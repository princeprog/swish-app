import { API_ENDPOINTS } from "@/constants/api-config";
import { apiService } from "@/services/api.service";

export type StatisticEventType =
  | "points"
  | "rebound"
  | "assist"
  | "steal"
  | "turnover";
export type PlayerBoxScore = {
  assists: number;
  playerId: string;
  points: number;
  rebounds: number;
  steals: number;
  teamId: string;
  turnovers: number;
};
export type PlayerOfGameCandidate = PlayerBoxScore & {
  playerName: string;
};
export type PlayerOfGameState = {
  award: {
    confirmation_reason: string | null;
    confirmed_at: string | null;
    selected_player_id: string | null;
    suggested_player_id: string;
    suggested_score: number;
  };
  candidates: PlayerOfGameCandidate[];
  suggestion: {
    metricScore: number;
    playerId: string;
    teamId: string;
  };
};
export type StatisticsState = {
  boxScores: PlayerBoxScore[];
  events: Array<{
    id: string;
    player_id: string | null;
    reverses_event_id: string | null;
    sequence: number;
    type: StatisticEventType | "event.reversed";
    value: number;
  }>;
  game: {
    awayScore: number | null;
    awayTeamId: string;
    homeScore: number | null;
    homeTeamId: string;
    status: string;
  };
  roster: Array<{
    id: string;
    jersey_number: string;
    name: string;
    position: string | null;
    sort_order: number;
    team_id: string;
  }>;
  sheet: {
    away_player_points: number;
    home_player_points: number;
    override_reason: string | null;
    status: "draft" | "submitted" | "finalized" | "reopened";
  };
  version: number;
};

function endpoint(organizationId: string, gameId: string) {
  return `${API_ENDPOINTS.schedules.list(organizationId)}/${gameId}/statistics`;
}

export const statisticsService = {
  claim: (organizationId: string, gameId: string, deviceLabel?: string) =>
    apiService.post<{
      controlToken: string;
      expiresAt: string;
      sessionId: string;
    }>(
      `${endpoint(organizationId, gameId)}/control/claim`,
      { deviceLabel },
      { credentials: "include" },
    ),
  getState: (organizationId: string, gameId: string) =>
    apiService.get<StatisticsState>(endpoint(organizationId, gameId), {
      credentials: "include",
    }),
  getPlayerOfGame: (organizationId: string, gameId: string) =>
    apiService.get<PlayerOfGameState>(
      `${endpoint(organizationId, gameId)}/player-of-game`,
      { credentials: "include" },
    ),
  heartbeat: (organizationId: string, gameId: string, controlToken: string) =>
    apiService.post(
      `${endpoint(organizationId, gameId)}/control/heartbeat`,
      { controlToken },
      { credentials: "include" },
    ),
  record: (
    organizationId: string,
    gameId: string,
    data: {
      controlToken: string;
      expectedVersion: number;
      idempotencyKey: string;
      occurredAt: string;
      playerId?: string;
      reversesEventId?: string;
      type?: StatisticEventType;
      value?: number;
    },
  ) =>
    apiService.post<StatisticsState>(
      `${endpoint(organizationId, gameId)}/events`,
      data,
      { credentials: "include" },
    ),
  submit: (organizationId: string, gameId: string, controlToken: string) =>
    apiService.post(
      `${endpoint(organizationId, gameId)}/submit`,
      { controlToken },
      { credentials: "include" },
    ),
  confirmPlayerOfGame: (
    organizationId: string,
    gameId: string,
    data: { playerId: string; reason?: string },
  ) =>
    apiService.post<{
      award: PlayerOfGameState["award"];
      suggestion: PlayerOfGameState["suggestion"];
    }>(`${endpoint(organizationId, gameId)}/player-of-game/confirm`, data, {
      credentials: "include",
    }),
};
