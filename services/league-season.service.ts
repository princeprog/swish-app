import { API_ENDPOINTS } from "@/constants/api-config"
import { apiService } from "@/services/api.service"
import type { PaginatedResponse, PaginationParams } from "@/services/pagination"

export type LeagueSeason = {
  competition_defaults: LeagueSeasonCompetitionDefaults
  created_at: string
  id: string
  game_rules: LeagueSeasonGameRules
  name: string
  organization_id: string
  public_enabled: boolean
  slug: string
  status: string
  updated_at: string
  schedule_slot_duration_minutes: number
  archived_at?: string | null
}

export type QualifyingFormat =
  | "none"
  | "single_round_robin"
  | "double_round_robin"
export type PlayoffFormat =
  | "none"
  | "single_elimination"
  | "double_elimination"
export type TiebreakerRule =
  | "win_percentage"
  | "head_to_head"
  | "point_differential"
  | "points_for"
  | "manual_decision"

export type LeagueSeasonCompetitionDefaults = {
  crossover_template: Array<{ awaySeed: string; homeSeed: string }>
  playoff_format: PlayoffFormat
  pool_count: number
  qualifiers_per_pool: number
  qualifying_format: QualifyingFormat
  tiebreakers: TiebreakerRule[]
}

export type LeagueSeasonCompetitionDefaultsInput = {
  crossoverTemplate: Array<{ awaySeed: string; homeSeed: string }>
  playoffFormat: PlayoffFormat
  poolCount: number
  qualifiersPerPool: number
  qualifyingFormat: QualifyingFormat
  tiebreakers: TiebreakerRule[]
}

export type LeagueSeasonGameRules = {
  overtime_duration_ms: number
  personal_foul_limit: number
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
  personalFoulLimit: number
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
  competitionDefaults: LeagueSeasonCompetitionDefaultsInput
  gameRules: LeagueSeasonGameRulesInput
  name: string
  organizationId: string
  publicEnabled?: boolean
  scheduleSlotDurationMinutes: number
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
  archive: (organizationId: string, leagueSeasonId: string) =>
    apiService.post<LeagueSeason, Record<string, never>>(
      API_ENDPOINTS.leagueSeasons.archive(organizationId, leagueSeasonId),
      {},
      { credentials: "include" },
    ),
  remove: (organizationId: string, leagueSeasonId: string) =>
    leagueSeasonService.archive(organizationId, leagueSeasonId),
  restore: (organizationId: string, leagueSeasonId: string) =>
    apiService.post<LeagueSeason, Record<string, never>>(
      API_ENDPOINTS.leagueSeasons.restore(organizationId, leagueSeasonId),
      {},
      { credentials: "include" },
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
