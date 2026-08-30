import type {
  LeagueSeason,
  LeagueSeasonGameRulesInput,
  LeagueSeasonCompetitionDefaultsInput,
  PlayoffFormat,
  QualifyingFormat,
  TiebreakerRule,
} from "@/services/league-season.service"

export type SeasonStatus = "draft" | "active" | "inactive"

export type SeasonGameRulesForm = {
  overtimeMinutes: number
  personalFoulLimit: number
  periodMinutes: number
  regulationPeriods: number
  shotClockEnabled: boolean
  shotClockFullSeconds: number
  shotClockShortSeconds: number
  teamFoulsBeforePenalty: number
  timeoutsFirstHalf: number
  timeoutsPerOvertime: number
  timeoutsSecondHalf: number
}

export type SeasonCompetitionForm = {
  crossoverTemplate: Array<{ awaySeed: string; homeSeed: string }>
  playoffFormat: PlayoffFormat
  poolCount: number
  qualifiersPerPool: number
  qualifyingFormat: QualifyingFormat
  scheduleSlotDurationMinutes: number
  tiebreakers: TiebreakerRule[]
}

export type SeasonGameRulesValidationError = {
  field: keyof SeasonGameRulesForm
  message: string
}

export type SeasonFormValues = {
  competition: SeasonCompetitionForm
  gameRules: SeasonGameRulesForm
  name: string
  publicEnabled: boolean
  slug: string
  status: SeasonStatus
}

export const DEFAULT_SEASON_GAME_RULES: SeasonGameRulesForm = {
  overtimeMinutes: 5,
  personalFoulLimit: 5,
  periodMinutes: 10,
  regulationPeriods: 4,
  shotClockEnabled: true,
  shotClockFullSeconds: 24,
  shotClockShortSeconds: 14,
  teamFoulsBeforePenalty: 4,
  timeoutsFirstHalf: 2,
  timeoutsPerOvertime: 1,
  timeoutsSecondHalf: 3,
}

export const DEFAULT_SEASON_COMPETITION: SeasonCompetitionForm = {
  crossoverTemplate: [
    { awaySeed: "B2", homeSeed: "A1" },
    { awaySeed: "A2", homeSeed: "B1" },
  ],
  playoffFormat: "single_elimination",
  poolCount: 2,
  qualifiersPerPool: 2,
  qualifyingFormat: "single_round_robin",
  scheduleSlotDurationMinutes: 90,
  tiebreakers: [
    "win_percentage",
    "head_to_head",
    "point_differential",
    "points_for",
    "manual_decision",
  ],
}

export function slugifySeasonName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
}

export function createSeasonFormValues(): SeasonFormValues {
  return {
    competition: {
      ...DEFAULT_SEASON_COMPETITION,
      crossoverTemplate: DEFAULT_SEASON_COMPETITION.crossoverTemplate.map(
        (matchup) => ({ ...matchup }),
      ),
      tiebreakers: [...DEFAULT_SEASON_COMPETITION.tiebreakers],
    },
    gameRules: { ...DEFAULT_SEASON_GAME_RULES },
    name: "",
    publicEnabled: false,
    slug: "",
    status: "draft",
  }
}

export function seasonToFormValues(season: LeagueSeason): SeasonFormValues {
  return {
    competition: {
      crossoverTemplate: season.competition_defaults.crossover_template.map(
        (matchup) => ({ ...matchup }),
      ),
      playoffFormat: season.competition_defaults.playoff_format,
      poolCount: season.competition_defaults.pool_count,
      qualifiersPerPool:
        season.competition_defaults.qualifiers_per_pool,
      qualifyingFormat: season.competition_defaults.qualifying_format,
      scheduleSlotDurationMinutes: season.schedule_slot_duration_minutes,
      tiebreakers: [...season.competition_defaults.tiebreakers],
    },
    gameRules: {
      overtimeMinutes: season.game_rules.overtime_duration_ms / 60000,
      personalFoulLimit: season.game_rules.personal_foul_limit,
      periodMinutes: season.game_rules.period_duration_ms / 60000,
      regulationPeriods: season.game_rules.regulation_periods,
      shotClockEnabled: season.game_rules.shot_clock_enabled,
      shotClockFullSeconds: season.game_rules.shot_clock_full_ms / 1000,
      shotClockShortSeconds: season.game_rules.shot_clock_short_ms / 1000,
      teamFoulsBeforePenalty:
        season.game_rules.team_fouls_before_penalty,
      timeoutsFirstHalf: season.game_rules.timeouts_first_half,
      timeoutsPerOvertime: season.game_rules.timeouts_per_overtime,
      timeoutsSecondHalf: season.game_rules.timeouts_second_half,
    },
    name: season.name,
    publicEnabled: season.public_enabled,
    slug: season.slug,
    status: season.status as SeasonStatus,
  }
}

export function toGameRulesInput(
  rules: SeasonGameRulesForm,
): LeagueSeasonGameRulesInput {
  return {
    overtimeDurationMs: rules.overtimeMinutes * 60000,
    personalFoulLimit: rules.personalFoulLimit,
    periodDurationMs: rules.periodMinutes * 60000,
    regulationPeriods: rules.regulationPeriods,
    shotClockEnabled: rules.shotClockEnabled,
    shotClockFullMs: rules.shotClockFullSeconds * 1000,
    shotClockShortMs: rules.shotClockShortSeconds * 1000,
    teamFoulsBeforePenalty: rules.teamFoulsBeforePenalty,
    timeoutsFirstHalf: rules.timeoutsFirstHalf,
    timeoutsPerOvertime: rules.timeoutsPerOvertime,
    timeoutsSecondHalf: rules.timeoutsSecondHalf,
  }
}

export function toCompetitionDefaultsInput(
  competition: SeasonCompetitionForm,
): LeagueSeasonCompetitionDefaultsInput {
  return {
    crossoverTemplate: competition.crossoverTemplate.map((matchup) => ({
      awaySeed: matchup.awaySeed.trim().toUpperCase(),
      homeSeed: matchup.homeSeed.trim().toUpperCase(),
    })),
    playoffFormat: competition.playoffFormat,
    poolCount: competition.poolCount,
    qualifiersPerPool: competition.qualifiersPerPool,
    qualifyingFormat: competition.qualifyingFormat,
    tiebreakers: [...competition.tiebreakers],
  }
}

export function validateSeasonDetails(values: SeasonFormValues): string | null {
  if (!values.name.trim()) return "Season name is required."
  if (!values.slug.trim()) return "Season slug is required."

  return null
}

export function validateSeasonGameRules(
  rules: SeasonGameRulesForm,
): string | null {
  return getSeasonGameRulesValidationError(rules)?.message ?? null
}

export function getSeasonGameRulesValidationError(
  rules: SeasonGameRulesForm,
): SeasonGameRulesValidationError | null {
  if (!isWholeNumberInRange(rules.regulationPeriods, 1, 8)) {
    return {
      field: "regulationPeriods",
      message: "The season must have between 1 and 8 quarters.",
    }
  }

  if (!isWholeNumberInRange(rules.periodMinutes, 1, 30)) {
    return {
      field: "periodMinutes",
      message: "Quarter length must be between 1 and 30 minutes.",
    }
  }

  if (!isWholeNumberInRange(rules.overtimeMinutes, 1, 30)) {
    return {
      field: "overtimeMinutes",
      message: "Overtime length must be between 1 and 30 minutes.",
    }
  }

  if (!isWholeNumberInRange(rules.personalFoulLimit, 1, 10)) {
    return {
      field: "personalFoulLimit",
      message: "The personal-foul limit must be between 1 and 10.",
    }
  }

  if (!isWholeNumberInRange(rules.shotClockFullSeconds, 1, 99)) {
    return {
      field: "shotClockFullSeconds",
      message: "The full shot clock must be between 1 and 99 seconds.",
    }
  }

  if (!isWholeNumberInRange(rules.shotClockShortSeconds, 1, 99)) {
    return {
      field: "shotClockShortSeconds",
      message: "The short reset must be between 1 and 99 seconds.",
    }
  }

  if (rules.shotClockShortSeconds > rules.shotClockFullSeconds) {
    return {
      field: "shotClockShortSeconds",
      message: "The short reset cannot be longer than the full shot clock.",
    }
  }

  if (!isWholeNumberInRange(rules.teamFoulsBeforePenalty, 1, 20)) {
    return {
      field: "teamFoulsBeforePenalty",
      message: "Team fouls before penalty must be between 1 and 20.",
    }
  }

  for (const field of [
    "timeoutsFirstHalf",
    "timeoutsSecondHalf",
    "timeoutsPerOvertime",
  ] as const) {
    if (!isWholeNumberInRange(rules[field], 0, 10)) {
      return {
        field,
        message: "Each timeout allowance must be between 0 and 10.",
      }
    }
  }

  return null
}

export function validateSeasonCompetition(
  competition: SeasonCompetitionForm,
): string | null {
  if (!isWholeNumberInRange(competition.scheduleSlotDurationMinutes, 15, 1440)) {
    return "The scheduling slot must be between 15 and 1,440 minutes."
  }
  if (!isWholeNumberInRange(competition.poolCount, 1, 16)) {
    return "Choose between 1 and 16 pools."
  }
  if (!isWholeNumberInRange(competition.qualifiersPerPool, 1, 64)) {
    return "Choose between 1 and 64 qualifiers per pool."
  }
  if (competition.tiebreakers[0] !== "win_percentage") {
    return "Ranking must start with win percentage."
  }
  if (
    competition.qualifyingFormat !== "none" &&
    competition.playoffFormat !== "none"
  ) {
    const seeds = competition.crossoverTemplate.flatMap((matchup) => [
      matchup.homeSeed.trim().toUpperCase(),
      matchup.awaySeed.trim().toUpperCase(),
    ])
    if (seeds.length < 2 || seeds.some((seed) => !/^[A-Z]+[1-9]\d*$/.test(seed))) {
      return "Each crossover slot must use a pool seed such as A1 or B2."
    }
    if (new Set(seeds).size !== seeds.length) {
      return "Each pool seed can appear only once in the crossover."
    }
  }
  return null
}

export function formatSeasonGameRules(season: LeagueSeason): string {
  const rules = season.game_rules
  const timing = `${rules.regulation_periods} × ${rules.period_duration_ms / 60000} min`
  const shotClock = rules.shot_clock_enabled
    ? `${rules.shot_clock_full_ms / 1000}/${rules.shot_clock_short_ms / 1000} sec`
    : "No shot clock"

  return `${timing} · ${shotClock}`
}

function isWholeNumberInRange(value: number, minimum: number, maximum: number) {
  return Number.isInteger(value) && value >= minimum && value <= maximum
}
