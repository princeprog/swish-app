import { API_ENDPOINTS } from "@/constants/api-config";
import { apiService } from "@/services/api.service";

export type ScoringPhase =
  | "pregame"
  | "live"
  | "paused"
  | "period_break"
  | "final"
  | "reopened";

export type ScoringCommandType =
  | "game.configure"
  | "game.start"
  | "clocks.start"
  | "clocks.pause"
  | "game_clock.adjust"
  | "shot_clock.start"
  | "shot_clock.pause"
  | "shot_clock.reset"
  | "shot_clock.adjust"
  | "score.record"
  | "team_foul.record"
  | "timeout.record"
  | "event.reverse"
  | "period.end"
  | "period.start"
  | "game.finalize"
  | "game.reopen";

export type ScoringState = {
  clock: {
    gameClockRemainingMs: number;
    gameClockRunning: boolean;
    gameClockStartedAt: string | null;
    shotClockRemainingMs: number;
    shotClockRunning: boolean;
    shotClockStartedAt: string | null;
  };
  config: {
    overtimeDurationMs: number;
    periodDurationMs: number;
    regulationPeriods: number;
    shotClockFullMs: number;
    shotClockShortMs: number;
  };
  control: {
    controlledByMe: boolean;
    expiresAt: string | null;
    sessionId?: string;
    status: "available" | "claimed" | "expired";
  };
  fouls: {
    away: number;
    awayInPenalty: boolean;
    home: number;
    homeInPenalty: boolean;
    penaltyAt: number;
  };
  game: {
    awayTeam: {
      id: string;
      name: string;
    };
    divisionName: string;
    homeTeam: {
      id: string;
      name: string;
    };
    id: string;
    startsAt: string;
    status: string;
    venueName: string;
  };
  latestReversibleEvent: {
    id: string;
    payload: Record<string, unknown>;
    summary: string;
    type: "score.record" | "team_foul.record" | "timeout.record";
  } | null;
  period: {
    label: string;
    number: number;
    overtimeNumber: number;
  };
  phase: ScoringPhase;
  scores: {
    away: number;
    home: number;
  };
  serverTime: string;
  timeouts: {
    allowancePerTeam: number;
    away: { remaining: number; used: number };
    home: { remaining: number; used: number };
    segment: "first_half" | "second_half" | "overtime";
  };
  version: number;
};

export type ScoringEvent = {
  game_clock_remaining_ms: number;
  id: string;
  idempotency_key: string;
  occurred_at_client: string | null;
  occurred_at_server: string;
  overtime_number: number;
  payload: Record<string, unknown>;
  period_number: number;
  reverses_event_id: string | null;
  sequence: number;
  shot_clock_remaining_ms: number;
  type: ScoringCommandType;
};

export type ScoringCommandPayload = {
  controlToken?: string;
  expectedVersion: number;
  idempotencyKey: string;
  occurredAt: string;
  payload?: Record<string, unknown>;
  type: ScoringCommandType;
};

export type ScoringCommandResponse = {
  event: ScoringEvent;
  state: ScoringState;
};

export type ScoringControlResponse = {
  controlToken: string;
  expiresAt: string;
  sessionId: string;
};

function scoringEndpoint(organizationId: string, gameId: string) {
  return `${API_ENDPOINTS.schedules.list(organizationId)}/${gameId}/scoring`;
}

export const scoringService = {
  claimControl: (
    organizationId: string,
    gameId: string,
    data?: { deviceLabel?: string },
  ) =>
    apiService.post<ScoringControlResponse>(
      `${scoringEndpoint(organizationId, gameId)}/control/claim`,
      data ?? {},
      { credentials: "include" },
    ),
  executeCommand: (
    organizationId: string,
    gameId: string,
    data: ScoringCommandPayload,
  ) =>
    apiService.post<ScoringCommandResponse, ScoringCommandPayload>(
      `${scoringEndpoint(organizationId, gameId)}/commands`,
      data,
      { credentials: "include" },
    ),
  getState: (organizationId: string, gameId: string) =>
    apiService.get<ScoringState>(scoringEndpoint(organizationId, gameId), {
      credentials: "include",
    }),
  heartbeatControl: (
    organizationId: string,
    gameId: string,
    data: { controlToken: string },
  ) =>
    apiService.post<{ expiresAt: string; sessionId: string }, typeof data>(
      `${scoringEndpoint(organizationId, gameId)}/control/heartbeat`,
      data,
      { credentials: "include" },
    ),
  listEvents: (
    organizationId: string,
    gameId: string,
    query?: { beforeSequence?: number; limit?: number },
  ) =>
    apiService.get<ScoringEvent[]>(
      `${scoringEndpoint(organizationId, gameId)}/events`,
      {
        credentials: "include",
        query,
      },
    ),
  releaseControl: (
    organizationId: string,
    gameId: string,
    data: { controlToken: string },
  ) =>
    apiService.delete<{ success: true }>(
      `${scoringEndpoint(organizationId, gameId)}/control`,
      {
        credentials: "include",
        data,
      },
    ),
  takeoverControl: (
    organizationId: string,
    gameId: string,
    data: { deviceLabel?: string; reason: string },
  ) =>
    apiService.post<ScoringControlResponse, typeof data>(
      `${scoringEndpoint(organizationId, gameId)}/control/takeover`,
      data,
      { credentials: "include" },
    ),
};
