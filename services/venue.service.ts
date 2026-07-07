import { API_ENDPOINTS } from "@/constants/api-config"
import { apiService } from "@/services/api.service"
import type { PaginatedResponse, PaginationParams } from "@/services/pagination"

export type Venue = {
  created_at: string
  id: string
  league_season_id: string
  name: string
  slug: string
  status: string
  updated_at: string
}

export type CreateVenuePayload = {
  leagueSeasonId: string
  name: string
  slug: string
  status?: "active" | "inactive"
}

export type UpdateVenuePayload = Partial<CreateVenuePayload>

export const venueService = {
  create: (organizationId: string, data: CreateVenuePayload) =>
    apiService.post<Venue, CreateVenuePayload>(
      API_ENDPOINTS.venues.create(organizationId),
      data,
      { credentials: "include" },
    ),
  list: (organizationId: string, params: PaginationParams = {}) =>
    apiService.get<PaginatedResponse<Venue>>(API_ENDPOINTS.venues.list(organizationId), {
      credentials: "include",
      query: params,
    }),
  remove: (organizationId: string, venueId: string) =>
    apiService.delete<void>(`${API_ENDPOINTS.venues.list(organizationId)}/${venueId}`, {
      credentials: "include",
    }),
  update: (organizationId: string, venueId: string, data: UpdateVenuePayload) =>
    apiService.patch<Venue, UpdateVenuePayload>(
      `${API_ENDPOINTS.venues.list(organizationId)}/${venueId}`,
      data,
      { credentials: "include" },
    ),
}
