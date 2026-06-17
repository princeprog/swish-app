"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  teamService,
  type CreateTeamPayload,
  type Team,
  type UpdateTeamPayload,
} from "@/services/team.service"

export const TEAM_QUERY_KEYS = {
  list: (organizationId: string) => ["teams", "list", organizationId] as const,
}

export function useTeamsQuery(organizationId?: string) {
  return useQuery({
    enabled: Boolean(organizationId),
    queryFn: () => teamService.list(organizationId!),
    queryKey: TEAM_QUERY_KEYS.list(organizationId ?? "unknown"),
    retry: false,
  })
}

export function useCreateTeamMutation(organizationId: string) {
  const queryClient = useQueryClient()

  return useMutation<Team, unknown, CreateTeamPayload>({
    mutationFn: (payload) => teamService.create(organizationId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: TEAM_QUERY_KEYS.list(organizationId),
      })
    },
  })
}

export function useUpdateTeamMutation(organizationId: string) {
  const queryClient = useQueryClient()

  return useMutation<Team, unknown, { payload: UpdateTeamPayload; teamId: string }>({
    mutationFn: ({ payload, teamId }) =>
      teamService.update(organizationId, teamId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: TEAM_QUERY_KEYS.list(organizationId),
      })
    },
  })
}

export function useDeleteTeamMutation(organizationId: string) {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, string>({
    mutationFn: (teamId) => teamService.remove(organizationId, teamId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: TEAM_QUERY_KEYS.list(organizationId),
      })
    },
  })
}
