"use client";

import * as React from "react";
import { Award, BarChart3, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { AppSidebar } from "@/components/app-sidebar";
import { WorkspaceHeader } from "@/components/organizations/shared/workspace-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/hooks/use-auth";
import { useOrganizationsQuery } from "@/hooks/use-organization";
import { useScheduleQuery } from "@/hooks/use-schedule";
import { useStatisticsConsole } from "@/hooks/use-statistics";
import type {
  PlayerBoxScore,
  StatisticEventType,
} from "@/services/statistics.service";

const statButtons: Array<{
  label: string;
  type: StatisticEventType;
  value: number;
}> = [
  { label: "+1 PT", type: "points", value: 1 },
  { label: "+2 PT", type: "points", value: 2 },
  { label: "+3 PT", type: "points", value: 3 },
  { label: "+REB", type: "rebound", value: 1 },
  { label: "+AST", type: "assist", value: 1 },
  { label: "+STL", type: "steal", value: 1 },
  { label: "+TOV", type: "turnover", value: 1 },
];

function PlayerOfGameCard({
  gameConsole,
}: {
  gameConsole: ReturnType<typeof useStatisticsConsole>;
}) {
  const awardState = gameConsole.award.data;
  const [selectedPlayerId, setSelectedPlayerId] = React.useState("");
  const [reason, setReason] = React.useState("");

  if (gameConsole.award.isLoading)
    return <Card className="h-40 animate-pulse" />;

  if (gameConsole.award.isError || !awardState) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Player of the Game</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          The award will be available when the official result and stat sheet
          are finalized.
        </CardContent>
      </Card>
    );
  }

  const effectiveSelectedPlayerId =
    selectedPlayerId || awardState.suggestion.playerId;
  const selectedIsSuggestion =
    effectiveSelectedPlayerId === awardState.suggestion.playerId;
  const confirmedPlayer = awardState.candidates.find(
    (candidate) => candidate.playerId === awardState.award.selected_player_id,
  );
  const suggestion = awardState.candidates.find(
    (candidate) => candidate.playerId === awardState.suggestion.playerId,
  );

  if (awardState.award.confirmed_at && confirmedPlayer) {
    return (
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="text-primary" /> Player of the Game
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold">{confirmedPlayer.playerName}</p>
          <p className="text-sm text-muted-foreground">
            {confirmedPlayer.points} PTS · {confirmedPlayer.rebounds} REB ·{" "}
            {confirmedPlayer.assists} AST · {confirmedPlayer.steals} STL ·{" "}
            {confirmedPlayer.turnovers} TOV
          </p>
          {awardState.award.confirmation_reason ? (
            <p className="mt-3 text-sm">
              Selection note: {awardState.award.confirmation_reason}
            </p>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award /> Confirm Player of the Game
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Suggested:{" "}
          <span className="font-medium text-foreground">
            {suggestion?.playerName}
          </span>{" "}
          · impact score {awardState.suggestion.metricScore}. The impact score
          is points + rebounds + assists + steals − turnovers.
        </p>
        <div className="space-y-2">
          <Label htmlFor="player-of-game">Selected player</Label>
          <NativeSelect
            id="player-of-game"
            value={effectiveSelectedPlayerId}
            onChange={(event) => setSelectedPlayerId(event.target.value)}
          >
            {awardState.candidates.map((candidate) => (
              <NativeSelectOption
                key={candidate.playerId}
                value={candidate.playerId}
              >
                {candidate.playerName} · {candidate.points} PTS,{" "}
                {candidate.rebounds} REB, {candidate.assists} AST,{" "}
                {candidate.steals} STL, {candidate.turnovers} TOV
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        {!selectedIsSuggestion ? (
          <div className="space-y-2">
            <Label htmlFor="player-of-game-reason">Selection reason</Label>
            <Textarea
              id="player-of-game-reason"
              placeholder="Explain why this player is the official selection."
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </div>
        ) : null}
        <Button
          disabled={
            !effectiveSelectedPlayerId ||
            gameConsole.confirmPlayerOfGame.isPending ||
            (!selectedIsSuggestion && reason.trim().length < 10)
          }
          onClick={async () => {
            try {
              await gameConsole.confirmPlayerOfGame.mutateAsync({
                playerId: effectiveSelectedPlayerId,
                reason: selectedIsSuggestion ? undefined : reason.trim(),
              });
              toast.success("Player of the Game confirmed");
            } catch (error) {
              toast.error(getApiErrorMessage(error));
            }
          }}
        >
          {gameConsole.confirmPlayerOfGame.isPending ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Award />
          )}
          Confirm award
        </Button>
      </CardContent>
    </Card>
  );
}

export function StatisticianGameScreen({
  gameId,
  slug,
}: {
  gameId: string;
  slug: string;
}) {
  const organizationsQuery = useOrganizationsQuery();
  const organization = organizationsQuery.data?.find(
    (item) => item.slug === slug,
  );
  const gameQuery = useScheduleQuery(organization?.id, gameId);
  const gameConsole = useStatisticsConsole(organization?.id, gameId);
  const [overrideReason, setOverrideReason] = React.useState("");

  if (!organization || gameQuery.isLoading || gameConsole.query.isLoading) {
    return <main className="p-8">Loading stat sheet…</main>;
  }

  const game = gameQuery.data;
  const state = gameConsole.query.data;
  if (!game || !state)
    return <main className="p-8">This assigned game could not be loaded.</main>;

  const scoreFor = (playerId: string) =>
    state.boxScores.find((item) => item.playerId === playerId);
  const teamPlayerPoints = (teamId: string) =>
    state.boxScores
      .filter((item) => item.teamId === teamId)
      .reduce((sum, item) => sum + item.points, 0);

  async function record(
    playerId: string,
    type: StatisticEventType,
    value: number,
  ) {
    try {
      await gameConsole.record.mutateAsync({ playerId, type, value });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  const teams = [
    {
      id: state.game.homeTeamId,
      name: game.home_team_name,
      official: state.game.homeScore,
    },
    {
      id: state.game.awayTeamId,
      name: game.away_team_name,
      official: state.game.awayScore,
    },
  ];
  const playerPointMismatch = teams.some(
    (team) =>
      team.official !== null && teamPlayerPoints(team.id) !== team.official,
  );
  const canOverrideReconciliation = ["owner", "admin"].includes(
    organization.access.role,
  );

  return (
    <SidebarProvider>
      <AppSidebar
        organization={{
          access: organization.access,
          name: organization.name,
          slug,
          status: organization.status,
        }}
      />
      <SidebarInset>
        <WorkspaceHeader
          organizationAccess={organization.access}
          organizationName={organization.name}
          organizationSlug={slug}
          pageTitle="Stat sheet"
        />
        <main className="space-y-6 p-4 lg:p-6">
          <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">
                {game.home_team_name} vs {game.away_team_name}
              </h1>
              <p className="text-sm text-muted-foreground">
                Player points are reconciled with the official score but never
                change it.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{state.sheet.status}</Badge>
              {gameConsole.controlToken ? (
                <Badge>Control active</Badge>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Button
                    disabled={gameConsole.claim.isPending}
                    onClick={() => gameConsole.claim.mutate()}
                  >
                    {gameConsole.claim.isPending ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <BarChart3 />
                    )}
                    Claim control
                  </Button>
                  <Button
                    disabled={gameConsole.takeover.isPending}
                    variant="outline"
                    onClick={async () => {
                      const reason = window.prompt(
                        "Explain why this device needs to take over statistics control.",
                      );
                      if (!reason || reason.trim().length < 10) {
                        if (reason) {
                          toast.error(
                            "Enter a reason of at least 10 characters.",
                          );
                        }
                        return;
                      }
                      try {
                        await gameConsole.takeover.mutateAsync(reason.trim());
                        toast.success(
                          "Statistics control moved to this device",
                        );
                      } catch (error) {
                        toast.error(getApiErrorMessage(error));
                      }
                    }}
                  >
                    Take over
                  </Button>
                </div>
              )}
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-2">
            {teams.map((team) => (
              <Card key={team.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-3">
                    <span>{team.name}</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      Player points {teamPlayerPoints(team.id)} / Official{" "}
                      {team.official ?? "—"}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="divide-y rounded-md border p-0">
                  {state.roster
                    .filter((player) => player.team_id === team.id)
                    .map((player) => {
                      const box: PlayerBoxScore | undefined = scoreFor(
                        player.id,
                      );
                      return (
                        <div key={player.id} className="space-y-3 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-medium">
                              <span className="mr-2 text-muted-foreground">
                                #{player.jersey_number}
                              </span>
                              {player.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {box?.points ?? 0} PTS · {box?.rebounds ?? 0} REB
                              · {box?.assists ?? 0} AST · {box?.steals ?? 0} STL
                              · {box?.turnovers ?? 0} TOV
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {statButtons.map((button) => (
                              <Button
                                key={`${button.type}-${button.value}`}
                                size="xs"
                                variant="outline"
                                disabled={
                                  !gameConsole.controlToken ||
                                  gameConsole.record.isPending ||
                                  state.sheet.status === "submitted" ||
                                  state.sheet.status === "finalized"
                                }
                                onClick={() =>
                                  record(player.id, button.type, button.value)
                                }
                              >
                                {button.label}
                              </Button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </CardContent>
              </Card>
            ))}
          </div>

          {playerPointMismatch &&
          ["draft", "reopened"].includes(state.sheet.status) ? (
            <Card className="border-amber-500/40">
              <CardHeader>
                <CardTitle>Player points need reconciliation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Player points do not match both official team scores. Correct
                  the stat events before submission
                  {canOverrideReconciliation
                    ? ", or approve the discrepancy with a league record note."
                    : ". Ask a league administrator to approve a documented discrepancy if the stat sheet is correct."}
                </p>
                {canOverrideReconciliation ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="reconciliation-override-reason">
                        Discrepancy reason
                      </Label>
                      <Textarea
                        id="reconciliation-override-reason"
                        placeholder="Explain the team score that is not attributed to a player."
                        value={overrideReason}
                        onChange={(event) =>
                          setOverrideReason(event.target.value)
                        }
                      />
                    </div>
                    <Button
                      disabled={
                        overrideReason.trim().length < 10 ||
                        gameConsole.overrideReconciliation.isPending
                      }
                      variant="outline"
                      onClick={async () => {
                        try {
                          await gameConsole.overrideReconciliation.mutateAsync(
                            overrideReason.trim(),
                          );
                          toast.success("Statistics discrepancy approved");
                        } catch (error) {
                          toast.error(getApiErrorMessage(error));
                        }
                      }}
                    >
                      {gameConsole.overrideReconciliation.isPending ? (
                        <Loader2 className="animate-spin" />
                      ) : null}
                      Approve discrepancy
                    </Button>
                  </>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Recent stat events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {state.events
                .slice(-10)
                .reverse()
                .map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                  >
                    <p className="text-sm">
                      {event.type.replaceAll("_", " ")} · {event.value}
                    </p>
                    {!event.reverses_event_id &&
                    event.type !== "event.reversed" ? (
                      <Button
                        aria-label="Reverse statistic event"
                        size="icon-sm"
                        variant="ghost"
                        disabled={!gameConsole.controlToken}
                        onClick={() =>
                          gameConsole.record.mutate({
                            reversesEventId: event.id,
                          })
                        }
                      >
                        <RotateCcw />
                      </Button>
                    ) : null}
                  </div>
                ))}
              <Button
                disabled={
                  !gameConsole.controlToken ||
                  gameConsole.submit.isPending ||
                  state.sheet.status === "submitted" ||
                  state.sheet.status === "finalized"
                }
                onClick={async () => {
                  try {
                    await gameConsole.submit.mutateAsync();
                    toast.success("Stat sheet submitted and reconciled");
                  } catch (error) {
                    toast.error(getApiErrorMessage(error));
                  }
                }}
              >
                {gameConsole.submit.isPending ? (
                  <Loader2 className="animate-spin" />
                ) : null}
                Submit stat sheet
              </Button>
            </CardContent>
          </Card>

          {state.game.status === "final" &&
          state.sheet.status === "finalized" ? (
            <PlayerOfGameCard gameConsole={gameConsole} />
          ) : null}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
