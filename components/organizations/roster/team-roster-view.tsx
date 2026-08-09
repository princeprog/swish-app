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
  Send,
  Trash2,
  Users2,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { AppSidebar } from "@/components/app-sidebar"
import { PageEntrance, StaggerReveal } from "@/components/motion/page-motion"
import { DataTablePagination } from "@/components/organizations/shared/data-table-pagination"
import { WorkspaceHeader } from "@/components/organizations/shared/workspace-header"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
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
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
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
import {
  useApproveRosterMutation,
  useReturnRosterMutation,
  useStartAmendmentMutation,
  useSubmitRosterMutation,
} from "@/hooks/use-roster"
import type { Division } from "@/services/division.service"
import type { Organization } from "@/services/organization.service"
import type { PageSizeOption, PaginationMeta } from "@/services/pagination"
import type { Player } from "@/services/player.service"
import type { TeamRosterResponse } from "@/services/roster.service"
import type { Team } from "@/services/team.service"

const playerPositionOptions = [
  { label: "Point Guard", value: "point_guard" },
  { label: "Shooting Guard", value: "shooting_guard" },
  { label: "Small Forward", value: "small_forward" },
  { label: "Power Forward", value: "power_forward" },
  { label: "Center", value: "center" },
  { label: "Guard", value: "guard" },
  { label: "Forward", value: "forward" },
] as const

function formatPlayerPosition(position: string) {
  return (
    playerPositionOptions.find((option) => option.value === position)?.label ??
    "Unspecified"
  )
}

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
    return "border-emerald-600 bg-emerald-600 text-white"
  }

  return "border-zinc-600 bg-zinc-600 text-white"
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
                  Position
                </div>
                <div className="font-medium">{formatPlayerPosition(player.position)}</div>
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
    position: string
    status: "active" | "inactive"
  }) => Promise<void>
  pending: boolean
  player?: Player | null
  team: Team
}) {
  const [name, setName] = React.useState(player?.name ?? "")
  const [jerseyNumber, setJerseyNumber] = React.useState(player?.jersey_number ?? "")
  const [position, setPosition] = React.useState(player?.position ?? "")
  const [status, setStatus] = React.useState<"active" | "inactive">(
    (player?.status as "active" | "inactive") ?? "active",
  )
  const [validationError, setValidationError] = React.useState<string | null>(null)

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

    if (!position) {
      setValidationError("Position is required.")
      return
    }

    setValidationError(null)

    await onSubmit({
      jerseyNumber: jerseyNumber.trim(),
      name: name.trim(),
      position,
      status,
    })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[calc(100vh-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-2xl">
        <DialogHeader className="gap-1.5 border-b border-border/60 px-6 py-5 pr-14">
          <DialogTitle className="text-lg">
            {mode === "create" ? "Add player to roster" : "Edit roster player"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Enter player details" : "Update player details"} for{" "}
            {team.name}. Team assignment stays locked to this roster.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5 px-6 py-5">
            <div className="flex items-center gap-3 rounded-md border border-border/60 bg-muted/30 px-3 py-2.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border/60 bg-background">
                <Shield className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Roster assignment</p>
                <p className="truncate text-sm font-medium">{team.name}</p>
              </div>
            </div>

            <Field>
              <FieldLabel htmlFor="roster-player-name">Player name</FieldLabel>
              <FieldContent>
                <Input
                  id="roster-player-name"
                  placeholder="Marcus Dela Cruz"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
                <FieldDescription>
                  Use the player&apos;s official roster name.
                </FieldDescription>
              </FieldContent>
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="roster-player-jersey">Jersey number</FieldLabel>
                <FieldContent>
                  <Input
                    id="roster-player-jersey"
                    inputMode="numeric"
                    placeholder="7"
                    required
                    value={jerseyNumber}
                    onChange={(event) => setJerseyNumber(event.target.value)}
                  />
                  <FieldDescription>
                    Must be unique within this team.
                  </FieldDescription>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="roster-player-position">Primary position</FieldLabel>
                <FieldContent>
                  <NativeSelect
                    className="w-full"
                    id="roster-player-position"
                    required
                    value={position}
                    onChange={(event) => setPosition(event.target.value)}
                  >
                    <NativeSelectOption value="">Select a position</NativeSelectOption>
                    {playerPositionOptions.map((option) => (
                      <NativeSelectOption key={option.value} value={option.value}>
                        {option.label}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                  <FieldDescription>
                    Used in roster and lineup views.
                  </FieldDescription>
                </FieldContent>
              </Field>
            </div>

            <Field>
              <FieldLabel>Status</FieldLabel>
              <FieldContent>
                <div
                  aria-label="Player status"
                  className="grid grid-cols-2 gap-2"
                  role="group"
                >
                  {([
                    ["active", "Active"],
                    ["inactive", "Inactive"],
                  ] as const).map(([value, label]) => {
                    const selected = status === value

                    return (
                      <button
                        key={value}
                        aria-pressed={selected}
                        className={cn(
                          "flex h-10 items-center gap-2 rounded-md border px-3 text-sm transition-colors",
                          selected
                            ? "border-primary/40 bg-primary/10 text-foreground"
                            : "border-border/70 bg-background/60 text-muted-foreground hover:bg-muted/40",
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

          <DialogFooter className="border-t border-border/60 px-6 py-4">
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function rosterStatusTone(status: string) {
  if (status === "approved") return "border-emerald-600 bg-emerald-600 text-white"
  if (status === "submitted") return "border-amber-600 bg-amber-600 text-white"
  if (status === "returned") return "border-red-600 bg-red-600 text-white"
  return "border-zinc-600 bg-zinc-600 text-white"
}

function formatRosterStatus(status: string) {
  if (status === "submitted") return "Submitted"
  if (status === "approved") return "Approved"
  if (status === "returned") return "Returned"
  return "Draft"
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
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon

        return (
          <Card
            key={card.title}
            size="sm"
            className="rounded-lg border border-border/60 bg-card/90 py-3 shadow-none"
          >
            <CardHeader className="px-4 pb-2">
              <div className="flex items-center gap-3">
                <div className="flex size-7 items-center justify-center rounded-md border border-border/70 bg-background/70">
                  <Icon className="size-3.5 text-muted-foreground" />
                </div>
                <CardDescription className="text-xs font-medium text-foreground/85">
                  {card.title}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-1 px-4 pt-0">
              <div className="text-2xl font-semibold tracking-tight">{card.value}</div>
              <p className="text-xs leading-5 text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </section>
  )
}

function TeamRosterTable({
  canEditPlayers,
  onPageChange,
  onPageSizeChange,
  onDeletePlayer,
  onEditPlayer,
  onViewPlayer,
  pagination,
  players,
}: {
  canEditPlayers: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: PageSizeOption) => void
  onDeletePlayer: (player: Player) => void
  onEditPlayer: (player: Player) => void
  onViewPlayer: (player: Player) => void
  pagination: PaginationMeta
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
    <Card className="border border-border/60 bg-card/95 py-0 shadow-none">
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="border-border/60 hover:bg-transparent">
              <TableHead className="w-12 px-4">
                <Checkbox aria-label="Select all roster players" />
              </TableHead>
              <TableHead className="h-12 text-muted-foreground">Player</TableHead>
              <TableHead className="text-muted-foreground">Jersey no.</TableHead>
              <TableHead className="text-muted-foreground">Position</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Updated</TableHead>
              <TableHead className="w-14 text-right"> </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.map((player) => (
              <TableRow
                key={player.id}
                className="h-18 cursor-pointer border-border/60 transition-colors hover:bg-muted/30"
                onClick={() => onViewPlayer(player)}
              >
                <TableCell className="px-4">
                  <Checkbox
                    aria-label={`Select ${player.name}`}
                    onClick={(event) => event.stopPropagation()}
                  />
                </TableCell>
                <TableCell className="whitespace-normal">
                  <div className="flex items-center gap-3">
                    <Avatar size="lg">
                      <AvatarFallback className="text-[11px] font-semibold">
                        {getInitials(player.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-1">
                      <div className="font-medium">{player.name}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    #{player.jersey_number}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {formatPlayerPosition(player.position)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={statusTone(player.status)} variant="outline">
                    {player.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
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
                    {canEditPlayers ? (
                      <RosterPlayerActionsPopover
                        onDelete={() => onDeletePlayer(player)}
                        onEdit={() => onEditPlayer(player)}
                        onView={() => onViewPlayer(player)}
                        player={player}
                      />
                    ) : (
                      <Button
                        aria-label={`View ${player.name}`}
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => onViewPlayer(player)}
                      >
                        <Eye className="size-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <DataTablePagination
          pagination={pagination}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </CardContent>
    </Card>
  )
}

export function TeamRosterView({
  divisions,
  onPageChange,
  onPageSizeChange,
  organization,
  pagination,
  players,
  roster,
  team,
}: {
  divisions: Division[]
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: PageSizeOption) => void
  organization: Organization
  pagination: PaginationMeta
  players: Player[]
  roster?: TeamRosterResponse
  team: Team
}) {
  const createPlayerMutation = useCreatePlayerMutation(organization.id)
  const updatePlayerMutation = useUpdatePlayerMutation(organization.id)
  const deletePlayerMutation = useDeletePlayerMutation(organization.id)
  const submitRosterMutation = useSubmitRosterMutation(organization.id, team.id)
  const approveRosterMutation = useApproveRosterMutation(organization.id, team.id)
  const returnRosterMutation = useReturnRosterMutation(organization.id, team.id)
  const startAmendmentMutation = useStartAmendmentMutation(organization.id, team.id)
  const [createModalOpen, setCreateModalOpen] = React.useState(false)
  const [playerToDelete, setPlayerToDelete] = React.useState<Player | null>(null)
  const [playerToEdit, setPlayerToEdit] = React.useState<Player | null>(null)
  const [playerToView, setPlayerToView] = React.useState<Player | null>(null)
  const [playerDetailsOpen, setPlayerDetailsOpen] = React.useState(false)
  const [mountedPlayerDetails, setMountedPlayerDetails] = React.useState<Player | null>(null)
  const [returnReason, setReturnReason] = React.useState("")
  const [amendmentReason, setAmendmentReason] = React.useState("")

  const division = divisions.find((item) => item.id === team.division_id)
  const rosterPlayers = players
  const rosterDetails = roster?.visibility === "hidden" ? null : roster?.roster
  const rosterStatus = rosterDetails?.status ?? "draft"
  const canEditPlayers = roster?.visibility !== "published" && (rosterStatus === "draft" || rosterStatus === "returned")
  const isSubmitted = rosterStatus === "submitted"
  const isApproved = rosterStatus === "approved"

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
    position: string
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

  async function handleSubmitRoster() {
    try {
      await submitRosterMutation.mutateAsync()
      toast.success("Roster submitted for review")
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  async function handleApproveRoster() {
    try {
      await approveRosterMutation.mutateAsync()
      toast.success("Roster approved")
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  async function handleReturnRoster() {
    if (!returnReason.trim()) {
      toast.error("Add a correction note before returning this roster.")
      return
    }

    try {
      await returnRosterMutation.mutateAsync(returnReason.trim())
      toast.success("Roster returned for corrections")
      setReturnReason("")
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  async function handleStartAmendment() {
    if (!amendmentReason.trim()) {
      toast.error("Add a reason before starting an amendment.")
      return
    }

    try {
      await startAmendmentMutation.mutateAsync(amendmentReason.trim())
      toast.success("Roster amendment started")
      setAmendmentReason("")
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  async function handleUpdatePlayer(payload: {
    jerseyNumber: string
    name: string
    position: string
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
          pageTitle={`${team.name} roster`}
          primaryAction={{
            disabled: !canEditPlayers,
            label: "New player",
            onClick: () => setCreateModalOpen(true),
          }}
        />

        <PageEntrance asChild>
          <main className="flex flex-1 flex-col gap-6 bg-background px-4 py-4 lg:px-6 lg:py-5">
            <StaggerReveal className="contents">
              <section className="space-y-4">
            <Button asChild variant="ghost" className="w-fit">
              <Link href={`/organizations/${organization.slug}/teams`}>
                <ArrowLeft className="size-4" />
                Back to teams
              </Link>
            </Button>

            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight">{team.name} roster</h1>
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <span className="rounded-full border border-border/70 px-3 py-1">
                    {division?.name ?? "Unknown division"}
                  </span>
                  {rosterDetails ? (
                    <Badge className={rosterStatusTone(rosterStatus)} variant="outline">
                      {formatRosterStatus(rosterStatus)}
                    </Badge>
                  ) : null}
                  {rosterDetails?.publishedVersionId ? (
                    <Badge className="border-sky-600 bg-sky-600 text-white" variant="outline">
                      Published
                    </Badge>
                  ) : null}
                </div>
              </div>

              {rosterDetails ? (
                <div className="flex flex-wrap justify-end gap-2">
                  {canEditPlayers ? (
                    <Button
                      disabled={submitRosterMutation.isPending}
                      onClick={() => void handleSubmitRoster()}
                    >
                      {submitRosterMutation.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Send className="size-4" />
                      )}
                      Submit roster
                    </Button>
                  ) : null}
                  {isSubmitted ? (
                    <>
                      <Button
                        disabled={approveRosterMutation.isPending}
                        onClick={() => void handleApproveRoster()}
                      >
                        {approveRosterMutation.isPending ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="size-4" />
                        )}
                        Approve
                      </Button>
                    </>
                  ) : null}
                  {isApproved && rosterDetails.publishedVersionId ? (
                    <Button variant="outline" onClick={() => setAmendmentReason("Roster update")}>
                      <PencilLine className="size-4" />
                      Start amendment
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </section>

          {roster?.visibility === "hidden" ? (
            <Empty className="border bg-card">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Shield className="size-5" />
                </EmptyMedia>
                <EmptyTitle>Roster locked until release</EmptyTitle>
                <EmptyDescription>{roster.message}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : null}

          {rosterDetails && !canEditPlayers ? (
            <Card className="border border-border/60 bg-card/95 shadow-none">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <div className="font-medium">
                    {isSubmitted
                      ? "Waiting for admin review"
                      : roster?.visibility === "published"
                        ? "Published roster"
                        : "Roster is locked"}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isSubmitted
                      ? "Player changes are paused while this roster is under review."
                      : "Published player details stay visible while any amendment is reviewed."}
                  </p>
                </div>
                {isSubmitted ? (
                  <div className="flex min-w-72 flex-1 gap-2 sm:flex-none">
                    <Input
                      aria-label="Correction reason"
                      placeholder="Correction note"
                      value={returnReason}
                      onChange={(event) => setReturnReason(event.target.value)}
                    />
                    <Button
                      disabled={returnRosterMutation.isPending}
                      variant="outline"
                      onClick={() => void handleReturnRoster()}
                    >
                      Return
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {amendmentReason ? (
            <Card className="border border-border/60 bg-card/95 shadow-none">
              <CardContent className="flex flex-wrap items-center gap-2 p-4">
                <Input
                  aria-label="Amendment reason"
                  className="min-w-72 flex-1"
                  value={amendmentReason}
                  onChange={(event) => setAmendmentReason(event.target.value)}
                />
                <Button
                  disabled={startAmendmentMutation.isPending}
                  onClick={() => void handleStartAmendment()}
                >
                  Start amendment
                </Button>
                <Button variant="ghost" onClick={() => setAmendmentReason("")}>
                  Cancel
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {roster?.visibility !== "hidden" ? (
            <TeamRosterSummaryCards
              activePlayers={activePlayers}
              inactivePlayers={inactivePlayers}
              recentlyUpdatedPlayers={recentlyUpdatedPlayers}
              totalPlayers={rosterPlayers.length}
            />
          ) : null}

          {roster?.visibility !== "hidden" ? (
            <section className="space-y-6">
            <TeamRosterTable
              canEditPlayers={canEditPlayers}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
              onDeletePlayer={setPlayerToDelete}
              onEditPlayer={setPlayerToEdit}
              onViewPlayer={(player) => {
                setPlayerToView(player)
                setMountedPlayerDetails(player)
                setPlayerDetailsOpen(true)
              }}
              pagination={pagination}
              players={rosterPlayers}
            />
              </section>
            ) : null}
            </StaggerReveal>
          </main>
        </PageEntrance>
      </SidebarInset>

      {createModalOpen && canEditPlayers ? (
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

      {playerToEdit && canEditPlayers ? (
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

      {playerToDelete && canEditPlayers ? (
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
