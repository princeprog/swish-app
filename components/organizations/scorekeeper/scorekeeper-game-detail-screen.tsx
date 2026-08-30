"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Loader2,
  Maximize2,
  MoreHorizontal,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
} from "lucide-react";

import {
  getScorekeeperErrorState,
  ScorekeeperFocusedState,
  ScorekeeperLoadingState,
} from "@/components/organizations/scorekeeper/scorekeeper-states";
import {
  ComponentReveal,
  PageEntrance,
  RevealGroup,
} from "@/components/motion/page-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { useOrganizationsQuery } from "@/hooks/use-organization";
import {
  type SendScoringCommandResult,
  useLiveScoring,
} from "@/hooks/use-scoring";
import { materializeClientScoringState } from "@/lib/scoring-live-display";
import { areLivePeriodActionsDisabled } from "@/lib/scorekeeper-live-actions";
import {
  getPeriodCommandFailureMessage,
  getPeriodControlDialog,
  type PeriodControlAction,
} from "@/lib/scorekeeper-period-controls";
import { getTimeoutControlDialog } from "@/lib/scorekeeper-timeout-controls";
import { getGameReopenReasonError } from "@/lib/game-reopen";
import { cn } from "@/lib/utils";
import type { ScoringState } from "@/services/scoring.service";

type ScorekeeperGameDetailScreenProps = {
  gameId: string;
  slug: string;
};

type TeamSide = "home" | "away";

function formatClock(ms: number) {
  const safeMs = Math.max(0, ms);
  const minutes = Math.floor(safeMs / 60000);
  const seconds = Math.floor((safeMs % 60000) / 1000);

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function useDisplayedScoringState(state: ScoringState | null) {
  const [tick, setTick] = React.useState(Date.now());

  React.useEffect(() => {
    const interval = window.setInterval(() => setTick(Date.now()), 250);

    return () => window.clearInterval(interval);
  }, []);

  return React.useMemo(() => {
    if (!state) return null;

    return materializeClientScoringState(state, tick);
  }, [state, tick]);
}

function useWakeLock(enabled: boolean) {
  React.useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;
    let cancelled = false;

    async function requestWakeLock() {
      if (!enabled || !("wakeLock" in navigator)) return;

      try {
        wakeLock = await navigator.wakeLock.request("screen");
        if (cancelled) {
          await wakeLock.release();
        }
      } catch {
        wakeLock = null;
      }
    }

    void requestWakeLock();

    return () => {
      cancelled = true;
      void wakeLock?.release();
    };
  }, [enabled]);
}

function TeamScorePanel({
  fouls,
  name,
  onFoul,
  onPlayerFoul,
  onScore,
  onTimeout,
  score,
  side,
  disabled,
  inPenalty,
  timeoutDisabled,
  timeoutsRemaining,
  players,
}: {
  disabled: boolean;
  fouls: number;
  inPenalty: boolean;
  name: string;
  onFoul: () => void;
  onPlayerFoul: (playerId: string) => void;
  onScore: (points: 1 | 2 | 3) => void;
  onTimeout: () => void;
  score: number;
  side: TeamSide;
  timeoutDisabled: boolean;
  timeoutsRemaining: number;
  players: Array<{
    fouledOut: boolean;
    fouls: number;
    id: string;
    jerseyNumber: string;
    name: string;
  }>;
}) {
  const [selectedPlayerId, setSelectedPlayerId] = React.useState("");
  return (
    <Card className="md:min-h-[640px] md:flex-1 md:justify-center">
      <CardHeader>
        <div
          className={cn(
            "flex items-start justify-between gap-4",
            side === "away" && "md:flex-row-reverse md:text-right",
          )}
        >
          <div
            className={cn(
              "flex min-w-0 items-start gap-3",
              side === "away" && "md:flex-row-reverse",
            )}
          >
            <Badge variant={side === "home" ? "default" : "secondary"}>
              {side === "home" ? "Home" : "Away"}
            </Badge>
            <div className="min-w-0">
              <CardTitle className="truncate text-xl md:text-4xl lg:text-5xl">
                {name}
              </CardTitle>
            </div>
          </div>
          <div className="font-mono text-4xl font-semibold tabular-nums md:hidden">
            {score}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="hidden text-center font-mono text-[9rem] font-semibold leading-none tabular-nums md:block lg:text-[11rem]">
          {score}
        </div>

        <div className="mt-3 grid grid-cols-[1fr_1.55fr_1fr] gap-2 md:mt-16 md:gap-4">
          {[1, 2, 3].map((points) => (
            <Button
              key={points}
              aria-label={`Add ${points} point${points === 1 ? "" : "s"} for ${name}`}
              className="h-16 text-3xl font-semibold md:h-28 md:text-5xl"
              variant={points === 2 ? "default" : "outline"}
              disabled={disabled}
              onClick={() => onScore(points as 1 | 2 | 3)}
            >
              +{points}
            </Button>
          ))}
        </div>

        <Separator className="my-4 md:my-7" />
        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium uppercase text-muted-foreground md:text-base">
              Team fouls
            </span>
            <div className="flex items-center gap-2">
              {inPenalty ? <Badge variant="destructive">Penalty</Badge> : null}
              <span className="font-mono text-3xl font-semibold tabular-nums md:text-4xl">
                {fouls}
              </span>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <NativeSelect
              aria-label={`Choose ${name} player for a personal foul`}
              disabled={disabled || players.length === 0}
              value={selectedPlayerId || "unselected"}
              onChange={(event) => setSelectedPlayerId(event.target.value)}
            >
              <NativeSelectOption value="unselected">
                Choose player
              </NativeSelectOption>
              {players.map((player) => (
                <NativeSelectOption
                  key={player.id}
                  value={player.id}
                  disabled={player.fouledOut}
                >
                  #{player.jerseyNumber} {player.name} · {player.fouls} fouls
                  {player.fouledOut ? " · Fouled out" : ""}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <Button
              disabled={
                disabled ||
                !selectedPlayerId ||
                selectedPlayerId === "unselected"
              }
              onClick={() => {
                onPlayerFoul(selectedPlayerId);
                setSelectedPlayerId("");
              }}
            >
              Player foul
            </Button>
          </div>
          <Button
            className="mt-2 h-10 w-full text-sm"
            disabled={disabled}
            variant="outline"
            onClick={onFoul}
          >
            Unattributed team / bench foul
          </Button>
        </div>

        <div className="mt-3">
          <Button
            className="h-12 w-full text-base md:h-14 md:text-xl"
            disabled={timeoutDisabled}
            variant="secondary"
            onClick={onTimeout}
          >
            <Clock3 className="size-5" />
            Timeout · {timeoutsRemaining} left
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PeriodScoreBreakdown({
  awayTeam,
  homeTeam,
  periods,
}: {
  awayTeam: string;
  homeTeam: string;
  periods: ScoringState["periodScores"];
}) {
  if (periods.length === 0) return null;

  return (
    <section
      aria-label="Period score breakdown"
      className="border-b bg-muted/20 px-4 py-3 md:px-8"
    >
      <div className="mx-auto max-w-6xl overflow-x-auto">
        <table className="w-full min-w-max text-center text-sm">
          <caption className="sr-only">
            Running score for each completed and active period
          </caption>
          <thead className="text-xs uppercase text-muted-foreground">
            <tr>
              <th className="pr-5 text-left font-medium" scope="col">
                Team
              </th>
              {periods.map((period) => (
                <th
                  className="min-w-12 px-2 font-medium"
                  key={`${period.period_number}-${period.overtime_number}`}
                  scope="col"
                >
                  {period.overtime_number > 0
                    ? `OT${period.overtime_number}`
                    : `Q${period.period_number}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="font-mono font-semibold tabular-nums">
            <tr>
              <th
                className="max-w-40 truncate pr-5 text-left font-sans"
                scope="row"
              >
                {homeTeam}
              </th>
              {periods.map((period) => (
                <td
                  className="px-2 py-1"
                  key={`${period.period_number}-${period.overtime_number}`}
                >
                  {period.home_score}
                </td>
              ))}
            </tr>
            <tr>
              <th
                className="max-w-40 truncate pr-5 text-left font-sans"
                scope="row"
              >
                {awayTeam}
              </th>
              {periods.map((period) => (
                <td
                  className="px-2 py-1"
                  key={`${period.period_number}-${period.overtime_number}`}
                >
                  {period.away_score}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ClockConsole({
  onClockToggle,
  onResetShotClock,
  onShotClockToggle,
  periodLabel,
  running,
  shotClock,
  shotClockEnabled,
  shotClockFullMs,
  shotClockRunning,
  shotClockShortMs,
  time,
  disabled,
  gameClockExpired,
  shotClockExpired,
}: {
  disabled: boolean;
  gameClockExpired: boolean;
  onClockToggle: () => void;
  onResetShotClock: (resetTo: "full" | "short") => void;
  onShotClockToggle: () => void;
  periodLabel: string;
  running: boolean;
  shotClock: number;
  shotClockEnabled: boolean;
  shotClockExpired: boolean;
  shotClockFullMs: number;
  shotClockRunning: boolean;
  shotClockShortMs: number;
  time: string;
}) {
  const shotClockToggleDisabled =
    disabled || shotClockExpired || (!shotClockRunning && !running);
  const shotClockLabel = shotClockRunning
    ? "Pause shot clock"
    : "Start shot clock";

  return (
    <Card className="overflow-hidden md:flex md:w-[280px] md:shrink-0 md:flex-col md:justify-center">
      <CardContent className="p-4 md:p-6">
        <div
          className={cn(
            "grid items-stretch gap-3 md:block",
            shotClockEnabled &&
              "grid-cols-[minmax(0,1fr)_94px] sm:grid-cols-[minmax(0,1fr)_112px]",
          )}
        >
          <div className="flex min-w-0 flex-col">
            <p className="text-sm font-medium text-muted-foreground md:text-center md:text-2xl">
              {periodLabel}
            </p>
            <div
              className={cn(
                "mt-1 whitespace-nowrap font-mono text-6xl font-semibold leading-none tabular-nums sm:text-7xl md:mt-5 md:text-center md:text-7xl lg:text-8xl",
                gameClockExpired && "text-destructive",
              )}
            >
              {time}
            </div>
            {gameClockExpired ? (
              <p className="mt-2 text-sm font-semibold text-destructive md:text-center">
                Period complete
              </p>
            ) : null}
            <Button
              className="mt-3 h-10 w-full text-base md:mt-5 md:h-16 md:text-2xl"
              onClick={onClockToggle}
              disabled={disabled}
            >
              {running ? (
                <Pause className="size-5" />
              ) : (
                <Play className="size-5" />
              )}
              {running ? "Pause" : "Start"}
            </Button>
          </div>

          {shotClockEnabled ? (
            <div className="flex min-w-0 flex-col border-l pl-3 md:mt-8 md:border-l-0 md:border-t md:pl-0 md:pt-6 md:text-center">
              <p className="text-[0.7rem] font-medium uppercase leading-none text-muted-foreground md:text-base">
                Shot clock
              </p>
              <Button
                aria-label={shotClockLabel}
                className={cn(
                  "mt-1 h-14 w-full font-mono text-4xl font-semibold leading-none tabular-nums sm:h-16 sm:text-5xl md:mt-2 md:h-auto md:text-7xl",
                  shotClockRunning && "bg-primary/10 text-primary",
                  shotClockExpired && "text-destructive",
                )}
                disabled={shotClockToggleDisabled}
                onClick={onShotClockToggle}
                type="button"
                variant="ghost"
              >
                {Math.ceil(shotClock / 1000)}
              </Button>
              {shotClockExpired ? (
                <p className="mt-1 text-xs font-semibold uppercase text-destructive">
                  Violation
                </p>
              ) : null}
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Button
                  className="h-10 min-w-0 px-0 text-lg font-semibold md:h-16 md:text-3xl"
                  onClick={() => onResetShotClock("full")}
                  disabled={disabled}
                >
                  {shotClockFullMs / 1000}
                </Button>
                <Button
                  className="h-10 min-w-0 px-0 text-lg font-semibold md:h-16 md:text-3xl"
                  variant="secondary"
                  onClick={() => onResetShotClock("short")}
                  disabled={disabled}
                >
                  {shotClockShortMs / 1000}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function ConsoleMoreSheet({
  canFinalize,
  canReopen,
  onClaim,
  onCommand,
  onFullscreen,
  onReopen,
  onTakeover,
  pendingCount,
  soundEnabled,
  state,
  toggleSound,
}: {
  canFinalize: boolean;
  canReopen: boolean;
  onClaim: () => void;
  onCommand: (
    type: Parameters<
      ReturnType<typeof useLiveScoring>["sendCommand"]
    >[0]["type"],
    payload?: Record<string, unknown>,
  ) => Promise<SendScoringCommandResult>;
  onFullscreen: () => void;
  onReopen: (reason: string) => Promise<SendScoringCommandResult>;
  onTakeover: () => void;
  pendingCount: number;
  soundEnabled: boolean;
  state: ScoringState;
  toggleSound: () => void;
}) {
  const [finalizeDialogOpen, setFinalizeDialogOpen] = React.useState(false);
  const [finalizeError, setFinalizeError] = React.useState<string | null>(null);
  const [isFinalizing, setIsFinalizing] = React.useState(false);
  const [isReopening, setIsReopening] = React.useState(false);
  const [reopenDialogOpen, setReopenDialogOpen] = React.useState(false);
  const [reopenError, setReopenError] = React.useState<string | null>(null);
  const [reopenReason, setReopenReason] = React.useState("");
  const [periodDialogAction, setPeriodDialogAction] =
    React.useState<PeriodControlAction | null>(null);
  const [periodDialogError, setPeriodDialogError] = React.useState<
    string | null
  >(null);
  const [isSendingPeriodCommand, setIsSendingPeriodCommand] =
    React.useState(false);
  const periodDialog = periodDialogAction
    ? getPeriodControlDialog(
        periodDialogAction,
        state.clock.gameClockRemainingMs,
      )
    : null;

  async function finalizeGame() {
    setFinalizeError(null);
    setIsFinalizing(true);

    let result: SendScoringCommandResult;
    try {
      result = await onCommand("game.finalize");
    } catch {
      setIsFinalizing(false);
      setFinalizeError(
        "Something interrupted finalizing this game. Please check your connection and try again.",
      );
      return;
    }

    setIsFinalizing(false);

    if (result.status === "confirmed") {
      setFinalizeDialogOpen(false);
      return;
    }

    if (result.status === "queued") {
      setFinalizeError(
        "You appear to be offline. Finalizing was saved on this device and will sync when the connection returns.",
      );
      return;
    }

    if (result.status === "blocked") {
      setFinalizeError(
        "Reconnect before finalizing this game. Official results need to reach the server right away.",
      );
      return;
    }

    setFinalizeError(
      "We couldn't finalize this game yet. The latest game state was reloaded, so please review the score and try again.",
    );
  }

  async function reopenGame() {
    const reason = reopenReason.trim();
    const reasonError = getGameReopenReasonError(reason);
    if (reasonError) {
      setReopenError(reasonError);
      return;
    }

    setReopenError(null);
    setIsReopening(true);
    try {
      const result = await onReopen(reason);
      if (result.status === "confirmed") {
        setReopenDialogOpen(false);
        setReopenReason("");
      } else if (result.status === "queued" || result.status === "blocked") {
        setReopenError(
          "Reconnect before reopening this official result. No correction can begin until the server confirms it.",
        );
      } else {
        setReopenError(
          result.status === "failed" && result.message
            ? result.message
            : "We couldn't reopen this game. Review any dependent playoff games and try again.",
        );
      }
    } catch {
      setReopenError(
        "Something interrupted reopening this game. Please check your connection and try again.",
      );
    } finally {
      setIsReopening(false);
    }
  }

  async function sendPeriodCommand(action: PeriodControlAction) {
    const dialog = getPeriodControlDialog(
      action,
      state.clock.gameClockRemainingMs,
    );

    if (dialog.blocked) {
      return;
    }

    setPeriodDialogError(null);
    setIsSendingPeriodCommand(true);

    let result: SendScoringCommandResult;
    try {
      result = await onCommand(
        action === "end" ? "period.end" : "period.start",
      );
    } catch {
      setIsSendingPeriodCommand(false);
      setPeriodDialogError(
        "Something interrupted this period change. Please check your connection and try again.",
      );
      return;
    }

    setIsSendingPeriodCommand(false);

    if (result.status === "confirmed") {
      setPeriodDialogAction(null);
      return;
    }

    if (result.status === "queued") {
      setPeriodDialogError(
        "You appear to be offline. Period changes need to sync before continuing.",
      );
      return;
    }

    if (result.status === "blocked") {
      setPeriodDialogError(
        "Reconnect before changing the period. The official game clock needs to be checked by the server.",
      );
      return;
    }

    setPeriodDialogError(
      result.status === "failed" && result.message
        ? result.message
        : getPeriodCommandFailureMessage(action),
    );
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" className="gap-2">
          <MoreHorizontal className="size-5" />
          More
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[82vh] overflow-auto">
        <SheetHeader>
          <SheetTitle>Game controls</SheetTitle>
        </SheetHeader>

        <div className="grid gap-5 px-4 pb-6 md:grid-cols-2">
          <section className="space-y-3">
            <h3 className="text-sm font-bold uppercase text-muted-foreground">
              Control
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={onClaim} variant="outline">
                Claim
              </Button>
              <Button onClick={onTakeover} variant="outline">
                Takeover
              </Button>
              <Button onClick={onFullscreen} variant="outline">
                <Maximize2 className="size-4" />
                Fullscreen
              </Button>
              {state.config.shotClockEnabled ? (
                <Button
                  onClick={() =>
                    onCommand(
                      state.clock.shotClockRunning
                        ? "shot_clock.pause"
                        : "shot_clock.start",
                    )
                  }
                  variant="outline"
                >
                  {state.clock.shotClockRunning ? "Pause shot" : "Start shot"}
                </Button>
              ) : null}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-bold uppercase text-muted-foreground">
              Period
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={() => {
                  setPeriodDialogError(null);
                  setPeriodDialogAction("end");
                }}
                variant="outline"
              >
                End period
              </Button>
              <Button
                onClick={() => {
                  setPeriodDialogError(null);
                  setPeriodDialogAction("next");
                }}
                variant="outline"
              >
                Next period
              </Button>
              <AlertDialog
                open={finalizeDialogOpen}
                onOpenChange={(open) => {
                  if (isFinalizing) return;
                  setFinalizeDialogOpen(open);
                  if (!open) {
                    setFinalizeError(null);
                  }
                }}
              >
                <AlertDialogTrigger asChild>
                  <Button disabled={!canFinalize}>Finalize</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogMedia className="bg-primary/10 text-primary">
                      <CheckCircle2 className="size-8" />
                    </AlertDialogMedia>
                    <AlertDialogTitle>Finalize this game?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This locks in the final score and makes the result
                      official for standings. Review the score before
                      continuing.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <div className="grid gap-3 rounded-md border bg-muted/30 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="truncate font-medium">
                        {state.game.homeTeam.name}
                      </span>
                      <span className="font-mono text-3xl font-semibold tabular-nums">
                        {state.scores.home}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between gap-4">
                      <span className="truncate font-medium">
                        {state.game.awayTeam.name}
                      </span>
                      <span className="font-mono text-3xl font-semibold tabular-nums">
                        {state.scores.away}
                      </span>
                    </div>
                  </div>

                  {isFinalizing ? (
                    <div
                      aria-live="polite"
                      className="flex items-start gap-3 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm text-primary"
                      role="status"
                    >
                      <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin" />
                      <div>
                        <p className="font-medium">Finalizing game…</p>
                        <p className="text-primary/80">
                          Saving the official result now. Please keep this open.
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {finalizeError ? (
                    <div
                      className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                      role="alert"
                    >
                      {finalizeError}
                    </div>
                  ) : null}

                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isFinalizing}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      disabled={isFinalizing}
                      onClick={(event) => {
                        event.preventDefault();
                        void finalizeGame();
                      }}
                    >
                      {isFinalizing ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="size-4" />
                      )}
                      {isFinalizing ? "Finalizing…" : "Finalize game"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <AlertDialog
              open={periodDialogAction !== null}
              onOpenChange={(open) => {
                if (isSendingPeriodCommand) return;
                if (!open) {
                  setPeriodDialogAction(null);
                  setPeriodDialogError(null);
                }
              }}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogMedia
                    className={
                      periodDialog?.blocked
                        ? "bg-destructive/10 text-destructive"
                        : "bg-primary/10 text-primary"
                    }
                  >
                    <Clock3 className="size-8" />
                  </AlertDialogMedia>
                  <AlertDialogTitle>{periodDialog?.title}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {periodDialog?.description}
                  </AlertDialogDescription>
                </AlertDialogHeader>

                {periodDialogError ? (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {periodDialogError}
                  </div>
                ) : null}

                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isSendingPeriodCommand}>
                    {periodDialog?.blocked ? "Close" : "Cancel"}
                  </AlertDialogCancel>
                  {periodDialog && !periodDialog.blocked ? (
                    <AlertDialogAction
                      disabled={isSendingPeriodCommand}
                      onClick={(event) => {
                        event.preventDefault();
                        void sendPeriodCommand(periodDialogAction ?? "end");
                      }}
                    >
                      {isSendingPeriodCommand ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Updating
                        </>
                      ) : (
                        periodDialog.confirmLabel
                      )}
                    </AlertDialogAction>
                  ) : null}
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            {state.phase === "final" && canReopen ? (
              <AlertDialog
                open={reopenDialogOpen}
                onOpenChange={(open) => {
                  if (isReopening) return;
                  setReopenDialogOpen(open);
                  if (!open) {
                    setReopenError(null);
                    setReopenReason("");
                  }
                }}
              >
                <AlertDialogTrigger asChild>
                  <Button className="w-full" variant="outline">
                    <RotateCcw className="size-4" />
                    Reopen official game
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogMedia className="bg-destructive/10 text-destructive">
                      <RotateCcw className="size-8" />
                    </AlertDialogMedia>
                    <AlertDialogTitle>
                      Reopen this official game?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      The result will leave the standings and playoff record
                      until it is finalized again. Reopening is blocked when a
                      dependent playoff game has already started.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium"
                      htmlFor="game-reopen-reason"
                    >
                      Correction reason
                    </label>
                    <Textarea
                      id="game-reopen-reason"
                      placeholder="Explain why the official result needs correction."
                      value={reopenReason}
                      onChange={(event) => setReopenReason(event.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      This reason is saved in the private audit record.
                    </p>
                  </div>
                  {reopenError ? (
                    <div
                      className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                      role="alert"
                    >
                      {reopenError}
                    </div>
                  ) : null}
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isReopening}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      disabled={
                        isReopening ||
                        Boolean(getGameReopenReasonError(reopenReason))
                      }
                      onClick={(event) => {
                        event.preventDefault();
                        void reopenGame();
                      }}
                    >
                      {isReopening ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <RotateCcw className="size-4" />
                      )}
                      {isReopening ? "Reopening…" : "Reopen game"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : null}
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-bold uppercase text-muted-foreground">
              Screen and sound
            </h3>
            <label className="flex items-center justify-between rounded-md border px-3 py-2">
              <span className="flex items-center gap-2 text-sm font-medium">
                {soundEnabled ? (
                  <Volume2 className="size-4" />
                ) : (
                  <VolumeX className="size-4" />
                )}
                Buzzer
              </span>
              <Switch checked={soundEnabled} onCheckedChange={toggleSound} />
            </label>
            <p className="text-sm text-muted-foreground">
              Queued actions: {pendingCount}
            </p>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function ScorekeeperGameDetailScreen({
  gameId,
  slug,
}: ScorekeeperGameDetailScreenProps) {
  const router = useRouter();
  const organizationsQuery = useOrganizationsQuery();
  const organizations = organizationsQuery.data ?? [];
  const organization = organizations.find((item) => item.slug === slug);
  const isTeamManager = organization?.access.role === "team_manager";
  const scoring = useLiveScoring(
    organization && !isTeamManager ? organization.id : undefined,
    gameId,
  );
  const displayedState = useDisplayedScoringState(scoring.local.state);
  const [soundEnabled, setSoundEnabled] = React.useState(false);
  const [startDialogOpen, setStartDialogOpen] = React.useState(false);
  const [timeoutDialogSide, setTimeoutDialogSide] =
    React.useState<TeamSide | null>(null);
  const [timeoutDialogError, setTimeoutDialogError] = React.useState<
    string | null
  >(null);
  const [isRecordingTimeout, setIsRecordingTimeout] = React.useState(false);
  const lastShotViolationVersion = React.useRef<number | null>(null);
  const timeoutDialogTeam =
    timeoutDialogSide && displayedState
      ? timeoutDialogSide === "home"
        ? displayedState.game.homeTeam
        : displayedState.game.awayTeam
      : null;
  const timeoutDialogRemaining =
    timeoutDialogSide && displayedState
      ? timeoutDialogSide === "home"
        ? displayedState.timeouts.home.remaining
        : displayedState.timeouts.away.remaining
      : 0;
  const timeoutDialog = timeoutDialogTeam
    ? getTimeoutControlDialog({
        remaining: timeoutDialogRemaining,
        teamName: timeoutDialogTeam.name,
      })
    : null;

  useWakeLock(Boolean(displayedState?.control.controlledByMe));

  React.useEffect(() => {
    if (isTeamManager) {
      router.replace(`/organizations/${slug}`);
    }
  }, [isTeamManager, router, slug]);

  function vibrate() {
    if ("vibrate" in navigator) {
      navigator.vibrate(20);
    }
  }

  function playBuzzer() {
    if (!soundEnabled) return;
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    oscillator.connect(context.destination);
    oscillator.frequency.value = 440;
    oscillator.start();
    oscillator.stop(context.currentTime + 0.12);
  }

  React.useEffect(() => {
    if (!displayedState || displayedState.clock.shotClockRemainingMs > 0) {
      return;
    }

    if (lastShotViolationVersion.current === displayedState.version) {
      return;
    }

    lastShotViolationVersion.current = displayedState.version;
    playBuzzer();
  }, [displayedState, soundEnabled]);

  function sendCommand(
    type: Parameters<typeof scoring.sendCommand>[0]["type"],
    payload?: Record<string, unknown>,
  ) {
    vibrate();
    return scoring.sendCommand({ payload, type });
  }

  function scoreTeam(side: TeamSide, points: 1 | 2 | 3) {
    if (!displayedState) return;

    sendCommand("score.record", {
      points,
      teamId:
        side === "home"
          ? displayedState.game.homeTeam.id
          : displayedState.game.awayTeam.id,
    });
  }

  function foulTeam(side: TeamSide) {
    if (!displayedState) return;

    sendCommand("team_foul.record", {
      teamId:
        side === "home"
          ? displayedState.game.homeTeam.id
          : displayedState.game.awayTeam.id,
    });
  }

  function foulPlayer(side: TeamSide, playerId: string) {
    if (!displayedState) return;
    sendCommand("personal_foul.record", {
      playerId,
      teamId:
        side === "home"
          ? displayedState.game.homeTeam.id
          : displayedState.game.awayTeam.id,
    });
  }

  function teamPlayers(side: TeamSide) {
    if (!displayedState) return [];
    const teamId =
      side === "home"
        ? displayedState.game.homeTeam.id
        : displayedState.game.awayTeam.id;
    return displayedState.roster
      .filter((player) => player.team_id === teamId)
      .map((player) => {
        const foul = displayedState.playerFouls.find(
          (item) => item.game_roster_player_id === player.id,
        );
        return {
          fouledOut: foul?.fouled_out ?? false,
          fouls: foul?.personal_fouls ?? 0,
          id: player.id,
          jerseyNumber: player.jersey_number,
          name: player.name,
        };
      });
  }

  function timeoutTeam(side: TeamSide) {
    if (!displayedState) return;

    setTimeoutDialogError(null);
    setTimeoutDialogSide(side);
  }

  async function recordTimeout() {
    if (!timeoutDialogTeam || !timeoutDialog || timeoutDialog.blocked) {
      return;
    }

    setTimeoutDialogError(null);
    setIsRecordingTimeout(true);

    let result: SendScoringCommandResult;
    try {
      result = await sendCommand("timeout.record", {
        teamId: timeoutDialogTeam.id,
      });
    } catch {
      setIsRecordingTimeout(false);
      setTimeoutDialogError(
        "Something interrupted recording this timeout. Please check your connection and try again.",
      );
      return;
    }

    setIsRecordingTimeout(false);

    if (result.status === "confirmed") {
      setTimeoutDialogSide(null);
      return;
    }

    if (result.status === "queued") {
      setTimeoutDialogError(
        "You appear to be offline. The timeout was saved on this device and will sync when the connection returns.",
      );
      return;
    }

    if (result.status === "blocked") {
      setTimeoutDialogError(
        "Reconnect before recording a timeout. Timeouts need to reach the server right away.",
      );
      return;
    }

    setTimeoutDialogError(
      "The game state changed while you were reviewing this timeout. Please check the timeout count and try again.",
    );
  }

  async function toggleClock() {
    if (!displayedState) return;
    let controlToken: string | undefined;

    const hasActiveControl =
      displayedState.control.controlledByMe &&
      displayedState.control.status === "claimed";

    if (!hasActiveControl) {
      const control = await scoring.claimControl("Scorekeeper device");
      controlToken = control.controlToken;
    }
    vibrate();
    void scoring.sendCommand({
      controlToken,
      type: displayedState.clock.gameClockRunning
        ? "clocks.pause"
        : displayedState.phase === "pregame"
          ? "game.start"
          : "clocks.start",
    });
  }

  function resetShotClock(resetTo: "full" | "short") {
    sendCommand("shot_clock.reset", { resetTo });
  }

  function toggleShotClock() {
    if (!displayedState) return;

    sendCommand(
      displayedState.clock.shotClockRunning
        ? "shot_clock.pause"
        : "shot_clock.start",
    );
  }

  function undoLatest() {
    if (!displayedState?.latestReversibleEvent) return;

    sendCommand("event.reverse", {
      eventId: displayedState.latestReversibleEvent.id,
    });
  }

  async function enterFullscreen() {
    await document.documentElement.requestFullscreen?.();
  }

  async function reopenOfficialGame(reason: string) {
    if (!displayedState) return { status: "ignored" } as const;

    let controlToken: string | undefined;
    if (!displayedState.control.controlledByMe) {
      const control =
        displayedState.control.status === "claimed"
          ? await scoring.takeoverControl({
              deviceLabel: "Admin correction device",
              reason: `Official result correction: ${reason}`,
            })
          : await scoring.claimControl("Admin correction device");
      controlToken = control.controlToken;
    }

    return scoring.sendCommand({
      controlToken,
      payload: { reason },
      type: "game.reopen",
    });
  }

  if (organizationsQuery.isLoading || (organization && isTeamManager)) {
    return <ScorekeeperLoadingState />;
  }

  if (organizationsQuery.isError) {
    const state = getScorekeeperErrorState(organizationsQuery.error);

    return (
      <PageEntrance asChild variant="subtle">
        <main className="min-h-screen bg-background p-6 text-foreground">
          <ComponentReveal asChild variant="subtle">
            <div className="mx-auto max-w-3xl">
              <ScorekeeperFocusedState
                description={state.description}
                icon={state.icon}
                title="We couldn't load this organization"
                onRetry={() => organizationsQuery.refetch()}
              />
            </div>
          </ComponentReveal>
        </main>
      </PageEntrance>
    );
  }

  if (!organization) {
    return (
      <PageEntrance asChild variant="subtle">
        <main className="min-h-screen bg-background p-6 text-foreground">
          <ComponentReveal asChild variant="subtle">
            <div className="mx-auto max-w-3xl">
              <ScorekeeperFocusedState
                description="This workspace does not exist or you do not have access to it."
                icon="not-found"
                title="Organization not found"
                actionHref="/organizations"
                actionLabel="Back to organizations"
              />
            </div>
          </ComponentReveal>
        </main>
      </PageEntrance>
    );
  }

  if (scoring.query.isLoading || !displayedState) {
    return <ScorekeeperLoadingState />;
  }

  if (scoring.query.isError) {
    const state = getScorekeeperErrorState(scoring.query.error);

    return (
      <PageEntrance asChild variant="subtle">
        <main className="min-h-screen bg-background p-6 text-foreground">
          <ComponentReveal asChild variant="subtle">
            <div className="mx-auto max-w-3xl">
              <ScorekeeperFocusedState
                description={state.description}
                icon={state.icon}
                title={state.title}
                actionHref={`/organizations/${slug}/scorekeeper`}
                actionLabel="Back to assignments"
              />
            </div>
          </ComponentReveal>
        </main>
      </PageEntrance>
    );
  }

  const matchup = `${displayedState.game.homeTeam.name} vs ${displayedState.game.awayTeam.name}`;
  const canFinalize =
    displayedState.phase === "period_break" &&
    displayedState.period.number >= displayedState.config.regulationPeriods &&
    displayedState.scores.home !== displayedState.scores.away &&
    scoring.local.pendingCommands.length === 0;
  const canReopen =
    organization.access.permissions.includes("game.score.override") &&
    displayedState.phase === "final";
  const isOffline = Boolean(scoring.local.offlineSince);
  const controlsDisabled =
    displayedState.phase === "final" ||
    scoring.offlineLockActive ||
    !displayedState.control.controlledByMe ||
    displayedState.control.status !== "claimed";
  const clockControlsDisabled =
    displayedState.phase === "final" ||
    scoring.offlineLockActive ||
    (displayedState.control.status === "claimed" &&
      !displayedState.control.controlledByMe);
  const timeoutPhaseValid = ["live", "paused"].includes(displayedState.phase);
  const gameClockExpired = displayedState.clock.gameClockRemainingMs === 0;
  const periodActionsDisabled = areLivePeriodActionsDisabled(
    displayedState.clock.gameClockRemainingMs,
  );
  const shotClockExpired =
    displayedState.config.shotClockEnabled &&
    displayedState.clock.shotClockRemainingMs === 0;

  if (displayedState.phase === "pregame") {
    const canStart =
      !scoring.offlineLockActive && displayedState.control.status !== "claimed";

    return (
      <PageEntrance asChild variant="subtle">
        <main className="min-h-screen bg-background p-4 text-foreground md:p-8">
          <ComponentReveal asChild variant="subtle">
            <div className="mx-auto grid max-w-4xl gap-4">
              <Button
                className="w-fit"
                variant="ghost"
                onClick={() =>
                  router.push(`/organizations/${slug}/scorekeeper`)
                }
              >
                <ArrowLeft className="size-5" />
                Back to assignments
              </Button>

              <Card>
                <CardHeader>
                  <Badge className="w-fit" variant="secondary">
                    Pregame review
                  </Badge>
                  <CardTitle className="text-2xl md:text-4xl">
                    {matchup}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-3">
                    <p className="text-sm font-medium uppercase text-muted-foreground">
                      Clock setup
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-md border p-3">
                        <p className="text-muted-foreground">Quarter</p>
                        <p className="font-mono text-2xl">
                          {displayedState.config.periodDurationMs / 60000}:00
                        </p>
                      </div>
                      <div className="rounded-md border p-3">
                        <p className="text-muted-foreground">Shot clock</p>
                        <p className="font-mono text-2xl">
                          {displayedState.config.shotClockEnabled
                            ? `${displayedState.config.shotClockFullMs / 1000}s`
                            : "Not used"}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Timeouts: {displayedState.config.timeoutsFirstHalf} in the
                      first half, {displayedState.config.timeoutsSecondHalf} in
                      the second half, and{" "}
                      {displayedState.config.timeoutsPerOvertime}
                      each overtime.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium uppercase text-muted-foreground">
                      Control
                    </p>
                    <Badge
                      variant={
                        displayedState.control.controlledByMe
                          ? "default"
                          : "secondary"
                      }
                    >
                      {displayedState.control.controlledByMe
                        ? "Controlled by this device"
                        : displayedState.control.status === "claimed"
                          ? "Controlled by another device"
                          : "Available"}
                    </Badge>
                    <AlertDialog
                      open={startDialogOpen}
                      onOpenChange={setStartDialogOpen}
                    >
                      <AlertDialogTrigger asChild>
                        <Button
                          className="h-12 w-full text-base"
                          disabled={
                            !canStart && !displayedState.control.controlledByMe
                          }
                        >
                          <Play className="size-5" />
                          Start Game
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogMedia className="bg-primary/10 text-primary">
                            <Play className="size-8" />
                          </AlertDialogMedia>
                          <AlertDialogTitle>Start this game?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Once you start, the game clock
                            {displayedState.config.shotClockEnabled
                              ? " and shot clock"
                              : ""}{" "}
                            will begin. Make sure both teams are ready before
                            continuing.
                          </AlertDialogDescription>
                        </AlertDialogHeader>

                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            disabled={scoring.isClaimingControl}
                            onClick={(event) => {
                              event.preventDefault();
                              void toggleClock().then(() => {
                                setStartDialogOpen(false);
                              });
                            }}
                          >
                            <Play className="size-4" />
                            Start live scoring
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ComponentReveal>
        </main>
      </PageEntrance>
    );
  }

  return (
    <PageEntrance asChild variant="subtle">
      <main className="min-h-screen bg-background text-foreground">
        <RevealGroup className="contents" pace="compact">
          <ComponentReveal asChild variant="subtle">
            <header className="flex h-16 items-center justify-between border-b bg-background px-4 md:h-20 md:px-8">
              <Button
                aria-label="Back to assignments"
                size="icon"
                variant="ghost"
                onClick={() =>
                  router.push(`/organizations/${slug}/scorekeeper`)
                }
              >
                <ArrowLeft className="size-6" />
              </Button>
              <h1 className="truncate px-3 text-center text-base font-semibold md:text-2xl">
                {matchup}
              </h1>
              <div className="flex items-center gap-3">
                <Badge
                  className={
                    displayedState.game.status === "live"
                      ? "border-red-600 bg-red-600 text-white hover:bg-red-600"
                      : undefined
                  }
                  variant={
                    displayedState.game.status === "live"
                      ? "default"
                      : "secondary"
                  }
                >
                  {displayedState.phase === "final" ? "FINAL" : "LIVE"}
                </Badge>
                <ConsoleMoreSheet
                  canFinalize={canFinalize}
                  canReopen={canReopen}
                  onClaim={() => scoring.claimControl("Scorekeeper device")}
                  onCommand={sendCommand}
                  onFullscreen={() => void enterFullscreen()}
                  onReopen={reopenOfficialGame}
                  onTakeover={() => {
                    const reason = prompt("Reason for takeover");
                    if (reason) {
                      scoring.takeoverControl({
                        deviceLabel: "Scorekeeper device",
                        reason,
                      });
                    }
                  }}
                  pendingCount={scoring.local.pendingCommands.length}
                  soundEnabled={soundEnabled}
                  state={displayedState}
                  toggleSound={() => setSoundEnabled((value) => !value)}
                />
              </div>
            </header>
          </ComponentReveal>

          {scoring.isSendingCommand || scoring.local.lastConfirmedAction ? (
            <ComponentReveal asChild variant="subtle">
              <div
                className="border-b bg-muted/40 px-4 py-2 text-sm md:px-8"
                role="status"
              >
                <div className="mx-auto flex max-w-6xl items-center gap-2 font-medium">
                  {scoring.isSendingCommand ? (
                    <Loader2 className="size-4 animate-spin text-primary" />
                  ) : (
                    <CheckCircle2 className="size-4 text-primary" />
                  )}
                  <span>
                    {scoring.isSendingCommand
                      ? "Saving scoring update…"
                      : scoring.local.lastConfirmedAction}
                  </span>
                </div>
              </div>
            </ComponentReveal>
          ) : null}

          <PeriodScoreBreakdown
            awayTeam={displayedState.game.awayTeam.name}
            homeTeam={displayedState.game.homeTeam.name}
            periods={displayedState.periodScores}
          />

          <RevealGroup
            asChild
            className="grid gap-3 p-3 md:min-h-[calc(100vh-5rem)] md:grid-cols-[minmax(0,1fr)_280px_minmax(0,1fr)] md:items-stretch"
            pace="compact"
          >
            <div>
              <ComponentReveal asChild variant="subtle">
                <div className="md:hidden">
                  <ClockConsole
                    onClockToggle={toggleClock}
                    onResetShotClock={resetShotClock}
                    onShotClockToggle={toggleShotClock}
                    periodLabel={displayedState.period.label}
                    running={displayedState.clock.gameClockRunning}
                    shotClock={displayedState.clock.shotClockRemainingMs}
                    shotClockEnabled={displayedState.config.shotClockEnabled}
                    shotClockFullMs={displayedState.config.shotClockFullMs}
                    shotClockRunning={displayedState.clock.shotClockRunning}
                    shotClockShortMs={displayedState.config.shotClockShortMs}
                    time={formatClock(
                      displayedState.clock.gameClockRemainingMs,
                    )}
                    disabled={clockControlsDisabled}
                    gameClockExpired={gameClockExpired}
                    shotClockExpired={shotClockExpired}
                  />
                </div>
              </ComponentReveal>

              <ComponentReveal variant="subtle">
                <TeamScorePanel
                  fouls={displayedState.fouls.home}
                  name={displayedState.game.homeTeam.name}
                  onFoul={() => foulTeam("home")}
                  onPlayerFoul={(playerId) => foulPlayer("home", playerId)}
                  onScore={(points) => scoreTeam("home", points)}
                  onTimeout={() => timeoutTeam("home")}
                  score={displayedState.scores.home}
                  side="home"
                  disabled={controlsDisabled || periodActionsDisabled}
                  inPenalty={displayedState.fouls.homeInPenalty}
                  timeoutDisabled={
                    controlsDisabled ||
                    periodActionsDisabled ||
                    !timeoutPhaseValid ||
                    displayedState.timeouts.home.remaining <= 0
                  }
                  timeoutsRemaining={displayedState.timeouts.home.remaining}
                  players={teamPlayers("home")}
                />
              </ComponentReveal>

              <ComponentReveal asChild variant="subtle">
                <div className="hidden md:block">
                  <ClockConsole
                    onClockToggle={toggleClock}
                    onResetShotClock={resetShotClock}
                    onShotClockToggle={toggleShotClock}
                    periodLabel={displayedState.period.label}
                    running={displayedState.clock.gameClockRunning}
                    shotClock={displayedState.clock.shotClockRemainingMs}
                    shotClockEnabled={displayedState.config.shotClockEnabled}
                    shotClockFullMs={displayedState.config.shotClockFullMs}
                    shotClockRunning={displayedState.clock.shotClockRunning}
                    shotClockShortMs={displayedState.config.shotClockShortMs}
                    time={formatClock(
                      displayedState.clock.gameClockRemainingMs,
                    )}
                    disabled={clockControlsDisabled}
                    gameClockExpired={gameClockExpired}
                    shotClockExpired={shotClockExpired}
                  />
                </div>
              </ComponentReveal>

              <ComponentReveal variant="subtle">
                <TeamScorePanel
                  fouls={displayedState.fouls.away}
                  name={displayedState.game.awayTeam.name}
                  onFoul={() => foulTeam("away")}
                  onPlayerFoul={(playerId) => foulPlayer("away", playerId)}
                  onScore={(points) => scoreTeam("away", points)}
                  onTimeout={() => timeoutTeam("away")}
                  score={displayedState.scores.away}
                  side="away"
                  disabled={controlsDisabled || periodActionsDisabled}
                  inPenalty={displayedState.fouls.awayInPenalty}
                  timeoutDisabled={
                    controlsDisabled ||
                    periodActionsDisabled ||
                    !timeoutPhaseValid ||
                    displayedState.timeouts.away.remaining <= 0
                  }
                  timeoutsRemaining={displayedState.timeouts.away.remaining}
                  players={teamPlayers("away")}
                />
              </ComponentReveal>
            </div>
          </RevealGroup>

          <AlertDialog
            open={timeoutDialogSide !== null}
            onOpenChange={(open) => {
              if (isRecordingTimeout) return;
              if (!open) {
                setTimeoutDialogSide(null);
                setTimeoutDialogError(null);
              }
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogMedia
                  className={
                    timeoutDialog?.blocked
                      ? "bg-destructive/10 text-destructive"
                      : "bg-primary/10 text-primary"
                  }
                >
                  <Clock3 className="size-8" />
                </AlertDialogMedia>
                <AlertDialogTitle>{timeoutDialog?.title}</AlertDialogTitle>
                <AlertDialogDescription>
                  {timeoutDialog?.description}
                </AlertDialogDescription>
              </AlertDialogHeader>

              {timeoutDialogError ? (
                <div
                  className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                  role="alert"
                >
                  {timeoutDialogError}
                </div>
              ) : null}

              <AlertDialogFooter>
                <AlertDialogCancel disabled={isRecordingTimeout}>
                  {timeoutDialog?.blocked ? "Close" : "Cancel"}
                </AlertDialogCancel>
                {timeoutDialog && !timeoutDialog.blocked ? (
                  <AlertDialogAction
                    disabled={isRecordingTimeout}
                    onClick={(event) => {
                      event.preventDefault();
                      void recordTimeout();
                    }}
                  >
                    {isRecordingTimeout ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Recording
                      </>
                    ) : (
                      timeoutDialog.confirmLabel
                    )}
                  </AlertDialogAction>
                ) : null}
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <footer className="sticky bottom-0 flex items-center justify-between border-t bg-background px-4 py-3 text-sm md:hidden">
            <div className="flex min-w-0 items-center gap-2">
              {scoring.local.lastConfirmedAction ? (
                <CheckCircle2 className="size-6 shrink-0 text-primary" />
              ) : isOffline ? (
                <WifiOff className="size-6 shrink-0 text-muted-foreground" />
              ) : (
                <Wifi className="size-6 shrink-0 text-primary" />
              )}
              <span className="truncate font-semibold">
                {scoring.local.lastConfirmedAction ??
                  (scoring.offlineLockActive
                    ? "Reconnect to continue"
                    : isOffline
                      ? `${scoring.local.pendingCommands.length} queued`
                      : "Online")}
              </span>
            </div>
            <Button
              disabled={
                !displayedState.latestReversibleEvent || controlsDisabled
              }
              size="sm"
              variant="ghost"
              onClick={undoLatest}
            >
              <RotateCcw className="size-4" />
              Undo
            </Button>
          </footer>

          <div className="fixed bottom-8 left-1/2 z-20 hidden w-[260px] -translate-x-1/2 md:block">
            <Button
              className="h-14 w-full"
              variant="outline"
              disabled={
                !displayedState.latestReversibleEvent || controlsDisabled
              }
              onClick={undoLatest}
            >
              <RotateCcw className="size-5" />
              Undo {displayedState.latestReversibleEvent?.summary ?? ""}
            </Button>
          </div>
        </RevealGroup>
      </main>
    </PageEntrance>
  );
}
