"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  scoringCommandQueue,
  type QueuedScoringCommand,
} from "@/services/scoring-command-queue";
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
  payload?: Record<string, unknown>;
  type: ScoringCommandType;
};

type LiveScoringAction =
  | { state: ScoringState; type: "server-state" }
  | { control: ScoringControlResponse; type: "control-claimed" }
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
  const next: ScoringState = structuredClone(state);

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
      next.latestReversibleEvent = {
        id: "optimistic",
        payload: command.payload ?? {},
        summary: `${next.game.homeTeam.name} team foul`,
        type: "team_foul.record",
      };
    }

    if (teamId === next.game.awayTeam.id) {
      next.fouls.away += 1;
      next.latestReversibleEvent = {
        id: "optimistic",
        payload: command.payload ?? {},
        summary: `${next.game.awayTeam.name} team foul`,
        type: "team_foul.record",
      };
    }
  }

  if (command.type === "game.start" || command.type === "clocks.start") {
    const now = new Date().toISOString();
    next.phase = "live";
    next.clock.gameClockRunning = true;
    next.clock.shotClockRunning = true;
    next.clock.gameClockStartedAt = now;
    next.clock.shotClockStartedAt = now;
  }

  if (command.type === "clocks.pause") {
    next.phase = next.phase === "pregame" ? "pregame" : "paused";
    next.clock.gameClockRunning = false;
    next.clock.shotClockRunning = false;
    next.clock.gameClockStartedAt = null;
    next.clock.shotClockStartedAt = null;
  }

  if (command.type === "shot_clock.reset") {
    next.clock.shotClockRemainingMs =
      command.payload?.resetTo === "short"
        ? next.config.shotClockShortMs
        : next.config.shotClockFullMs;
  }

  if (command.type === "event.reverse") {
    const event = next.latestReversibleEvent;

    if (event?.type === "score.record") {
      const teamId = event.payload.teamId;
      const points = Number(event.payload.points ?? 0);
      if (teamId === next.game.homeTeam.id) next.scores.home -= points;
      if (teamId === next.game.awayTeam.id) next.scores.away -= points;
    }

    if (event?.type === "team_foul.record") {
      const teamId = event.payload.teamId;
      if (teamId === next.game.homeTeam.id) next.fouls.home -= 1;
      if (teamId === next.game.awayTeam.id) next.fouls.away -= 1;
    }

    next.latestReversibleEvent = null;
  }

  next.version += 1;
  return next;
}

function formatCommandConfirmation(command: OptimisticCommand, state: ScoringState) {
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

export function useScoringStateQuery(
  organizationId?: string,
  gameId?: string,
) {
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
  });

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
      heartbeatMutation.mutate();
    }, 15000);

    return () => window.clearInterval(interval);
  }, [gameId, heartbeatMutation, local.controlToken, organizationId]);

  const sendCommand = React.useCallback(
    async (command: OptimisticCommand) => {
      if (!organizationId || !gameId || !local.state) return;
      if (
        local.offlineSince &&
        Date.now() - local.offlineSince > 90 * 1000
      ) {
        return;
      }

      const payload: ScoringCommandPayload = {
        controlToken: local.controlToken ?? undefined,
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
        await commandMutation.mutateAsync(payload);
      } catch (error) {
        await scoringCommandQueue.add(queuedCommand);
        dispatch({ command: queuedCommand, type: "command-queued" });
      }
    },
    [
      commandMutation,
      gameId,
      local.controlToken,
      local.offlineSince,
      local.state,
      organizationId,
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
    claimControl: claimControlMutation.mutate,
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
    takeoverControl: takeoverControlMutation.mutate,
  };
}
