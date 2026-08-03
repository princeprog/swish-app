import { API_ENDPOINTS } from "@/constants/api-config"
import { apiService } from "@/services/api.service"
import type { PaginatedResponse, PaginationParams } from "@/services/pagination"

export type Player = {
  created_at: string
  id: string
  jersey_number: string
  name: string
  position: string
  status: string
  team_id: string
  updated_at: string
}

export type CreatePlayerPayload = {
  jerseyNumber: string
  name: string
  position: string
  status?: "active" | "inactive"
  teamId: string
}

export type UpdatePlayerPayload = Partial<CreatePlayerPayload>

export type PlayerSortBy =
  | "division"
  | "jerseyNumber"
  | "name"
  | "position"
  | "recent"
  | "status"
  | "team"
  | "updated"

export type PlayerListParams = PaginationParams & {
  divisionId?: string
  search?: string
  sortBy?: PlayerSortBy
  sortDirection?: "asc" | "desc"
  status?: "active" | "inactive"
  teamId?: string
}

export const playerService = {
  create: (organizationId: string, data: CreatePlayerPayload) =>
    apiService.post<Player, CreatePlayerPayload>(
      API_ENDPOINTS.players.create(organizationId),
      data,
      {
        credentials: "include",
      },
    ),
  list: (organizationId: string, params: PlayerListParams = {}) =>
    apiService.get<PaginatedResponse<Player>>(API_ENDPOINTS.players.list(organizationId), {
      credentials: "include",
      query: params,
    }),
  remove: (organizationId: string, playerId: string) =>
    apiService.delete<void>(
      `${API_ENDPOINTS.players.list(organizationId)}/${playerId}`,
      {
        credentials: "include",
      },
    ),
  update: (organizationId: string, playerId: string, data: UpdatePlayerPayload) =>
    apiService.patch<Player, UpdatePlayerPayload>(
      `${API_ENDPOINTS.players.list(organizationId)}/${playerId}`,
      data,
      {
        credentials: "include",
      },
    ),
}
