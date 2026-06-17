"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { ApiRequestError } from "@/services/api.service"
import {
  authService,
  type AuthResponse,
  type LoginPayload,
  type RegisterPayload,
} from "@/services/auth.service"

export const AUTH_QUERY_KEYS = {
  me: ["auth", "me"] as const,
}

export function isUnauthorizedApiError(error: unknown): boolean {
  return error instanceof ApiRequestError && error.status === 401
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof Error && "data" in error) {
    const apiError = error as ApiRequestError<{
      error?: {
        message?: string | string[]
      }
    }>
    const message = apiError.data?.error?.message

    if (Array.isArray(message)) {
      return message.join(", ")
    }

    if (typeof message === "string") {
      return message
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return "Something went wrong. Please try again."
}

export function useLoginMutation() {
  const queryClient = useQueryClient()

  return useMutation<AuthResponse, unknown, LoginPayload>({
    mutationFn: authService.login,
    onSuccess: (data) => {
      queryClient.setQueryData(AUTH_QUERY_KEYS.me, data)
    },
  })
}

export function useRegisterMutation() {
  const queryClient = useQueryClient()

  return useMutation<AuthResponse, unknown, RegisterPayload>({
    mutationFn: authService.register,
    onSuccess: (data) => {
      queryClient.setQueryData(AUTH_QUERY_KEYS.me, data)
    },
  })
}

export function useLogoutMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authService.logout,
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: AUTH_QUERY_KEYS.me })
      await queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.me })
    },
  })
}

export function useRefreshMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authService.refresh,
    onSuccess: (data) => {
      queryClient.setQueryData(AUTH_QUERY_KEYS.me, data)
    },
  })
}

export function useMeQuery(enabled = true) {
  return useQuery({
    enabled,
    queryFn: authService.getMe,
    queryKey: AUTH_QUERY_KEYS.me,
    retry: false,
  })
}
