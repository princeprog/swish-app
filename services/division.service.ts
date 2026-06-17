import { API_ENDPOINTS } from "@/constants/api-config"
import { apiService } from "@/services/api.service"

export type Division = {
  created_at: string
  id: string
  league_season_id: string
  name: string
  slug: string
  status: string
  updated_at: string
}

export type CreateDivisionPayload = {
  leagueSeasonId: string
  name: string
  slug: string
  status?: "active" | "inactive"
}

export type UpdateDivisionPayload = Partial<CreateDivisionPayload>

export const divisionService = {
  create: (organizationId: string, data: CreateDivisionPayload) =>
    apiService.post<Division, CreateDivisionPayload>(
      API_ENDPOINTS.divisions.create(organizationId),
      data,
      {
        credentials: "include",
      },
    ),
  list: (organizationId: string) =>
    apiService.get<Division[]>(API_ENDPOINTS.divisions.list(organizationId), {
      credentials: "include",
    }),
  remove: (organizationId: string, divisionId: string) =>
    apiService.delete<void>(
      `${API_ENDPOINTS.divisions.list(organizationId)}/${divisionId}`,
      {
        credentials: "include",
      },
    ),
  update: (
    organizationId: string,
    divisionId: string,
    data: UpdateDivisionPayload,
  ) =>
    apiService.patch<Division, UpdateDivisionPayload>(
      `${API_ENDPOINTS.divisions.list(organizationId)}/${divisionId}`,
      data,
      {
        credentials: "include",
      },
    ),
}
