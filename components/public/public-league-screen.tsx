"use client";

import { CalendarDays, Loader2, Shield, Trophy, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePublicLeague } from "@/hooks/use-public-league";
import type {
  PublicLeagueGame,
  PublicLeaguePortal,
} from "@/services/public-league.service";

function formatGameDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function groupBy<T, K>(items: T[], getKey: (item: T) => K) {
  const groups = new Map<K, T[]>();
  for (const item of items) {
    const key = getKey(item);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return groups;
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function Score({ game }: { game: PublicLeagueGame }) {
  if (game.homeScore === null || game.awayScore === null) return null;
  return (
    <div className="font-mono text-xl font-semibold tabular-nums">
      {game.homeScore}–{game.awayScore}
    </div>
  );
}

function GameList({
  awards,
  games,
  mode,
}: {
  awards: PublicLeaguePortal["awards"];
  games: PublicLeagueGame[];
  mode: "results" | "schedule";
}) {
  if (games.length === 0) {
    return (
      <EmptyState>
        {mode === "schedule"
          ? "No published games are scheduled yet."
          : "Official results will appear after games are finalized."}
      </EmptyState>
    );
  }

  return (
    <div className="divide-y rounded-lg border">
      {games.map((game) => {
        const award = awards.find((item) => item.game_id === game.id);
        return (
          <article
            className="grid gap-4 px-4 py-4 md:grid-cols-[180px_minmax(0,1fr)_auto] md:items-center"
            key={game.id}
          >
            <div className="text-sm">
              <p className="font-medium">{formatGameDate(game.startsAt)}</p>
              <p className="text-muted-foreground">{game.venueName}</p>
              <p className="text-xs text-muted-foreground">
                {game.division.name}
              </p>
            </div>
            <div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
                <p className="text-right font-semibold">{game.homeTeam.name}</p>
                <span className="text-xs uppercase text-muted-foreground">
                  vs
                </span>
                <p className="font-semibold">{game.awayTeam.name}</p>
              </div>
              {award ? (
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Player of the Game: {award.player_name} · {award.team_name}
                </p>
              ) : null}
            </div>
            <div className="flex items-center justify-between gap-3 md:block md:text-right">
              <Score game={game} />
              {game.status === "live" || game.status === "reopened" ? (
                <Badge className="mt-1" variant="destructive">
                  Live · Unofficial
                </Badge>
              ) : game.status === "final" ? (
                <Badge className="mt-1" variant="secondary">
                  Final
                </Badge>
              ) : (
                <Badge className="mt-1" variant="outline">
                  Scheduled
                </Badge>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function Standings({ rows }: { rows: PublicLeaguePortal["standings"] }) {
  if (rows.length === 0) {
    return (
      <EmptyState>Standings begin after the first official result.</EmptyState>
    );
  }

  const groups = groupBy(
    rows,
    (row) => `${row.division_name} · ${row.pool_name}`,
  );
  return (
    <div className="space-y-8">
      {[...groups.entries()].map(([name, group]) => (
        <section key={name}>
          <h2 className="mb-3 text-lg font-semibold">{name}</h2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-180 text-sm">
              <thead className="bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Rank</th>
                  <th>Team</th>
                  <th>W-L</th>
                  <th>Win %</th>
                  <th>PF</th>
                  <th>PA</th>
                  <th>Diff</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {group.map((row) => (
                  <tr className="border-t" key={row.team_id}>
                    <td className="px-3 py-3 font-semibold">
                      {row.rank ?? "—"}
                    </td>
                    <td className="font-medium">{row.team_name}</td>
                    <td>
                      {row.wins}-{row.losses}
                    </td>
                    <td>{Number(row.win_percentage).toFixed(3)}</td>
                    <td>{row.points_for}</td>
                    <td>{row.points_against}</td>
                    <td>
                      {row.point_differential > 0 ? "+" : ""}
                      {row.point_differential}
                    </td>
                    <td>
                      <Badge variant="outline">
                        {row.qualification_status.replaceAll("_", " ")}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}

function Bracket({ matchups }: { matchups: PublicLeaguePortal["bracket"] }) {
  if (matchups.length === 0) {
    return (
      <EmptyState>
        The playoff bracket will appear when it is generated.
      </EmptyState>
    );
  }
  const divisions = groupBy(matchups, (matchup) => matchup.division_name);

  return (
    <div className="space-y-10">
      {[...divisions.entries()].map(([divisionName, divisionMatchups]) => {
        const lanes = groupBy(
          divisionMatchups,
          (matchup) => matchup.bracket_side ?? "playoffs",
        );
        return (
          <section key={divisionName}>
            <h2 className="mb-4 text-xl font-semibold">{divisionName}</h2>
            <div className="space-y-6">
              {[...lanes.entries()].map(([lane, laneMatchups]) => {
                const rounds = groupBy(
                  laneMatchups,
                  (matchup) => matchup.round_number,
                );
                return (
                  <div key={lane}>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      {lane}
                    </h3>
                    <div
                      aria-label={`${divisionName} ${lane} bracket`}
                      className="grid auto-cols-[minmax(230px,1fr)] grid-flow-col gap-4 overflow-x-auto pb-3"
                    >
                      {[...rounds.entries()].map(([round, roundMatchups]) => (
                        <div className="space-y-3" key={round}>
                          <p className="text-xs font-semibold uppercase text-muted-foreground">
                            Round {round}
                          </p>
                          {roundMatchups.map((matchup) => (
                            <Card
                              key={matchup.id}
                              className={
                                matchup.is_reset_final
                                  ? "border-amber-500/50"
                                  : undefined
                              }
                            >
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm">
                                  {matchup.label ?? `Match ${matchup.position}`}
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2 text-sm">
                                <p
                                  className={
                                    matchup.winner_team_id ===
                                    matchup.home_team_id
                                      ? "font-semibold text-primary"
                                      : "font-medium"
                                  }
                                >
                                  {matchup.home_team_name ?? "To be determined"}
                                </p>
                                <div className="border-t" />
                                <p
                                  className={
                                    matchup.winner_team_id ===
                                    matchup.away_team_id
                                      ? "font-semibold text-primary"
                                      : "font-medium"
                                  }
                                >
                                  {matchup.away_team_name ?? "To be determined"}
                                </p>
                                <Badge variant="outline">
                                  {matchup.status.replaceAll("_", " ")}
                                </Badge>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function Leaders({ leaders }: { leaders: PublicLeaguePortal["leaders"] }) {
  if (leaders.length === 0) {
    return (
      <EmptyState>
        Player leaders appear after finalized stat sheets.
      </EmptyState>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-180 text-sm">
        <thead className="bg-muted/50 text-left text-muted-foreground">
          <tr>
            <th className="px-3 py-2">Player</th>
            <th>Team</th>
            <th>PTS</th>
            <th>REB</th>
            <th>AST</th>
            <th>STL</th>
            <th>TOV</th>
          </tr>
        </thead>
        <tbody>
          {leaders.map((leader, index) => (
            <tr
              className="border-t"
              key={`${leader.player_id ?? leader.player_name}-${leader.team_id}`}
            >
              <td className="px-3 py-3 font-semibold">
                <span className="mr-2 text-muted-foreground">{index + 1}</span>
                {leader.player_name}
              </td>
              <td>{leader.team_name}</td>
              <td>{leader.points}</td>
              <td>{leader.rebounds}</td>
              <td>{leader.assists}</td>
              <td>{leader.steals}</td>
              <td>{leader.turnovers}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Teams({ divisions }: { divisions: PublicLeaguePortal["divisions"] }) {
  if (divisions.length === 0)
    return <EmptyState>No teams are published yet.</EmptyState>;
  return (
    <div className="space-y-8">
      {divisions.map((division) => (
        <section key={division.id}>
          <h2 className="mb-3 text-xl font-semibold">{division.name}</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {division.teams.map((team) => (
              <details
                className="group rounded-lg border bg-card"
                key={team.id}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between p-4 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <span className="flex items-center gap-2">
                    <span
                      className="size-3 rounded-full border"
                      style={{ backgroundColor: team.color ?? "transparent" }}
                    />
                    {team.name}
                  </span>
                  <Badge variant="secondary">
                    {team.players.length} players
                  </Badge>
                </summary>
                <ol className="divide-y border-t px-4">
                  {team.players.map((player) => (
                    <li className="flex gap-3 py-2 text-sm" key={player.id}>
                      <span className="w-8 text-muted-foreground">
                        #{player.jerseyNumber}
                      </span>
                      <span>{player.name}</span>
                    </li>
                  ))}
                </ol>
              </details>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function PublicLeagueScreen({
  organizationSlug,
  seasonSlug,
}: {
  organizationSlug: string;
  seasonSlug: string;
}) {
  const query = usePublicLeague(organizationSlug, seasonSlug);

  if (query.isLoading) {
    return (
      <main className="grid min-h-screen place-items-center">
        <div
          className="flex items-center gap-2 text-muted-foreground"
          role="status"
        >
          <Loader2 className="animate-spin" />
          Loading league…
        </div>
      </main>
    );
  }
  if (query.isError || !query.data) {
    return (
      <main className="grid min-h-screen place-items-center p-6">
        <Card className="max-w-md" role="alert">
          <CardHeader>
            <CardTitle>
              <h1>League page unavailable</h1>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            This league may not be published yet. Check the link or contact the
            league organizer.
          </CardContent>
        </Card>
      </main>
    );
  }

  const league = query.data;
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-end sm:justify-between lg:px-8">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-primary">
              Official league record
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
              {league.organization.name}
            </h1>
            <p className="mt-1 text-muted-foreground">{league.season.name}</p>
          </div>
          <div className="flex gap-2 text-sm text-muted-foreground">
            <Shield className="size-4" />
            Final results and standings are official
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <Tabs defaultValue="schedule">
          <TabsList className="h-auto w-full justify-start overflow-x-auto bg-transparent p-0">
            <TabsTrigger value="schedule">
              <CalendarDays />
              Schedule
            </TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="standings">Standings</TabsTrigger>
            <TabsTrigger value="bracket">
              <Trophy />
              Bracket
            </TabsTrigger>
            <TabsTrigger value="leaders">Leaders</TabsTrigger>
            <TabsTrigger value="teams">
              <Users />
              Teams & Rosters
            </TabsTrigger>
          </TabsList>
          <TabsContent className="mt-6" value="schedule">
            <GameList
              awards={league.awards}
              games={league.schedule}
              mode="schedule"
            />
          </TabsContent>
          <TabsContent className="mt-6" value="results">
            <GameList
              awards={league.awards}
              games={league.results}
              mode="results"
            />
          </TabsContent>
          <TabsContent className="mt-6" value="standings">
            <Standings rows={league.standings} />
          </TabsContent>
          <TabsContent className="mt-6" value="bracket">
            <Bracket matchups={league.bracket} />
          </TabsContent>
          <TabsContent className="mt-6" value="leaders">
            <Leaders leaders={league.leaders} />
          </TabsContent>
          <TabsContent className="mt-6" value="teams">
            <Teams divisions={league.divisions} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
