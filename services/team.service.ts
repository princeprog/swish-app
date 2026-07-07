import { API_ENDPOINTS } from "@/constants/api-config"
import { apiService } from "@/services/api.service"
import type { PaginatedResponse, PaginationParams } from "@/services/pagination"

export type Team = {
  color: string | null
  created_at: string
  division_id: string
  id: string
  name: string
  slug: string
  status: string
  updated_at: string
}

export type CreateTeamPayload = {
  color?: string
  divisionId: string
  name: string
  slug: string
  status?: "active" | "inactive"
}

export type UpdateTeamPayload = Partial<CreateTeamPayload>

export type TeamListParams = PaginationParams & {
  divisionId?: string
  search?: string
  sortBy?: "division" | "name" | "recent"
  status?: "active" | "inactive"
}

export const teamService = {
  create: (organizationId: string, data: CreateTeamPayload) =>
    apiService.post<Team, CreateTeamPayload>(
      API_ENDPOINTS.teams.create(organizationId),
      data,
      {
        credentials: "include",
      },
    ),
  list: (organizationId: string, params: TeamListParams = {}) =>
    apiService.get<PaginatedResponse<Team>>(API_ENDPOINTS.teams.list(organizationId), {
      credentials: "include",
      query: params,
    }),
  remove: (organizationId: string, teamId: string) =>
    apiService.delete<void>(`${API_ENDPOINTS.teams.list(organizationId)}/${teamId}`, {
      credentials: "include",
    }),
  update: (organizationId: string, teamId: string, data: UpdateTeamPayload) =>
    apiService.patch<Team, UpdateTeamPayload>(
      `${API_ENDPOINTS.teams.list(organizationId)}/${teamId}`,
      data,
      {
        credentials: "include",
      },
    ),
}
