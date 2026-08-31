import { API_ENDPOINTS } from "@/constants/api-config";
import { apiService } from "@/services/api.service";

export type Schedule = {
  away_score: number | null;
  away_team_color: string | null;
  away_team_id: string;
  away_team_name: string;
  away_team_slug: string;
  created_at: string;
  division_id: string;
  division_name: string;
  division_slug: string;
  finalized_at: string | null;
  home_score: number | null;
  home_team_color: string | null;
  home_team_id: string;
  home_team_name: string;
  home_team_slug: string;
  id: string;
  league_season_id: string;
  league_season_name: string;
  league_season_slug: string;
  organization_id: string;
  published_at: string | null;
  scorekeeper_member_id: string | null;
  scorekeeper_name: string | null;
  statistician_member_id: string | null;
  statistician_name: string | null;
  starts_at: string;
  status: string;
  updated_at: string;
  venue_id: string;
  venue_name: string;
  venue_slug: string;
  archived_at?: string | null;
};

export type CreateSchedulePayload = {
  awayTeamId: string;
  awayScore?: number;
  divisionId: string;
  homeTeamId: string;
  homeScore?: number;
  leagueSeasonId: string;
  scorekeeperMemberId?: string | null;
  statisticianMemberId?: string | null;
  startsAt: string;
  status?:
    | "draft"
    | "scheduled"
    | "live"
    | "final"
    | "reopened"
    | "postponed"
    | "cancelled";
  venueId: string;
};

export type UpdateSchedulePayload = Partial<CreateSchedulePayload>;

export type FinalizeScheduleGamePayload = {
  awayScore: number;
  homeScore: number;
};

export type ScorekeeperOption = {
  email: string;
  id: string;
  name: string;
};
export type StatisticianOption = ScorekeeperOption;

export type UpdateScorekeeperAssignmentPayload = {
  scorekeeperMemberId: string | null;
};
export type UpdateStatisticianAssignmentPayload = {
  statisticianMemberId: string | null;
};

export type ScheduleListQuery = {
  divisionId?: string;
  leagueSeasonId?: string;
  search?: string;
  sortBy?: "date" | "division" | "venue";
  status?: CreateSchedulePayload["status"];
};

export const scheduleService = {
  create: (organizationId: string, data: CreateSchedulePayload) =>
    apiService.post<Schedule, CreateSchedulePayload>(
      API_ENDPOINTS.schedules.create(organizationId),
      data,
      { credentials: "include" },
    ),
  list: (organizationId: string, query?: ScheduleListQuery) =>
    apiService.get<Schedule[]>(API_ENDPOINTS.schedules.list(organizationId), {
      credentials: "include",
      query,
    }),
  finalize: (
    organizationId: string,
    scheduleId: string,
    data: FinalizeScheduleGamePayload,
  ) =>
    apiService.post<Schedule, FinalizeScheduleGamePayload>(
      API_ENDPOINTS.schedules.finalize(organizationId, scheduleId),
      data,
      { credentials: "include" },
    ),
  listScorekeepers: (organizationId: string) =>
    apiService.get<ScorekeeperOption[]>(
      API_ENDPOINTS.schedules.scorekeepers(organizationId),
      {
        credentials: "include",
      },
    ),
  listStatisticians: (organizationId: string) =>
    apiService.get<StatisticianOption[]>(
      `${API_ENDPOINTS.schedules.list(organizationId)}/statisticians`,
      { credentials: "include" },
    ),
  get: (organizationId: string, scheduleId: string) =>
    apiService.get<Schedule>(
      `${API_ENDPOINTS.schedules.list(organizationId)}/${scheduleId}`,
      {
        credentials: "include",
      },
    ),
  archive: (organizationId: string, scheduleId: string) =>
    apiService.post<Schedule, Record<string, never>>(
      API_ENDPOINTS.schedules.archive(organizationId, scheduleId),
      {},
      { credentials: "include" },
    ),
  remove: (organizationId: string, scheduleId: string) =>
    scheduleService.archive(organizationId, scheduleId),
  restore: (organizationId: string, scheduleId: string) =>
    apiService.post<Schedule, Record<string, never>>(
      API_ENDPOINTS.schedules.restore(organizationId, scheduleId),
      {},
      { credentials: "include" },
    ),
  update: (
    organizationId: string,
    scheduleId: string,
    data: UpdateSchedulePayload,
  ) =>
    apiService.patch<Schedule, UpdateSchedulePayload>(
      `${API_ENDPOINTS.schedules.list(organizationId)}/${scheduleId}`,
      data,
      { credentials: "include" },
    ),
  updateScorekeeper: (
    organizationId: string,
    scheduleId: string,
    data: UpdateScorekeeperAssignmentPayload,
  ) =>
    apiService.put<Schedule, UpdateScorekeeperAssignmentPayload>(
      API_ENDPOINTS.schedules.scorekeeper(organizationId, scheduleId),
      data,
      { credentials: "include" },
    ),
  updateStatistician: (
    organizationId: string,
    scheduleId: string,
    data: UpdateStatisticianAssignmentPayload,
  ) =>
    apiService.put<Schedule, UpdateStatisticianAssignmentPayload>(
      `${API_ENDPOINTS.schedules.list(organizationId)}/${scheduleId}/statistician`,
      data,
      { credentials: "include" },
    ),
};
