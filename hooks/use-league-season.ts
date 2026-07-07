"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  leagueSeasonService,
  type CreateLeagueSeasonPayload,
  type LeagueSeason,
  type UpdateLeagueSeasonPayload,
} from "@/services/league-season.service"
import type { PaginationParams } from "@/services/pagination"

export const LEAGUE_SEASON_QUERY_KEYS = {
  list: (organizationId: string) =>
    ["league-seasons", "list", organizationId] as const,
  listWithParams: (organizationId: string, params: PaginationParams) =>
    ["league-seasons", "list", organizationId, params] as const,
}

export function useLeagueSeasonsQuery(
  organizationId?: string,
  params: PaginationParams = {},
) {
  return useQuery({
    enabled: Boolean(organizationId),
    queryFn: () => leagueSeasonService.list(organizationId!, params),
    queryKey: LEAGUE_SEASON_QUERY_KEYS.listWithParams(
      organizationId ?? "unknown",
      params,
    ),
    retry: false,
  })
}

export function useCreateLeagueSeasonMutation(organizationId: string) {
  const queryClient = useQueryClient()

  return useMutation<LeagueSeason, unknown, CreateLeagueSeasonPayload>({
    mutationFn: (payload) => leagueSeasonService.create(organizationId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: LEAGUE_SEASON_QUERY_KEYS.list(organizationId),
      })
    },
  })
}

export function useUpdateLeagueSeasonMutation(organizationId: string) {
  const queryClient = useQueryClient()

  return useMutation<
    LeagueSeason,
    unknown,
    { leagueSeasonId: string; payload: UpdateLeagueSeasonPayload }
  >({
    mutationFn: ({ leagueSeasonId, payload }) =>
      leagueSeasonService.update(organizationId, leagueSeasonId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: LEAGUE_SEASON_QUERY_KEYS.list(organizationId),
      })
    },
  })
}

export function useDeleteLeagueSeasonMutation(organizationId: string) {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, string>({
    mutationFn: (leagueSeasonId) =>
      leagueSeasonService.remove(organizationId, leagueSeasonId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: LEAGUE_SEASON_QUERY_KEYS.list(organizationId),
      })
    },
  })
}
