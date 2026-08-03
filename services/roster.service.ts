import { API_ENDPOINTS } from "@/constants/api-config"
import { apiService } from "@/services/api.service"
import type { Player } from "@/services/player.service"

export type RosterWorkflowStatus = "draft" | "submitted" | "returned" | "approved"

export type TeamRosterResponse =
  | {
      message: string
      team: {
        divisionId: string
        divisionName: string
        id: string
        name: string
      }
      visibility: "hidden"
    }
  | {
      players: Player[]
      roster: {
        id: string
        isReleased: boolean
        latestApprovedVersionId: string | null
        publishedVersionId: string | null
        status: RosterWorkflowStatus
      }
      team: {
        divisionId: string
        divisionName: string
        id: string
        name: string
      }
      visibility: "working" | "published"
    }

export type DivisionRosterResponse = {
  release: {
    isReleased: boolean
    releaseReason: string | null
    releasedAt: string | null
  }
  settings: {
    divisionId: string
    id: string
    maxActivePlayers: number | null
    minActivePlayers: number | null
    releaseReason: string | null
    releasedAt: string | null
    submissionDeadlineAt: string | null
  }
  teams: Array<{
    id: string
    isPublished: boolean
    name: string
    publishedAt: string | null
    publishedPlayerCount: number | null
    reviewedAt: string | null
    slug: string
    status: RosterWorkflowStatus
    submittedAt: string | null
  }>
}

export type UpdateRosterSettingsPayload = {
  maxActivePlayers?: number | null
  minActivePlayers?: number | null
  submissionDeadlineAt?: string | null
}

export const rosterService = {
  approveTeam: (organizationId: string, teamId: string) =>
    apiService.post(
      API_ENDPOINTS.rosters.approveTeam(organizationId, teamId),
      undefined,
      { credentials: "include" },
    ),
  getDivision: (organizationId: string, divisionId: string) =>
    apiService.get<DivisionRosterResponse>(
      API_ENDPOINTS.rosters.division(organizationId, divisionId),
      { credentials: "include" },
    ),
  getTeam: (organizationId: string, teamId: string) =>
    apiService.get<TeamRosterResponse>(
      API_ENDPOINTS.rosters.team(organizationId, teamId),
      { credentials: "include" },
    ),
  publishDivision: (organizationId: string, divisionId: string) =>
    apiService.post(
      API_ENDPOINTS.rosters.publishDivision(organizationId, divisionId),
      undefined,
      { credentials: "include" },
    ),
  returnTeam: (organizationId: string, teamId: string, reason: string) =>
    apiService.post(
      API_ENDPOINTS.rosters.returnTeam(organizationId, teamId),
      { reason },
      { credentials: "include" },
    ),
  startAmendment: (organizationId: string, teamId: string, reason: string) =>
    apiService.post(
      API_ENDPOINTS.rosters.startAmendment(organizationId, teamId),
      { reason },
      { credentials: "include" },
    ),
  submitTeam: (organizationId: string, teamId: string) =>
    apiService.post(
      API_ENDPOINTS.rosters.submitTeam(organizationId, teamId),
      undefined,
      { credentials: "include" },
    ),
  updateSettings: (
    organizationId: string,
    divisionId: string,
    data: UpdateRosterSettingsPayload,
  ) =>
    apiService.patch(
      API_ENDPOINTS.rosters.settings(organizationId, divisionId),
      data,
      { credentials: "include" },
    ),
}
