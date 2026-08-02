"use client"

import { useQuery } from "@tanstack/react-query"

import {
  standingsService,
  type StandingsParams,
} from "@/services/standings.service"

export const STANDINGS_QUERY_KEYS = {
  all: (organizationId: string) =>
    ["standings", "list", organizationId] as const,
  list: (organizationId: string, params: StandingsParams) =>
    [...STANDINGS_QUERY_KEYS.all(organizationId), params] as const,
}

export function useStandingsQuery(
  organizationId?: string,
  params?: StandingsParams,
) {
  return useQuery({
    enabled: Boolean(organizationId && params?.leagueSeasonId),
    queryFn: () => standingsService.list(organizationId!, params!),
    queryKey: STANDINGS_QUERY_KEYS.list(
      organizationId ?? "unknown",
      params ?? { leagueSeasonId: "unknown" },
    ),
    retry: false,
  })
}
