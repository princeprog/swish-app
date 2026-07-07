"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import {
  CalendarDays,
  CalendarClock,
  CalendarRange,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDashed,
  CopyCheck,
  Ellipsis,
  Filter,
  Globe,
  MapPin,
  Loader2,
  PencilLine,
  Plus,
  Search,
  Shield,
  Sparkles,
  Trash2,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { AppSidebar } from "@/components/app-sidebar"
import { WorkspaceHeader } from "@/components/organizations/shared/workspace-header"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Field, FieldContent, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getApiErrorMessage } from "@/hooks/use-auth"
import {
  useCreateScheduleMutation,
  useDeleteScheduleMutation,
  useUpdateScheduleMutation,
} from "@/hooks/use-schedule"
import type { Division } from "@/services/division.service"
import type { LeagueSeason } from "@/services/league-season.service"
import type { Organization } from "@/services/organization.service"
import type { Schedule } from "@/services/schedule.service"
import type { Team } from "@/services/team.service"
import type { Venue } from "@/services/venue.service"

type ScheduleStatus =
  | "draft"
  | "scheduled"
  | "live"
  | "final"
  | "reopened"
  | "postponed"
  | "cancelled"

function toLocalDateTimeInputValue(value: string) {
  const date = new Date(value)
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return offsetDate.toISOString().slice(0, 16)
}

function scheduleStatusTone(status: string) {
  switch (status) {
    case "scheduled":
      return "border-blue-500/20 bg-blue-500/10 text-blue-300"
    case "final":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
    case "live":
      return "border-orange-500/20 bg-orange-500/10 text-orange-300"
    case "postponed":
      return "border-amber-500/20 bg-amber-500/10 text-amber-300"
    case "cancelled":
      return "border-rose-500/20 bg-rose-500/10 text-rose-300"
    case "reopened":
      return "border-violet-500/20 bg-violet-500/10 text-violet-300"
    default:
      return "border-zinc-500/20 bg-zinc-500/10 text-zinc-300"
  }
}

function toTitleCase(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function ScheduleSummaryCards({ schedules }: { schedules: Schedule[] }) {
  const now = Date.now()
  const upcomingGames = schedules.filter((game) => new Date(game.starts_at).getTime() >= now).length
  const completedGames = schedules.filter((game) => game.status === "final").length
  const venuesInUse = new Set(schedules.map((game) => game.venue_id)).size

  const cards = [
    {
      description: "All saved games",
      icon: CalendarRange,
      title: "Total games",
      value: schedules.length,
    },
    {
      description: "Next 7 days",
      icon: CalendarClock,
      title: "Upcoming games",
      value: upcomingGames,
    },
    {
      description: "This season",
      icon: CheckCircle2,
      title: "Completed games",
      value: completedGames,
    },
    {
      description: "Locations used so far",
      icon: Shield,
      title: "Venues in use",
      value: venuesInUse,
    },
  ]

  return (
    <section className="grid gap-4 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon

        return (
          <Card key={card.title} className="border border-border/60 bg-card/95 shadow-none">
            <CardHeader className="gap-3 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg border border-border/70 bg-background/70">
                  <Icon className="size-4 text-muted-foreground" />
                </div>
                <CardDescription className="text-sm text-foreground/85">{card.title}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <div className="text-3xl font-semibold tracking-tight">{card.value}</div>
              <p className="text-sm text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </section>
  )
}

function ScheduleSetupNotesCard() {
  const notes = [
    "Create all division schedules before publishing the league calendar.",
    "Assign the correct venue and game time before game day.",
    "Review conflicts and overlaps before publishing schedule changes.",
    "Publish only when all public-facing games are ready to be visible.",
  ]

  return (
    <Card className="border border-border/60 bg-card/95 shadow-none">
      <CardHeader>
        <CardTitle className="text-base">Schedule setup notes</CardTitle>
        <CardDescription>Keep the competition calendar consistent and official.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-3">
          {notes.map((note) => (
            <li key={note} className="flex items-start gap-3 text-sm text-muted-foreground">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function ScheduleRecentActivityCard({ schedules }: { schedules: Schedule[] }) {
  const recentGames = [...schedules]
    .sort(
      (left, right) =>
        new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime(),
    )
    .slice(0, 4)

  return (
    <Card className="border border-border/60 bg-card/95 shadow-none">
      <CardHeader>
        <CardTitle className="text-base">Recent schedule activity</CardTitle>
        <CardDescription>Latest updates in this organization workspace.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentGames.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No schedule records yet. Create the first game to start the calendar.
          </p>
        ) : (
          recentGames.map((game) => (
            <div key={game.id} className="space-y-1">
              <div className="text-sm font-medium">
                {game.home_team_name} vs {game.away_team_name}
              </div>
              <div className="text-xs text-muted-foreground">{game.division_name} • {game.venue_name}</div>
              <div className="text-xs text-muted-foreground">
                Updated {new Date(game.updated_at).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

function ScheduleOperationsCard({
  canCreateSchedule,
  onCreateSchedule,
}: {
  canCreateSchedule: boolean
  onCreateSchedule: () => void
}) {
  return (
    <Card className="border border-border/60 bg-card/95 shadow-none">
      <CardHeader>
        <CardTitle className="text-base">Schedule operations</CardTitle>
        <CardDescription>
          Create, edit, and publish official game schedules for your league.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button className="w-full justify-start" disabled={!canCreateSchedule} onClick={onCreateSchedule}>
          <Globe className="size-4" />
          Publish schedule
        </Button>
        <Button className="w-full justify-start" variant="outline">
          <CopyCheck className="size-4" />
          Generate printable schedule
        </Button>
      </CardContent>
    </Card>
  )
}

function ScheduleActionsPopover({
  game,
  onDelete,
  onEdit,
}: {
  game: Schedule
  onDelete: () => void
  onEdit: () => void
}) {
  const [open, setOpen] = React.useState(false)
  const buttonRef = React.useRef<HTMLButtonElement | null>(null)
  const [menuPosition, setMenuPosition] = React.useState<{
    top: number
    left: number
  } | null>(null)

  React.useEffect(() => {
    if (!open) {
      setMenuPosition(null)
      return
    }

    function updatePosition() {
      const rect = buttonRef.current?.getBoundingClientRect()

      if (!rect) {
        return
      }

      setMenuPosition({
        top: rect.bottom + 8,
        left: rect.right - 176,
      })
    }

    updatePosition()

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement | null

      if (!target?.closest(`[data-schedule-actions="${game.id}"]`)) {
        setOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleEscape)
    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, true)

    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleEscape)
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition, true)
    }
  }, [game.id, open])

  return (
    <div className="relative inline-flex justify-end" data-schedule-actions={game.id}>
      <Button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Open actions for ${game.home_team_name} vs ${game.away_team_name}`}
        ref={buttonRef}
        size="icon-sm"
        variant="ghost"
        onClick={() => setOpen((current) => !current)}
      >
        <Ellipsis className="size-4" />
      </Button>

      {open && menuPosition
        ? createPortal(
            <div
              className="fixed z-50 min-w-44 rounded-xl border border-border/70 bg-popover p-1.5 shadow-xl"
              role="menu"
              style={{
                left: Math.max(menuPosition.left, 12),
                top: menuPosition.top,
              }}
            >
              <div data-schedule-actions={game.id}>
                <Button
                  className="w-full justify-start"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setOpen(false)
                    onEdit()
                  }}
                >
                  <PencilLine className="size-4" />
                  Edit game
                </Button>
                <Button
                  className="w-full justify-start text-destructive hover:text-destructive"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setOpen(false)
                    onDelete()
                  }}
                >
                  <Trash2 className="size-4" />
                  Delete game
                </Button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

function groupSchedulesByDay(games: Schedule[]) {
  const groups = new Map<string, Schedule[]>()

  for (const game of games) {
    const key = new Date(game.starts_at).toDateString()
    const entries = groups.get(key)
    if (entries) {
      entries.push(game)
    } else {
      groups.set(key, [game])
    }
  }

  return Array.from(groups.entries()).map(([dateKey, items]) => ({
    dateKey,
    games: items.sort(
      (left, right) => new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime(),
    ),
  }))
}

function ScheduleBoard({
  games,
  onDeleteGame,
  onEditGame,
}: {
  games: Schedule[]
  onDeleteGame: (game: Schedule) => void
  onEditGame: (game: Schedule) => void
}) {
  if (games.length === 0) {
    return (
      <Empty className="border bg-card">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CalendarRange className="size-5" />
          </EmptyMedia>
          <EmptyTitle>No scheduled games yet</EmptyTitle>
          <EmptyDescription>
            Create the first official game once seasons, divisions, teams, and venues are ready.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const groupedSchedules = groupSchedulesByDay(games)

  return (
    <Card className="border border-border/60 bg-card/95 shadow-none">
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>Schedule board</CardTitle>
            <CardDescription>Grouped by play date across all visible divisions and venues.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button aria-label="Previous dates" size="icon-sm" variant="outline">
              <ChevronLeft className="size-4" />
            </Button>
            <Button aria-label="Next dates" size="icon-sm" variant="outline">
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
        <CardAction>
          <div className="text-sm text-muted-foreground">{games.length} total</div>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {groupedSchedules.map((group, index) => {
            const date = new Date(group.dateKey)
            const isFirst = index === 0

            return (
              <button
                key={group.dateKey}
                className="flex min-w-20 flex-col items-center rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-accent"
                type="button"
              >
                <span className="text-xs text-muted-foreground">
                  {date.toLocaleDateString([], { weekday: "short" }).toUpperCase()}
                </span>
                <span className={isFirst ? "font-semibold text-foreground" : "font-medium"}>
                  {date.toLocaleDateString([], { day: "numeric" })}
                </span>
              </button>
            )
          })}
        </div>

        <div className="space-y-5">
          {groupedSchedules.map((group) => {
            const date = new Date(group.dateKey)

            return (
              <section key={group.dateKey} className="space-y-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-semibold">
                    {date.toLocaleDateString([], {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </h3>
                  <Badge variant="outline">{group.games.length} games</Badge>
                </div>

                <div className="overflow-hidden rounded-xl border border-border/60">
                  {group.games.map((game, index) => (
                    <div
                      key={game.id}
                      className={[
                        "grid gap-3 bg-card px-4 py-4",
                        "md:grid-cols-[130px_minmax(0,1.2fr)_180px_190px_120px_44px]",
                        index !== group.games.length - 1 ? "border-b border-border/60" : "",
                      ].join(" ")}
                    >
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {new Date(game.starts_at).toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </div>
                        <div className="text-xs text-muted-foreground">Game #{index + 1}</div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{game.home_team_name}</span>
                          <Badge variant="secondary">vs</Badge>
                          <span className="font-medium">{game.away_team_name}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{game.league_season_name}</div>
                      </div>

                      <div className="space-y-1 text-sm">
                        <div>{game.division_name}</div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CircleDashed className="size-3" />
                          {game.home_team_slug} / {game.away_team_slug}
                        </div>
                      </div>

                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-1">
                          <MapPin className="size-3.5 text-muted-foreground" />
                          {game.venue_name}
                        </div>
                        <div className="text-xs text-muted-foreground">{game.venue_slug}</div>
                      </div>

                      <div className="flex items-start md:justify-end">
                        <Badge className={scheduleStatusTone(game.status)} variant="outline">
                          {toTitleCase(game.status)}
                        </Badge>
                      </div>

                      <div className="flex items-start justify-end">
                        <ScheduleActionsPopover
                          game={game}
                          onDelete={() => onDeleteGame(game)}
                          onEdit={() => onEditGame(game)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function EditScheduleModal({
  divisions,
  game,
  onClose,
  organizationId,
  seasons,
  teams,
  venues,
}: {
  divisions: Division[]
  game: Schedule
  onClose: () => void
  organizationId: string
  seasons: LeagueSeason[]
  teams: Team[]
  venues: Venue[]
}) {
  const updateScheduleMutation = useUpdateScheduleMutation(organizationId)
  const [leagueSeasonId, setLeagueSeasonId] = React.useState(game.league_season_id)
  const availableDivisions = React.useMemo(
    () => divisions.filter((division) => division.league_season_id === leagueSeasonId),
    [divisions, leagueSeasonId],
  )
  const [divisionId, setDivisionId] = React.useState(game.division_id)
  const availableTeams = React.useMemo(
    () => teams.filter((team) => team.division_id === divisionId),
    [divisionId, teams],
  )
  const availableVenues = React.useMemo(
    () => venues.filter((venue) => venue.league_season_id === leagueSeasonId),
    [leagueSeasonId, venues],
  )
  const [homeTeamId, setHomeTeamId] = React.useState(game.home_team_id)
  const [awayTeamId, setAwayTeamId] = React.useState(game.away_team_id)
  const [venueId, setVenueId] = React.useState(game.venue_id)
  const [startsAt, setStartsAt] = React.useState(toLocalDateTimeInputValue(game.starts_at))
  const [status, setStatus] = React.useState<ScheduleStatus>(game.status as ScheduleStatus)
  const [validationError, setValidationError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const nextDivisionId =
      availableDivisions.find((division) => division.id === divisionId)?.id ??
      availableDivisions[0]?.id ??
      ""
    setDivisionId(nextDivisionId)
  }, [availableDivisions, divisionId])

  React.useEffect(() => {
    const nextVenueId =
      availableVenues.find((venue) => venue.id === venueId)?.id ?? availableVenues[0]?.id ?? ""
    setVenueId(nextVenueId)
  }, [availableVenues, venueId])

  React.useEffect(() => {
    const nextHomeTeamId =
      availableTeams.find((team) => team.id === homeTeamId)?.id ?? availableTeams[0]?.id ?? ""
    const nextAwayTeamId =
      availableTeams.find((team) => team.id === awayTeamId && team.id !== nextHomeTeamId)?.id ??
      availableTeams.find((team) => team.id !== nextHomeTeamId)?.id ??
      ""

    setHomeTeamId(nextHomeTeamId)
    setAwayTeamId(nextAwayTeamId)
  }, [availableTeams, awayTeamId, homeTeamId])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!leagueSeasonId || !divisionId || !venueId || !homeTeamId || !awayTeamId) {
      setValidationError("Season, division, venue, and both teams are required.")
      return
    }

    if (homeTeamId === awayTeamId) {
      setValidationError("Home and away teams must be different.")
      return
    }

    if (!startsAt) {
      setValidationError("Game date and time are required.")
      return
    }

    setValidationError(null)

    try {
      const updatedGame = await updateScheduleMutation.mutateAsync({
        payload: {
          awayTeamId,
          divisionId,
          homeTeamId,
          leagueSeasonId,
          startsAt: new Date(startsAt).toISOString(),
          status,
          venueId,
        },
        scheduleId: game.id,
      })

      toast.success(`Updated ${updatedGame.home_team_name} vs ${updatedGame.away_team_name}`)
      onClose()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 py-8 backdrop-blur-sm">
      <Card className="w-full max-w-3xl border border-border/70 bg-card shadow-2xl">
        <CardHeader className="gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-xl">Edit game</CardTitle>
              <CardDescription>Update the official schedule record for this matchup.</CardDescription>
            </div>
            <Button aria-label="Close edit game modal" size="icon-sm" variant="ghost" onClick={onClose}>
              <X className="size-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="edit-schedule-season">Season</FieldLabel>
                <FieldContent>
                  <NativeSelect
                    id="edit-schedule-season"
                    value={leagueSeasonId}
                    onChange={(event) => setLeagueSeasonId(event.target.value)}
                  >
                    <NativeSelectOption value="">Select a season</NativeSelectOption>
                    {seasons.map((season) => (
                      <NativeSelectOption key={season.id} value={season.id}>
                        {season.name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="edit-schedule-division">Division</FieldLabel>
                <FieldContent>
                  <NativeSelect
                    id="edit-schedule-division"
                    value={divisionId}
                    onChange={(event) => setDivisionId(event.target.value)}
                  >
                    <NativeSelectOption value="">Select a division</NativeSelectOption>
                    {availableDivisions.map((division) => (
                      <NativeSelectOption key={division.id} value={division.id}>
                        {division.name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="edit-schedule-home-team">Home team</FieldLabel>
                <FieldContent>
                  <NativeSelect
                    id="edit-schedule-home-team"
                    value={homeTeamId}
                    onChange={(event) => setHomeTeamId(event.target.value)}
                  >
                    <NativeSelectOption value="">Select a home team</NativeSelectOption>
                    {availableTeams.map((team) => (
                      <NativeSelectOption key={team.id} value={team.id}>
                        {team.name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="edit-schedule-away-team">Away team</FieldLabel>
                <FieldContent>
                  <NativeSelect
                    id="edit-schedule-away-team"
                    value={awayTeamId}
                    onChange={(event) => setAwayTeamId(event.target.value)}
                  >
                    <NativeSelectOption value="">Select an away team</NativeSelectOption>
                    {availableTeams
                      .filter((team) => team.id !== homeTeamId)
                      .map((team) => (
                        <NativeSelectOption key={team.id} value={team.id}>
                          {team.name}
                        </NativeSelectOption>
                      ))}
                  </NativeSelect>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="edit-schedule-venue">Venue</FieldLabel>
                <FieldContent>
                  <NativeSelect
                    id="edit-schedule-venue"
                    value={venueId}
                    onChange={(event) => setVenueId(event.target.value)}
                  >
                    <NativeSelectOption value="">Select a venue</NativeSelectOption>
                    {availableVenues.map((venue) => (
                      <NativeSelectOption key={venue.id} value={venue.id}>
                        {venue.name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="edit-schedule-status">Status</FieldLabel>
                <FieldContent>
                  <NativeSelect
                    id="edit-schedule-status"
                    value={status}
                    onChange={(event) => setStatus(event.target.value as ScheduleStatus)}
                  >
                    {["draft", "scheduled", "live", "final", "reopened", "postponed", "cancelled"].map(
                      (value) => (
                        <NativeSelectOption key={value} value={value}>
                          {toTitleCase(value)}
                        </NativeSelectOption>
                      ),
                    )}
                  </NativeSelect>
                </FieldContent>
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="edit-schedule-starts-at">Game date and time</FieldLabel>
              <FieldContent>
                <Input
                  id="edit-schedule-starts-at"
                  type="datetime-local"
                  value={startsAt}
                  onChange={(event) => setStartsAt(event.target.value)}
                />
              </FieldContent>
            </Field>

            {validationError || updateScheduleMutation.isError ? (
              <FieldError>{validationError ?? getApiErrorMessage(updateScheduleMutation.error)}</FieldError>
            ) : null}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateScheduleMutation.isPending}>
                {updateScheduleMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Saving
                  </>
                ) : (
                  <>
                    <PencilLine className="size-4" />
                    Save changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function DeleteScheduleModal({
  game,
  onClose,
  organizationId,
}: {
  game: Schedule
  onClose: () => void
  organizationId: string
}) {
  const deleteScheduleMutation = useDeleteScheduleMutation(organizationId)

  async function handleDelete() {
    try {
      await deleteScheduleMutation.mutateAsync(game.id)
      toast.success(`Deleted ${game.home_team_name} vs ${game.away_team_name}`)
      onClose()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 py-8 backdrop-blur-sm">
      <Card className="w-full max-w-lg border border-border/70 bg-card shadow-2xl">
        <CardHeader>
          <CardTitle>Delete game</CardTitle>
          <CardDescription>
            You are about to delete{" "}
            <span className="font-medium">
              {game.home_team_name} vs {game.away_team_name}
            </span>
            . This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {deleteScheduleMutation.isError ? (
            <FieldError>{getApiErrorMessage(deleteScheduleMutation.error)}</FieldError>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteScheduleMutation.isPending}
              onClick={handleDelete}
            >
              {deleteScheduleMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Deleting
                </>
              ) : (
                <>
                  <Trash2 className="size-4" />
                  Delete game
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function CreateScheduleModal({
  divisions,
  errorMessage,
  onClose,
  onSubmit,
  pending,
  seasons,
  teams,
  venues,
}: {
  divisions: Division[]
  errorMessage?: string | null
  onClose: () => void
  onSubmit: (payload: {
    awayTeamId: string
    divisionId: string
    homeTeamId: string
    leagueSeasonId: string
    startsAt: string
    status: ScheduleStatus
    venueId: string
  }) => Promise<void>
  pending: boolean
  seasons: LeagueSeason[]
  teams: Team[]
  venues: Venue[]
}) {
  const [leagueSeasonId, setLeagueSeasonId] = React.useState(seasons[0]?.id ?? "")
  const availableDivisions = React.useMemo(
    () => divisions.filter((division) => division.league_season_id === leagueSeasonId),
    [divisions, leagueSeasonId],
  )
  const [divisionId, setDivisionId] = React.useState(availableDivisions[0]?.id ?? "")
  const availableTeams = React.useMemo(
    () => teams.filter((team) => team.division_id === divisionId),
    [divisionId, teams],
  )
  const availableVenues = React.useMemo(
    () => venues.filter((venue) => venue.league_season_id === leagueSeasonId),
    [leagueSeasonId, venues],
  )
  const [homeTeamId, setHomeTeamId] = React.useState("")
  const [awayTeamId, setAwayTeamId] = React.useState("")
  const [venueId, setVenueId] = React.useState(availableVenues[0]?.id ?? "")
  const [startsAt, setStartsAt] = React.useState(
    toLocalDateTimeInputValue(new Date().toISOString()),
  )
  const [status, setStatus] = React.useState<ScheduleStatus>("scheduled")
  const [validationError, setValidationError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const nextDivisionId =
      availableDivisions.find((division) => division.id === divisionId)?.id ??
      availableDivisions[0]?.id ??
      ""
    setDivisionId(nextDivisionId)
  }, [availableDivisions, divisionId])

  React.useEffect(() => {
    const nextVenueId =
      availableVenues.find((venue) => venue.id === venueId)?.id ??
      availableVenues[0]?.id ??
      ""
    setVenueId(nextVenueId)
  }, [availableVenues, venueId])

  React.useEffect(() => {
    const nextHomeTeamId =
      availableTeams.find((team) => team.id === homeTeamId)?.id ??
      availableTeams[0]?.id ??
      ""
    const nextAwayTeamId =
      availableTeams.find((team) => team.id === awayTeamId && team.id !== nextHomeTeamId)?.id ??
      availableTeams.find((team) => team.id !== nextHomeTeamId)?.id ??
      ""

    setHomeTeamId(nextHomeTeamId)
    setAwayTeamId(nextAwayTeamId)
  }, [availableTeams, awayTeamId, homeTeamId])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!leagueSeasonId || !divisionId || !venueId || !homeTeamId || !awayTeamId) {
      setValidationError("Season, division, venue, and both teams are required.")
      return
    }

    if (homeTeamId === awayTeamId) {
      setValidationError("Home and away teams must be different.")
      return
    }

    if (!startsAt) {
      setValidationError("Game date and time are required.")
      return
    }

    setValidationError(null)

    await onSubmit({
      awayTeamId,
      divisionId,
      homeTeamId,
      leagueSeasonId,
      startsAt: new Date(startsAt).toISOString(),
      status,
      venueId,
    })
  }

  const previewHomeTeam =
    availableTeams.find((team) => team.id === homeTeamId)?.name ?? "Home team"
  const previewAwayTeam =
    availableTeams.find((team) => team.id === awayTeamId)?.name ?? "Away team"
  const previewDivision =
    availableDivisions.find((division) => division.id === divisionId)?.name ?? "Division"
  const previewSeason =
    seasons.find((season) => season.id === leagueSeasonId)?.name ?? "Season"
  const previewVenue =
    availableVenues.find((venue) => venue.id === venueId)?.name ?? "Venue"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 py-8 backdrop-blur-sm">
      <Card className="w-full max-w-6xl border border-border/70 bg-card shadow-2xl">
        <CardHeader className="gap-4 border-b border-border/60 pb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-xl">Create game</CardTitle>
              <CardDescription>
                Create an official schedule record for this organization.
              </CardDescription>
            </div>
            <Button aria-label="Close create game modal" size="icon-sm" variant="ghost" onClick={onClose}>
              <X className="size-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <form onSubmit={handleSubmit}>
            <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="space-y-5 p-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="schedule-season">Season</FieldLabel>
                    <FieldContent>
                      <NativeSelect
                        id="schedule-season"
                        value={leagueSeasonId}
                        onChange={(event) => setLeagueSeasonId(event.target.value)}
                      >
                        <NativeSelectOption value="">Select a season</NativeSelectOption>
                        {seasons.map((season) => (
                          <NativeSelectOption key={season.id} value={season.id}>
                            {season.name}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="schedule-division">Division</FieldLabel>
                    <FieldContent>
                      <NativeSelect
                        id="schedule-division"
                        value={divisionId}
                        onChange={(event) => setDivisionId(event.target.value)}
                      >
                        <NativeSelectOption value="">Select a division</NativeSelectOption>
                        {availableDivisions.map((division) => (
                          <NativeSelectOption key={division.id} value={division.id}>
                            {division.name}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="schedule-home-team">Home team</FieldLabel>
                    <FieldContent>
                      <NativeSelect
                        id="schedule-home-team"
                        value={homeTeamId}
                        onChange={(event) => setHomeTeamId(event.target.value)}
                      >
                        <NativeSelectOption value="">Select a home team</NativeSelectOption>
                        {availableTeams.map((team) => (
                          <NativeSelectOption key={team.id} value={team.id}>
                            {team.name}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="schedule-away-team">Away team</FieldLabel>
                    <FieldContent>
                      <NativeSelect
                        id="schedule-away-team"
                        value={awayTeamId}
                        onChange={(event) => setAwayTeamId(event.target.value)}
                      >
                        <NativeSelectOption value="">Select an away team</NativeSelectOption>
                        {availableTeams
                          .filter((team) => team.id !== homeTeamId)
                          .map((team) => (
                            <NativeSelectOption key={team.id} value={team.id}>
                              {team.name}
                            </NativeSelectOption>
                          ))}
                      </NativeSelect>
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="schedule-venue">Venue</FieldLabel>
                    <FieldContent>
                      <NativeSelect
                        id="schedule-venue"
                        value={venueId}
                        onChange={(event) => setVenueId(event.target.value)}
                      >
                        <NativeSelectOption value="">Select a venue</NativeSelectOption>
                        {availableVenues.map((venue) => (
                          <NativeSelectOption key={venue.id} value={venue.id}>
                            {venue.name}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="schedule-status">Status</FieldLabel>
                    <FieldContent>
                      <NativeSelect
                        id="schedule-status"
                        value={status}
                        onChange={(event) => setStatus(event.target.value as ScheduleStatus)}
                      >
                        {[
                          "draft",
                          "scheduled",
                          "live",
                          "final",
                          "reopened",
                          "postponed",
                          "cancelled",
                        ].map((value) => (
                          <NativeSelectOption key={value} value={value}>
                            {value}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    </FieldContent>
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="schedule-starts-at">Game date and time</FieldLabel>
                  <FieldContent>
                    <Input
                      id="schedule-starts-at"
                      type="datetime-local"
                      value={startsAt}
                      onChange={(event) => setStartsAt(event.target.value)}
                    />
                  </FieldContent>
                </Field>

                {validationError || errorMessage ? (
                  <FieldError>{validationError ?? errorMessage}</FieldError>
                ) : null}
              </div>

              <div className="border-t border-border/60 p-6 lg:border-t-0 lg:border-l">
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Game preview</h3>
                  <p className="text-sm text-muted-foreground">
                    This is how the schedule entry will read in the workspace.
                  </p>
                </div>

                <div className="mt-5 rounded-xl border border-border/70 bg-background/60 p-6">
                  <div className="space-y-5 rounded-xl border border-border/60 bg-gradient-to-b from-background to-card p-6">
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">{previewSeason}</div>
                      <div className="text-2xl font-semibold tracking-tight">
                        {previewHomeTeam} vs {previewAwayTeam}
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div>{previewDivision}</div>
                      <div>{previewVenue}</div>
                      <div>
                        {startsAt
                          ? new Date(startsAt).toLocaleString()
                          : "Select game date and time"}
                      </div>
                    </div>
                    <div>
                      <span
                        className={`rounded-full border px-2 py-1 text-xs font-medium ${scheduleStatusTone(status)}`}
                      >
                        {status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-border/60 px-6 py-5 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Creating
                  </>
                ) : (
                  <>
                    <Plus className="size-4" />
                    Create game
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export function OrganizationSchedulesView({
  divisions,
  organization,
  schedules,
  seasons,
  teams,
  venues,
}: {
  divisions: Division[]
  organization: Organization
  schedules: Schedule[]
  seasons: LeagueSeason[]
  teams: Team[]
  venues: Venue[]
}) {
  const createScheduleMutation = useCreateScheduleMutation(organization.id)
  const [createModalOpen, setCreateModalOpen] = React.useState(false)
  const [gameToDelete, setGameToDelete] = React.useState<Schedule | null>(null)
  const [gameToEdit, setGameToEdit] = React.useState<Schedule | null>(null)
  const [search, setSearch] = React.useState("")
  const [divisionFilter, setDivisionFilter] = React.useState("all")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [sortBy, setSortBy] = React.useState("recent")

  const filteredGames = React.useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    const nextGames = schedules.filter((game) => {
      const matchesSearch =
        !normalizedSearch ||
        game.home_team_name.toLowerCase().includes(normalizedSearch) ||
        game.away_team_name.toLowerCase().includes(normalizedSearch) ||
        game.venue_name.toLowerCase().includes(normalizedSearch)
      const matchesDivision =
        divisionFilter === "all" || game.division_id === divisionFilter
      const matchesStatus = statusFilter === "all" || game.status === statusFilter

      return matchesSearch && matchesDivision && matchesStatus
    })

    nextGames.sort((left, right) => {
      if (sortBy === "division") {
        return left.division_name.localeCompare(right.division_name)
      }

      if (sortBy === "venue") {
        return left.venue_name.localeCompare(right.venue_name)
      }

      return new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime()
    })

    return nextGames
  }, [divisionFilter, schedules, search, sortBy, statusFilter])

  async function handleCreateSchedule(payload: {
    awayTeamId: string
    divisionId: string
    homeTeamId: string
    leagueSeasonId: string
    startsAt: string
    status: ScheduleStatus
    venueId: string
  }) {
    try {
      const game = await createScheduleMutation.mutateAsync(payload)
      toast.success(
        `Created ${game.home_team_name} vs ${game.away_team_name}`,
      )
      setCreateModalOpen(false)
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  const canCreateSchedule =
    seasons.length > 0 && divisions.length > 0 && teams.length >= 2 && venues.length > 0

  return (
    <SidebarProvider>
      <AppSidebar
        organization={{
          name: organization.name,
          slug: organization.slug,
          status: organization.status,
        }}
      />
      <SidebarInset>
        <WorkspaceHeader
          organizationName={organization.name}
          organizationSlug={organization.slug}
          pageTitle="Schedules"
        />

        <main className="flex flex-1 flex-col gap-6 bg-background px-4 py-4 lg:px-6 lg:py-5">
          <section className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href={`/organizations/${organization.slug}`}>Organizations</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink href={`/organizations/${organization.slug}`}>{organization.name}</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Schedules</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <h1 className="text-3xl font-semibold tracking-tight">Schedules</h1>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                Manage the official game calendar for {organization.name} across all divisions and venues.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button disabled={!canCreateSchedule} onClick={() => setCreateModalOpen(true)}>
                <Plus className="size-4" />
                New game
              </Button>
              <Button variant="outline">
                <CalendarDays className="size-4" />
                Import schedule
              </Button>
              <Button variant="outline">
                <Globe className="size-4" />
                Publish schedule
              </Button>
            </div>
          </section>

          <ScheduleSummaryCards schedules={schedules} />

          {!canCreateSchedule ? (
            <Card className="border border-dashed border-border/70 bg-card/70 shadow-none">
              <CardHeader>
                <CardTitle>Finish setup before adding games</CardTitle>
                <CardDescription>
                  Schedules need at least one season, division, venue, and two teams in the same division.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_320px]">
            <div className="space-y-6">
              <Card className="border border-border/60 bg-card/95 shadow-none">
                <CardContent className="space-y-4 p-4">
                  <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_170px_160px_190px_180px_120px]">
                    <div className="relative">
                      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        placeholder="Search games..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                      />
                    </div>
                    <NativeSelect
                      value={divisionFilter}
                      onChange={(event) => setDivisionFilter(event.target.value)}
                    >
                      <NativeSelectOption value="all">All divisions</NativeSelectOption>
                      {divisions.map((division) => (
                        <NativeSelectOption key={division.id} value={division.id}>
                          {division.name}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                    <NativeSelect
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value)}
                    >
                      <NativeSelectOption value="all">All status</NativeSelectOption>
                      {[
                        "draft",
                        "scheduled",
                        "live",
                        "final",
                        "reopened",
                        "postponed",
                        "cancelled",
                      ].map((status) => (
                        <NativeSelectOption key={status} value={status}>
                          {status}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                    <NativeSelect
                      value={sortBy}
                      onChange={(event) => setSortBy(event.target.value)}
                    >
                      <NativeSelectOption value="recent">Sort: Date (Earliest)</NativeSelectOption>
                      <NativeSelectOption value="division">Sort: Division</NativeSelectOption>
                      <NativeSelectOption value="venue">Sort: Venue</NativeSelectOption>
                    </NativeSelect>
                    <Button className="justify-start" variant="outline">
                      <CalendarRange className="size-4" />
                      {filteredGames.length > 0
                        ? `${new Date(filteredGames[0].starts_at).toLocaleDateString()} - ${new Date(
                            filteredGames[filteredGames.length - 1].starts_at,
                          ).toLocaleDateString()}`
                        : "Date range"}
                    </Button>
                    <Button className="flex-1" variant="outline">
                      <Filter className="size-4" />
                      Filters
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <ScheduleBoard
                games={filteredGames}
                onDeleteGame={setGameToDelete}
                onEditGame={setGameToEdit}
              />
            </div>

            <div className="space-y-6">
              <ScheduleOperationsCard
                canCreateSchedule={canCreateSchedule}
                onCreateSchedule={() => setCreateModalOpen(true)}
              />
              <ScheduleSetupNotesCard />
              <ScheduleRecentActivityCard schedules={schedules} />
              <Card className="border border-border/60 bg-card/95 shadow-none">
                <CardHeader>
                  <CardTitle className="text-base">Publishing status</CardTitle>
                  <CardDescription>Public schedule pages depend on clean, verified game records.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Draft games pending review</span>
                    <Badge variant="outline">
                      {schedules.filter((game) => game.status === "draft").length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Published-ready games</span>
                    <Badge variant="outline">
                      {schedules.filter((game) => ["scheduled", "live", "final"].includes(game.status)).length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Needs follow-up</span>
                    <Badge variant="outline">
                      {schedules.filter((game) => ["postponed", "cancelled", "reopened"].includes(game.status)).length}
                    </Badge>
                  </div>
                  <Button className="w-full justify-start" variant="outline">
                    <Sparkles className="size-4" />
                    Review publishing checklist
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>
        </main>
      </SidebarInset>

      {createModalOpen ? (
        <CreateScheduleModal
          divisions={divisions}
          errorMessage={
            createScheduleMutation.isError
              ? getApiErrorMessage(createScheduleMutation.error)
              : null
          }
          pending={createScheduleMutation.isPending}
          seasons={seasons}
          teams={teams}
          venues={venues}
          onClose={() => setCreateModalOpen(false)}
          onSubmit={handleCreateSchedule}
        />
      ) : null}

      {gameToEdit ? (
        <EditScheduleModal
          divisions={divisions}
          game={gameToEdit}
          organizationId={organization.id}
          seasons={seasons}
          teams={teams}
          venues={venues}
          onClose={() => setGameToEdit(null)}
        />
      ) : null}

      {gameToDelete ? (
        <DeleteScheduleModal
          game={gameToDelete}
          organizationId={organization.id}
          onClose={() => setGameToDelete(null)}
        />
      ) : null}
    </SidebarProvider>
  )
}
