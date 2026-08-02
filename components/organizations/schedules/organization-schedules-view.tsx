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
  Ellipsis,
  FileText,
  Globe,
  History,
  MapPin,
  Loader2,
  PencilLine,
  Plus,
  RotateCcw,
  Search,
  Shield,
  Trash2,
  UserRoundCheck,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { AppSidebar } from "@/components/app-sidebar"
import { canManageOrganizationSchedule } from "@/components/organizations/schedules/schedule-access"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getApiErrorMessage } from "@/hooks/use-auth"
import {
  useCreateScheduleMutation,
  useDeleteScheduleMutation,
  useSchedulesQuery,
  useScorekeepersQuery,
  useUpdateScorekeeperAssignmentMutation,
  useUpdateScheduleMutation,
} from "@/hooks/use-schedule"
import type { Division } from "@/services/division.service"
import type { LeagueSeason } from "@/services/league-season.service"
import type { Organization } from "@/services/organization.service"
import type {
  Schedule,
  ScheduleListQuery,
  ScorekeeperOption,
} from "@/services/schedule.service"
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

function getDateTimePickerDate(value: string) {
  if (!value) {
    return undefined
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

function formatDateTimePickerLabel(value: string) {
  const date = getDateTimePickerDate(value)

  if (!date) {
    return "Select date and time"
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function getDateTimePickerTime(value: string) {
  const date = getDateTimePickerDate(value) ?? new Date()
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")

  return `${hours}:${minutes}`
}

function updateDateTimePickerDate(value: string, nextDate: Date) {
  const currentDate = getDateTimePickerDate(value) ?? new Date()
  const combinedDate = new Date(nextDate)

  combinedDate.setHours(currentDate.getHours(), currentDate.getMinutes(), 0, 0)

  return toLocalDateTimeInputValue(combinedDate.toISOString())
}

function updateDateTimePickerTime(value: string, nextTime: string) {
  const [hours, minutes] = nextTime.split(":").map(Number)

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return value
  }

  const combinedDate = getDateTimePickerDate(value) ?? new Date()
  combinedDate.setHours(hours, minutes, 0, 0)

  return toLocalDateTimeInputValue(combinedDate.toISOString())
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

function canAssignScorekeeper(status: string) {
  return ["draft", "scheduled", "postponed"].includes(status)
}

const scheduleActionsMenuWidth = 224
const scheduleActionsMenuOffset = 8
const scheduleActionsViewportGutter = 12

function formatScheduleDateTime(value: string) {
  return new Date(value).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function getFinalGameOutcome(game: Schedule) {
  if (game.home_score === null || game.away_score === null) {
    return {
      detail: "The official score is not available.",
      winner: null,
    }
  }

  if (game.home_score === game.away_score) {
    return {
      detail: "This game ended in a tie.",
      winner: null,
    }
  }

  const winner =
    game.home_score > game.away_score
      ? game.home_team_name
      : game.away_team_name

  return {
    detail: `${winner} won the game.`,
    winner,
  }
}

function getScheduleActionsMenuPosition({
  menuRect,
  triggerRect,
}: {
  menuRect?: DOMRect
  triggerRect: DOMRect
}) {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const menuWidth = menuRect?.width ?? scheduleActionsMenuWidth
  const menuHeight = menuRect?.height ?? 220
  const maxLeft = Math.max(
    scheduleActionsViewportGutter,
    viewportWidth - menuWidth - scheduleActionsViewportGutter,
  )
  const left = Math.min(
    Math.max(
      triggerRect.right - menuWidth,
      scheduleActionsViewportGutter,
    ),
    maxLeft,
  )
  const spaceBelow =
    viewportHeight -
    triggerRect.bottom -
    scheduleActionsMenuOffset -
    scheduleActionsViewportGutter
  const spaceAbove =
    triggerRect.top -
    scheduleActionsMenuOffset -
    scheduleActionsViewportGutter
  const opensBelow = spaceBelow >= menuHeight || spaceBelow >= spaceAbove
  const availableHeight = Math.max(48, opensBelow ? spaceBelow : spaceAbove)
  const top = opensBelow
    ? triggerRect.bottom + scheduleActionsMenuOffset
    : triggerRect.top - scheduleActionsMenuOffset

  return {
    left,
    maxHeight: availableHeight,
    transform: opensBelow ? "none" : "translateY(-100%)",
    top,
  }
}

function ScheduleDateTimePicker({
  id,
  value,
  onChange,
}: {
  id: string
  value: string
  onChange: (value: string) => void
}) {
  const selectedDate = getDateTimePickerDate(value)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className="h-10 w-full justify-start gap-2 px-3 text-left font-normal"
        >
          <CalendarClock className="size-4 text-muted-foreground" />
          <span className="truncate">{formatDateTimePickerLabel(value)}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto gap-0 p-0">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(nextDate) => {
            if (nextDate) {
              onChange(updateDateTimePickerDate(value, nextDate))
            }
          }}
        />
        <div className="border-t border-border/60 p-3">
          <label
            className="mb-2 block text-sm font-medium text-foreground"
            htmlFor={`${id}-time`}
          >
            Time
          </label>
          <Input
            id={`${id}-time`}
            type="time"
            value={getDateTimePickerTime(value)}
            onInput={(event) =>
              onChange(
                updateDateTimePickerTime(value, event.currentTarget.value),
              )
            }
            onChange={(event) =>
              onChange(updateDateTimePickerTime(value, event.target.value))
            }
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

function ScheduleSummaryCards({ schedules }: { schedules: Schedule[] }) {
  const now = Date.now()
  const upcomingGames = schedules.filter(
    (game) => new Date(game.starts_at).getTime() >= now,
  ).length
  const completedGames = schedules.filter(
    (game) => game.status === "final",
  ).length
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
          <Card
            key={card.title}
            size="sm"
            className="rounded-lg border border-border/60 bg-card/90 py-3 shadow-none"
          >
            <CardHeader className="px-4 pb-2">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border/70 bg-background/70">
                  <Icon className="size-3.5 text-muted-foreground" />
                </div>
                <CardDescription className="text-sm font-medium leading-5 text-foreground/80">
                  {card.title}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-1 px-4 pt-0">
              <div className="text-2xl font-semibold leading-none tracking-tight">
                {card.value}
              </div>
              <p className="text-xs leading-5 text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </section>
  )
}

function ScheduleActionsPopover({
  canManageSchedule,
  game,
  onAssignScorekeeper,
  onDelete,
  onEdit,
  onViewSummary,
}: {
  canManageSchedule: boolean
  game: Schedule
  onAssignScorekeeper: () => void
  onDelete: () => void
  onEdit: () => void
  onViewSummary: () => void
}) {
  const [open, setOpen] = React.useState(false)
  const buttonRef = React.useRef<HTMLButtonElement | null>(null)
  const menuRef = React.useRef<HTMLDivElement | null>(null)
  const [menuPosition, setMenuPosition] = React.useState<{
    left: number
    maxHeight: number
    top: number
    transform: string
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

      setMenuPosition(
        getScheduleActionsMenuPosition({
          menuRect: menuRef.current?.getBoundingClientRect(),
          triggerRect: rect,
        }),
      )
    }

    updatePosition()
    const animationFrame = window.requestAnimationFrame(updatePosition)

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
      window.cancelAnimationFrame(animationFrame)
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleEscape)
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition, true)
    }
  }, [game.id, open])

  if (!canManageSchedule) {
    return null
  }

  const assignmentLocked = !canAssignScorekeeper(game.status)
  const isFinalGame = game.status === "final"

  return (
    <div
      className="relative inline-flex justify-end"
      data-schedule-actions={game.id}
    >
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
              className="fixed z-50 w-56 overflow-y-auto rounded-xl border border-border/70 bg-popover p-1.5 shadow-xl"
              ref={menuRef}
              role="menu"
              style={{
                left: menuPosition.left,
                maxHeight: menuPosition.maxHeight,
                top: menuPosition.top,
                transform: menuPosition.transform,
              }}
            >
              <div data-schedule-actions={game.id}>
                {isFinalGame ? (
                  <>
                    <Button
                      className="w-full justify-start"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setOpen(false)
                        onViewSummary()
                      }}
                    >
                      <FileText className="size-4" />
                      View game summary
                    </Button>
                    <Button
                      aria-disabled="true"
                      className="w-full justify-start opacity-60"
                      disabled
                      size="sm"
                      title="Scoring history is not available yet."
                      variant="ghost"
                    >
                      <History className="size-4" />
                      View scoring history
                    </Button>
                    <Button
                      aria-disabled="true"
                      className="w-full justify-start opacity-60"
                      disabled
                      size="sm"
                      title="Public game pages are not available yet."
                      variant="ghost"
                    >
                      <Globe className="size-4" />
                      View public page
                    </Button>
                    <Button
                      aria-disabled="true"
                      className="w-full justify-start opacity-60"
                      disabled
                      size="sm"
                      title="Reopening finalized games is not available yet."
                      variant="ghost"
                    >
                      <RotateCcw className="size-4" />
                      Reopen game
                    </Button>
                    <div className="space-y-1 px-3 py-2 text-xs leading-5 text-muted-foreground">
                      <p>Coming soon actions are not available yet.</p>
                      <p>Final games are protected as official records.</p>
                    </div>
                  </>
                ) : (
                  <>
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
                      className="w-full justify-start"
                      disabled={assignmentLocked}
                      size="sm"
                      title={
                        assignmentLocked
                          ? "Scorekeeper assignments lock after the game begins."
                          : undefined
                      }
                      variant="ghost"
                      onClick={() => {
                        setOpen(false)
                        onAssignScorekeeper()
                      }}
                    >
                      <UserRoundCheck className="size-4" />
                      {game.scorekeeper_member_id
                        ? "Change scorekeeper"
                        : "Assign scorekeeper"}
                    </Button>
                    {assignmentLocked ? (
                      <p className="px-3 py-1.5 text-xs leading-5 text-muted-foreground">
                        Assignments lock after the game begins.
                      </p>
                    ) : null}
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
                  </>
                )}
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
      (left, right) =>
        new Date(left.starts_at).getTime() -
        new Date(right.starts_at).getTime(),
    ),
  }))
}

function ScheduleBoard({
  canManageSchedule,
  games,
  onAssignScorekeeper,
  onDeleteGame,
  onEditGame,
  onViewFinalSummary,
}: {
  canManageSchedule: boolean
  games: Schedule[]
  onAssignScorekeeper: (game: Schedule) => void
  onDeleteGame: (game: Schedule) => void
  onEditGame: (game: Schedule) => void
  onViewFinalSummary: (game: Schedule) => void
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
            Create the first official game once seasons, divisions, teams, and
            venues are ready.
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
            <CardDescription>
              Grouped by play date across all visible divisions and venues.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              aria-label="Previous dates"
              size="icon-sm"
              variant="outline"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button aria-label="Next dates" size="icon-sm" variant="outline">
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
        <CardAction>
          <div className="text-sm text-muted-foreground">
            {games.length} total
          </div>
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
                  {date
                    .toLocaleDateString([], { weekday: "short" })
                    .toUpperCase()}
                </span>
                <span
                  className={
                    isFirst ? "font-semibold text-foreground" : "font-medium"
                  }
                >
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
                        index !== group.games.length - 1
                          ? "border-b border-border/60"
                          : "",
                      ].join(" ")}
                    >
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {new Date(game.starts_at).toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Game #{index + 1}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {game.home_team_name}
                          </span>
                          {game.home_score !== null &&
                          game.away_score !== null ? (
                            <Badge variant="outline">
                              {game.home_score} - {game.away_score}
                            </Badge>
                          ) : null}
                          <Badge variant="secondary">vs</Badge>
                          <span className="font-medium">
                            {game.away_team_name}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {game.league_season_name}
                        </div>
                      </div>

                      <div className="space-y-1 text-sm">
                        <div>{game.division_name}</div>
                      </div>

                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-1">
                          <MapPin className="size-3.5 text-muted-foreground" />
                          {game.venue_name}
                        </div>
                      </div>

                      <div className="flex items-start md:justify-end">
                        <Badge
                          className={scheduleStatusTone(game.status)}
                          variant="outline"
                        >
                          {toTitleCase(game.status)}
                        </Badge>
                      </div>

                      <div className="flex items-start justify-end">
                        <ScheduleActionsPopover
                          canManageSchedule={canManageSchedule}
                          game={game}
                          onAssignScorekeeper={() =>
                            onAssignScorekeeper(game)
                          }
                          onDelete={() => onDeleteGame(game)}
                          onEdit={() => onEditGame(game)}
                          onViewSummary={() => onViewFinalSummary(game)}
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

function FinalGameSummaryModal({
  game,
  onClose,
}: {
  game: Schedule
  onClose: () => void
}) {
  const outcome = getFinalGameOutcome(game)
  const hasOfficialScore = game.home_score !== null && game.away_score !== null

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="gap-1.5 border-b border-border/60 px-6 py-5 pr-14">
          <div className="mb-2 flex size-10 items-center justify-center rounded-md border border-border/70 bg-muted">
            <CheckCircle2 className="size-5 text-emerald-600" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle className="text-lg">Game summary</DialogTitle>
            <Badge className={scheduleStatusTone("final")} variant="outline">
              Final
            </Badge>
          </div>
          <DialogDescription>
            Official result for {game.home_team_name} vs {game.away_team_name}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-6 py-5">
          <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">
                  {game.home_team_name}
                </div>
                <div className="mt-2 truncate text-sm font-medium">
                  {game.away_team_name}
                </div>
              </div>
              <div className="text-right text-3xl font-semibold tabular-nums">
                {hasOfficialScore ? (
                  <>
                    <div>{game.home_score}</div>
                    <div className="mt-2">{game.away_score}</div>
                  </>
                ) : (
                  <span className="text-base text-muted-foreground">--</span>
                )}
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              {outcome.detail}
            </p>
          </div>

          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-lg border border-border/60 p-3">
              <div className="text-xs font-medium uppercase text-muted-foreground">
                Season
              </div>
              <div className="mt-1 font-medium">{game.league_season_name}</div>
            </div>
            <div className="rounded-lg border border-border/60 p-3">
              <div className="text-xs font-medium uppercase text-muted-foreground">
                Division
              </div>
              <div className="mt-1 font-medium">{game.division_name}</div>
            </div>
            <div className="rounded-lg border border-border/60 p-3">
              <div className="text-xs font-medium uppercase text-muted-foreground">
                Venue
              </div>
              <div className="mt-1 font-medium">{game.venue_name}</div>
            </div>
            <div className="rounded-lg border border-border/60 p-3">
              <div className="text-xs font-medium uppercase text-muted-foreground">
                Scheduled
              </div>
              <div className="mt-1 font-medium">
                {formatScheduleDateTime(game.starts_at)}
              </div>
            </div>
            <div className="rounded-lg border border-border/60 p-3 sm:col-span-2">
              <div className="text-xs font-medium uppercase text-muted-foreground">
                Finalized
              </div>
              <div className="mt-1 font-medium">
                {game.finalized_at
                  ? formatScheduleDateTime(game.finalized_at)
                  : "Finalization time is not available."}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-border/60 px-6 py-4">
          <Button type="button" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  const [leagueSeasonId, setLeagueSeasonId] = React.useState(
    game.league_season_id,
  )
  const availableDivisions = React.useMemo(
    () =>
      divisions.filter(
        (division) => division.league_season_id === leagueSeasonId,
      ),
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
  const [startsAt, setStartsAt] = React.useState(
    toLocalDateTimeInputValue(game.starts_at),
  )
  const [status, setStatus] = React.useState<ScheduleStatus>(
    game.status as ScheduleStatus,
  )
  const [homeScore, setHomeScore] = React.useState(
    game.home_score === null ? "" : String(game.home_score),
  )
  const [awayScore, setAwayScore] = React.useState(
    game.away_score === null ? "" : String(game.away_score),
  )
  const [validationError, setValidationError] = React.useState<string | null>(
    null,
  )

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
      availableTeams.find(
        (team) => team.id === awayTeamId && team.id !== nextHomeTeamId,
      )?.id ??
      availableTeams.find((team) => team.id !== nextHomeTeamId)?.id ??
      ""

    setHomeTeamId(nextHomeTeamId)
    setAwayTeamId(nextAwayTeamId)
  }, [availableTeams, awayTeamId, homeTeamId])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (
      !leagueSeasonId ||
      !divisionId ||
      !venueId ||
      !homeTeamId ||
      !awayTeamId
    ) {
      setValidationError(
        "Season, division, venue, and both teams are required.",
      )
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

    if (status === "final" && (!homeScore || !awayScore)) {
      setValidationError("Final games need both home and away scores.")
      return
    }

    setValidationError(null)

    try {
      const updatedGame = await updateScheduleMutation.mutateAsync({
        payload: {
          awayTeamId,
          awayScore: awayScore ? Number(awayScore) : undefined,
          divisionId,
          homeTeamId,
          homeScore: homeScore ? Number(homeScore) : undefined,
          leagueSeasonId,
          startsAt: new Date(startsAt).toISOString(),
          status,
          venueId,
        },
        scheduleId: game.id,
      })

      toast.success(
        `Updated ${updatedGame.home_team_name} vs ${updatedGame.away_team_name}`,
      )
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
              <CardDescription>
                Update the official schedule record for this matchup.
              </CardDescription>
            </div>
            <Button
              aria-label="Close edit game modal"
              size="icon-sm"
              variant="ghost"
              onClick={onClose}
            >
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
                    <NativeSelectOption value="">
                      Select a season
                    </NativeSelectOption>
                    {seasons.map((season) => (
                      <NativeSelectOption key={season.id} value={season.id}>
                        {season.name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="edit-schedule-division">
                  Division
                </FieldLabel>
                <FieldContent>
                  <NativeSelect
                    id="edit-schedule-division"
                    value={divisionId}
                    onChange={(event) => setDivisionId(event.target.value)}
                  >
                    <NativeSelectOption value="">
                      Select a division
                    </NativeSelectOption>
                    {availableDivisions.map((division) => (
                      <NativeSelectOption key={division.id} value={division.id}>
                        {division.name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="edit-schedule-home-team">
                  Home team
                </FieldLabel>
                <FieldContent>
                  <NativeSelect
                    id="edit-schedule-home-team"
                    value={homeTeamId}
                    onChange={(event) => setHomeTeamId(event.target.value)}
                  >
                    <NativeSelectOption value="">
                      Select a home team
                    </NativeSelectOption>
                    {availableTeams.map((team) => (
                      <NativeSelectOption key={team.id} value={team.id}>
                        {team.name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="edit-schedule-away-team">
                  Away team
                </FieldLabel>
                <FieldContent>
                  <NativeSelect
                    id="edit-schedule-away-team"
                    value={awayTeamId}
                    onChange={(event) => setAwayTeamId(event.target.value)}
                  >
                    <NativeSelectOption value="">
                      Select an away team
                    </NativeSelectOption>
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
                    <NativeSelectOption value="">
                      Select a venue
                    </NativeSelectOption>
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
                    onChange={(event) =>
                      setStatus(event.target.value as ScheduleStatus)
                    }
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
                        {toTitleCase(value)}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </FieldContent>
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="edit-schedule-starts-at">
                Game date and time
              </FieldLabel>
              <FieldContent>
                <Input
                  id="edit-schedule-starts-at"
                  type="datetime-local"
                  value={startsAt}
                  onChange={(event) => setStartsAt(event.target.value)}
                />
              </FieldContent>
            </Field>

            {status === "final" ? (
              <div className="grid gap-5 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="edit-schedule-home-score">
                    Home score
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id="edit-schedule-home-score"
                      min={0}
                      type="number"
                      value={homeScore}
                      onChange={(event) => setHomeScore(event.target.value)}
                    />
                  </FieldContent>
                </Field>
                <Field>
                  <FieldLabel htmlFor="edit-schedule-away-score">
                    Away score
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id="edit-schedule-away-score"
                      min={0}
                      type="number"
                      value={awayScore}
                      onChange={(event) => setAwayScore(event.target.value)}
                    />
                  </FieldContent>
                </Field>
              </div>
            ) : null}

            {validationError || updateScheduleMutation.isError ? (
              <FieldError>
                {validationError ??
                  getApiErrorMessage(updateScheduleMutation.error)}
              </FieldError>
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
            <FieldError>
              {getApiErrorMessage(deleteScheduleMutation.error)}
            </FieldError>
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

function AssignScorekeeperModal({
  game,
  onClose,
  organizationId,
  scorekeepers,
}: {
  game: Schedule
  onClose: () => void
  organizationId: string
  scorekeepers: ScorekeeperOption[]
}) {
  const assignmentMutation =
    useUpdateScorekeeperAssignmentMutation(organizationId)
  const [scorekeeperMemberId, setScorekeeperMemberId] = React.useState(
    game.scorekeeper_member_id ?? "unassigned",
  )
  const assignmentLocked = !canAssignScorekeeper(game.status)

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (assignmentLocked) {
      return
    }

    try {
      const updatedGame = await assignmentMutation.mutateAsync({
        payload: {
          scorekeeperMemberId:
            scorekeeperMemberId === "unassigned"
              ? null
              : scorekeeperMemberId,
        },
        scheduleId: game.id,
      })
      toast.success(
        updatedGame.scorekeeper_name
          ? `${updatedGame.scorekeeper_name} is assigned to this game.`
          : "This game is now unassigned.",
      )
      onClose()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="gap-1.5 border-b border-border/60 px-6 py-5 pr-14">
          <div className="mb-2 flex size-10 items-center justify-center rounded-md border border-border/70 bg-muted">
            <UserRoundCheck className="size-5 text-muted-foreground" />
          </div>
          <DialogTitle className="text-lg">
            {game.scorekeeper_member_id
              ? "Change scorekeeper"
              : "Assign scorekeeper"}
          </DialogTitle>
          <DialogDescription>
            Choose the scorekeeper responsible for this scheduled game.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave}>
          <div className="space-y-5 px-6 py-5">
            <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
              <div className="text-sm font-medium">
                {game.home_team_name} vs {game.away_team_name}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {new Date(game.starts_at).toLocaleString([], {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}{" "}
                at {game.venue_name}
              </div>
            </div>

            <Field>
              <FieldLabel htmlFor="schedule-scorekeeper-assignment">
                Scorekeeper
              </FieldLabel>
              <FieldContent>
                <NativeSelect
                  className="w-full"
                  disabled={assignmentLocked || assignmentMutation.isPending}
                  id="schedule-scorekeeper-assignment"
                  value={scorekeeperMemberId}
                  onChange={(event) =>
                    setScorekeeperMemberId(event.target.value)
                  }
                >
                  <NativeSelectOption value="unassigned">
                    Unassigned
                  </NativeSelectOption>
                  {scorekeepers.map((scorekeeper) => (
                    <NativeSelectOption
                      key={scorekeeper.id}
                      value={scorekeeper.id}
                    >
                      {scorekeeper.name || scorekeeper.email}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </FieldContent>
            </Field>

            <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm leading-6 text-muted-foreground">
              Current assignment:{" "}
              <span className="font-medium text-foreground">
                {game.scorekeeper_name ?? "Unassigned"}
              </span>
            </div>

            {scorekeepers.length === 0 ? (
              <FieldError>
                No active scorekeepers are available yet. You can leave this
                game unassigned.
              </FieldError>
            ) : null}

            {assignmentLocked ? (
              <FieldError>
                Scorekeeper assignments lock after the game begins.
              </FieldError>
            ) : null}

            {assignmentMutation.isError ? (
              <FieldError>
                {getApiErrorMessage(assignmentMutation.error)}
              </FieldError>
            ) : null}
          </div>

          <DialogFooter className="border-t border-border/60 px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={assignmentLocked || assignmentMutation.isPending}
            >
              {assignmentMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving
                </>
              ) : (
                <>
                  <UserRoundCheck className="size-4" />
                  Save assignment
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function CreateScheduleModal({
  divisions,
  errorMessage,
  onClose,
  onSubmit,
  pending,
  scorekeepers,
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
    scorekeeperMemberId: string | null
    startsAt: string
    venueId: string
  }) => Promise<void>
  pending: boolean
  scorekeepers: ScorekeeperOption[]
  seasons: LeagueSeason[]
  teams: Team[]
  venues: Venue[]
}) {
  const [leagueSeasonId, setLeagueSeasonId] = React.useState(
    seasons[0]?.id ?? "",
  )
  const availableDivisions = React.useMemo(
    () =>
      divisions.filter(
        (division) => division.league_season_id === leagueSeasonId,
      ),
    [divisions, leagueSeasonId],
  )
  const [divisionId, setDivisionId] = React.useState(
    availableDivisions[0]?.id ?? "",
  )
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
  const [scorekeeperMemberId, setScorekeeperMemberId] =
    React.useState("unassigned")
  const [startsAt, setStartsAt] = React.useState(
    toLocalDateTimeInputValue(new Date().toISOString()),
  )
  const [validationError, setValidationError] = React.useState<string | null>(
    null,
  )

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
      availableTeams.find(
        (team) => team.id === awayTeamId && team.id !== nextHomeTeamId,
      )?.id ??
      availableTeams.find((team) => team.id !== nextHomeTeamId)?.id ??
      ""

    setHomeTeamId(nextHomeTeamId)
    setAwayTeamId(nextAwayTeamId)
  }, [availableTeams, awayTeamId, homeTeamId])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (
      !leagueSeasonId ||
      !divisionId ||
      !venueId ||
      !homeTeamId ||
      !awayTeamId
    ) {
      setValidationError(
        "Season, division, venue, and both teams are required.",
      )
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
      scorekeeperMemberId:
        scorekeeperMemberId === "unassigned" ? null : scorekeeperMemberId,
      startsAt: new Date(startsAt).toISOString(),
      venueId,
    })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[calc(100vh-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-2xl">
        <DialogHeader className="gap-1.5 border-b border-border/60 px-6 py-5 pr-14">
          <DialogTitle className="text-lg">Create game</DialogTitle>
          <DialogDescription>
            Schedule an official game for this organization.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5 px-6 py-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="schedule-season">Season</FieldLabel>
                <FieldContent>
                  <NativeSelect
                    className="w-full"
                    id="schedule-season"
                    value={leagueSeasonId}
                    onChange={(event) => setLeagueSeasonId(event.target.value)}
                  >
                    <NativeSelectOption value="">
                      Select a season
                    </NativeSelectOption>
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
                    className="w-full"
                    id="schedule-division"
                    value={divisionId}
                    onChange={(event) => setDivisionId(event.target.value)}
                  >
                    <NativeSelectOption value="">
                      Select a division
                    </NativeSelectOption>
                    {availableDivisions.map((division) => (
                      <NativeSelectOption key={division.id} value={division.id}>
                        {division.name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </FieldContent>
              </Field>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="schedule-home-team">Home team</FieldLabel>
                <FieldContent>
                  <NativeSelect
                    className="w-full"
                    id="schedule-home-team"
                    value={homeTeamId}
                    onChange={(event) => setHomeTeamId(event.target.value)}
                  >
                    <NativeSelectOption value="">
                      Select a home team
                    </NativeSelectOption>
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
                    className="w-full"
                    id="schedule-away-team"
                    value={awayTeamId}
                    onChange={(event) => setAwayTeamId(event.target.value)}
                  >
                    <NativeSelectOption value="">
                      Select an away team
                    </NativeSelectOption>
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
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="schedule-venue">Venue</FieldLabel>
                <FieldContent>
                  <NativeSelect
                    className="w-full"
                    id="schedule-venue"
                    value={venueId}
                    onChange={(event) => setVenueId(event.target.value)}
                  >
                    <NativeSelectOption value="">
                      Select a venue
                    </NativeSelectOption>
                    {availableVenues.map((venue) => (
                      <NativeSelectOption key={venue.id} value={venue.id}>
                        {venue.name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="schedule-starts-at">
                  Game date and time
                </FieldLabel>
                <FieldContent>
                  <ScheduleDateTimePicker
                    id="schedule-starts-at"
                    value={startsAt}
                    onChange={setStartsAt}
                  />
                </FieldContent>
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="schedule-scorekeeper">
                Scorekeeper
              </FieldLabel>
              <FieldContent>
                <NativeSelect
                  className="w-full"
                  id="schedule-scorekeeper"
                  value={scorekeeperMemberId}
                  onChange={(event) =>
                    setScorekeeperMemberId(event.target.value)
                  }
                >
                  <NativeSelectOption value="unassigned">
                    Unassigned
                  </NativeSelectOption>
                  {scorekeepers.map((scorekeeper) => (
                    <NativeSelectOption
                      key={scorekeeper.id}
                      value={scorekeeper.id}
                    >
                      {scorekeeper.name || scorekeeper.email}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </FieldContent>
            </Field>

            {validationError || errorMessage ? (
              <FieldError>{validationError ?? errorMessage}</FieldError>
            ) : null}
          </div>

          <DialogFooter className="border-t border-border/60 px-6 py-4">
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function OrganizationSchedulesView({
  divisions,
  organization,
  seasons,
  teams,
  venues,
}: {
  divisions: Division[]
  organization: Organization
  seasons: LeagueSeason[]
  teams: Team[]
  venues: Venue[]
}) {
  const createScheduleMutation = useCreateScheduleMutation(organization.id)
  const [createModalOpen, setCreateModalOpen] = React.useState(false)
  const [gameToAssign, setGameToAssign] = React.useState<Schedule | null>(null)
  const [gameToDelete, setGameToDelete] = React.useState<Schedule | null>(null)
  const [gameToEdit, setGameToEdit] = React.useState<Schedule | null>(null)
  const [gameToSummarize, setGameToSummarize] =
    React.useState<Schedule | null>(null)
  const [search, setSearch] = React.useState("")
  const [divisionFilter, setDivisionFilter] = React.useState("all")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [sortBy, setSortBy] =
    React.useState<NonNullable<ScheduleListQuery["sortBy"]>>("date")
  const deferredSearch = React.useDeferredValue(search.trim())
  const schedulesQueryParams = React.useMemo<ScheduleListQuery>(
    () => ({
      divisionId: divisionFilter === "all" ? undefined : divisionFilter,
      search: deferredSearch || undefined,
      sortBy,
      status:
        statusFilter === "all"
          ? undefined
          : (statusFilter as NonNullable<ScheduleListQuery["status"]>),
    }),
    [deferredSearch, divisionFilter, sortBy, statusFilter],
  )
  const schedulesQuery = useSchedulesQuery(
    organization.id,
    schedulesQueryParams,
  )
  const schedules = schedulesQuery.data ?? []
  const canManageSchedule = canManageOrganizationSchedule(organization)
  const scorekeepersQuery = useScorekeepersQuery(
    organization.id,
    canManageSchedule,
  )
  const scorekeepers = scorekeepersQuery.data ?? []

  async function handleCreateSchedule(payload: {
    awayTeamId: string
    divisionId: string
    homeTeamId: string
    leagueSeasonId: string
    scorekeeperMemberId: string | null
    startsAt: string
    venueId: string
  }) {
    try {
      const game = await createScheduleMutation.mutateAsync({
        ...payload,
        status: "scheduled",
      })
      toast.success(`Created ${game.home_team_name} vs ${game.away_team_name}`)
      setCreateModalOpen(false)
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  const canCreateSchedule =
    canManageSchedule &&
    seasons.length > 0 &&
    divisions.length > 0 &&
    teams.length >= 2 &&
    venues.length > 0

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
          pageTitle="Schedules"
          primaryAction={{
            disabled: !canCreateSchedule,
            label: "New game",
            onClick: () => setCreateModalOpen(true),
          }}
        />

        <main className="flex flex-1 flex-col gap-6 bg-background px-4 py-4 lg:px-6 lg:py-5">
          <section className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      href={`/organizations/${organization.slug}`}
                    >
                      Organizations
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      href={`/organizations/${organization.slug}`}
                    >
                      {organization.name}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Schedules</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <h1 className="text-3xl font-semibold tracking-tight">
                Schedules
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                Manage the official game calendar for {organization.name} across
                all divisions and venues.
              </p>
            </div>
            {canManageSchedule ? (
              <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline">
                <CalendarDays className="size-4" />
                Import schedule
              </Button>
              <Button variant="outline">
                <Globe className="size-4" />
                Publish schedule
              </Button>
              </div>
            ) : null}
          </section>

          <ScheduleSummaryCards schedules={schedules} />

          {canManageSchedule && !canCreateSchedule ? (
            <Card className="border border-dashed border-border/70 bg-card/70 shadow-none">
              <CardHeader>
                <CardTitle>Finish setup before adding games</CardTitle>
                <CardDescription>
                  Schedules need at least one season, division, venue, and two
                  teams in the same division.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          <section className="space-y-6">
            <div className="space-y-6">
              <Card className="border border-border/60 bg-card/95 shadow-none">
                <CardContent className="space-y-4 p-4">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_minmax(160px,180px)_minmax(150px,170px)_minmax(190px,210px)]">
                    <div className="relative md:col-span-2 xl:col-span-1">
                      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        aria-label="Search games"
                        className="h-10 w-full pl-9"
                        placeholder="Search games..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                      />
                    </div>
                    <NativeSelect
                      aria-label="Filter by division"
                      className="h-10 w-full"
                      value={divisionFilter}
                      onChange={(event) =>
                        setDivisionFilter(event.target.value)
                      }
                    >
                      <NativeSelectOption value="all">
                        All divisions
                      </NativeSelectOption>
                      {divisions.map((division) => (
                        <NativeSelectOption
                          key={division.id}
                          value={division.id}
                        >
                          {division.name}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                    <NativeSelect
                      aria-label="Filter by status"
                      className="h-10 w-full"
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value)}
                    >
                      <NativeSelectOption value="all">
                        All status
                      </NativeSelectOption>
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
                      aria-label="Sort schedule"
                      className="h-10 w-full"
                      value={sortBy}
                      onChange={(event) =>
                        setSortBy(
                          event.target.value as NonNullable<
                            ScheduleListQuery["sortBy"]
                          >,
                        )
                      }
                    >
                      <NativeSelectOption value="date">
                        Sort: Date (Earliest)
                      </NativeSelectOption>
                      <NativeSelectOption value="division">
                        Sort: Division
                      </NativeSelectOption>
                      <NativeSelectOption value="venue">
                        Sort: Venue
                      </NativeSelectOption>
                    </NativeSelect>
                  </div>
                  {schedulesQuery.isError ? (
                    <FieldError>
                      {getApiErrorMessage(schedulesQuery.error)}
                    </FieldError>
                  ) : null}
                </CardContent>
              </Card>

              <ScheduleBoard
                canManageSchedule={canManageSchedule}
                games={schedules}
                onAssignScorekeeper={setGameToAssign}
                onDeleteGame={setGameToDelete}
                onEditGame={setGameToEdit}
                onViewFinalSummary={setGameToSummarize}
              />
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
          scorekeepers={scorekeepers}
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

      {gameToAssign ? (
        <AssignScorekeeperModal
          game={gameToAssign}
          organizationId={organization.id}
          scorekeepers={scorekeepers}
          onClose={() => setGameToAssign(null)}
        />
      ) : null}

      {gameToDelete ? (
        <DeleteScheduleModal
          game={gameToDelete}
          organizationId={organization.id}
          onClose={() => setGameToDelete(null)}
        />
      ) : null}

      {gameToSummarize ? (
        <FinalGameSummaryModal
          game={gameToSummarize}
          onClose={() => setGameToSummarize(null)}
        />
      ) : null}
    </SidebarProvider>
  )
}
