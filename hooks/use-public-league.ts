"use client";

import { useQuery } from "@tanstack/react-query";

import { publicLeagueService } from "@/services/public-league.service";

export function usePublicLeague(organizationSlug: string, seasonSlug: string) {
  return useQuery({
    queryFn: () => publicLeagueService.getPortal(organizationSlug, seasonSlug),
    queryKey: ["public-league", organizationSlug, seasonSlug],
    retry: false,
  });
}
