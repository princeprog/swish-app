"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import * as React from "react"
import { useQuery } from "@tanstack/react-query"

import {
  teamManagerWorkspaceService,
  type TeamManagerWorkspaceAssignment,
} from "@/services/team-manager-workspace.service"

export const TEAM_MANAGER_WORKSPACE_QUERY_KEYS = {
  detail: (organizationId: string) =>
    ["team-manager-workspace", organizationId] as const,
}

export function useTeamManagerWorkspaceQuery(organizationId?: string) {
  return useQuery({
    enabled: Boolean(organizationId),
    queryFn: () => teamManagerWorkspaceService.get(organizationId!),
    queryKey: TEAM_MANAGER_WORKSPACE_QUERY_KEYS.detail(
      organizationId ?? "unknown",
    ),
    retry: false,
  })
}

export function useSelectedManagerAssignment(organizationId?: string) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const workspaceQuery = useTeamManagerWorkspaceQuery(organizationId)
  const selectedSeasonId = searchParams.get("seasonId")

  const assignment = React.useMemo<TeamManagerWorkspaceAssignment | undefined>(
    () =>
      workspaceQuery.data?.assignments.find(
        (item) => item.season.id === selectedSeasonId,
      ) ??
      workspaceQuery.data?.assignments.find(
        (item) => item.season.id === workspaceQuery.data?.defaultSeasonId,
      ) ??
      workspaceQuery.data?.assignments[0],
    [selectedSeasonId, workspaceQuery.data],
  )

  React.useEffect(() => {
    if (!workspaceQuery.data || !workspaceQuery.data.assignments.length) {
      return
    }

    const validSeason = workspaceQuery.data.assignments.some(
      (item) => item.season.id === selectedSeasonId,
    )
    const nextSeasonId = validSeason
      ? selectedSeasonId
      : workspaceQuery.data.defaultSeasonId

    if (!nextSeasonId || nextSeasonId === selectedSeasonId) {
      return
    }

    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.set("seasonId", nextSeasonId)
    router.replace(`${pathname}?${nextParams.toString()}`)
  }, [pathname, router, searchParams, selectedSeasonId, workspaceQuery.data])

  const setSelectedSeasonId = React.useCallback(
    (seasonId: string) => {
      const nextParams = new URLSearchParams(searchParams.toString())
      nextParams.set("seasonId", seasonId)
      router.push(`${pathname}?${nextParams.toString()}`)
    },
    [pathname, router, searchParams],
  )

  return {
    assignment,
    selectedSeasonId: assignment?.season.id ?? null,
    setSelectedSeasonId,
    workspaceQuery,
  }
}
