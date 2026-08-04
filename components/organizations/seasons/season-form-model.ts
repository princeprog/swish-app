import type {
  LeagueSeason,
  LeagueSeasonGameRulesInput,
} from "@/services/league-season.service"

export type SeasonStatus = "draft" | "active" | "inactive"

export type SeasonGameRulesForm = {
  overtimeMinutes: number
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

export type SeasonFormValues = {
  gameRules: SeasonGameRulesForm
  name: string
  publicEnabled: boolean
  slug: string
  status: SeasonStatus
}

export const DEFAULT_SEASON_GAME_RULES: SeasonGameRulesForm = {
  overtimeMinutes: 5,
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
    gameRules: { ...DEFAULT_SEASON_GAME_RULES },
    name: "",
    publicEnabled: false,
    slug: "",
    status: "draft",
  }
}

export function seasonToFormValues(season: LeagueSeason): SeasonFormValues {
  return {
    gameRules: {
      overtimeMinutes: season.game_rules.overtime_duration_ms / 60000,
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

export function validateSeasonDetails(values: SeasonFormValues): string | null {
  if (!values.name.trim()) return "Season name is required."
  if (!values.slug.trim()) return "Season slug is required."

  return null
}

export function validateSeasonGameRules(
  rules: SeasonGameRulesForm,
): string | null {
  if (!isWholeNumberInRange(rules.regulationPeriods, 1, 8)) {
    return "The season must have between 1 and 8 quarters."
  }

  if (!isWholeNumberInRange(rules.periodMinutes, 1, 30)) {
    return "Quarter length must be between 1 and 30 minutes."
  }

  if (!isWholeNumberInRange(rules.overtimeMinutes, 1, 30)) {
    return "Overtime length must be between 1 and 30 minutes."
  }

  if (!isWholeNumberInRange(rules.shotClockFullSeconds, 1, 99)) {
    return "The full shot clock must be between 1 and 99 seconds."
  }

  if (!isWholeNumberInRange(rules.shotClockShortSeconds, 1, 99)) {
    return "The short reset must be between 1 and 99 seconds."
  }

  if (rules.shotClockShortSeconds > rules.shotClockFullSeconds) {
    return "The short reset cannot be longer than the full shot clock."
  }

  if (!isWholeNumberInRange(rules.teamFoulsBeforePenalty, 1, 20)) {
    return "Team fouls before penalty must be between 1 and 20."
  }

  for (const allowance of [
    rules.timeoutsFirstHalf,
    rules.timeoutsSecondHalf,
    rules.timeoutsPerOvertime,
  ]) {
    if (!isWholeNumberInRange(allowance, 0, 10)) {
      return "Each timeout allowance must be between 0 and 10."
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
