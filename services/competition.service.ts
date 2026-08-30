import { API_ENDPOINTS } from "@/constants/api-config"
import { apiService } from "@/services/api.service"
import type {
  LeagueSeasonCompetitionDefaultsInput,
  PlayoffFormat,
  QualifyingFormat,
  TiebreakerRule,
} from "@/services/league-season.service"

export type CompetitionFormat = {
  crossover_template: Array<{ awaySeed: string; homeSeed: string }>
  division_id: string
  division_name: string
  id: string
  league_season_id: string
  playoff_format: PlayoffFormat
  pool_count: number
  qualifiers_per_pool: number
  qualifying_format: QualifyingFormat
  revision: number
  schedule_slot_duration_minutes: number
  status: "draft" | "locked" | "completed"
  tiebreakers: TiebreakerRule[]
}

export type CompetitionPool = {
  code: string
  id: string
  name: string
  sortOrder: number
  teamIds: string[]
  teams: Array<{ id: string; name: string; seed: number | null }>
}

export type CompetitionMatchup = {
  away_source_ref: string | null
  away_source_type: string
  away_team_id: string | null
  bracket_side: "pool" | "winners" | "losers" | "finals"
  division_format_id: string
  format_revision: number
  home_source_ref: string | null
  home_source_type: string
  home_team_id: string | null
  id: string
  is_reset_final: boolean
  label: string | null
  loser_team_id: string | null
  loser_to_matchup_id: string | null
  loser_to_slot: "home" | "away" | null
  position: number
  pool_id: string | null
  round_number: number
  stage: "qualifier" | "playoff"
  status: "pending" | "ready" | "scheduled" | "live" | "final" | "void"
  winner_team_id: string | null
  winner_to_matchup_id: string | null
  winner_to_slot: "home" | "away" | null
}

export type CompetitionStanding = {
  games_played: number
  losses: number
  point_differential: number
  points_against: number
  points_for: number
  pool_id: string
  qualification_status: "pending" | "qualified" | "eliminated"
  rank: number | null
  ranking_explanation: Array<{
    label: string
    rule: TiebreakerRule
    value: number | string
  }>
  team_id: string
  win_percentage: string | number
  wins: number
}

export type CompetitionWorkspace = {
  format: CompetitionFormat
  matchups: CompetitionMatchup[]
  pools: CompetitionPool[]
  standings: CompetitionStanding[]
  tieDecisions: Array<{
    id: string
    ordered_team_ids: string[]
    pool_id: string
    reason: string
    team_ids: string[]
    tie_key: string
  }>
}

export type ScheduleMatchupPayload = {
  scorekeeperMemberId?: string | null
  startsAt: string
  statisticianMemberId?: string | null
  venueId: string
}

function endpoint(organizationId: string, divisionId: string) {
  return API_ENDPOINTS.competition.workspace(organizationId, divisionId)
}

export const competitionService = {
  generate: (
    organizationId: string,
    divisionId: string,
    directSeedTeamIds?: string[],
  ) =>
    apiService.post<{ matchups: CompetitionMatchup[]; status: string }>(
      `${endpoint(organizationId, divisionId)}/generate`,
      { directSeedTeamIds },
      { credentials: "include" },
    ),
  getWorkspace: (organizationId: string, divisionId: string) =>
    apiService.get<CompetitionWorkspace>(endpoint(organizationId, divisionId), {
      credentials: "include",
    }),
  recordTieDecision: (
    organizationId: string,
    divisionId: string,
    data: { orderedTeamIds: string[]; poolId: string; reason: string; teamIds: string[] },
  ) =>
    apiService.post(
      `${endpoint(organizationId, divisionId)}/tie-decisions`,
      data,
      { credentials: "include" },
    ),
  reset: (organizationId: string, divisionId: string) =>
    apiService.post<{ success: true }>(
      `${endpoint(organizationId, divisionId)}/reset`,
      {},
      { credentials: "include" },
    ),
  scheduleMatchup: (
    organizationId: string,
    divisionId: string,
    matchupId: string,
    data: ScheduleMatchupPayload,
  ) =>
    apiService.post(
      `${endpoint(organizationId, divisionId)}/matchups/${matchupId}/schedule`,
      data,
      { credentials: "include" },
    ),
  setPools: (
    organizationId: string,
    divisionId: string,
    pools: Array<{ poolId: string; teamIds: string[] }>,
  ) =>
    apiService.put<CompetitionWorkspace>(
      `${endpoint(organizationId, divisionId)}/pools`,
      { pools },
      { credentials: "include" },
    ),
  updateFormat: (
    organizationId: string,
    divisionId: string,
    data: Partial<LeagueSeasonCompetitionDefaultsInput>,
  ) =>
    apiService.patch(
      endpoint(organizationId, divisionId),
      data,
      { credentials: "include" },
    ),
}
