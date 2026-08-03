"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { PLAYER_QUERY_KEYS } from "@/hooks/use-player"
import {
  rosterService,
  type UpdateRosterSettingsPayload,
} from "@/services/roster.service"

export const ROSTER_QUERY_KEYS = {
  division: (organizationId: string, divisionId: string) =>
    ["rosters", "division", organizationId, divisionId] as const,
  team: (organizationId: string, teamId: string) =>
    ["rosters", "team", organizationId, teamId] as const,
}

export function useDivisionRosterQuery(
  organizationId?: string,
  divisionId?: string,
) {
  return useQuery({
    enabled: Boolean(organizationId && divisionId),
    queryFn: () => rosterService.getDivision(organizationId!, divisionId!),
    queryKey: ROSTER_QUERY_KEYS.division(
      organizationId ?? "unknown",
      divisionId ?? "unknown",
    ),
    retry: false,
  })
}

export function useTeamRosterQuery(organizationId?: string, teamId?: string) {
  return useQuery({
    enabled: Boolean(organizationId && teamId),
    queryFn: () => rosterService.getTeam(organizationId!, teamId!),
    queryKey: ROSTER_QUERY_KEYS.team(
      organizationId ?? "unknown",
      teamId ?? "unknown",
    ),
    retry: false,
  })
}

function useRosterInvalidation(organizationId: string, teamId?: string) {
  const queryClient = useQueryClient()

  return async () => {
    await queryClient.invalidateQueries({
      queryKey: ["rosters"],
    })
    await queryClient.invalidateQueries({
      queryKey: PLAYER_QUERY_KEYS.list(organizationId),
    })
    if (teamId) {
      await queryClient.invalidateQueries({
        queryKey: ROSTER_QUERY_KEYS.team(organizationId, teamId),
      })
    }
  }
}

export function useSubmitRosterMutation(organizationId: string, teamId: string) {
  const invalidate = useRosterInvalidation(organizationId, teamId)

  return useMutation({
    mutationFn: () => rosterService.submitTeam(organizationId, teamId),
    onSuccess: invalidate,
  })
}

export function useStartAmendmentMutation(
  organizationId: string,
  teamId: string,
) {
  const invalidate = useRosterInvalidation(organizationId, teamId)

  return useMutation({
    mutationFn: (reason: string) =>
      rosterService.startAmendment(organizationId, teamId, reason),
    onSuccess: invalidate,
  })
}

export function useApproveRosterMutation(organizationId: string, teamId: string) {
  const invalidate = useRosterInvalidation(organizationId, teamId)

  return useMutation({
    mutationFn: () => rosterService.approveTeam(organizationId, teamId),
    onSuccess: invalidate,
  })
}

export function useReturnRosterMutation(organizationId: string, teamId: string) {
  const invalidate = useRosterInvalidation(organizationId, teamId)

  return useMutation({
    mutationFn: (reason: string) =>
      rosterService.returnTeam(organizationId, teamId, reason),
    onSuccess: invalidate,
  })
}

export function usePublishDivisionRostersMutation(
  organizationId: string,
  divisionId: string,
) {
  const invalidate = useRosterInvalidation(organizationId)

  return useMutation({
    mutationFn: () => rosterService.publishDivision(organizationId, divisionId),
    onSuccess: invalidate,
  })
}

export function useUpdateRosterSettingsMutation(
  organizationId: string,
  divisionId: string,
) {
  const invalidate = useRosterInvalidation(organizationId)

  return useMutation({
    mutationFn: (payload: UpdateRosterSettingsPayload) =>
      rosterService.updateSettings(organizationId, divisionId, payload),
    onSuccess: invalidate,
  })
}
