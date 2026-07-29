"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import {
  ArrowLeft,
  CalendarClock,
  Clock,
  MapPin,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";

import { ScorekeeperShell } from "@/components/organizations/scorekeeper/scorekeeper-shell";
import {
  getScorekeeperErrorState,
  ScorekeeperFocusedState,
  ScorekeeperLoadingState,
} from "@/components/organizations/scorekeeper/scorekeeper-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useOrganizationsQuery } from "@/hooks/use-organization";
import { useScheduleQuery } from "@/hooks/use-schedule";
import type { Schedule } from "@/services/schedule.service";

type ScorekeeperGameDetailScreenProps = {
  gameId: string;
  slug: string;
};

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatUpdatedAt(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatStatus(status: string): string {
  return status.replace("_", " ");
}

function TeamLine({
  color,
  name,
  score,
}: {
  color: string | null;
  name: string;
  score: number | null;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border bg-background/60 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="size-3 shrink-0 rounded-full border"
          style={{ backgroundColor: color ?? "transparent" }}
        />
        <span className="truncate font-medium">{name}</span>
      </div>
      <span className="font-mono text-lg font-semibold tabular-nums">
        {score ?? "-"}
      </span>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-lg border bg-background/60 px-4 py-3">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 break-words text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function GameDetail({ game, slug }: { game: Schedule; slug: string }) {
  return (
    <div className="space-y-6">
      <Button asChild variant="outline" size="sm">
        <Link href={`/organizations/${slug}/scorekeeper`}>
          <ArrowLeft className="size-4" />
          Back to assignments
        </Link>
      </Button>

      <section className="rounded-lg border bg-muted/20 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarClock className="size-4" />
              <time dateTime={game.starts_at}>
                {formatDateTime(game.starts_at)}
              </time>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {game.home_team_name} vs {game.away_team_name}
            </h2>
          </div>
          <Badge
            variant={game.status === "live" ? "default" : "secondary"}
            className="capitalize"
          >
            {formatStatus(game.status)}
          </Badge>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Teams and score</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <TeamLine
              color={game.home_team_color}
              name={game.home_team_name}
              score={game.home_score}
            />
            <TeamLine
              color={game.away_team_color}
              name={game.away_team_name}
              score={game.away_score}
            />
            <Separator />
            <p className="text-sm text-muted-foreground">
              This view is read only. Official scoring controls will be added in
              the scoring workflow.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Schedule record</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <DetailRow
              icon={<Trophy className="size-4" />}
              label="Season"
              value={game.league_season_name}
            />
            <DetailRow
              icon={<Users className="size-4" />}
              label="Division"
              value={game.division_name}
            />
            <DetailRow
              icon={<MapPin className="size-4" />}
              label="Venue"
              value={game.venue_name}
            />
            <DetailRow
              icon={<Clock className="size-4" />}
              label="Last updated"
              value={formatUpdatedAt(game.updated_at)}
            />
            <DetailRow
              icon={<ShieldCheck className="size-4" />}
              label="Game ID"
              value={game.id}
            />
          </CardContent>
        </Card>
      </div>
    </div>
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
  const scheduleQuery = useScheduleQuery(
    organization && !isTeamManager ? organization.id : undefined,
    gameId,
  );

  React.useEffect(() => {
    if (isTeamManager) {
      router.replace(`/organizations/${slug}`);
    }
  }, [isTeamManager, router, slug]);

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

  if (scheduleQuery.isLoading) {
    return <ScorekeeperLoadingState />;
  }

  if (scheduleQuery.isError) {
    const state = getScorekeeperErrorState(scheduleQuery.error);

    return (
      <ScorekeeperShell
        organization={organization}
        organizations={organizations}
      >
        <ScorekeeperFocusedState
          description={state.description}
          icon={state.icon}
          title={state.title}
          actionHref={`/organizations/${slug}/scorekeeper`}
          actionLabel="Back to assignments"
        />
      </ScorekeeperShell>
    );
  }

  if (!scheduleQuery.data) {
    return (
      <ScorekeeperShell
        organization={organization}
        organizations={organizations}
      >
        <ScorekeeperFocusedState
          description="This game is outside your assigned schedule or belongs to another organization."
          icon="not-found"
          title="Game not found"
          actionHref={`/organizations/${slug}/scorekeeper`}
          actionLabel="Back to assignments"
        />
      </ScorekeeperShell>
    );
  }

  return (
    <ScorekeeperShell organization={organization} organizations={organizations}>
      <GameDetail game={scheduleQuery.data} slug={slug} />
    </ScorekeeperShell>
  );
}
