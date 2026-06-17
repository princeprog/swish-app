"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  organizationService,
  type CreateOrganizationPayload,
  type Organization,
} from "@/services/organization.service"

export const ORGANIZATION_QUERY_KEYS = {
  list: ["organizations", "list"] as const,
}

export function useOrganizationsQuery() {
  return useQuery({
    queryFn: organizationService.list,
    queryKey: ORGANIZATION_QUERY_KEYS.list,
    retry: false,
  })
}

export function useCreateOrganizationMutation() {
  const queryClient = useQueryClient()

  return useMutation<Organization, unknown, CreateOrganizationPayload>({
    mutationFn: organizationService.create,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ORGANIZATION_QUERY_KEYS.list,
      })
    },
  })
}
