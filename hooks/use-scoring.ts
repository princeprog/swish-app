"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  type ScoringConnectionState,
  canSendScoringCommand,
  hasFreshServerState,
  transitionScoringConnection,
} from "@/lib/scoring-connection-policy";
import { getFriendlyScoringCommandErrorMessage } from "@/lib/scoring-command-errors";
import {
  scoringService,
  type ScoringCommandPayload,
  type ScoringCommandType,
  type ScoringControlResponse,
  type ScoringEvent,
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
  connection: ScoringConnectionState;
  lastConfirmedAction: string | null;
  state: ScoringState | null;
};

type ScoringCommandInput = {
  controlToken?: string;
  payload?: Record<string, unknown>;
  type: ScoringCommandType;
};

export type SendScoringCommandResult =
  | { status: "confirmed"; state: ScoringState }
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
  | { action: string; state: ScoringState; type: "command-confirmed" }
  | { type: "command-started" }
  | { type: "offline" }
  | { type: "online" };

function formatCommandConfirmation(
  command: ScoringCommandInput,
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
      return {
        ...current,
        connection: transitionScoringConnection(
          current.connection,
          "server-state-confirmed",
        ),
        state: action.state,
      };
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
    case "command-started":
      return { ...current, connection: "pending", lastConfirmedAction: null };
    case "command-confirmed":
      return {
        ...current,
        lastConfirmedAction: action.action,
        connection: transitionScoringConnection(
          current.connection,
          "command-confirmed",
        ),
        state: action.state,
      };
    case "offline":
      return {
        ...current,
        connection: transitionScoringConnection(current.connection, "offline"),
      };
    case "online":
      return {
        ...current,
        connection: transitionScoringConnection(current.connection, "online"),
      };
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

function browserIsOffline() {
  return typeof navigator !== "undefined" && !navigator.onLine;
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

export function useScoringEventsQuery(
  organizationId?: string,
  gameId?: string,
) {
  return useQuery<ScoringEvent[]>({
    enabled: Boolean(organizationId && gameId),
    queryFn: () => scoringService.listEvents(organizationId!, gameId!),
    queryKey: SCORING_QUERY_KEYS.events(
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
  const eventsQuery = useScoringEventsQuery(organizationId, gameId);
  const refetchStateRef = React.useRef(stateQuery.refetch);
  const commandInFlightRef = React.useRef(false);
  const controlInFlightRef = React.useRef(false);
  const heartbeatInFlightRef = React.useRef(false);
  const [local, dispatch] = React.useReducer(liveScoringReducer, {
    controlToken: null,
    connection:
      typeof navigator !== "undefined" && !navigator.onLine
        ? "offline"
        : "reconnecting",
    lastConfirmedAction: null,
    state: null,
  });

  React.useEffect(() => {
    refetchStateRef.current = stateQuery.refetch;
  }, [stateQuery.refetch]);

  React.useEffect(() => {
    if (
      stateQuery.isSuccess &&
      stateQuery.isFetchedAfterMount &&
      stateQuery.data &&
      !browserIsOffline()
    ) {
      dispatch({ state: stateQuery.data, type: "server-state" });
    }
  }, [stateQuery.data, stateQuery.isFetchedAfterMount, stateQuery.isSuccess]);

  React.useEffect(() => {
    const markOffline = () => dispatch({ type: "offline" });
    const markOnline = () => {
      dispatch({ type: "online" });
      void refetchStateRef
        .current()
        .then((result) => {
          if (hasFreshServerState(result)) {
            dispatch({ state: result.data, type: "server-state" });
          }
        })
        .catch(() => undefined);
    };

    window.addEventListener("offline", markOffline);
    window.addEventListener("online", markOnline);

    return () => {
      window.removeEventListener("offline", markOffline);
      window.removeEventListener("online", markOnline);
    };
  }, []);

  const resyncFromServer = React.useCallback(async () => {
    dispatch({ type: "online" });
    try {
      const result = await refetchStateRef.current();
      if (hasFreshServerState(result)) {
        dispatch({ state: result.data, type: "server-state" });
      }
      return result;
    } catch {
      // Keep the console in reconnecting state until a later fresh refresh succeeds.
      return undefined;
    }
  }, []);

  const claimControlMutation = useMutation({
    mutationFn: (deviceLabel?: string) =>
      scoringService.claimControl(organizationId!, gameId!, { deviceLabel }),
    onSuccess: (control) => dispatch({ control, type: "control-claimed" }),
    onError: () => {
      void resyncFromServer();
    },
  });

  const takeoverControlMutation = useMutation({
    mutationFn: (input: { deviceLabel?: string; reason: string }) =>
      scoringService.takeoverControl(organizationId!, gameId!, input),
    onSuccess: (control) => dispatch({ control, type: "control-claimed" }),
    onError: () => {
      void resyncFromServer();
    },
  });

  const heartbeatMutation = useMutation({
    mutationFn: () =>
      scoringService.heartbeatControl(organizationId!, gameId!, {
        controlToken: local.controlToken!,
      }),
    onSuccess: (control) => {
      heartbeatInFlightRef.current = false;
      dispatch({ control, type: "control-heartbeat" });
    },
    onError: () => {
      heartbeatInFlightRef.current = false;
      void resyncFromServer();
    },
  });
  const heartbeatMutateRef = React.useRef(heartbeatMutation.mutate);

  React.useEffect(() => {
    heartbeatMutateRef.current = heartbeatMutation.mutate;
  }, [heartbeatMutation.mutate]);

  const commandMutation = useMutation({
    mutationFn: (command: ScoringCommandPayload) =>
      scoringService.executeCommand(organizationId!, gameId!, command),
    onSuccess: async (response, command) => {
      dispatch({
        action: formatCommandConfirmation(command, response.state),
        state: response.state,
        type: "command-confirmed",
      });
      await queryClient.setQueryData(
        SCORING_QUERY_KEYS.state(organizationId!, gameId!),
        response.state,
      );
      await queryClient.invalidateQueries({
        queryKey: SCORING_QUERY_KEYS.events(organizationId!, gameId!),
      });
    },
  });

  React.useEffect(() => {
    if (
      !local.controlToken ||
      !organizationId ||
      !gameId ||
      local.connection !== "ready"
    ) {
      return;
    }

    const interval = window.setInterval(() => {
      if (!browserIsOffline() && !heartbeatInFlightRef.current) {
        heartbeatInFlightRef.current = true;
        heartbeatMutateRef.current();
      }
    }, 15000);

    return () => window.clearInterval(interval);
  }, [gameId, local.connection, local.controlToken, organizationId]);

  const sendCommand = React.useCallback(
    async (command: ScoringCommandInput): Promise<SendScoringCommandResult> => {
      if (!organizationId || !gameId || !local.state) {
        return { status: "ignored" };
      }
      if (commandInFlightRef.current) return { status: "blocked" };
      if (browserIsOffline()) {
        dispatch({ type: "offline" });
        return { status: "blocked" };
      }
      const decision = canSendScoringCommand({
        connection: local.connection,
        controlValid:
          Boolean(command.controlToken) ||
          (local.state.control.controlledByMe &&
            local.state.control.status === "claimed"),
        mutationPending: commandMutation.isPending,
      });
      if (!decision.allowed) {
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
      commandInFlightRef.current = true;
      dispatch({ type: "command-started" });

      try {
        const response = await commandMutation.mutateAsync(payload);
        return { state: response.state, status: "confirmed" };
      } catch (error) {
        const refreshed = await resyncFromServer();
        if (refreshed && hasFreshServerState(refreshed)) {
          return {
            message:
              error instanceof TypeError
                ? "We could not confirm that update. The latest official game state was reloaded; review it before trying again."
                : (getFriendlyScoringCommandErrorMessage(error) ?? undefined),
            state: refreshed.data,
            status: "failed",
          };
        }
        return {
          message:
            error instanceof TypeError
              ? "We could not confirm that update. Reconnect to continue. No scoring change was recorded."
              : (getFriendlyScoringCommandErrorMessage(error) ?? undefined),
          status: "failed",
        };
      } finally {
        commandInFlightRef.current = false;
      }
    },
    [
      commandMutation,
      gameId,
      local.connection,
      local.controlToken,
      local.state,
      organizationId,
      resyncFromServer,
    ],
  );

  const connectionAllowsMutations = local.connection === "ready";
  const guardedClaimControl = React.useCallback(
    (deviceLabel?: string) => {
      if (
        !connectionAllowsMutations ||
        browserIsOffline() ||
        controlInFlightRef.current ||
        claimControlMutation.isPending ||
        takeoverControlMutation.isPending
      ) {
        if (browserIsOffline()) dispatch({ type: "offline" });
        return Promise.resolve(undefined);
      }
      controlInFlightRef.current = true;
      return claimControlMutation
        .mutateAsync(deviceLabel)
        .catch(() => undefined)
        .finally(() => {
          controlInFlightRef.current = false;
        });
    },
    [
      claimControlMutation,
      connectionAllowsMutations,
      takeoverControlMutation.isPending,
    ],
  );
  const guardedTakeoverControl = React.useCallback(
    (input: { deviceLabel?: string; reason: string }) => {
      if (
        !connectionAllowsMutations ||
        browserIsOffline() ||
        controlInFlightRef.current ||
        claimControlMutation.isPending ||
        takeoverControlMutation.isPending
      ) {
        if (browserIsOffline()) dispatch({ type: "offline" });
        return Promise.resolve(undefined);
      }
      controlInFlightRef.current = true;
      return takeoverControlMutation
        .mutateAsync(input)
        .catch(() => undefined)
        .finally(() => {
          controlInFlightRef.current = false;
        });
    },
    [
      claimControlMutation.isPending,
      connectionAllowsMutations,
      takeoverControlMutation,
    ],
  );

  return {
    claimControl: guardedClaimControl,
    heartbeatStatus: heartbeatMutation.status,
    isClaimingControl: claimControlMutation.isPending,
    isTakingOverControl: takeoverControlMutation.isPending,
    isSendingCommand: commandMutation.isPending,
    local,
    offlineLockActive: !connectionAllowsMutations,
    events: eventsQuery,
    query: stateQuery,
    sendCommand,
    takeoverControl: guardedTakeoverControl,
  };
}
