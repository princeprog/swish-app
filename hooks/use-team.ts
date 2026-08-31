"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  teamService,
  type CreateTeamPayload,
  type Team,
  type TeamListParams,
  type UpdateTeamPayload,
} from "@/services/team.service"

export const TEAM_QUERY_KEYS = {
  list: (organizationId: string) => ["teams", "list", organizationId] as const,
  listWithParams: (organizationId: string, params: TeamListParams) =>
    ["teams", "list", organizationId, params] as const,
}

export function useTeamsQuery(
  organizationId?: string,
  params: TeamListParams = {},
) {
  return useQuery({
    enabled: Boolean(organizationId),
    queryFn: () => teamService.list(organizationId!, params),
    queryKey: TEAM_QUERY_KEYS.listWithParams(organizationId ?? "unknown", params),
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
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: TEAM_QUERY_KEYS.list(organizationId),
        }),
        queryClient.invalidateQueries({
          queryKey: ["team-manager-workspace", organizationId],
        }),
      ])
    },
  })
}

export function useArchiveTeamMutation(organizationId: string) {
  const queryClient = useQueryClient()

  return useMutation<Team, unknown, string>({
    mutationFn: (teamId) => teamService.archive(organizationId, teamId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: TEAM_QUERY_KEYS.list(organizationId),
      })
    },
  })
}
