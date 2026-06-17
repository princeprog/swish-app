"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  divisionService,
  type CreateDivisionPayload,
  type Division,
  type UpdateDivisionPayload,
} from "@/services/division.service"

export const DIVISION_QUERY_KEYS = {
  list: (organizationId: string) => ["divisions", "list", organizationId] as const,
}

export function useDivisionsQuery(organizationId?: string) {
  return useQuery({
    enabled: Boolean(organizationId),
    queryFn: () => divisionService.list(organizationId!),
    queryKey: DIVISION_QUERY_KEYS.list(organizationId ?? "unknown"),
    retry: false,
  })
}

export function useCreateDivisionMutation(organizationId: string) {
  const queryClient = useQueryClient()

  return useMutation<Division, unknown, CreateDivisionPayload>({
    mutationFn: (payload) => divisionService.create(organizationId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: DIVISION_QUERY_KEYS.list(organizationId),
      })
    },
  })
}

export function useUpdateDivisionMutation(organizationId: string) {
  const queryClient = useQueryClient()

  return useMutation<
    Division,
    unknown,
    { divisionId: string; payload: UpdateDivisionPayload }
  >({
    mutationFn: ({ divisionId, payload }) =>
      divisionService.update(organizationId, divisionId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: DIVISION_QUERY_KEYS.list(organizationId),
      })
    },
  })
}

export function useDeleteDivisionMutation(organizationId: string) {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, string>({
    mutationFn: (divisionId) =>
      divisionService.remove(organizationId, divisionId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: DIVISION_QUERY_KEYS.list(organizationId),
      })
    },
  })
}
