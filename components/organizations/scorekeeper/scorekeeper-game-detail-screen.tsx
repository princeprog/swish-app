"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import {
  ArrowLeft,
  CheckCircle2,
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
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useOrganizationsQuery } from "@/hooks/use-organization";
import { useLiveScoring } from "@/hooks/use-scoring";
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

    const next = structuredClone(state);

    if (next.clock.gameClockRunning && next.clock.gameClockStartedAt) {
      const elapsed = tick - new Date(next.clock.gameClockStartedAt).getTime();
      next.clock.gameClockRemainingMs = Math.max(
        0,
        next.clock.gameClockRemainingMs - elapsed,
      );
    }

    if (next.clock.shotClockRunning && next.clock.shotClockStartedAt) {
      const elapsed = tick - new Date(next.clock.shotClockStartedAt).getTime();
      next.clock.shotClockRemainingMs = Math.max(
        0,
        next.clock.shotClockRemainingMs - elapsed,
      );
    }

    return next;
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
  onScore,
  score,
  side,
  disabled,
}: {
  disabled: boolean;
  fouls: number;
  name: string;
  onFoul: () => void;
  onScore: (points: 1 | 2 | 3) => void;
  score: number;
  side: TeamSide;
}) {
  return (
    <section className="border-b border-black/10 bg-white px-4 py-4 last:border-b-0 md:flex md:min-h-[640px] md:flex-1 md:flex-col md:justify-center md:border-b-0 md:px-8 lg:px-12">
      <div
        className={cn(
          "mb-3 flex items-start justify-between gap-4",
          side === "away" && "md:flex-row-reverse md:text-right",
        )}
      >
        <div
          className={cn(
            "flex min-w-0 gap-3",
            side === "away" && "md:flex-row-reverse",
          )}
        >
          <span
            className={cn(
              "mt-1 h-7 w-1.5 shrink-0 rounded-full md:h-28 md:w-2",
              side === "home" ? "bg-orange-400" : "bg-slate-950",
            )}
          />
          <div className="min-w-0">
            <h2 className="truncate text-xl font-extrabold text-slate-950 md:text-4xl lg:text-5xl">
              {name}
            </h2>
            <p className="text-sm text-slate-500 md:text-lg">
              {side === "home" ? "Home" : "Away"}
            </p>
          </div>
        </div>
        <div className="font-mono text-4xl font-black tabular-nums text-slate-950 md:hidden">
          {score}
        </div>
      </div>

      <div className="hidden text-center font-mono text-[9rem] font-black leading-none tabular-nums text-slate-950 md:block lg:text-[11rem]">
        {score}
      </div>

      <div className="mt-3 grid grid-cols-[1fr_1.55fr_1fr] gap-2 md:mt-16 md:gap-4">
        {[1, 2, 3].map((points) => (
          <Button
            key={points}
            aria-label={`Add ${points} point${points === 1 ? "" : "s"} for ${name}`}
            className={cn(
              "h-16 rounded-md text-3xl font-black md:h-28 md:text-5xl",
              points === 2
                ? "bg-blue-700 text-white hover:bg-blue-800"
                : "border border-slate-200 bg-white text-blue-700 hover:bg-blue-50",
            )}
            variant={points === 2 ? "default" : "outline"}
            disabled={disabled}
            onClick={() => onScore(points as 1 | 2 | 3)}
          >
            +{points}
          </Button>
        ))}
      </div>

      <div className="mt-3 border-t border-slate-200 pt-3 md:mt-7">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-black uppercase text-slate-950 md:text-xl">
            Team fouls
          </span>
          <span className="font-mono text-3xl font-black tabular-nums text-slate-950 md:text-4xl">
            {fouls}
          </span>
        </div>
        <Button
          className="h-12 w-full rounded-md bg-blue-700 text-base font-bold text-white hover:bg-blue-800 md:h-16 md:text-2xl"
          disabled={disabled}
          onClick={onFoul}
        >
          Team foul
        </Button>
      </div>
    </section>
  );
}

function ClockConsole({
  onClockToggle,
  onResetShotClock,
  periodLabel,
  running,
  shotClock,
  time,
  disabled,
}: {
  disabled: boolean;
  onClockToggle: () => void;
  onResetShotClock: (resetTo: "full" | "short") => void;
  periodLabel: string;
  running: boolean;
  shotClock: number;
  time: string;
}) {
  return (
    <section className="bg-slate-950 px-4 py-4 text-white md:flex md:w-[280px] md:shrink-0 md:flex-col md:items-stretch md:justify-center md:px-5">
      <div className="grid grid-cols-[minmax(0,1fr)_112px] gap-4 md:block">
        <div>
          <p className="text-sm font-black md:text-center md:text-2xl">
            {periodLabel}
          </p>
          <div className="mt-1 font-mono text-7xl font-black leading-none tabular-nums md:mt-5 md:text-center md:text-7xl lg:text-8xl">
            {time}
          </div>
          <Button
            className="mt-2 h-10 w-full rounded-md bg-blue-700 text-base font-bold text-white hover:bg-blue-800 md:mt-5 md:h-16 md:text-2xl"
            onClick={onClockToggle}
            disabled={disabled}
          >
            {running ? <Pause className="size-5" /> : <Play className="size-5" />}
            {running ? "Pause" : "Start"}
          </Button>
        </div>

        <div className="border-l border-white/30 pl-3 md:mt-8 md:border-l-0 md:border-t md:pl-0 md:pt-6 md:text-center">
          <p className="text-xs font-black uppercase tracking-wide text-white md:text-base">
            Shot clock
          </p>
          <div className="font-mono text-5xl font-black tabular-nums md:mt-2 md:text-7xl">
            {Math.ceil(shotClock / 1000)}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button
              className="h-12 rounded-md bg-blue-700 text-xl font-black text-white hover:bg-blue-800 md:h-16 md:text-3xl"
              onClick={() => onResetShotClock("full")}
              disabled={disabled}
            >
              24
            </Button>
            <Button
              className="h-12 rounded-md bg-blue-700 text-xl font-black text-white hover:bg-blue-800 md:h-16 md:text-3xl"
              onClick={() => onResetShotClock("short")}
              disabled={disabled}
            >
              14
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ConsoleMoreSheet({
  canFinalize,
  onClaim,
  onCommand,
  onFullscreen,
  onTakeover,
  pendingCount,
  soundEnabled,
  state,
  toggleSound,
}: {
  canFinalize: boolean;
  onClaim: () => void;
  onCommand: (
    type: Parameters<ReturnType<typeof useLiveScoring>["sendCommand"]>[0]["type"],
    payload?: Record<string, unknown>,
  ) => void;
  onFullscreen: () => void;
  onTakeover: () => void;
  pendingCount: number;
  soundEnabled: boolean;
  state: ScoringState;
  toggleSound: () => void;
}) {
  const [periodMinutes, setPeriodMinutes] = React.useState(
    state.config.periodDurationMs / 60000,
  );

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
              <Button
                onClick={() => onCommand("shot_clock.pause")}
                variant="outline"
              >
                Pause shot
              </Button>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-bold uppercase text-muted-foreground">
              Pregame clocks
            </h3>
            <div className="flex items-center gap-2">
              <input
                className="h-11 w-24 rounded-md border px-3"
                max={30}
                min={1}
                type="number"
                value={periodMinutes}
                onChange={(event) => setPeriodMinutes(Number(event.target.value))}
              />
              <Button
                onClick={() =>
                  onCommand("game.configure", {
                    periodDurationMs: periodMinutes * 60000,
                  })
                }
                variant="outline"
              >
                Set quarter minutes
              </Button>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-bold uppercase text-muted-foreground">
              Period
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={() => {
                  if (confirm("End this period now?")) {
                    onCommand("period.end", {
                      reason: "Manual period end from scorekeeper console",
                    });
                  }
                }}
                variant="outline"
              >
                End period
              </Button>
              <Button onClick={() => onCommand("period.start")} variant="outline">
                Next period
              </Button>
              <Button
                disabled={!canFinalize}
                onClick={() => {
                  if (confirm("Finalize this game result?")) {
                    onCommand("game.finalize");
                  }
                }}
              >
                Finalize
              </Button>
            </div>
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

  function sendCommand(
    type: Parameters<typeof scoring.sendCommand>[0]["type"],
    payload?: Record<string, unknown>,
  ) {
    vibrate();
    void scoring.sendCommand({ payload, type });
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

  function toggleClock() {
    if (!displayedState) return;
    sendCommand(
      displayedState.clock.gameClockRunning
        ? "clocks.pause"
        : displayedState.phase === "pregame"
          ? "game.start"
          : "clocks.start",
    );
  }

  function resetShotClock(resetTo: "full" | "short") {
    playBuzzer();
    sendCommand("shot_clock.reset", { resetTo });
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

  if (organizationsQuery.isLoading || (organization && isTeamManager)) {
    return <ScorekeeperLoadingState />;
  }

  if (organizationsQuery.isError) {
    const state = getScorekeeperErrorState(organizationsQuery.error);

    return (
      <main className="min-h-screen bg-background p-6 text-foreground">
        <div className="mx-auto max-w-3xl">
          <ScorekeeperFocusedState
            description={state.description}
            icon={state.icon}
            title="We couldn't load this organization"
            onRetry={() => organizationsQuery.refetch()}
          />
        </div>
      </main>
    );
  }

  if (!organization) {
    return (
      <main className="min-h-screen bg-background p-6 text-foreground">
        <div className="mx-auto max-w-3xl">
          <ScorekeeperFocusedState
            description="This workspace does not exist or you do not have access to it."
            icon="not-found"
            title="Organization not found"
            actionHref="/organizations"
            actionLabel="Back to organizations"
          />
        </div>
      </main>
    );
  }

  if (scoring.query.isLoading || !displayedState) {
    return <ScorekeeperLoadingState />;
  }

  if (scoring.query.isError) {
    const state = getScorekeeperErrorState(scoring.query.error);

    return (
      <main className="min-h-screen bg-background p-6 text-foreground">
        <div className="mx-auto max-w-3xl">
          <ScorekeeperFocusedState
            description={state.description}
            icon={state.icon}
            title={state.title}
            actionHref={`/organizations/${slug}/scorekeeper`}
            actionLabel="Back to assignments"
          />
        </div>
      </main>
    );
  }

  const matchup = `${displayedState.game.homeTeam.name} vs ${displayedState.game.awayTeam.name}`;
  const canFinalize =
    displayedState.phase === "period_break" &&
    displayedState.period.number >= displayedState.config.regulationPeriods &&
    displayedState.scores.home !== displayedState.scores.away &&
    scoring.local.pendingCommands.length === 0;
  const isOffline = Boolean(scoring.local.offlineSince);
  const controlsDisabled = scoring.offlineLockActive;

  return (
    <main className="min-h-screen bg-neutral-100 text-slate-950">
      <header className="flex h-16 items-center justify-between border-b border-black/10 bg-white px-4 md:h-20 md:px-8">
        <Button
          aria-label="Back to assignments"
          size="icon"
          variant="ghost"
          onClick={() => router.push(`/organizations/${slug}/scorekeeper`)}
        >
          <ArrowLeft className="size-6" />
        </Button>
        <h1 className="truncate px-3 text-center text-base font-black md:text-2xl">
          {matchup}
        </h1>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-sm font-bold">
            <span className="size-2 rounded-full bg-red-500" />
            LIVE
          </span>
          <ConsoleMoreSheet
            canFinalize={canFinalize}
            onClaim={() => scoring.claimControl("Scorekeeper device")}
            onCommand={sendCommand}
            onFullscreen={() => void enterFullscreen()}
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

      <div className="md:flex md:min-h-[calc(100vh-5rem)]">
        <div className="md:hidden">
          <ClockConsole
            onClockToggle={toggleClock}
            onResetShotClock={resetShotClock}
            periodLabel={displayedState.period.label}
            running={displayedState.clock.gameClockRunning}
            shotClock={displayedState.clock.shotClockRemainingMs}
            time={formatClock(displayedState.clock.gameClockRemainingMs)}
            disabled={controlsDisabled}
          />
        </div>

        <TeamScorePanel
          fouls={displayedState.fouls.home}
          name={displayedState.game.homeTeam.name}
          onFoul={() => foulTeam("home")}
          onScore={(points) => scoreTeam("home", points)}
          score={displayedState.scores.home}
          side="home"
          disabled={controlsDisabled}
        />

        <div className="hidden md:block">
          <ClockConsole
            onClockToggle={toggleClock}
            onResetShotClock={resetShotClock}
            periodLabel={displayedState.period.label}
            running={displayedState.clock.gameClockRunning}
            shotClock={displayedState.clock.shotClockRemainingMs}
            time={formatClock(displayedState.clock.gameClockRemainingMs)}
            disabled={controlsDisabled}
          />
        </div>

        <TeamScorePanel
          fouls={displayedState.fouls.away}
          name={displayedState.game.awayTeam.name}
          onFoul={() => foulTeam("away")}
          onScore={(points) => scoreTeam("away", points)}
          score={displayedState.scores.away}
          side="away"
          disabled={controlsDisabled}
        />
      </div>

      <footer className="sticky bottom-0 flex items-center justify-between border-t border-black/10 bg-white px-4 py-3 text-sm md:hidden">
        <div className="flex min-w-0 items-center gap-2">
          {scoring.local.lastConfirmedAction ? (
            <CheckCircle2 className="size-6 shrink-0 text-green-600" />
          ) : isOffline ? (
            <WifiOff className="size-6 shrink-0 text-orange-500" />
          ) : (
            <Wifi className="size-6 shrink-0 text-green-600" />
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
          disabled={!displayedState.latestReversibleEvent || controlsDisabled}
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
          className="h-14 w-full rounded-md border border-orange-400 bg-slate-950 text-orange-300 hover:bg-slate-900"
          disabled={!displayedState.latestReversibleEvent || controlsDisabled}
          onClick={undoLatest}
        >
          <RotateCcw className="size-5" />
          Undo {displayedState.latestReversibleEvent?.summary ?? ""}
        </Button>
      </div>
    </main>
  );
}
