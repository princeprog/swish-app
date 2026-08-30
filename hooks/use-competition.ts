"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  competitionService,
  type ScheduleMatchupPayload,
} from "@/services/competition.service"
import type { LeagueSeasonCompetitionDefaultsInput } from "@/services/league-season.service"

export const COMPETITION_QUERY_KEYS = {
  workspace: (organizationId: string, divisionId: string) =>
    ["competition", organizationId, divisionId] as const,
}

export function useCompetitionWorkspaceQuery(
  organizationId?: string,
  divisionId?: string,
) {
  return useQuery({
    enabled: Boolean(organizationId && divisionId),
    queryFn: () => competitionService.getWorkspace(organizationId!, divisionId!),
    queryKey: COMPETITION_QUERY_KEYS.workspace(
      organizationId ?? "unknown",
      divisionId ?? "unknown",
    ),
    retry: false,
  })
}

function useCompetitionMutation<TVariables>(
  organizationId: string,
  divisionId: string,
  mutationFn: (variables: TVariables) => Promise<unknown>,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: COMPETITION_QUERY_KEYS.workspace(organizationId, divisionId),
      })
    },
  })
}

export function useUpdateCompetitionFormatMutation(
  organizationId: string,
  divisionId: string,
) {
  return useCompetitionMutation<Partial<LeagueSeasonCompetitionDefaultsInput>>(
    organizationId,
    divisionId,
    (payload) => competitionService.updateFormat(organizationId, divisionId, payload),
  )
}

export function useSetCompetitionPoolsMutation(
  organizationId: string,
  divisionId: string,
) {
  return useCompetitionMutation<Array<{ poolId: string; teamIds: string[] }>>(
    organizationId,
    divisionId,
    (pools) => competitionService.setPools(organizationId, divisionId, pools),
  )
}

export function useGenerateCompetitionMutation(
  organizationId: string,
  divisionId: string,
) {
  return useCompetitionMutation<string[] | undefined>(
    organizationId,
    divisionId,
    (directSeedTeamIds) =>
      competitionService.generate(organizationId, divisionId, directSeedTeamIds),
  )
}

export function useResetCompetitionMutation(
  organizationId: string,
  divisionId: string,
) {
  return useCompetitionMutation<void>(organizationId, divisionId, () =>
    competitionService.reset(organizationId, divisionId),
  )
}

export function useScheduleMatchupMutation(
  organizationId: string,
  divisionId: string,
) {
  return useCompetitionMutation<{
    matchupId: string
    payload: ScheduleMatchupPayload
  }>(organizationId, divisionId, ({ matchupId, payload }) =>
    competitionService.scheduleMatchup(
      organizationId,
      divisionId,
      matchupId,
      payload,
    ),
  )
}

export function useRecordTieDecisionMutation(
  organizationId: string,
  divisionId: string,
) {
  return useCompetitionMutation<{
    orderedTeamIds: string[]
    poolId: string
    reason: string
    teamIds: string[]
  }>(organizationId, divisionId, (payload) =>
    competitionService.recordTieDecision(
      organizationId,
      divisionId,
      payload,
    ),
  )
}
