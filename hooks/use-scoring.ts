"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  scoringCommandQueue,
  type QueuedScoringCommand,
} from "@/services/scoring-command-queue";
import {
  isQueueableScoringError,
  rebaseClientScoringState,
} from "@/lib/scoring-live-display";
import { getFriendlyScoringCommandErrorMessage } from "@/lib/scoring-command-errors";
import { canRetryNextPeriodAfterRefresh } from "@/lib/scorekeeper-period-controls";
import {
  scoringService,
  type ScoringCommandPayload,
  type ScoringCommandType,
  type ScoringControlResponse,
  type ScoringState,
} from "@/services/scoring.service";

export const SCORING_QUERY_KEYS = {
  events: (organizationId: string, gameId: string) =>
    ["scoring", "events", organizationId, gameId] as const,
  state: (organizationId: string, gameId: string) =>
    ["scoring", "state", organizationId, gameId] as const,
};

type LocalScoringState = {
  controlToken: string | null;
  lastConfirmedAction: string | null;
  offlineSince: number | null;
  pendingCommands: QueuedScoringCommand[];
  state: ScoringState | null;
};

type OptimisticCommand = {
  controlToken?: string;
  payload?: Record<string, unknown>;
  type: ScoringCommandType;
};

export type SendScoringCommandResult =
  | { status: "confirmed"; state: ScoringState }
  | { status: "queued" }
  | { message?: string; state?: ScoringState; status: "failed" }
  | { status: "blocked" }
  | { status: "ignored" };

type LiveScoringAction =
  | { state: ScoringState; type: "server-state" }
  | { control: ScoringControlResponse; type: "control-claimed" }
  | {
      control: Pick<ScoringControlResponse, "expiresAt" | "sessionId">;
      type: "control-heartbeat";
    }
  | { command: OptimisticCommand; idempotencyKey: string; type: "optimistic" }
  | { action: string; state: ScoringState; type: "command-confirmed" }
  | { pendingCommands: QueuedScoringCommand[]; type: "pending-loaded" }
  | { command: QueuedScoringCommand; type: "command-queued" }
  | { type: "queue-cleared" }
  | { type: "offline" }
  | { type: "online" };

function applyOptimisticCommand(
  state: ScoringState,
  command: OptimisticCommand,
): ScoringState {
  let next: ScoringState = structuredClone(state);

  if (command.type === "score.record") {
    const teamId = command.payload?.teamId;
    const points = Number(command.payload?.points ?? 0);

    if (teamId === next.game.homeTeam.id) {
      next.scores.home += points;
      next.latestReversibleEvent = {
        id: "optimistic",
        payload: command.payload ?? {},
        summary: `${next.game.homeTeam.name} +${points}`,
        type: "score.record",
      };
    }

    if (teamId === next.game.awayTeam.id) {
      next.scores.away += points;
      next.latestReversibleEvent = {
        id: "optimistic",
        payload: command.payload ?? {},
        summary: `${next.game.awayTeam.name} +${points}`,
        type: "score.record",
      };
    }
  }

  if (command.type === "team_foul.record") {
    const teamId = command.payload?.teamId;

    if (teamId === next.game.homeTeam.id) {
      next.fouls.home += 1;
      next.fouls.homeInPenalty = next.fouls.home >= next.fouls.penaltyAt;
      next.latestReversibleEvent = {
        id: "optimistic",
        payload: command.payload ?? {},
        summary: `${next.game.homeTeam.name} team foul`,
        type: "team_foul.record",
      };
    }

    if (teamId === next.game.awayTeam.id) {
      next.fouls.away += 1;
      next.fouls.awayInPenalty = next.fouls.away >= next.fouls.penaltyAt;
      next.latestReversibleEvent = {
        id: "optimistic",
        payload: command.payload ?? {},
        summary: `${next.game.awayTeam.name} team foul`,
        type: "team_foul.record",
      };
    }
  }

  if (command.type === "personal_foul.record") {
    const teamId = command.payload?.teamId;
    const playerId = command.payload?.playerId;
    if (teamId === next.game.homeTeam.id) next.fouls.home += 1;
    if (teamId === next.game.awayTeam.id) next.fouls.away += 1;
    const existing = next.playerFouls.find(
      (foul) => foul.game_roster_player_id === playerId,
    );
    const player = next.roster.find((item) => item.id === playerId);
    if (existing) {
      existing.personal_fouls += 1;
    } else if (
      player &&
      typeof playerId === "string" &&
      typeof teamId === "string"
    ) {
      next.playerFouls.push({
        fouled_out: false,
        game_roster_player_id: playerId,
        jersey_number: player.jersey_number,
        name: player.name,
        personal_fouls: 1,
        team_id: teamId,
      });
    }
    next.latestReversibleEvent = {
      id: "optimistic",
      payload: command.payload ?? {},
      summary: `${player?.name ?? "Player"} personal foul`,
      type: "personal_foul.record",
    };
  }

  if (command.type === "timeout.record") {
    next = rebaseClientScoringState(next, Date.now());
    const teamId = command.payload?.teamId;

    if (teamId === next.game.homeTeam.id) {
      next.timeouts.home.used += 1;
      next.timeouts.home.remaining = Math.max(
        0,
        next.timeouts.home.remaining - 1,
      );
      next.latestReversibleEvent = {
        id: "optimistic",
        payload: command.payload ?? {},
        summary: `${next.game.homeTeam.name} timeout`,
        type: "timeout.record",
      };
    }

    if (teamId === next.game.awayTeam.id) {
      next.timeouts.away.used += 1;
      next.timeouts.away.remaining = Math.max(
        0,
        next.timeouts.away.remaining - 1,
      );
      next.latestReversibleEvent = {
        id: "optimistic",
        payload: command.payload ?? {},
        summary: `${next.game.awayTeam.name} timeout`,
        type: "timeout.record",
      };
    }

    next.phase = "paused";
    next.clock.gameClockRunning = false;
    next.clock.shotClockRunning = false;
    next.clock.gameClockStartedAt = null;
    next.clock.shotClockStartedAt = null;
  }

  if (command.type === "game.start" || command.type === "clocks.start") {
    next = rebaseClientScoringState(next, Date.now());
    const now = next.serverTime;
    next.phase = "live";
    next.clock.gameClockRunning = true;
    next.clock.shotClockRunning = next.config.shotClockEnabled;
    next.clock.gameClockStartedAt = now;
    next.clock.shotClockStartedAt = next.config.shotClockEnabled ? now : null;
  }

  if (command.type === "clocks.pause") {
    next = rebaseClientScoringState(next, Date.now());
    next.phase = next.phase === "pregame" ? "pregame" : "paused";
    next.clock.gameClockRunning = false;
    next.clock.shotClockRunning = false;
    next.clock.gameClockStartedAt = null;
    next.clock.shotClockStartedAt = null;
  }

  if (command.type === "shot_clock.reset") {
    next = rebaseClientScoringState(next, Date.now());
    next.clock.shotClockRemainingMs =
      command.payload?.resetTo === "short"
        ? next.config.shotClockShortMs
        : next.config.shotClockFullMs;
    next.clock.shotClockStartedAt = next.clock.shotClockRunning
      ? next.serverTime
      : null;
  }

  if (command.type === "shot_clock.pause") {
    next = rebaseClientScoringState(next, Date.now());
    next.clock.shotClockRunning = false;
    next.clock.shotClockStartedAt = null;
  }

  if (command.type === "shot_clock.start") {
    next = rebaseClientScoringState(next, Date.now());
    next.clock.shotClockRunning = true;
    next.clock.shotClockStartedAt = next.serverTime;
  }

  if (command.type === "event.reverse") {
    const event = next.latestReversibleEvent;

    if (event?.type === "score.record") {
      const teamId = event.payload.teamId;
      const points = Number(event.payload.points ?? 0);
      if (teamId === next.game.homeTeam.id) next.scores.home -= points;
      if (teamId === next.game.awayTeam.id) next.scores.away -= points;
    }

    if (
      event?.type === "team_foul.record" ||
      event?.type === "personal_foul.record"
    ) {
      const teamId = event.payload.teamId;
      if (teamId === next.game.homeTeam.id) next.fouls.home -= 1;
      if (teamId === next.game.awayTeam.id) next.fouls.away -= 1;
      next.fouls.homeInPenalty = next.fouls.home >= next.fouls.penaltyAt;
      next.fouls.awayInPenalty = next.fouls.away >= next.fouls.penaltyAt;
      if (event.type === "personal_foul.record") {
        const player = next.playerFouls.find(
          (foul) => foul.game_roster_player_id === event.payload.playerId,
        );
        if (player)
          player.personal_fouls = Math.max(0, player.personal_fouls - 1);
      }
    }

    if (event?.type === "timeout.record") {
      const teamId = event.payload.teamId;
      if (teamId === next.game.homeTeam.id) {
        next.timeouts.home.used = Math.max(0, next.timeouts.home.used - 1);
        next.timeouts.home.remaining = Math.min(
          next.timeouts.allowancePerTeam,
          next.timeouts.home.remaining + 1,
        );
      }
      if (teamId === next.game.awayTeam.id) {
        next.timeouts.away.used = Math.max(0, next.timeouts.away.used - 1);
        next.timeouts.away.remaining = Math.min(
          next.timeouts.allowancePerTeam,
          next.timeouts.away.remaining + 1,
        );
      }
      next.phase = "paused";
      next.clock.gameClockRunning = false;
      next.clock.shotClockRunning = false;
      next.clock.gameClockStartedAt = null;
      next.clock.shotClockStartedAt = null;
    }

    next.latestReversibleEvent = null;
  }

  next.version += 1;
  return next;
}

function formatCommandConfirmation(
  command: OptimisticCommand,
  state: ScoringState,
) {
  if (command.type === "score.record") {
    const points = command.payload?.points;
    const teamId = command.payload?.teamId;
    const teamName =
      teamId === state.game.homeTeam.id
        ? state.game.homeTeam.name
        : state.game.awayTeam.name;

    return `${teamName} +${points} recorded`;
  }

  if (command.type === "team_foul.record") {
    const teamId = command.payload?.teamId;
    const teamName =
      teamId === state.game.homeTeam.id
        ? state.game.homeTeam.name
        : state.game.awayTeam.name;

    return `${teamName} foul recorded`;
  }

  if (command.type === "timeout.record") {
    const teamId = command.payload?.teamId;
    const teamName =
      teamId === state.game.homeTeam.id
        ? state.game.homeTeam.name
        : state.game.awayTeam.name;

    return `${teamName} timeout recorded`;
  }

  if (command.type === "game.finalize") {
    return "Game finalized";
  }

  if (command.type === "game.reopen") {
    return "Game reopened for correction";
  }

  return "Scoring action recorded";
}

function liveScoringReducer(
  current: LocalScoringState,
  action: LiveScoringAction,
): LocalScoringState {
  switch (action.type) {
    case "server-state":
      return { ...current, state: action.state };
    case "control-claimed":
      return {
        ...current,
        controlToken: action.control.controlToken,
        state: current.state
          ? {
              ...current.state,
              control: {
                controlledByMe: true,
                expiresAt: action.control.expiresAt,
                sessionId: action.control.sessionId,
                status: "claimed",
              },
            }
          : current.state,
      };
    case "control-heartbeat":
      return {
        ...current,
        state: current.state
          ? {
              ...current.state,
              control: {
                ...current.state.control,
                expiresAt: action.control.expiresAt,
                sessionId: action.control.sessionId,
                status: "claimed",
              },
            }
          : current.state,
      };
    case "optimistic":
      if (!current.state) return current;
      return {
        ...current,
        lastConfirmedAction: null,
        state: applyOptimisticCommand(current.state, action.command),
      };
    case "command-confirmed":
      return {
        ...current,
        lastConfirmedAction: action.action,
        offlineSince: null,
        state: action.state,
      };
    case "pending-loaded":
      return { ...current, pendingCommands: action.pendingCommands };
    case "command-queued":
      return {
        ...current,
        offlineSince: current.offlineSince ?? Date.now(),
        pendingCommands: [...current.pendingCommands, action.command],
      };
    case "queue-cleared":
      return { ...current, pendingCommands: [] };
    case "offline":
      return { ...current, offlineSince: current.offlineSince ?? Date.now() };
    case "online":
      return { ...current, offlineSince: null };
    default:
      return current;
  }
}

function createIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useScoringStateQuery(organizationId?: string, gameId?: string) {
  return useQuery({
    enabled: Boolean(organizationId && gameId),
    queryFn: () => scoringService.getState(organizationId!, gameId!),
    queryKey: SCORING_QUERY_KEYS.state(
      organizationId ?? "unknown",
      gameId ?? "unknown",
    ),
    refetchInterval: 15000,
    retry: false,
  });
}

export function useLiveScoring(organizationId?: string, gameId?: string) {
  const queryClient = useQueryClient();
  const stateQuery = useScoringStateQuery(organizationId, gameId);
  const [local, dispatch] = React.useReducer(liveScoringReducer, {
    controlToken: null,
    lastConfirmedAction: null,
    offlineSince: null,
    pendingCommands: [],
    state: null,
  });

  React.useEffect(() => {
    if (stateQuery.data) {
      dispatch({ state: stateQuery.data, type: "server-state" });
    }
  }, [stateQuery.data]);

  React.useEffect(() => {
    if (!organizationId || !gameId) return;

    void scoringCommandQueue
      .list(organizationId, gameId)
      .then((pendingCommands) =>
        dispatch({ pendingCommands, type: "pending-loaded" }),
      )
      .catch(() => undefined);
  }, [gameId, organizationId]);

  React.useEffect(() => {
    const markOffline = () => dispatch({ type: "offline" });
    const markOnline = () => dispatch({ type: "online" });

    window.addEventListener("offline", markOffline);
    window.addEventListener("online", markOnline);

    return () => {
      window.removeEventListener("offline", markOffline);
      window.removeEventListener("online", markOnline);
    };
  }, []);

  const claimControlMutation = useMutation({
    mutationFn: (deviceLabel?: string) =>
      scoringService.claimControl(organizationId!, gameId!, { deviceLabel }),
    onSuccess: (control) => dispatch({ control, type: "control-claimed" }),
  });

  const takeoverControlMutation = useMutation({
    mutationFn: (input: { deviceLabel?: string; reason: string }) =>
      scoringService.takeoverControl(organizationId!, gameId!, input),
    onSuccess: (control) => dispatch({ control, type: "control-claimed" }),
  });

  const heartbeatMutation = useMutation({
    mutationFn: () =>
      scoringService.heartbeatControl(organizationId!, gameId!, {
        controlToken: local.controlToken!,
      }),
    onSuccess: (control) => dispatch({ control, type: "control-heartbeat" }),
  });
  const heartbeatMutateRef = React.useRef(heartbeatMutation.mutate);

  React.useEffect(() => {
    heartbeatMutateRef.current = heartbeatMutation.mutate;
  }, [heartbeatMutation.mutate]);

  const commandMutation = useMutation({
    mutationFn: (command: ScoringCommandPayload) =>
      scoringService.executeCommand(organizationId!, gameId!, command),
    onSuccess: async (response, command) => {
      await scoringCommandQueue.remove(
        organizationId!,
        gameId!,
        command.idempotencyKey,
      );
      dispatch({
        action: formatCommandConfirmation(command, response.state),
        state: response.state,
        type: "command-confirmed",
      });
      await queryClient.setQueryData(
        SCORING_QUERY_KEYS.state(organizationId!, gameId!),
        response.state,
      );
    },
  });

  React.useEffect(() => {
    if (!local.controlToken || !organizationId || !gameId) return;

    const interval = window.setInterval(() => {
      heartbeatMutateRef.current();
    }, 15000);

    return () => window.clearInterval(interval);
  }, [gameId, local.controlToken, organizationId]);

  const sendCommand = React.useCallback(
    async (command: OptimisticCommand): Promise<SendScoringCommandResult> => {
      if (!organizationId || !gameId || !local.state) {
        return { status: "ignored" };
      }
      if (local.offlineSince && Date.now() - local.offlineSince > 90 * 1000) {
        return { status: "blocked" };
      }

      const payload: ScoringCommandPayload = {
        controlToken: command.controlToken ?? local.controlToken ?? undefined,
        expectedVersion: local.state.version,
        idempotencyKey: createIdempotencyKey(),
        occurredAt: new Date().toISOString(),
        payload: command.payload,
        type: command.type,
      };
      const queuedCommand = {
        command: payload,
        gameId,
        organizationId,
        queuedAt: Date.now(),
      };

      dispatch({
        command,
        idempotencyKey: payload.idempotencyKey,
        type: "optimistic",
      });

      try {
        const response = await commandMutation.mutateAsync(payload);
        return { state: response.state, status: "confirmed" };
      } catch (error) {
        if (isQueueableScoringError(error)) {
          await scoringCommandQueue.add(queuedCommand);
          dispatch({ command: queuedCommand, type: "command-queued" });
          return { status: "queued" };
        }

        const failureMessage = getFriendlyScoringCommandErrorMessage(error);
        const refreshed = await stateQuery.refetch();
        if (refreshed.data) {
          dispatch({ state: refreshed.data, type: "server-state" });

          if (
            canRetryNextPeriodAfterRefresh({
              commandType: command.type,
              gameClockRemainingMs: refreshed.data.clock.gameClockRemainingMs,
            })
          ) {
            const retryPayload: ScoringCommandPayload = {
              controlToken:
                command.controlToken ?? local.controlToken ?? undefined,
              expectedVersion: refreshed.data.version,
              idempotencyKey: createIdempotencyKey(),
              occurredAt: new Date().toISOString(),
              payload: command.payload,
              type: command.type,
            };

            try {
              const retryResponse =
                await commandMutation.mutateAsync(retryPayload);
              return { state: retryResponse.state, status: "confirmed" };
            } catch (retryError) {
              return {
                message:
                  getFriendlyScoringCommandErrorMessage(retryError) ??
                  failureMessage ??
                  undefined,
                state: refreshed.data,
                status: "failed",
              };
            }
          }
        }
        return { message: failureMessage ?? undefined, status: "failed" };
      }
    },
    [
      commandMutation,
      gameId,
      local.controlToken,
      local.offlineSince,
      local.state,
      organizationId,
      stateQuery,
    ],
  );

  const flushQueue = React.useCallback(async () => {
    if (!organizationId || !gameId) return;

    const pending = await scoringCommandQueue.list(organizationId, gameId);

    for (const item of pending) {
      await commandMutation.mutateAsync(item.command);
    }

    await scoringCommandQueue.clear(organizationId, gameId);
    dispatch({ type: "queue-cleared" });
  }, [commandMutation, gameId, organizationId]);

  return {
    claimControl: claimControlMutation.mutateAsync,
    flushQueue,
    heartbeatStatus: heartbeatMutation.status,
    isClaimingControl: claimControlMutation.isPending,
    isSendingCommand: commandMutation.isPending,
    local,
    offlineLockActive: Boolean(
      local.offlineSince && Date.now() - local.offlineSince > 90 * 1000,
    ),
    query: stateQuery,
    sendCommand,
    takeoverControl: takeoverControlMutation.mutateAsync,
  };
}
