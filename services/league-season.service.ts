import { API_ENDPOINTS } from "@/constants/api-config"
import { apiService } from "@/services/api.service"

export type LeagueSeason = {
  created_at: string
  id: string
  name: string
  organization_id: string
  public_enabled: boolean
  slug: string
  status: string
  updated_at: string
}

export type CreateLeagueSeasonPayload = {
  name: string
  organizationId: string
  publicEnabled?: boolean
  slug: string
  status?: "draft" | "active" | "inactive"
}

export type UpdateLeagueSeasonPayload = Partial<
  Omit<CreateLeagueSeasonPayload, "organizationId">
>

export const leagueSeasonService = {
  create: (organizationId: string, data: CreateLeagueSeasonPayload) =>
    apiService.post<LeagueSeason, CreateLeagueSeasonPayload>(
      API_ENDPOINTS.leagueSeasons.create(organizationId),
      data,
      {
        credentials: "include",
      },
    ),
  list: (organizationId: string) =>
    apiService.get<LeagueSeason[]>(
      API_ENDPOINTS.leagueSeasons.list(organizationId),
      {
        credentials: "include",
      },
    ),
  remove: (organizationId: string, leagueSeasonId: string) =>
    apiService.delete<void>(
      `${API_ENDPOINTS.leagueSeasons.list(organizationId)}/${leagueSeasonId}`,
      {
        credentials: "include",
      },
    ),
  update: (
    organizationId: string,
    leagueSeasonId: string,
    data: UpdateLeagueSeasonPayload,
  ) =>
    apiService.patch<LeagueSeason, UpdateLeagueSeasonPayload>(
      `${API_ENDPOINTS.leagueSeasons.list(organizationId)}/${leagueSeasonId}`,
      data,
      {
        credentials: "include",
      },
    ),
}
