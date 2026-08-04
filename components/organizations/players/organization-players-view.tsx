"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  CheckCircle2,
  Clock3,
  Loader2,
  MoreHorizontal,
  PencilLine,
  Plus,
  Search,
  Shield,
  Trash2,
  Users2,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { AppSidebar } from "@/components/app-sidebar"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import type { PageSizeOption, PaginationMeta } from "@/services/pagination"
import type { Player, PlayerSortBy } from "@/services/player.service"
import type { Team } from "@/services/team.service"

type PlayerTableFilters = {
  divisionFilter: string
  search: string
  sortBy: PlayerSortBy
  sortDirection: "asc" | "desc"
  statusFilter: "active" | "all" | "inactive"
  teamFilter: string
}

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

function statusTone(status: string) {
  if (status === "active") {
    return "border-emerald-600 bg-emerald-600 text-white"
  }

  return "border-zinc-600 bg-zinc-600 text-white"
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

function PlayerActionsPopover({
  onDelete,
  onEdit,
  player,
}: {
  onDelete: () => void
  onEdit: () => void
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
      if (!target?.closest(`[data-player-actions="${player.id}"]`)) {
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
    <div className="relative inline-flex justify-end" data-player-actions={player.id}>
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
              <div data-player-actions={player.id}>
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
                  Delete player
                </Button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

function PlayerFormModal({
  errorMessage,
  mode,
  onClose,
  onSubmit,
  pending,
  player,
  teams,
}: {
  errorMessage?: string | null
  mode: "create" | "edit"
  onClose: () => void
  onSubmit: (payload: {
    jerseyNumber: string
    name: string
    position: string
    status: "active" | "inactive"
    teamId: string
  }) => Promise<void>
  pending: boolean
  player?: Player | null
  teams: Team[]
}) {
  const [name, setName] = React.useState(player?.name ?? "")
  const [teamId, setTeamId] = React.useState(player?.team_id ?? teams[0]?.id ?? "")
  const [jerseyNumber, setJerseyNumber] = React.useState(player?.jersey_number ?? "")
  const [position, setPosition] = React.useState(player?.position ?? "")
  const [status, setStatus] = React.useState<"active" | "inactive">(
    (player?.status as "active" | "inactive") ?? "active",
  )
  const [validationError, setValidationError] = React.useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!teamId) {
      setValidationError("Team is required.")
      return
    }
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
      teamId,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 py-8 backdrop-blur-sm">
      <Card className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto border border-border/70 bg-card shadow-2xl">
        <CardHeader className="gap-4 border-b border-border/60 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-lg">
                {mode === "create" ? "Create player" : "Edit player"}
              </CardTitle>
              <CardDescription>
                Manage player records, jersey numbers, and roster status inside
                the organization.
              </CardDescription>
            </div>
            <Button
              aria-label={`Close ${mode} player modal`}
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
            <div className="space-y-5 p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="player-team">Team</FieldLabel>
                  <FieldContent>
                    <NativeSelect
                      className="h-10 w-full"
                      id="player-team"
                      value={teamId}
                      onChange={(event) => setTeamId(event.target.value)}
                    >
                      <NativeSelectOption value="">Select a team</NativeSelectOption>
                      {teams.map((team) => (
                        <NativeSelectOption key={team.id} value={team.id}>
                          {team.name}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel htmlFor="player-name">Player name</FieldLabel>
                  <FieldContent>
                    <Input
                      className="h-10"
                      id="player-name"
                      placeholder="Marcus Dela Cruz"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                    />
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel htmlFor="player-jersey">Jersey number</FieldLabel>
                  <FieldContent>
                    <Input
                      className="h-10"
                      id="player-jersey"
                      placeholder="7"
                      value={jerseyNumber}
                      onChange={(event) => setJerseyNumber(event.target.value)}
                    />
                    <FieldDescription>
                      Keep jersey numbers unique within each team.
                    </FieldDescription>
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel htmlFor="player-position">Position</FieldLabel>
                  <FieldContent>
                    <NativeSelect
                      className="h-10 w-full"
                      id="player-position"
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
                      Choose the player&apos;s primary basketball position.
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
                              "flex h-10 items-center gap-2 rounded-md border px-3 text-sm transition-colors",
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
              </div>

              {validationError || errorMessage ? (
                <FieldError>{validationError ?? errorMessage}</FieldError>
              ) : null}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-border/60 px-6 py-5 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {mode === "create" ? "Creating" : "Saving"}
                  </>
                ) : (
                  <>
                    {mode === "create" ? (
                      <Plus className="size-4" />
                    ) : (
                      <PencilLine className="size-4" />
                    )}
                    {mode === "create" ? "Create player" : "Save changes"}
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

function DeletePlayerModal({
  errorMessage,
  onClose,
  onDelete,
  pending,
  player,
}: {
  errorMessage?: string | null
  onClose: () => void
  onDelete: () => Promise<void>
  pending: boolean
  player: Player
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 py-8 backdrop-blur-sm">
      <Card className="w-full max-w-lg border border-border/70 bg-card shadow-2xl">
        <CardHeader>
          <CardTitle>Delete player</CardTitle>
          <CardDescription>
            You are about to delete <span className="font-medium">{player.name}</span>.
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
                  Deleting
                </>
              ) : (
                <>
                  <Trash2 className="size-4" />
                  Delete player
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SortableTableHead({
  activeSortBy,
  children,
  className,
  onSortChange,
  sortBy,
  sortDirection,
}: {
  activeSortBy: PlayerSortBy
  children: React.ReactNode
  className?: string
  onSortChange: (sortBy: PlayerSortBy) => void
  sortBy: PlayerSortBy
  sortDirection: "asc" | "desc"
}) {
  const active = activeSortBy === sortBy
  const SortIcon = active
    ? sortDirection === "asc"
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown

  return (
    <TableHead
      className={cn("text-muted-foreground", className)}
      aria-sort={active ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="-ml-2 h-8 gap-1.5 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
        aria-label={`Sort by ${String(children)}`}
        onClick={() => onSortChange(sortBy)}
      >
        {children}
        <SortIcon
          className={cn(
            "size-3.5",
            active ? "text-foreground" : "text-muted-foreground/70",
          )}
        />
      </Button>
    </TableHead>
  )
}

function PlayersTable({
  divisionsById,
  isRefreshing,
  onPageChange,
  onPageSizeChange,
  onSortChange,
  onDeletePlayer,
  onEditPlayer,
  pagination,
  players,
  sortBy,
  sortDirection,
  teamsById,
}: {
  divisionsById: Map<string, Division>
  isRefreshing: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: PageSizeOption) => void
  onSortChange: (sortBy: PlayerSortBy) => void
  onDeletePlayer: (player: Player) => void
  onEditPlayer: (player: Player) => void
  pagination: PaginationMeta
  players: Player[]
  sortBy: PlayerSortBy
  sortDirection: "asc" | "desc"
  teamsById: Map<string, Team>
}) {
  if (players.length === 0 && !isRefreshing) {
    return (
      <Empty className="border bg-card">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Users2 className="size-5" />
          </EmptyMedia>
          <EmptyTitle>No players yet</EmptyTitle>
          <EmptyDescription>
            Create the first player record for this organization so rosters can
            become official.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <Card
      className="relative overflow-hidden border border-border/60 bg-card/95 py-0 shadow-none"
      aria-busy={isRefreshing}
    >
      {isRefreshing ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/75 backdrop-blur-[1px]">
          <div className="inline-flex items-center gap-2 rounded-md border border-border/70 bg-background px-3 py-2 text-sm font-medium shadow-sm">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
            Updating players
          </div>
        </div>
      ) : null}
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="border-border/60 hover:bg-transparent">
              <TableHead className="w-12 px-4">
                <Checkbox aria-label="Select all players" />
              </TableHead>
              <SortableTableHead
                activeSortBy={sortBy}
                className="h-12"
                sortBy="name"
                sortDirection={sortDirection}
                onSortChange={onSortChange}
              >
                Player
              </SortableTableHead>
              <SortableTableHead
                activeSortBy={sortBy}
                sortBy="team"
                sortDirection={sortDirection}
                onSortChange={onSortChange}
              >
                Team
              </SortableTableHead>
              <SortableTableHead
                activeSortBy={sortBy}
                sortBy="division"
                sortDirection={sortDirection}
                onSortChange={onSortChange}
              >
                Division
              </SortableTableHead>
              <SortableTableHead
                activeSortBy={sortBy}
                sortBy="jerseyNumber"
                sortDirection={sortDirection}
                onSortChange={onSortChange}
              >
                Jersey no.
              </SortableTableHead>
              <SortableTableHead
                activeSortBy={sortBy}
                sortBy="position"
                sortDirection={sortDirection}
                onSortChange={onSortChange}
              >
                Position
              </SortableTableHead>
              <SortableTableHead
                activeSortBy={sortBy}
                sortBy="status"
                sortDirection={sortDirection}
                onSortChange={onSortChange}
              >
                Status
              </SortableTableHead>
              <SortableTableHead
                activeSortBy={sortBy}
                sortBy="updated"
                sortDirection={sortDirection}
                onSortChange={onSortChange}
              >
                Updated
              </SortableTableHead>
              <TableHead className="w-14 text-right"> </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody
            className={cn(
              "transition-opacity duration-200 ease-out",
              isRefreshing ? "opacity-60" : "opacity-100",
            )}
          >
            {players.length === 0 ? (
              <TableRow className="h-24 border-border/60 hover:bg-transparent">
                <TableCell
                  colSpan={9}
                  className="text-center text-sm text-muted-foreground"
                >
                  Updating players
                </TableCell>
              </TableRow>
            ) : null}
            {players.map((player) => {
              const team = teamsById.get(player.team_id)
              const division = team ? divisionsById.get(team.division_id) : undefined

              return (
                <TableRow
                  key={player.id}
                  className="h-18 border-border/60 transition-colors duration-200 ease-out hover:bg-muted/30"
                >
                  <TableCell className="px-4">
                    <Checkbox aria-label={`Select ${player.name}`} />
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
                        <div className="text-xs text-muted-foreground">
                          {player.id.slice(0, 8).toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{team?.name ?? "Unknown team"}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="font-medium">{division?.name ?? "Unknown division"}</div>
                      <div className="text-xs text-muted-foreground">
                        {team?.name ?? "No team context"}
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
                    <PlayerActionsPopover
                      onDelete={() => onDeletePlayer(player)}
                      onEdit={() => onEditPlayer(player)}
                      player={player}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
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

function PlayersSummaryCards({
  activePlayers,
  recentlyUpdatedPlayers,
  teamsWithCompleteRosters,
  totalPlayers,
}: {
  activePlayers: number
  recentlyUpdatedPlayers: number
  teamsWithCompleteRosters: string
  totalPlayers: number
}) {
  const cards = [
    {
      description: "All registered players",
      icon: Users2,
      title: "Total players",
      value: String(totalPlayers),
    },
    {
      description: "Currently active",
      icon: CheckCircle2,
      title: "Active players",
      value: String(activePlayers),
    },
    {
      description: "Teams are ready",
      icon: Shield,
      title: "Teams with complete rosters",
      value: teamsWithCompleteRosters,
    },
    {
      description: "In the last 7 days",
      icon: Clock3,
      title: "Recently updated players",
      value: String(recentlyUpdatedPlayers),
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

export function OrganizationPlayersView({
  divisions,
  filters,
  isPlayersTableRefreshing,
  onFiltersChange,
  onPageChange,
  onPageSizeChange,
  organization,
  pagination,
  players,
  teams,
}: {
  divisions: Division[]
  filters: PlayerTableFilters
  isPlayersTableRefreshing: boolean
  onFiltersChange: (filters: PlayerTableFilters) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: PageSizeOption) => void
  organization: Organization
  pagination: PaginationMeta
  players: Player[]
  teams: Team[]
}) {
  const createPlayerMutation = useCreatePlayerMutation(organization.id)
  const updatePlayerMutation = useUpdatePlayerMutation(organization.id)
  const deletePlayerMutation = useDeletePlayerMutation(organization.id)
  const [createModalOpen, setCreateModalOpen] = React.useState(false)
  const [playerToDelete, setPlayerToDelete] = React.useState<Player | null>(null)
  const [playerToEdit, setPlayerToEdit] = React.useState<Player | null>(null)

  const divisionsById = React.useMemo(
    () => new Map(divisions.map((division) => [division.id, division])),
    [divisions],
  )
  const teamsById = React.useMemo(
    () => new Map(teams.map((team) => [team.id, team])),
    [teams],
  )

  const totalPlayers = players.length
  const activePlayers = players.filter((player) => player.status === "active").length
  const recentThreshold = Date.now() - 7 * 24 * 60 * 60 * 1000
  const recentlyUpdatedPlayers = players.filter(
    (player) => new Date(player.updated_at).getTime() >= recentThreshold,
  ).length
  const rosterCounts = teams.map((team) => ({
    count: players.filter((player) => player.team_id === team.id).length,
    teamId: team.id,
  }))
  const teamsWithCompleteRosters = `${
    rosterCounts.filter((item) => item.count >= 8).length
  } / ${teams.length || 0}`

  function handleSortChange(sortBy: PlayerSortBy) {
    onFiltersChange({
      ...filters,
      sortBy,
      sortDirection:
        filters.sortBy === sortBy && filters.sortDirection === "asc" ? "desc" : "asc",
    })
  }

  async function handleCreatePlayer(payload: {
    jerseyNumber: string
    name: string
    position: string
    status: "active" | "inactive"
    teamId: string
  }) {
    try {
      const player = await createPlayerMutation.mutateAsync(payload)
      toast.success(`Created ${player.name}`)
      setCreateModalOpen(false)
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  async function handleUpdatePlayer(payload: {
    jerseyNumber: string
    name: string
    position: string
    status: "active" | "inactive"
    teamId: string
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
      toast.success(`Deleted ${playerToDelete.name}`)
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
          pageTitle="Players"
          primaryAction={{
            disabled: teams.length === 0,
            label: "New player",
            onClick: () => setCreateModalOpen(true),
          }}
        />

        <main className="flex flex-1 flex-col gap-6 bg-background px-4 py-4 lg:px-6 lg:py-5">
          <section className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight">Players</h1>
            </div>
          </section>

          <PlayersSummaryCards
            activePlayers={activePlayers}
            recentlyUpdatedPlayers={recentlyUpdatedPlayers}
            teamsWithCompleteRosters={teamsWithCompleteRosters}
            totalPlayers={totalPlayers}
          />

          {teams.length === 0 ? (
            <Card className="border border-dashed border-border/70 bg-card/70 shadow-none">
              <CardHeader>
                <CardTitle>Create a team first</CardTitle>
                <CardDescription>
                  Players belong to a team. Add teams before creating player
                  records for this organization.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          <section className="space-y-6">
            <div className="space-y-6">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_minmax(150px,170px)_minmax(160px,180px)_minmax(140px,160px)]">
                <div className="relative md:col-span-2 xl:col-span-1">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="h-9 w-full pl-9"
                    placeholder="Search players..."
                    value={filters.search}
                    onChange={(event) =>
                      onFiltersChange({ ...filters, search: event.target.value })
                    }
                  />
                </div>
                <Select
                  value={filters.teamFilter}
                  onValueChange={(value) =>
                    onFiltersChange({ ...filters, teamFilter: value })
                  }
                >
                  <SelectTrigger
                    aria-label="Filter by team"
                    className="w-full"
                  >
                    <SelectValue placeholder="All teams" />
                  </SelectTrigger>
                  <SelectContent position="popper" align="start">
                    <SelectItem value="all">All teams</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filters.divisionFilter}
                  onValueChange={(value) =>
                    onFiltersChange({
                      ...filters,
                      divisionFilter: value,
                    })
                  }
                >
                  <SelectTrigger
                    aria-label="Filter by division"
                    className="w-full"
                  >
                    <SelectValue placeholder="All divisions" />
                  </SelectTrigger>
                  <SelectContent position="popper" align="start">
                    <SelectItem value="all">All divisions</SelectItem>
                    {divisions.map((division) => (
                      <SelectItem key={division.id} value={division.id}>
                        {division.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filters.statusFilter}
                  onValueChange={(value) =>
                    onFiltersChange({
                      ...filters,
                      statusFilter: value as PlayerTableFilters["statusFilter"],
                    })
                  }
                >
                  <SelectTrigger
                    aria-label="Filter by status"
                    className="w-full"
                  >
                    <SelectValue placeholder="All status" />
                  </SelectTrigger>
                  <SelectContent position="popper" align="start">
                    <SelectItem value="all">All status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <PlayersTable
                divisionsById={divisionsById}
                isRefreshing={isPlayersTableRefreshing}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
                onSortChange={handleSortChange}
                onDeletePlayer={setPlayerToDelete}
                onEditPlayer={setPlayerToEdit}
                pagination={pagination}
                players={players}
                sortBy={filters.sortBy === "recent" ? "updated" : filters.sortBy}
                sortDirection={filters.sortDirection}
                teamsById={teamsById}
              />
            </div>
          </section>
        </main>
      </SidebarInset>

      {createModalOpen ? (
        <PlayerFormModal
          errorMessage={
            createPlayerMutation.isError ? getApiErrorMessage(createPlayerMutation.error) : null
          }
          mode="create"
          pending={createPlayerMutation.isPending}
          teams={teams}
          onClose={() => setCreateModalOpen(false)}
          onSubmit={handleCreatePlayer}
        />
      ) : null}

      {playerToEdit ? (
        <PlayerFormModal
          errorMessage={
            updatePlayerMutation.isError ? getApiErrorMessage(updatePlayerMutation.error) : null
          }
          mode="edit"
          pending={updatePlayerMutation.isPending}
          player={playerToEdit}
          teams={teams}
          onClose={() => setPlayerToEdit(null)}
          onSubmit={handleUpdatePlayer}
        />
      ) : null}

      {playerToDelete ? (
        <DeletePlayerModal
          errorMessage={
            deletePlayerMutation.isError ? getApiErrorMessage(deletePlayerMutation.error) : null
          }
          pending={deletePlayerMutation.isPending}
          player={playerToDelete}
          onClose={() => setPlayerToDelete(null)}
          onDelete={handleDeletePlayer}
        />
      ) : null}
    </SidebarProvider>
  )
}
