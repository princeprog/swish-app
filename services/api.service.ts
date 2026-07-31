import { API_BASE_URL, API_ENDPOINTS } from "@/constants/api-config";
import { createSessionRefreshCoordinator } from "@/lib/auth-refresh-coordinator";

type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type QueryValue = string | number | boolean | null | undefined;

type ApiRequestOptions<TData = unknown> = Omit<
  RequestInit,
  "body" | "method"
> & {
  authRetry?: boolean;
  data?: TData;
  method?: ApiMethod;
  query?: Record<string, QueryValue | QueryValue[]>;
  token?: string;
};

export class ApiRequestError<TError = unknown> extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly statusText: string,
    readonly data: TError,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

function buildUrl(
  endpoint: string,
  query?: ApiRequestOptions["query"],
): string {
  const isAbsoluteUrl = /^https?:\/\//i.test(endpoint);
  const baseUrl = API_BASE_URL.replace(/\/$/, "");
  const normalizedEndpoint = endpoint.replace(/^\//, "");
  const url = new URL(
    isAbsoluteUrl ? endpoint : `${baseUrl}/${normalizedEndpoint}`,
  );

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      const values = Array.isArray(value) ? value : [value];

      for (const item of values) {
        if (item !== null && item !== undefined) {
          url.searchParams.append(key, String(item));
        }
      }
    }
  }

  return url.toString();
}

function isFormData(data: unknown): data is FormData {
  return typeof FormData !== "undefined" && data instanceof FormData;
}

async function parseResponse(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined;
  }

  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

function isUnauthorizedApiError(error: unknown): boolean {
  return error instanceof ApiRequestError && error.status === 401;
}

function isAuthRetryBypassedEndpoint(endpoint: string): boolean {
  const authEndpoints = [
    API_ENDPOINTS.auth.login,
    API_ENDPOINTS.auth.logout,
    API_ENDPOINTS.auth.refresh,
    API_ENDPOINTS.auth.register,
  ];
  const pathname = /^https?:\/\//i.test(endpoint)
    ? new URL(endpoint).pathname
    : endpoint;

  return authEndpoints.includes(pathname as (typeof authEndpoints)[number]);
}

async function rawApiRequest<TResponse = unknown, TData = unknown>(
  endpoint: string,
  options: ApiRequestOptions<TData> = {},
): Promise<TResponse> {
  const {
    authRetry: _authRetry,
    data,
    headers,
    method = data ? "POST" : "GET",
    query,
    token,
    credentials = "include",
    ...requestOptions
  } = options;

  const requestHeaders = new Headers(headers);
  let body: BodyInit | undefined;

  if (data !== undefined) {
    if (isFormData(data)) {
      body = data;
    } else {
      requestHeaders.set("Content-Type", "application/json");
      body = JSON.stringify(data);
    }
  }

  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(buildUrl(endpoint, query), {
    ...requestOptions,
    body,
    credentials,
    headers: requestHeaders,
    method,
  });
  const responseData = await parseResponse(response);

  if (!response.ok) {
    throw new ApiRequestError(
      `Request failed with status ${response.status}`,
      response.status,
      response.statusText,
      responseData,
    );
  }

  return responseData as TResponse;
}

const authRefreshCoordinator = createSessionRefreshCoordinator({
  getMe: () =>
    rawApiRequest<{ user: unknown }>(API_ENDPOINTS.auth.me, {
      authRetry: false,
      credentials: "include",
      method: "GET",
    }),
  isUnauthorizedError: isUnauthorizedApiError,
  refresh: () =>
    rawApiRequest<{ user: unknown }>(API_ENDPOINTS.auth.refresh, {
      authRetry: false,
      credentials: "include",
      method: "POST",
    }),
});

export async function apiRequest<TResponse = unknown, TData = unknown>(
  endpoint: string,
  options: ApiRequestOptions<TData> = {},
): Promise<TResponse> {
  const { authRetry = true } = options;

  try {
    return await rawApiRequest<TResponse, TData>(endpoint, options);
  } catch (error) {
    if (
      !authRetry ||
      !isUnauthorizedApiError(error) ||
      isAuthRetryBypassedEndpoint(endpoint)
    ) {
      throw error;
    }

    await authRefreshCoordinator.ensureFreshSession();

    return rawApiRequest<TResponse, TData>(endpoint, {
      ...options,
      authRetry: false,
    });
  }
}

export const apiService = {
  delete: <TResponse = unknown, TData = unknown>(
    endpoint: string,
    options?: Omit<ApiRequestOptions<TData>, "method">,
  ) => apiRequest<TResponse, TData>(endpoint, { ...options, method: "DELETE" }),

  get: <TResponse = unknown>(
    endpoint: string,
    options?: Omit<ApiRequestOptions, "method" | "data">,
  ) => apiRequest<TResponse>(endpoint, { ...options, method: "GET" }),

  patch: <TResponse = unknown, TData = unknown>(
    endpoint: string,
    data?: TData,
    options?: Omit<ApiRequestOptions<TData>, "method" | "data">,
  ) =>
    apiRequest<TResponse, TData>(endpoint, {
      ...options,
      data,
      method: "PATCH",
    }),

  post: <TResponse = unknown, TData = unknown>(
    endpoint: string,
    data?: TData,
    options?: Omit<ApiRequestOptions<TData>, "method" | "data">,
  ) =>
    apiRequest<TResponse, TData>(endpoint, {
      ...options,
      data,
      method: "POST",
    }),

  put: <TResponse = unknown, TData = unknown>(
    endpoint: string,
    data?: TData,
    options?: Omit<ApiRequestOptions<TData>, "method" | "data">,
  ) =>
    apiRequest<TResponse, TData>(endpoint, { ...options, data, method: "PUT" }),
};
