"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  statisticsService,
  type StatisticEventType,
} from "@/services/statistics.service";

export const STATISTICS_QUERY_KEYS = {
  award: (organizationId: string, gameId: string) =>
    ["statistics", organizationId, gameId, "player-of-game"] as const,
  state: (organizationId: string, gameId: string) =>
    ["statistics", organizationId, gameId] as const,
};

export function useStatisticsConsole(organizationId?: string, gameId?: string) {
  const queryClient = useQueryClient();
  const [controlToken, setControlToken] = React.useState<string | null>(null);
  const query = useQuery({
    enabled: Boolean(organizationId && gameId),
    queryFn: () => statisticsService.getState(organizationId!, gameId!),
    queryKey: STATISTICS_QUERY_KEYS.state(
      organizationId ?? "unknown",
      gameId ?? "unknown",
    ),
    retry: false,
    refetchInterval: 5_000,
  });
  const award = useQuery({
    enabled: Boolean(
      organizationId &&
      gameId &&
      query.data?.game.status === "final" &&
      query.data?.sheet.status === "finalized",
    ),
    queryFn: () => statisticsService.getPlayerOfGame(organizationId!, gameId!),
    queryKey: STATISTICS_QUERY_KEYS.award(
      organizationId ?? "unknown",
      gameId ?? "unknown",
    ),
    retry: false,
  });
  const claim = useMutation({
    mutationFn: () =>
      statisticsService.claim(organizationId!, gameId!, "Statistics console"),
    onSuccess: (control) => setControlToken(control.controlToken),
  });
  const takeover = useMutation({
    mutationFn: (reason: string) =>
      statisticsService.takeover(organizationId!, gameId!, {
        deviceLabel: "Statistics console",
        reason,
      }),
    onSuccess: (control) => setControlToken(control.controlToken),
  });
  const record = useMutation({
    mutationFn: (command: {
      playerId?: string;
      reversesEventId?: string;
      type?: StatisticEventType;
      value?: number;
    }) => {
      if (!controlToken || !query.data)
        throw new Error("Claim statistics control first.");
      return statisticsService.record(organizationId!, gameId!, {
        ...command,
        controlToken,
        expectedVersion: query.data.version,
        idempotencyKey: crypto.randomUUID(),
        occurredAt: new Date().toISOString(),
      });
    },
    onSuccess: (state) =>
      queryClient.setQueryData(
        STATISTICS_QUERY_KEYS.state(organizationId!, gameId!),
        state,
      ),
  });
  const submit = useMutation({
    mutationFn: () => {
      if (!controlToken) throw new Error("Claim statistics control first.");
      return statisticsService.submit(organizationId!, gameId!, controlToken);
    },
    onSuccess: async () => query.refetch(),
  });
  const overrideReconciliation = useMutation({
    mutationFn: (reason: string) =>
      statisticsService.overrideReconciliation(
        organizationId!,
        gameId!,
        reason,
      ),
    onSuccess: async () => query.refetch(),
  });
  const confirmPlayerOfGame = useMutation({
    mutationFn: (data: { playerId: string; reason?: string }) =>
      statisticsService.confirmPlayerOfGame(organizationId!, gameId!, data),
    onSuccess: async () =>
      queryClient.invalidateQueries({
        queryKey: STATISTICS_QUERY_KEYS.award(organizationId!, gameId!),
      }),
  });

  React.useEffect(() => {
    if (!controlToken || !organizationId || !gameId) return;
    const interval = window.setInterval(() => {
      void statisticsService.heartbeat(organizationId, gameId, controlToken);
    }, 30_000);
    return () => window.clearInterval(interval);
  }, [controlToken, gameId, organizationId]);

  return {
    award,
    claim,
    confirmPlayerOfGame,
    controlToken,
    overrideReconciliation,
    query,
    record,
    submit,
    takeover,
  };
}
