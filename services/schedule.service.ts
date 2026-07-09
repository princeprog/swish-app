import { API_ENDPOINTS } from "@/constants/api-config"
import { apiService } from "@/services/api.service"

export type Schedule = {
  away_score: number | null
  away_team_color: string | null
  away_team_id: string
  away_team_name: string
  away_team_slug: string
  created_at: string
  division_id: string
  division_name: string
  division_slug: string
  finalized_at: string | null
  home_score: number | null
  home_team_color: string | null
  home_team_id: string
  home_team_name: string
  home_team_slug: string
  id: string
  league_season_id: string
  league_season_name: string
  league_season_slug: string
  organization_id: string
  published_at: string | null
  starts_at: string
  status: string
  updated_at: string
  venue_id: string
  venue_name: string
  venue_slug: string
}

export type CreateSchedulePayload = {
  awayTeamId: string
  awayScore?: number
  divisionId: string
  homeTeamId: string
  homeScore?: number
  leagueSeasonId: string
  startsAt: string
  status?: "draft" | "scheduled" | "live" | "final" | "reopened" | "postponed" | "cancelled"
  venueId: string
}

export type UpdateSchedulePayload = Partial<CreateSchedulePayload>

export const scheduleService = {
  create: (organizationId: string, data: CreateSchedulePayload) =>
    apiService.post<Schedule, CreateSchedulePayload>(
      API_ENDPOINTS.schedules.create(organizationId),
      data,
      { credentials: "include" },
    ),
  list: (organizationId: string) =>
    apiService.get<Schedule[]>(API_ENDPOINTS.schedules.list(organizationId), {
      credentials: "include",
    }),
  remove: (organizationId: string, scheduleId: string) =>
    apiService.delete<void>(
      `${API_ENDPOINTS.schedules.list(organizationId)}/${scheduleId}`,
      {
        credentials: "include",
      },
    ),
  update: (organizationId: string, scheduleId: string, data: UpdateSchedulePayload) =>
    apiService.patch<Schedule, UpdateSchedulePayload>(
      `${API_ENDPOINTS.schedules.list(organizationId)}/${scheduleId}`,
      data,
      { credentials: "include" },
    ),
}
