"use client"

import * as React from "react"
import Link from "next/link"
import { createPortal } from "react-dom"
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  Eye,
  Loader2,
  MoreHorizontal,
  PencilLine,
  Plus,
  Shield,
  Trash2,
  Users2,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { AppSidebar } from "@/components/app-sidebar"
import { WorkspaceHeader } from "@/components/organizations/shared/workspace-header"
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
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { getApiErrorMessage } from "@/hooks/use-auth"
import {
  useCreatePlayerMutation,
  useDeletePlayerMutation,
  useUpdatePlayerMutation,
} from "@/hooks/use-player"
import type { Division } from "@/services/division.service"
import type { Organization } from "@/services/organization.service"
import type { Player } from "@/services/player.service"
import type { Team } from "@/services/team.service"

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

function statusTone(status: string) {
  if (status === "active") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
  }

  return "border-zinc-500/20 bg-zinc-500/10 text-zinc-300"
}

function RosterPlayerActionsPopover({
  onDelete,
  onEdit,
  onView,
  player,
}: {
  onDelete: () => void
  onEdit: () => void
  onView: () => void
  player: Player
}) {
  const [open, setOpen] = React.useState(false)
  const buttonRef = React.useRef<HTMLButtonElement | null>(null)
  const [menuPosition, setMenuPosition] = React.useState<{
    left: number
    top: number
  } | null>(null)

  React.useEffect(() => {
    if (!open) {
      setMenuPosition(null)
      return
    }

    function updatePosition() {
      const rect = buttonRef.current?.getBoundingClientRect()
      if (!rect) return
      setMenuPosition({ left: rect.right - 176, top: rect.bottom + 8 })
    }

    updatePosition()

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement | null
      if (!target?.closest(`[data-roster-player-actions="${player.id}"]`)) {
        setOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
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
  }, [open, player.id])

  return (
    <div
      className="relative inline-flex justify-end"
      data-roster-player-actions={player.id}
    >
      <Button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Open actions for ${player.name}`}
        ref={buttonRef}
        size="icon-sm"
        variant="ghost"
        onClick={() => setOpen((current) => !current)}
      >
        <MoreHorizontal className="size-4" />
      </Button>

      {open && menuPosition
        ? createPortal(
            <div
              className="fixed z-50 min-w-44 rounded-xl border border-border/70 bg-popover p-1.5 shadow-xl"
              role="menu"
              style={{ left: Math.max(menuPosition.left, 12), top: menuPosition.top }}
            >
              <div data-roster-player-actions={player.id}>
                <Button
                  className="w-full justify-start"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setOpen(false)
                    onView()
                  }}
                >
                  <Eye className="size-4" />
                  View details
                </Button>
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
                  Edit player
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
                  Remove player
                </Button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

function PlayerDetailsSheet({
  mounted,
  onOpenChange,
  open,
  player,
  team,
}: {
  mounted: boolean
  onOpenChange: (open: boolean) => void
  open: boolean
  player: Player | null
  team: Team
}) {
  if (!mounted || !player) {
    return null
  }

  const createdAt = new Date(player.created_at)
  const updatedAt = new Date(player.updated_at)

  return (
    <>
      <div
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-40 bg-black/10 backdrop-blur-xs transition-all duration-300 ease-out",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => onOpenChange(false)}
      />
      <aside
        aria-label={`${player.name} details`}
        aria-modal="true"
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-border/70 bg-background/95 shadow-xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
          open
            ? "translate-x-0 opacity-100"
            : "translate-x-[104%] opacity-0",
        )}
        role="dialog"
      >
        <div
          className={cn(
            "flex items-start gap-3 border-b border-border/60 px-6 py-5 transition-all duration-300 ease-out",
            open ? "translate-y-0 opacity-100 delay-75" : "translate-y-2 opacity-0",
          )}
        >
          <div className="flex items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/70 text-sm font-semibold text-foreground">
              {getInitials(player.name)}
            </div>
            <div className="min-w-0 space-y-1">
              <div className="text-xl font-semibold">{player.name}</div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="rounded-full border border-border/70 px-2 py-1 text-xs">
                  #{player.jersey_number}
                </span>
                <span
                  className={`rounded-full border px-2 py-1 text-xs font-medium ${statusTone(player.status)}`}
                >
                  {player.status}
                </span>
              </div>
            </div>
          </div>
          <Button
            aria-label="Close player details"
            className="ml-auto"
            size="icon-sm"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-4" />
          </Button>
        </div>

        <div
          className={cn(
            "flex-1 space-y-6 overflow-y-auto px-6 py-6 transition-all duration-300 ease-out",
            open ? "translate-y-0 opacity-100 delay-100" : "translate-y-3 opacity-0",
          )}
        >
          <Card className="border border-border/60 bg-card/95 shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Roster assignment</CardTitle>
              <CardDescription>Current team context for this player.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  Team
                </div>
                <div className="font-medium">{team.name}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  Team status
                </div>
                <div className="font-medium">{team.status}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-card/95 shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Player record</CardTitle>
              <CardDescription>Current stored details for this roster member.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  Full name
                </div>
                <div className="font-medium">{player.name}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  Jersey number
                </div>
                <div className="font-medium">#{player.jersey_number}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  Status
                </div>
                <div className="font-medium">{player.status}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  Player ID
                </div>
                <div className="font-mono text-sm text-muted-foreground">{player.id}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-card/95 shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Activity</CardTitle>
              <CardDescription>Audit-friendly timestamps for this player record.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  Created
                </div>
                <div className="font-medium">{createdAt.toLocaleDateString()}</div>
                <div className="text-sm text-muted-foreground">
                  {createdAt.toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  Last updated
                </div>
                <div className="font-medium">{updatedAt.toLocaleDateString()}</div>
                <div className="text-sm text-muted-foreground">
                  {updatedAt.toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </aside>
    </>
  )
}

function RosterPlayerFormModal({
  errorMessage,
  mode,
  onClose,
  onSubmit,
  pending,
  player,
  team,
}: {
  errorMessage?: string | null
  mode: "create" | "edit"
  onClose: () => void
  onSubmit: (payload: {
    jerseyNumber: string
    name: string
    status: "active" | "inactive"
  }) => Promise<void>
  pending: boolean
  player?: Player | null
  team: Team
}) {
  const [name, setName] = React.useState(player?.name ?? "")
  const [jerseyNumber, setJerseyNumber] = React.useState(player?.jersey_number ?? "")
  const [status, setStatus] = React.useState<"active" | "inactive">(
    (player?.status as "active" | "inactive") ?? "active",
  )
  const [validationError, setValidationError] = React.useState<string | null>(null)
  const previewName = name.trim() || "Player name"
  const previewInitials = getInitials(previewName)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!name.trim()) {
      setValidationError("Player name is required.")
      return
    }

    if (!jerseyNumber.trim()) {
      setValidationError("Jersey number is required.")
      return
    }

    setValidationError(null)

    await onSubmit({
      jerseyNumber: jerseyNumber.trim(),
      name: name.trim(),
      status,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 py-8 backdrop-blur-sm">
      <Card className="w-full max-w-5xl border border-border/70 bg-card shadow-2xl">
        <CardHeader className="gap-4 border-b border-border/60 pb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-xl">
                {mode === "create" ? "Add player to roster" : "Edit roster player"}
              </CardTitle>
              <CardDescription>
                This player will stay scoped to {team.name}. Team reassignment is managed from the Players page.
              </CardDescription>
            </div>
            <Button
              aria-label={`Close ${mode} roster player modal`}
              size="icon-sm"
              variant="ghost"
              onClick={onClose}
            >
              <X className="size-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <form onSubmit={handleSubmit}>
            <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-5 p-6">
                <Field>
                  <FieldLabel htmlFor="roster-player-team">Team</FieldLabel>
                  <FieldContent>
                    <Input id="roster-player-team" value={team.name} readOnly disabled />
                    <FieldDescription>
                      Team assignment is locked in this workflow.
                    </FieldDescription>
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel htmlFor="roster-player-name">Player name</FieldLabel>
                  <FieldContent>
                    <Input
                      id="roster-player-name"
                      placeholder="Marcus Dela Cruz"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                    />
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel htmlFor="roster-player-jersey">Jersey number</FieldLabel>
                  <FieldContent>
                    <Input
                      id="roster-player-jersey"
                      placeholder="7"
                      value={jerseyNumber}
                      onChange={(event) => setJerseyNumber(event.target.value)}
                    />
                    <FieldDescription>
                      Jersey numbers should stay unique within this team.
                    </FieldDescription>
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel>Status</FieldLabel>
                  <FieldContent>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        ["active", "Active"],
                        ["inactive", "Inactive"],
                      ] as const).map(([value, label]) => {
                        const selected = status === value

                        return (
                          <button
                            key={value}
                            className={cn(
                              "flex h-11 items-center gap-2 rounded-md border px-3 text-sm transition-colors",
                              selected
                                ? "border-primary/40 bg-primary/10 text-foreground"
                                : "border-border/70 bg-background/60 text-muted-foreground hover:bg-background",
                            )}
                            type="button"
                            onClick={() => setStatus(value)}
                          >
                            <span
                              className={cn(
                                "size-2.5 rounded-full",
                                value === "active" ? "bg-emerald-400" : "bg-zinc-400",
                              )}
                            />
                            <span>{label}</span>
                            {selected ? <Check className="ml-auto size-4" /> : null}
                          </button>
                        )
                      })}
                    </div>
                  </FieldContent>
                </Field>

                {validationError || errorMessage ? (
                  <FieldError>{validationError ?? errorMessage}</FieldError>
                ) : null}
              </div>

              <div className="border-t border-border/60 p-6 lg:border-t-0 lg:border-l">
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Roster preview</h3>
                  <p className="text-sm text-muted-foreground">
                    This is how the player record will appear inside {team.name}.
                  </p>
                </div>

                <div className="mt-5 rounded-xl border border-border/70 bg-background/60 p-6">
                  <div className="rounded-xl border border-border/60 bg-gradient-to-b from-background to-card px-6 py-8 text-center">
                    <div className="mx-auto flex size-24 items-center justify-center rounded-full border border-border/70 bg-background/70 text-xl font-semibold">
                      {previewInitials}
                    </div>
                    <div className="mt-6 space-y-3">
                      <div className="text-3xl font-semibold tracking-tight">
                        {previewName}
                      </div>
                      <div className="mx-auto inline-flex items-center gap-2 rounded-md border border-border/70 bg-background/70 px-3 py-2 text-sm text-muted-foreground">
                        <Shield className="size-4" />
                        <span>{team.name}</span>
                      </div>
                      <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="rounded-full border border-border/70 px-2 py-1">
                          #{jerseyNumber.trim() || "--"}
                        </span>
                        <span>{status}</span>
                      </div>
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
                    {mode === "create" ? "Adding" : "Saving"}
                  </>
                ) : (
                  <>
                    {mode === "create" ? (
                      <Plus className="size-4" />
                    ) : (
                      <PencilLine className="size-4" />
                    )}
                    {mode === "create" ? "Add player" : "Save changes"}
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

function DeleteRosterPlayerModal({
  errorMessage,
  onClose,
  onDelete,
  pending,
  player,
  teamName,
}: {
  errorMessage?: string | null
  onClose: () => void
  onDelete: () => Promise<void>
  pending: boolean
  player: Player
  teamName: string
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 py-8 backdrop-blur-sm">
      <Card className="w-full max-w-lg border border-border/70 bg-card shadow-2xl">
        <CardHeader>
          <CardTitle>Remove player from roster</CardTitle>
          <CardDescription>
            You are about to delete <span className="font-medium">{player.name}</span> from {teamName}.
            This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() => void onDelete()}
            >
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Removing
                </>
              ) : (
                <>
                  <Trash2 className="size-4" />
                  Remove player
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function TeamRosterSummaryCards({
  activePlayers,
  inactivePlayers,
  recentlyUpdatedPlayers,
  totalPlayers,
}: {
  activePlayers: number
  inactivePlayers: number
  recentlyUpdatedPlayers: number
  totalPlayers: number
}) {
  const cards = [
    {
      description: "All players assigned to this team",
      icon: Users2,
      title: "Roster size",
      value: totalPlayers,
    },
    {
      description: "Eligible active players",
      icon: CheckCircle2,
      title: "Active players",
      value: activePlayers,
    },
    {
      description: "Inactive or unavailable",
      icon: Shield,
      title: "Inactive players",
      value: inactivePlayers,
    },
    {
      description: "Updated in the last 7 days",
      icon: Clock3,
      title: "Recently updated",
      value: recentlyUpdatedPlayers,
    },
  ]

  return (
    <section className="grid gap-4 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon

        return (
          <Card key={card.title} className="border border-border/60 bg-card/95 shadow-none">
            <CardHeader className="gap-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg border border-border/70 bg-background/70">
                  <Icon className="size-4 text-muted-foreground" />
                </div>
                <CardDescription className="text-sm text-foreground/85">
                  {card.title}
                </CardDescription>
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

function TeamRosterTable({
  onDeletePlayer,
  onEditPlayer,
  onViewPlayer,
  players,
}: {
  onDeletePlayer: (player: Player) => void
  onEditPlayer: (player: Player) => void
  onViewPlayer: (player: Player) => void
  players: Player[]
}) {
  if (players.length === 0) {
    return (
      <Empty className="border bg-card">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Users2 className="size-5" />
          </EmptyMedia>
          <EmptyTitle>No players on this roster yet</EmptyTitle>
          <EmptyDescription>
            Add the first player to start building this team&apos;s official roster.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <Card className="border border-border/60 bg-card/95 shadow-none">
      <CardHeader>
        <CardTitle>Roster</CardTitle>
        <CardAction>
          <div className="text-sm text-muted-foreground">{players.length} total</div>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-border/60 hover:bg-transparent">
              <TableHead>Player</TableHead>
              <TableHead>Jersey no.</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-14 text-right"> </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.map((player) => (
              <TableRow
                key={player.id}
                className="cursor-pointer border-border/50 transition-colors hover:bg-background/40"
                onClick={() => onViewPlayer(player)}
              >
                <TableCell className="whitespace-normal">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/60 text-[11px] font-semibold text-foreground">
                      {getInitials(player.name)}
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium">{player.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {player.id.slice(0, 8).toUpperCase()}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="inline-flex rounded-full border border-border/70 px-2 py-1 text-xs font-medium">
                    #{player.jersey_number}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={`rounded-full border px-2 py-1 text-xs font-medium ${statusTone(player.status)}`}
                  >
                    {player.status}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div>{new Date(player.updated_at).toLocaleDateString()}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(player.updated_at).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div onClick={(event) => event.stopPropagation()}>
                    <RosterPlayerActionsPopover
                      onDelete={() => onDeletePlayer(player)}
                      onEdit={() => onEditPlayer(player)}
                      onView={() => onViewPlayer(player)}
                      player={player}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function TeamRosterNotesCard({ teamName }: { teamName: string }) {
  const notes = [
    "Use this page for players already assigned to this team.",
    "Jersey numbers should stay unique within this roster.",
    "Use active status only for eligible competition players.",
    "Move players between teams from the organization-wide Players page, not here.",
  ]

  return (
    <Card className="border border-border/60 bg-card/95 shadow-none">
      <CardHeader>
        <CardTitle className="text-base">Roster notes</CardTitle>
        <CardDescription>Keep {teamName} ready for schedules and standings.</CardDescription>
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

export function TeamRosterView({
  divisions,
  organization,
  players,
  team,
}: {
  divisions: Division[]
  organization: Organization
  players: Player[]
  team: Team
}) {
  const createPlayerMutation = useCreatePlayerMutation(organization.id)
  const updatePlayerMutation = useUpdatePlayerMutation(organization.id)
  const deletePlayerMutation = useDeletePlayerMutation(organization.id)
  const [createModalOpen, setCreateModalOpen] = React.useState(false)
  const [playerToDelete, setPlayerToDelete] = React.useState<Player | null>(null)
  const [playerToEdit, setPlayerToEdit] = React.useState<Player | null>(null)
  const [playerToView, setPlayerToView] = React.useState<Player | null>(null)
  const [playerDetailsOpen, setPlayerDetailsOpen] = React.useState(false)
  const [mountedPlayerDetails, setMountedPlayerDetails] = React.useState<Player | null>(null)

  const division = divisions.find((item) => item.id === team.division_id)
  const rosterPlayers = React.useMemo(
    () =>
      [...players]
        .filter((player) => player.team_id === team.id)
        .sort(
          (left, right) =>
            new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime(),
        ),
    [players, team.id],
  )

  const activePlayers = rosterPlayers.filter((player) => player.status === "active").length
  const inactivePlayers = rosterPlayers.length - activePlayers
  const recentThreshold = Date.now() - 7 * 24 * 60 * 60 * 1000
  const recentlyUpdatedPlayers = rosterPlayers.filter(
    (player) => new Date(player.updated_at).getTime() >= recentThreshold,
  ).length

  React.useEffect(() => {
    if (playerToView) {
      setMountedPlayerDetails(playerToView)
      setPlayerDetailsOpen(true)
      return
    }

    if (!playerDetailsOpen) {
      const timeoutId = window.setTimeout(() => {
        setMountedPlayerDetails(null)
      }, 320)

      return () => window.clearTimeout(timeoutId)
    }
  }, [playerDetailsOpen, playerToView])

  async function handleCreatePlayer(payload: {
    jerseyNumber: string
    name: string
    status: "active" | "inactive"
  }) {
    try {
      const player = await createPlayerMutation.mutateAsync({
        ...payload,
        teamId: team.id,
      })
      toast.success(`Added ${player.name} to ${team.name}`)
      setCreateModalOpen(false)
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  async function handleUpdatePlayer(payload: {
    jerseyNumber: string
    name: string
    status: "active" | "inactive"
  }) {
    if (!playerToEdit) return

    try {
      const player = await updatePlayerMutation.mutateAsync({
        payload,
        playerId: playerToEdit.id,
      })
      toast.success(`Updated ${player.name}`)
      setPlayerToEdit(null)
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  async function handleDeletePlayer() {
    if (!playerToDelete) return

    try {
      await deletePlayerMutation.mutateAsync(playerToDelete.id)
      toast.success(`Removed ${playerToDelete.name}`)
      setPlayerToDelete(null)
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

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
          pageTitle={`${team.name} roster`}
          primaryAction={{
            label: "New player",
            onClick: () => setCreateModalOpen(true),
          }}
        />

        <main className="flex flex-1 flex-col gap-6 bg-background px-4 py-4 lg:px-6 lg:py-5">
          <section className="space-y-4">
            <Button asChild variant="ghost" className="w-fit">
              <Link href={`/organizations/${organization.slug}/teams`}>
                <ArrowLeft className="size-4" />
                Back to teams
              </Link>
            </Button>

            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">People setup</p>
                <h1 className="text-3xl font-semibold tracking-tight">{team.name} roster</h1>
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                  Manage the official roster for {team.name}. Players created here stay assigned to this
                  team, while cross-team transfers continue to live on the main Players page.
                </p>
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <span className="rounded-full border border-border/70 px-3 py-1">
                    {division?.name ?? "Unknown division"}
                  </span>
                  <span className="rounded-full border border-border/70 px-3 py-1">
                    {team.status}
                  </span>
                </div>
              </div>

              <Button onClick={() => setCreateModalOpen(true)}>
                <Plus className="size-4" />
                New player
              </Button>
            </div>
          </section>

          <TeamRosterSummaryCards
            activePlayers={activePlayers}
            inactivePlayers={inactivePlayers}
            recentlyUpdatedPlayers={recentlyUpdatedPlayers}
            totalPlayers={rosterPlayers.length}
          />

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_320px]">
            <div className="space-y-6">
              <TeamRosterTable
                onDeletePlayer={setPlayerToDelete}
                onEditPlayer={setPlayerToEdit}
                onViewPlayer={(player) => {
                  setPlayerToView(player)
                  setMountedPlayerDetails(player)
                  setPlayerDetailsOpen(true)
                }}
                players={rosterPlayers}
              />
            </div>

            <div className="space-y-6">
              <Card className="border border-border/60 bg-card/95 shadow-none">
                <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
                  <div className="space-y-1">
                    <CardTitle className="text-base">Roster operations</CardTitle>
                    <CardDescription>
                      Add, update, and maintain the official roster for this team.
                    </CardDescription>
                  </div>
                  <Button onClick={() => setCreateModalOpen(true)}>
                    <Plus className="size-4" />
                    New player
                  </Button>
                </CardHeader>
              </Card>

              <TeamRosterNotesCard teamName={team.name} />
            </div>
          </section>
        </main>
      </SidebarInset>

      {createModalOpen ? (
        <RosterPlayerFormModal
          errorMessage={
            createPlayerMutation.isError
              ? getApiErrorMessage(createPlayerMutation.error)
              : null
          }
          mode="create"
          pending={createPlayerMutation.isPending}
          team={team}
          onClose={() => setCreateModalOpen(false)}
          onSubmit={handleCreatePlayer}
        />
      ) : null}

      {playerToEdit ? (
        <RosterPlayerFormModal
          errorMessage={
            updatePlayerMutation.isError
              ? getApiErrorMessage(updatePlayerMutation.error)
              : null
          }
          mode="edit"
          pending={updatePlayerMutation.isPending}
          player={playerToEdit}
          team={team}
          onClose={() => setPlayerToEdit(null)}
          onSubmit={handleUpdatePlayer}
        />
      ) : null}

      {playerToDelete ? (
        <DeleteRosterPlayerModal
          errorMessage={
            deletePlayerMutation.isError
              ? getApiErrorMessage(deletePlayerMutation.error)
              : null
          }
          pending={deletePlayerMutation.isPending}
          player={playerToDelete}
          teamName={team.name}
          onClose={() => setPlayerToDelete(null)}
          onDelete={handleDeletePlayer}
        />
      ) : null}

      <PlayerDetailsSheet
        mounted={Boolean(mountedPlayerDetails)}
        open={playerDetailsOpen}
        player={mountedPlayerDetails}
        team={team}
        onOpenChange={(open) => {
          setPlayerDetailsOpen(open)
          if (!open) {
            setPlayerToView(null)
          }
        }}
      />
    </SidebarProvider>
  )
}
