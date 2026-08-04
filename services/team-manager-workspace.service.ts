import { API_ENDPOINTS } from "@/constants/api-config"
import { apiService } from "@/services/api.service"

export type TeamManagerWorkspaceAssignment = {
  assignmentId: string
  division: {
    id: string
    name: string
    slug: string
  }
  roster: {
    amendmentReason: string | null
    publishedVersionId: string | null
    reviewNote: string | null
    status: string
    submissionDeadlineAt: string | null
  }
  season: {
    id: string
    name: string
    slug: string
    status: string
  }
  team: {
    color: string | null
    id: string
    name: string
    slug: string
    status: string
  }
}

export type TeamManagerWorkspace = {
  assignments: TeamManagerWorkspaceAssignment[]
  defaultSeasonId: string | null
}

export const teamManagerWorkspaceService = {
  get: (organizationId: string) =>
    apiService.get<TeamManagerWorkspace>(
      API_ENDPOINTS.teamManagerWorkspace.get(organizationId),
      {
        credentials: "include",
      },
    ),
}
