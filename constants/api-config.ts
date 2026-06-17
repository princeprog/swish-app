export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3001"

export const AUTH_COOKIE_NAMES = {
  access:
    process.env.AUTH_ACCESS_COOKIE_NAME ??
    process.env.NEXT_PUBLIC_AUTH_ACCESS_COOKIE_NAME ??
    "swish_access_token",
  refresh:
    process.env.AUTH_REFRESH_COOKIE_NAME ??
    process.env.NEXT_PUBLIC_AUTH_REFRESH_COOKIE_NAME ??
    "swish_refresh_token",
} as const

export const AUTH_ROUTES = ["/login", "/signup"] as const
export const AUTHENTICATED_REDIRECT_ROUTE = "/organizations"
export const PROTECTED_ROUTE_PREFIXES = ["/organizations"] as const

export const API_ENDPOINTS = {
  auth: {
    login: "/auth/login",
    logout: "/auth/logout",
    me: "/auth/me",
    refresh: "/auth/refresh",
    register: "/auth/register",
  },
  organizations: {
    create: "/organizations",
    list: "/organizations",
  },
  leagueSeasons: {
    create: (organizationId: string) =>
      `/organizations/${organizationId}/league-seasons`,
    list: (organizationId: string) =>
      `/organizations/${organizationId}/league-seasons`,
  },
  divisions: {
    create: (organizationId: string) =>
      `/organizations/${organizationId}/divisions`,
    list: (organizationId: string) =>
      `/organizations/${organizationId}/divisions`,
  },
} as const
