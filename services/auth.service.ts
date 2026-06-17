import { API_ENDPOINTS } from "@/constants/api-config"
import { apiService } from "@/services/api.service"

export type AuthUser = {
  email: string
  id: string
  name: string
}

export type AuthResponse = {
  user: AuthUser
}

export type LoginPayload = {
  email: string
  password: string
}

export type RegisterPayload = {
  email: string
  name: string
  password: string
}

export const authService = {
  getMe: () =>
    apiService.get<AuthResponse>(API_ENDPOINTS.auth.me, {
      credentials: "include",
    }),
  login: (data: LoginPayload) =>
    apiService.post<AuthResponse, LoginPayload>(API_ENDPOINTS.auth.login, data, {
      credentials: "include",
    }),
  logout: () =>
    apiService.post<{ success: boolean }>(API_ENDPOINTS.auth.logout, undefined, {
      credentials: "include",
    }),
  refresh: () =>
    apiService.post<AuthResponse>(API_ENDPOINTS.auth.refresh, undefined, {
      credentials: "include",
    }),
  register: (data: RegisterPayload) =>
    apiService.post<AuthResponse, RegisterPayload>(
      API_ENDPOINTS.auth.register,
      data,
      {
        credentials: "include",
      },
    ),
}
