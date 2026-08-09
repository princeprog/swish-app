"use client"

import Link from "next/link"
import * as React from "react"
import { format } from "date-fns"
import {
  CalendarDaysIcon,
  CheckIcon,
  Loader2Icon,
  MapPinIcon,
  PencilIcon,
} from "lucide-react"
import { toast } from "sonner"

import {
  ComponentReveal,
  RevealGroup,
} from "@/components/motion/page-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { getApiErrorMessage } from "@/hooks/use-auth"
import { usePlayersQuery } from "@/hooks/use-player"
import { useSchedulesQuery } from "@/hooks/use-schedule"
import { useUpdateTeamMutation } from "@/hooks/use-team"
import { cn } from "@/lib/utils"
import type { Organization } from "@/services/organization.service"
import type { Schedule } from "@/services/schedule.service"
import type { TeamManagerWorkspaceAssignment } from "@/services/team-manager-workspace.service"

const ROSTER_STAGES = ["Draft", "Submitted", "Approved", "Published"] as const

function rosterStage(assignment: TeamManagerWorkspaceAssignment) {
  if (assignment.roster.publishedVersionId) return 3
  if (assignment.roster.status === "approved") return 2
  if (assignment.roster.status === "submitted") return 1
  return 0
}

function rosterStatusLabel(assignment: TeamManagerWorkspaceAssignment) {
  if (assignment.roster.publishedVersionId) return "Published"
  if (assignment.roster.status === "approved") return "Approved"
  if (assignment.roster.status === "submitted") return "Submitted"
  if (assignment.roster.status === "returned") return "Returned"
  return "Draft"
}

function rosterStatusClassName(assignment: TeamManagerWorkspaceAssignment) {
  if (assignment.roster.publishedVersionId) return "bg-emerald-600 text-white"
  if (assignment.roster.status === "approved") return "bg-emerald-600 text-white"
  if (assignment.roster.status === "submitted") return "bg-emerald-600 text-white"
  if (assignment.roster.status === "returned") return "bg-amber-600 text-white"
  return "bg-muted text-muted-foreground"
}

function isRosterEditable(status: string) {
  return status === "draft" || status === "returned"
}

function rosterReviewNote(assignment: TeamManagerWorkspaceAssignment) {
  if (assignment.roster.reviewNote) return assignment.roster.reviewNote
  if (assignment.roster.status === "submitted") {
    return "League review pending. No changes requested."
  }
  if (assignment.roster.publishedVersionId) return "Official roster published."
  if (assignment.roster.status === "approved") return "Roster approved by the league."
  return "No review note yet."
}

function TeamProfileDialog({
  assignment,
  organization,
}: {
  assignment: TeamManagerWorkspaceAssignment
  organization: Organization
}) {
  const updateTeamMutation = useUpdateTeamMutation(organization.id)
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState(assignment.team.name)
  const [color, setColor] = React.useState(assignment.team.color ?? "#111827")

  React.useEffect(() => {
    setName(assignment.team.name)
    setColor(assignment.team.color ?? "#111827")
  }, [assignment])

  const hasChanges =
    name.trim() !== assignment.team.name ||
    color !== (assignment.team.color ?? "#111827")

  async function saveTeamProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      await updateTeamMutation.mutateAsync({
        payload: { color, name: name.trim() },
        teamId: assignment.team.id,
      })
      toast.success("Team profile updated.")
      setOpen(false)
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button aria-label="Edit team" size="icon-sm" title="Edit team" variant="ghost">
          <PencilIcon />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit team</DialogTitle>
          <DialogDescription>
            Update the team name and color shown across the league.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-6" onSubmit={saveTeamProfile}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="manager-team-name">Team name</FieldLabel>
              <Input
                id="manager-team-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="manager-team-color">Team color</FieldLabel>
              <Input
                id="manager-team-color"
                className="h-10"
                type="color"
                value={color}
                onChange={(event) => setColor(event.target.value)}
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!hasChanges || !name.trim() || updateTeamMutation.isPending}
              type="submit"
            >
              {updateTeamMutation.isPending ? (
                <Loader2Icon className="animate-spin" data-icon="inline-start" />
              ) : null}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function TeamIdentityCard({
  assignment,
  organization,
}: {
  assignment: TeamManagerWorkspaceAssignment
  organization: Organization
}) {
  return (
    <Card className="py-0">
      <CardContent className="grid gap-5 px-5 py-7 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.15fr] lg:items-center lg:px-7">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="size-9 shrink-0 rounded-md border"
            style={{ backgroundColor: assignment.team.color ?? "#111827" }}
          />
          <p className="truncate text-base font-semibold">{assignment.team.name}</p>
        </div>
        <div className="border-border lg:border-l lg:pl-7">
          <p className="text-xs font-medium uppercase text-muted-foreground">Division</p>
          <p className="mt-1 font-medium">{assignment.division.name}</p>
        </div>
        <div className="border-border lg:border-l lg:pl-7">
          <p className="text-xs font-medium uppercase text-muted-foreground">Season</p>
          <p className="mt-1 font-medium">{assignment.season.name}</p>
        </div>
        <div className="flex items-center justify-between gap-3 border-border lg:border-l lg:pl-7">
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">Status</p>
            <Badge className={cn("mt-1", rosterStatusClassName(assignment))}>
              {rosterStatusLabel(assignment)}
            </Badge>
          </div>
          <TeamProfileDialog assignment={assignment} organization={organization} />
        </div>
      </CardContent>
    </Card>
  )
}

function RosterProgress({ assignment }: { assignment: TeamManagerWorkspaceAssignment }) {
  const currentStage = rosterStage(assignment)

  return (
    <div
      aria-label={`Roster status: ${rosterStatusLabel(assignment)}`}
      aria-valuemax={ROSTER_STAGES.length - 1}
      aria-valuemin={0}
      aria-valuenow={currentStage}
      role="progressbar"
    >
      <ol className="grid grid-cols-4 text-xs sm:text-sm">
        {ROSTER_STAGES.map((stage, index) => (
          <li key={stage} className="flex min-w-0 flex-col items-center gap-2">
            <div className="flex w-full items-center">
              <Separator
                className={cn(
                  "flex-1",
                  index === 0 && "invisible",
                  index <= currentStage ? "bg-primary" : "bg-muted",
                )}
              />
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border-2 bg-card",
                  index <= currentStage
                    ? "border-primary text-primary"
                    : "border-muted-foreground text-muted-foreground",
                )}
              >
                {index < currentStage ? <CheckIcon className="size-3" /> : null}
              </span>
              <Separator
                className={cn(
                  "flex-1",
                  index === ROSTER_STAGES.length - 1 && "invisible",
                  index < currentStage ? "bg-primary" : "bg-muted",
                )}
              />
            </div>
            <span
              className={cn(
                "text-center",
                index === currentStage
                  ? "font-medium text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {stage}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function RosterSubmissionCard({
  activePlayers,
  assignment,
  inactivePlayers,
  isLoadingPlayers,
  organization,
}: {
  activePlayers?: number
  assignment: TeamManagerWorkspaceAssignment
  inactivePlayers?: number
  isLoadingPlayers: boolean
  organization: Organization
}) {
  const editable = isRosterEditable(assignment.roster.status)
  const totalPlayers =
    activePlayers === undefined || inactivePlayers === undefined
      ? undefined
      : activePlayers + inactivePlayers
  const stats = [
    { label: "Total players", value: totalPlayers },
    { label: "Active players", value: activePlayers },
    { label: "Inactive players", value: inactivePlayers },
  ]

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="gap-8 px-5 py-8 sm:px-7">
        <CardTitle className="text-lg">Roster submission</CardTitle>
        <RosterProgress assignment={assignment} />
      </CardHeader>
      <CardContent className="flex flex-col gap-0 px-5 sm:px-7">
        <Separator />
        <div className="grid gap-2 py-6 sm:grid-cols-[13rem_minmax(0,1fr)]">
          <p className="text-sm text-muted-foreground">Submission deadline</p>
          <p className="text-sm font-medium">
            {assignment.roster.submissionDeadlineAt
              ? format(new Date(assignment.roster.submissionDeadlineAt), "MMMM d, yyyy · h:mm a")
              : "No deadline set"}
          </p>
        </div>
        <Separator />
        <div className="grid gap-2 py-6 sm:grid-cols-[13rem_minmax(0,1fr)]">
          <p className="text-sm text-muted-foreground">Review note</p>
          <p className="text-sm font-medium">{rosterReviewNote(assignment)}</p>
        </div>
        <Separator />
        <div className="flex justify-end py-6">
          <Button asChild variant={editable ? "default" : "outline"}>
            <Link
              href={`/organizations/${organization.slug}/teams/${assignment.team.id}/roster?seasonId=${assignment.season.id}`}
            >
              {editable ? "Manage roster" : "View roster"}
            </Link>
          </Button>
        </div>
      </CardContent>
      <CardFooter className="grid grid-cols-1 gap-0 border-t px-0 py-0 sm:grid-cols-3">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={cn(
              "flex flex-col gap-2 px-5 py-7 sm:px-7",
              index > 0 && "border-t sm:border-l sm:border-t-0",
            )}
          >
            <p className="text-xs font-medium uppercase text-muted-foreground">{stat.label}</p>
            {isLoadingPlayers ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <p className="text-2xl font-semibold tabular-nums">{stat.value ?? "-"}</p>
            )}
          </div>
        ))}
      </CardFooter>
    </Card>
  )
}

function NextGameCard({
  assignment,
  game,
  isLoading,
  organization,
}: {
  assignment: TeamManagerWorkspaceAssignment
  game?: Schedule
  isLoading: boolean
  organization: Organization
}) {
  if (isLoading) return <Skeleton className="h-28 rounded-xl" />

  const scheduleHref = `/organizations/${organization.slug}/schedules?seasonId=${assignment.season.id}`

  if (!game) {
    return (
      <Card className="py-0">
        <CardContent className="flex flex-col gap-4 px-5 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">Next game</p>
            <p className="mt-1 font-medium">No upcoming game scheduled</p>
          </div>
          <Button asChild variant="outline">
            <Link href={scheduleHref}>View schedule</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const isHome = game.home_team_id === assignment.team.id
  const opponent = isHome ? game.away_team_name : game.home_team_name

  return (
    <Card className="py-0">
      <CardContent className="grid gap-5 px-5 py-7 md:grid-cols-[minmax(0,1fr)_1.2fr_1fr_auto_auto] md:items-center md:px-7">
        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground">Next game</p>
          <p className="mt-1 font-medium">vs. {opponent}</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CalendarDaysIcon className="size-4 text-muted-foreground" aria-hidden="true" />
          <span>{format(new Date(game.starts_at), "EEEE, MMMM d · h:mm a")}</span>
        </div>
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <MapPinIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="truncate">{game.venue_name}</span>
        </div>
        <Badge variant="outline">{isHome ? "Home" : "Away"}</Badge>
        <Button asChild variant="outline">
          <Link href={scheduleHref}>View schedule</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export function ManagerTeamOverview({
  assignment,
  organization,
}: {
  assignment: TeamManagerWorkspaceAssignment
  organization: Organization
}) {
  const activePlayersQuery = usePlayersQuery(organization.id, {
    pageSize: 10,
    status: "active",
    teamId: assignment.team.id,
  })
  const inactivePlayersQuery = usePlayersQuery(organization.id, {
    pageSize: 10,
    status: "inactive",
    teamId: assignment.team.id,
  })
  const schedulesQuery = useSchedulesQuery(organization.id, {
    leagueSeasonId: assignment.season.id,
    sortBy: "date",
  })
  const nextGame = React.useMemo(
    () =>
      [...(schedulesQuery.data ?? [])]
        .filter(
          (game) => {
            const startsAt = new Date(game.starts_at).getTime()
            const now = Date.now()
            const recentLiveGame =
              game.status === "live" && startsAt >= now - 6 * 60 * 60 * 1000

            return (
              recentLiveGame ||
              (game.status !== "final" &&
                game.status !== "cancelled" &&
                startsAt >= now)
            )
          },
        )
        .sort(
          (left, right) =>
            new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime(),
        )[0],
    [schedulesQuery.data],
  )

  return (
    <RevealGroup asChild>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <ComponentReveal>
          <TeamIdentityCard assignment={assignment} organization={organization} />
        </ComponentReveal>
        <ComponentReveal>
          <RosterSubmissionCard
            activePlayers={activePlayersQuery.data?.pagination.totalItems}
            assignment={assignment}
            inactivePlayers={inactivePlayersQuery.data?.pagination.totalItems}
            isLoadingPlayers={activePlayersQuery.isLoading || inactivePlayersQuery.isLoading}
            organization={organization}
          />
        </ComponentReveal>
        <ComponentReveal>
          <NextGameCard
            assignment={assignment}
            game={nextGame}
            isLoading={schedulesQuery.isLoading}
            organization={organization}
          />
        </ComponentReveal>
      </div>
    </RevealGroup>
  )
}
