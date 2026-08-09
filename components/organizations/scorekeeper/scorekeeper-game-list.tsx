"use client";

import Link from "next/link";
import { CalendarClock, MapPin, Trophy } from "lucide-react";

import {
  ComponentReveal,
  RevealGroup,
} from "@/components/motion/page-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Organization } from "@/services/organization.service";
import type { Schedule } from "@/services/schedule.service";

type GameGroup = {
  description: string;
  games: Schedule[];
  title: string;
};

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfToday() {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date;
}

function isCompleteGame(game: Schedule): boolean {
  return ["cancelled", "final", "postponed"].includes(game.status);
}

function isAttentionGame(game: Schedule, now: Date): boolean {
  const startsAt = new Date(game.starts_at);

  return (
    game.status === "live" ||
    (!isCompleteGame(game) && startsAt.getTime() < now.getTime())
  );
}

export function groupScorekeeperGames(games: Schedule[]): GameGroup[] {
  const now = new Date();
  const todayStart = startOfToday();
  const todayEnd = endOfToday();
  const sortedGames = [...games].sort(
    (first, second) =>
      new Date(first.starts_at).getTime() -
      new Date(second.starts_at).getTime(),
  );

  const attention = sortedGames.filter((game) => isAttentionGame(game, now));
  const today = sortedGames.filter((game) => {
    const startsAt = new Date(game.starts_at);

    return (
      !attention.includes(game) &&
      !isCompleteGame(game) &&
      startsAt >= todayStart &&
      startsAt <= todayEnd
    );
  });
  const upcoming = sortedGames.filter((game) => {
    const startsAt = new Date(game.starts_at);

    return (
      !attention.includes(game) && !isCompleteGame(game) && startsAt > todayEnd
    );
  });
  const completed = sortedGames.filter(isCompleteGame).reverse();

  return [
    {
      description:
        "Live games and scheduled games whose start time has passed.",
      games: attention,
      title: "Needs attention",
    },
    {
      description: "Assigned games scheduled for today.",
      games: today,
      title: "Today",
    },
    {
      description: "Assigned games coming after today.",
      games: upcoming,
      title: "Upcoming",
    },
    {
      description: "Final, postponed, or cancelled assignments.",
      games: completed,
      title: "Completed",
    },
  ];
}

function formatGameTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatStatus(status: string): string {
  return status.replace("_", " ");
}

function GameScore({ game }: { game: Schedule }) {
  const hasScore = game.home_score !== null || game.away_score !== null;

  if (!hasScore) {
    return (
      <div className="text-sm font-medium text-muted-foreground">No score</div>
    );
  }

  return (
    <div className="font-mono text-lg font-semibold tabular-nums">
      {game.home_score ?? "-"} - {game.away_score ?? "-"}
    </div>
  );
}

function ScorekeeperGameCard({
  game,
  organization,
}: {
  game: Schedule;
  organization: Organization;
}) {
  const href = `/organizations/${organization.slug}/scorekeeper/games/${game.id}`;

  return (
    <Link
      href={href}
      className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Card className="rounded-lg border bg-card shadow-xs transition-colors hover:bg-muted/30">
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <CalendarClock className="size-4" />
                <time dateTime={game.starts_at}>
                  {formatGameTime(game.starts_at)}
                </time>
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold">
                  {game.home_team_name}
                </p>
                <p className="truncate text-base font-semibold">
                  {game.away_team_name}
                </p>
              </div>
            </div>

            <div className="text-right">
              <GameScore game={game} />
              <Badge
                variant={game.status === "live" ? "default" : "secondary"}
                className="mt-2 capitalize"
              >
                {formatStatus(game.status)}
              </Badge>
            </div>
          </div>

          <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <div className="flex min-w-0 items-center gap-2">
              <Trophy className="size-4 shrink-0" />
              <span className="truncate">{game.division_name}</span>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <MapPin className="size-4 shrink-0" />
              <span className="truncate">{game.venue_name}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function ScorekeeperGameList({
  games,
  organization,
}: {
  games: Schedule[];
  organization: Organization;
}) {
  const groups = groupScorekeeperGames(games);

  return (
    <RevealGroup className="space-y-8" pace="compact">
      <ComponentReveal asChild variant="subtle">
        <section className="rounded-lg border bg-muted/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Assigned games
              </p>
              <h2 className="text-2xl font-semibold tracking-tight">
                {games.length} {games.length === 1 ? "game" : "games"}
              </h2>
            </div>
            <Badge variant="outline">Read only</Badge>
          </div>
        </section>
      </ComponentReveal>

      {groups.map((group) => (
        <section key={group.title} className="space-y-3">
          <ComponentReveal asChild variant="subtle">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">{group.title}</h3>
              <p className="text-sm text-muted-foreground">{group.description}</p>
            </div>
          </ComponentReveal>

          {group.games.length > 0 ? (
            <RevealGroup
              asChild
              className={cn(
                "grid gap-3",
                group.title === "Needs attention"
                  ? "lg:grid-cols-2"
                  : "md:grid-cols-2",
              )}
              pace="compact"
              phase="secondary"
            >
              <div>
                {group.games.map((game) => (
                  <ComponentReveal key={game.id} variant="subtle">
                    <ScorekeeperGameCard
                      game={game}
                      organization={organization}
                    />
                  </ComponentReveal>
                ))}
              </div>
            </RevealGroup>
          ) : (
            <ComponentReveal asChild variant="subtle">
              <div className="rounded-lg border border-dashed bg-card/60 px-4 py-5 text-sm text-muted-foreground">
                No assigned games in this section.
              </div>
            </ComponentReveal>
          )}
        </section>
      ))}
    </RevealGroup>
  );
}
