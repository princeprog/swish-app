"use client"

import Link from "next/link"
import * as React from "react"
import { format } from "date-fns"
import { CalendarDaysIcon, TrophyIcon, Users2Icon } from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import { PageEntrance, StaggerReveal } from "@/components/motion/page-motion"
import { ManagerTeamOverview } from "@/components/organizations/team-manager/manager-team-overview"
import { WorkspaceHeader } from "@/components/organizations/shared/workspace-header"
import { StandingsTable } from "@/components/organizations/standings/organization-standings-view"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getApiErrorMessage } from "@/hooks/use-auth"
import { usePlayersQuery } from "@/hooks/use-player"
import { useSchedulesQuery } from "@/hooks/use-schedule"
import { useStandingsQuery } from "@/hooks/use-standings"
import {
  useSelectedManagerAssignment,
} from "@/hooks/use-team-manager-workspace"
import { cn } from "@/lib/utils"
import type { Organization } from "@/services/organization.service"
import type { Schedule } from "@/services/schedule.service"
import type { TeamManagerWorkspaceAssignment } from "@/services/team-manager-workspace.service"

type ManagerPage = "players" | "schedule" | "standings" | "team"

type ManagerWorkspaceProps = {
  organization: Organization
  page: ManagerPage
}

function rosterStatusLabel(status: string) {
  if (status === "submitted") return "Submitted"
  if (status === "returned") return "Returned"
  if (status === "approved") return "Approved"
  return "Draft"
}

function rosterStatusClassName(status: string) {
  if (status === "approved") return "bg-emerald-600 text-white"
  if (status === "submitted") return "bg-blue-600 text-white"
  if (status === "returned") return "bg-amber-600 text-white"
  return "bg-muted text-muted-foreground"
}

function isRosterEditable(status: string) {
  return status === "draft" || status === "returned"
}

function formatDateTime(value: string) {
  return format(new Date(value), "MMM d, yyyy h:mm a")
}

function ManagerShell({
  assignment,
  children,
  organization,
  pageTitle,
  selectedSeasonId,
  setSelectedSeasonId,
  workspaceAssignments,
}: {
  assignment?: TeamManagerWorkspaceAssignment
  children: React.ReactNode
  organization: Organization
  pageTitle: string
  selectedSeasonId: string | null
  setSelectedSeasonId: (seasonId: string) => void
  workspaceAssignments: TeamManagerWorkspaceAssignment[]
}) {
  return (
    <SidebarProvider>
      <AppSidebar
        organization={{
          access: organization.access,
          name: organization.name,
          slug: organization.slug,
          status: organization.status,
        }}
      />
      <SidebarInset>
        <WorkspaceHeader
          organizationAccess={organization.access}
          organizationName={organization.name}
          organizationSlug={organization.slug}
          pageTitle={pageTitle}
          primaryAction={null}
        />
        <PageEntrance asChild>
          <main className="flex flex-1 flex-col gap-5 bg-background px-4 py-4 lg:px-6 lg:py-5">
            <StaggerReveal className="contents">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <h1
                className={cn(
                  "font-semibold tracking-tight",
                  pageTitle === "My team" ? "text-3xl" : "text-2xl",
                )}
              >
                {pageTitle}
              </h1>
              {assignment && pageTitle !== "My team" ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {assignment.team.name} · {assignment.division.name}
                </p>
              ) : null}
            </div>
            {workspaceAssignments.length ? (
              <Select
                disabled={workspaceAssignments.length === 1}
                value={selectedSeasonId ?? undefined}
                onValueChange={setSelectedSeasonId}
              >
                <SelectTrigger className="h-9 w-full md:w-64">
                  <SelectValue placeholder="Select season" />
                </SelectTrigger>
                <SelectContent>
                  {workspaceAssignments.map((item) => (
                    <SelectItem key={item.assignmentId} value={item.season.id}>
                      {item.season.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
          </div>
              {children}
            </StaggerReveal>
          </main>
        </PageEntrance>
      </SidebarInset>
    </SidebarProvider>
  )
}

function ManagerLoadingState({ organization }: { organization: Organization }) {
  return (
    <SidebarProvider>
      <AppSidebar
        organization={{
          access: organization.access,
          name: organization.name,
          slug: organization.slug,
          status: organization.status,
        }}
      />
      <SidebarInset>
        <WorkspaceHeader
          organizationAccess={organization.access}
          organizationName={organization.name}
          organizationSlug={organization.slug}
          pageTitle="My team"
          primaryAction={null}
        />
        <PageEntrance asChild>
          <main className="space-y-4 bg-background px-4 py-4 lg:px-6 lg:py-5">
            <Skeleton className="h-10 w-72" />
            <Skeleton className="h-36 rounded-lg" />
            <Skeleton className="h-72 rounded-lg" />
          </main>
        </PageEntrance>
      </SidebarInset>
    </SidebarProvider>
  )
}

function ManagerNoAssignmentState({ organization }: { organization: Organization }) {
  return (
    <ManagerShell
      organization={organization}
      pageTitle="My team"
      selectedSeasonId={null}
      setSelectedSeasonId={() => undefined}
      workspaceAssignments={[]}
    >
      <Empty className="border bg-card">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Users2Icon className="size-5" />
          </EmptyMedia>
          <EmptyTitle>No team assigned</EmptyTitle>
          <EmptyDescription>
            Ask a league admin to assign you to a team for this season.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </ManagerShell>
  )
}

function ManagerErrorState({
  description,
  organization,
}: {
  description: string
  organization: Organization
}) {
  return (
    <ManagerShell
      organization={organization}
      pageTitle="My team"
      selectedSeasonId={null}
      setSelectedSeasonId={() => undefined}
      workspaceAssignments={[]}
    >
      <Empty className="border bg-card">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TrophyIcon className="size-5" />
          </EmptyMedia>
          <EmptyTitle>We couldn't load your team workspace</EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </ManagerShell>
  )
}

function RosterStatusPanel({
  assignment,
  organization,
}: {
  assignment: TeamManagerWorkspaceAssignment
  organization: Organization
}) {
  const editable = isRosterEditable(assignment.roster.status)

  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-medium">Roster</h2>
            <Badge className={rosterStatusClassName(assignment.roster.status)}>
              {rosterStatusLabel(assignment.roster.status)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {assignment.roster.submissionDeadlineAt
              ? `Deadline: ${formatDateTime(assignment.roster.submissionDeadlineAt)}`
              : "No roster deadline set."}
          </p>
          {assignment.roster.reviewNote ? (
            <p className="text-sm text-muted-foreground">
              Review note: {assignment.roster.reviewNote}
            </p>
          ) : null}
        </div>
        <Button asChild size="sm" variant={editable ? "default" : "outline"}>
          <Link
            href={`/organizations/${organization.slug}/teams/${assignment.team.id}/roster?seasonId=${assignment.season.id}`}
          >
            {editable ? "Manage roster" : "View roster"}
          </Link>
        </Button>
      </div>
    </section>
  )
}

function ManagerPlayersContent({
  assignment,
  organization,
}: {
  assignment: TeamManagerWorkspaceAssignment
  organization: Organization
}) {
  const [search, setSearch] = React.useState("")
  const [status, setStatus] = React.useState("all")
  const playersQuery = usePlayersQuery(organization.id, {
    pageSize: 50,
    search: search || undefined,
    status: status === "all" ? undefined : (status as "active" | "inactive"),
    teamId: assignment.team.id,
  })
  const players = playersQuery.data?.data ?? []

  return (
    <>
      <RosterStatusPanel assignment={assignment} organization={organization} />
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
        <Input
          aria-label="Search players"
          className="h-9"
          placeholder="Search players..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-9 w-full">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <section className="overflow-hidden rounded-lg border bg-card">
        {playersQuery.isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-12" />
            ))}
          </div>
        ) : playersQuery.isError ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>We couldn't load players</EmptyTitle>
              <EmptyDescription>
                {getApiErrorMessage(playersQuery.error)}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : players.length ? (
          <div className="divide-y">
            {players.map((player) => (
              <div
                key={player.id}
                className="grid gap-3 p-4 text-sm sm:grid-cols-[minmax(0,1fr)_8rem_10rem_7rem]"
              >
                <div>
                  <p className="font-medium">{player.name}</p>
                  <p className="text-xs text-muted-foreground">
                    #{player.jersey_number || "-"}
                  </p>
                </div>
                <span>{player.position || "Unspecified"}</span>
                <span>{formatDateTime(player.updated_at)}</span>
                <Badge
                  className={
                    player.status === "active"
                      ? "bg-emerald-600 text-white"
                      : "bg-zinc-600 text-white"
                  }
                >
                  {player.status}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No players found</EmptyTitle>
              <EmptyDescription>
                This team does not have matching player records yet.
              </EmptyDescription>
            </EmptyHeader>
            {isRosterEditable(assignment.roster.status) ? (
              <EmptyContent>
                <Button asChild>
                  <Link
                    href={`/organizations/${organization.slug}/teams/${assignment.team.id}/roster?seasonId=${assignment.season.id}`}
                  >
                    Manage roster
                  </Link>
                </Button>
              </EmptyContent>
            ) : null}
          </Empty>
        )}
      </section>
    </>
  )
}

function gameIsResult(game: Schedule) {
  return game.status === "final" || game.status === "cancelled"
}

function groupGamesByDate(games: Schedule[]) {
  return games.reduce<Record<string, Schedule[]>>((groups, game) => {
    const key = format(new Date(game.starts_at), "yyyy-MM-dd")
    groups[key] = [...(groups[key] ?? []), game]
    return groups
  }, {})
}

function ManagerGameList({
  assignment,
  games,
  title,
}: {
  assignment: TeamManagerWorkspaceAssignment
  games: Schedule[]
  title: string
}) {
  const groupedGames = groupGamesByDate(games)
  const dates = Object.keys(groupedGames).sort()

  if (!games.length) {
    return (
      <Empty className="border bg-card">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CalendarDaysIcon className="size-5" />
          </EmptyMedia>
          <EmptyTitle>{title}</EmptyTitle>
          <EmptyDescription>
            The schedule will appear here once games are available.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="space-y-5">
      {dates.map((date) => (
        <section key={date} className="space-y-2">
          <h2 className="text-sm font-medium">
            {format(new Date(`${date}T00:00:00`), "EEEE, MMMM d, yyyy")}
          </h2>
          <div className="overflow-hidden rounded-lg border bg-card">
            {groupedGames[date].map((game) => {
              const isHome = game.home_team_id === assignment.team.id
              const opponent = isHome ? game.away_team_name : game.home_team_name
              const teamScore = isHome ? game.home_score : game.away_score
              const opponentScore = isHome ? game.away_score : game.home_score

              return (
                <div
                  key={game.id}
                  className="grid gap-3 border-b p-4 text-sm last:border-b-0 md:grid-cols-[10rem_minmax(0,1fr)_14rem_8rem]"
                >
                  <div>
                    <p className="font-medium">
                      {format(new Date(game.starts_at), "h:mm a")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isHome ? "Home" : "Away"}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">vs {opponent}</p>
                    <p className="text-xs text-muted-foreground">
                      {game.venue_name}
                    </p>
                  </div>
                  <div>
                    {game.status === "final" ? (
                      <p className="font-medium">
                        {teamScore ?? "-"} - {opponentScore ?? "-"}
                      </p>
                    ) : (
                      <p className="text-muted-foreground">Score pending</p>
                    )}
                  </div>
                  <Badge
                    className={cn(
                      "justify-self-start text-white",
                      game.status === "final"
                        ? "bg-emerald-600"
                        : game.status === "live"
                          ? "bg-red-600"
                          : "bg-blue-600",
                    )}
                  >
                    {game.status}
                  </Badge>
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}

function ManagerScheduleContent({
  assignment,
  organization,
}: {
  assignment: TeamManagerWorkspaceAssignment
  organization: Organization
}) {
  const schedulesQuery = useSchedulesQuery(organization.id, {
    leagueSeasonId: assignment.season.id,
    sortBy: "date",
  })
  const games = schedulesQuery.data ?? []
  const upcomingGames = games.filter((game) => !gameIsResult(game))
  const resultGames = games.filter(gameIsResult)

  if (schedulesQuery.isLoading) {
    return <Skeleton className="h-96 rounded-lg" />
  }

  if (schedulesQuery.isError) {
    return (
      <Empty className="border bg-card">
        <EmptyHeader>
          <EmptyTitle>We couldn't load your schedule</EmptyTitle>
          <EmptyDescription>
            {getApiErrorMessage(schedulesQuery.error)}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <Tabs defaultValue="upcoming">
      <TabsList>
        <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
        <TabsTrigger value="results">Results</TabsTrigger>
      </TabsList>
      <TabsContent value="upcoming">
        <ManagerGameList
          assignment={assignment}
          games={upcomingGames}
          title="No upcoming games"
        />
      </TabsContent>
      <TabsContent value="results">
        <ManagerGameList
          assignment={assignment}
          games={resultGames}
          title="No completed games"
        />
      </TabsContent>
    </Tabs>
  )
}

function ManagerStandingsContent({
  assignment,
  organization,
}: {
  assignment: TeamManagerWorkspaceAssignment
  organization: Organization
}) {
  const standingsQuery = useStandingsQuery(organization.id, {
    divisionId: assignment.division.id,
    leagueSeasonId: assignment.season.id,
  })
  const rows = standingsQuery.data?.rows ?? []

  if (standingsQuery.isLoading) {
    return <Skeleton className="h-96 rounded-lg" />
  }

  if (standingsQuery.isError) {
    return (
      <Empty className="border bg-card">
        <EmptyHeader>
          <EmptyTitle>We couldn't load standings</EmptyTitle>
          <EmptyDescription>
            {getApiErrorMessage(standingsQuery.error)}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <StandingsTable rows={rows} />
  )
}

export function TeamManagerWorkspace({
  organization,
  page,
}: ManagerWorkspaceProps) {
  const {
    assignment,
    selectedSeasonId,
    setSelectedSeasonId,
    workspaceQuery,
  } = useSelectedManagerAssignment(organization.id)

  if (workspaceQuery.isLoading) {
    return <ManagerLoadingState organization={organization} />
  }

  if (workspaceQuery.isError) {
    return (
      <ManagerErrorState
        description={getApiErrorMessage(workspaceQuery.error)}
        organization={organization}
      />
    )
  }

  if (!assignment || !workspaceQuery.data?.assignments.length) {
    return <ManagerNoAssignmentState organization={organization} />
  }

  const pageTitle =
    page === "players"
      ? "Players"
      : page === "schedule"
        ? "Schedule"
        : page === "standings"
          ? "Standings"
          : "My team"

  return (
    <ManagerShell
      assignment={assignment}
      organization={organization}
      pageTitle={pageTitle}
      selectedSeasonId={selectedSeasonId}
      setSelectedSeasonId={setSelectedSeasonId}
      workspaceAssignments={workspaceQuery.data.assignments}
    >
      {page === "team" ? (
        <ManagerTeamOverview assignment={assignment} organization={organization} />
      ) : null}
      {page === "players" ? (
        <ManagerPlayersContent assignment={assignment} organization={organization} />
      ) : null}
      {page === "schedule" ? (
        <ManagerScheduleContent assignment={assignment} organization={organization} />
      ) : null}
      {page === "standings" ? (
        <ManagerStandingsContent
          assignment={assignment}
          organization={organization}
        />
      ) : null}
    </ManagerShell>
  )
}
