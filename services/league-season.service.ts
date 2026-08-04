import { API_ENDPOINTS } from "@/constants/api-config"
import { apiService } from "@/services/api.service"
import type { PaginatedResponse, PaginationParams } from "@/services/pagination"

export type LeagueSeason = {
  created_at: string
  id: string
  game_rules: LeagueSeasonGameRules
  name: string
  organization_id: string
  public_enabled: boolean
  slug: string
  status: string
  updated_at: string
}

export type LeagueSeasonGameRules = {
  overtime_duration_ms: number
  period_duration_ms: number
  regulation_periods: number
  shot_clock_enabled: boolean
  shot_clock_full_ms: number
  shot_clock_short_ms: number
  team_fouls_before_penalty: number
  timeouts_first_half: number
  timeouts_per_overtime: number
  timeouts_second_half: number
}

export type LeagueSeasonGameRulesInput = {
  overtimeDurationMs: number
  periodDurationMs: number
  regulationPeriods: number
  shotClockEnabled: boolean
  shotClockFullMs: number
  shotClockShortMs: number
  teamFoulsBeforePenalty: number
  timeoutsFirstHalf: number
  timeoutsPerOvertime: number
  timeoutsSecondHalf: number
}

export type CreateLeagueSeasonPayload = {
  gameRules: LeagueSeasonGameRulesInput
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
  list: (organizationId: string, params: PaginationParams = {}) =>
    apiService.get<PaginatedResponse<LeagueSeason>>(
      API_ENDPOINTS.leagueSeasons.list(organizationId),
      {
        credentials: "include",
        query: params,
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
