import { API_ENDPOINTS } from "@/constants/api-config"
import { apiService } from "@/services/api.service"
import type { PaginatedResponse, PaginationParams } from "@/services/pagination"

export type Team = {
  color: string | null
  created_at: string
  division_id: string
  division_name?: string
  id: string
  league_season_id?: string
  league_season_name?: string
  name: string
  slug: string
  status: string
  updated_at: string
  archived_at?: string | null
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
  listAll: async (organizationId: string) => {
    const firstPage = await teamService.list(organizationId, {
      page: 1,
      pageSize: 50,
    })
    const remainingPages = await Promise.all(
      Array.from(
        { length: Math.max(0, firstPage.pagination.totalPages - 1) },
        (_, index) =>
          teamService.list(organizationId, {
            page: index + 2,
            pageSize: 50,
          }),
      ),
    )

    return [firstPage, ...remainingPages].flatMap((page) => page.data)
  },
  archive: (organizationId: string, teamId: string) =>
    apiService.post<Team, Record<string, never>>(
      API_ENDPOINTS.teams.archive(organizationId, teamId),
      {},
      { credentials: "include" },
    ),
  remove: (organizationId: string, teamId: string) =>
    teamService.archive(organizationId, teamId),
  restore: (organizationId: string, teamId: string) =>
    apiService.post<Team, Record<string, never>>(
      API_ENDPOINTS.teams.restore(organizationId, teamId),
      {},
      { credentials: "include" },
    ),
  update: (organizationId: string, teamId: string, data: UpdateTeamPayload) =>
    apiService.patch<Team, UpdateTeamPayload>(
      `${API_ENDPOINTS.teams.list(organizationId)}/${teamId}`,
      data,
      {
        credentials: "include",
      },
    ),
}
