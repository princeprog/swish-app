"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import {
  Check,
  CheckCircle2,
  Clock3,
  Filter,
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

function statusTone(status: string) {
  if (status === "active") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
  }

  return "border-zinc-500/20 bg-zinc-500/10 text-zinc-300"
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
  const [status, setStatus] = React.useState<"active" | "inactive">(
    (player?.status as "active" | "inactive") ?? "active",
  )
  const [validationError, setValidationError] = React.useState<string | null>(null)
  const previewName = name.trim() || "Player name"
  const previewTeam = teams.find((team) => team.id === teamId)?.name ?? "Team"
  const previewInitials = getInitials(previewName)

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
    setValidationError(null)
    await onSubmit({
      jerseyNumber: jerseyNumber.trim(),
      name: name.trim(),
      status,
      teamId,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 py-8 backdrop-blur-sm">
      <Card className="w-full max-w-5xl border border-border/70 bg-card shadow-2xl">
        <CardHeader className="gap-4 border-b border-border/60 pb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-xl">
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
            <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-5 p-6">
                <Field>
                  <FieldLabel htmlFor="player-team">Team</FieldLabel>
                  <FieldContent>
                    <NativeSelect
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
                  <h3 className="text-sm font-semibold">Player preview</h3>
                  <p className="text-sm text-muted-foreground">
                    This is how the player record will appear in the system.
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
                        <span>{previewTeam}</span>
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

function PlayersTable({
  divisionsById,
  onDeletePlayer,
  onEditPlayer,
  players,
  teamsById,
}: {
  divisionsById: Map<string, Division>
  onDeletePlayer: (player: Player) => void
  onEditPlayer: (player: Player) => void
  players: Player[]
  teamsById: Map<string, Team>
}) {
  if (players.length === 0) {
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
    <Card className="border border-border/60 bg-card/95 py-0 shadow-none">
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="border-border/60 hover:bg-transparent">
              <TableHead className="w-12 px-4">
                <Checkbox aria-label="Select all players" />
              </TableHead>
              <TableHead className="h-12 text-muted-foreground">Player</TableHead>
              <TableHead className="text-muted-foreground">Team</TableHead>
              <TableHead className="text-muted-foreground">Division</TableHead>
              <TableHead className="text-muted-foreground">Jersey no.</TableHead>
              <TableHead className="text-muted-foreground">Position</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Updated</TableHead>
              <TableHead className="w-14 text-right"> </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.map((player) => {
              const team = teamsById.get(player.team_id)
              const division = team ? divisionsById.get(team.division_id) : undefined

              return (
                <TableRow
                  key={player.id}
                  className="h-18 border-border/60 hover:bg-muted/30"
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
                    <Badge variant="secondary">Pending</Badge>
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

function PlayerSetupNotesCard() {
  const notes = [
    "Assign each player to the correct team.",
    "Keep jersey numbers unique within each team.",
    "Use active status only for eligible rostered players.",
    "Inactive players should not appear in competition rosters.",
  ]

  return (
    <Card className="border border-border/60 bg-card/95 shadow-none">
      <CardHeader>
        <CardTitle className="text-base">Player setup notes</CardTitle>
        <CardDescription>
          Keep player records accurate and roster-ready.
        </CardDescription>
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

function PlayersRecentActivityCard({
  players,
  teamsById,
}: {
  players: Player[]
  teamsById: Map<string, Team>
}) {
  const recentPlayers = [...players]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5)

  return (
    <Card className="border border-border/60 bg-card/95 shadow-none">
      <CardHeader>
        <CardTitle className="text-base">Recent activity</CardTitle>
        <CardDescription>Latest player record updates.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentPlayers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No player activity yet.</p>
        ) : (
          recentPlayers.map((player) => {
            const team = teamsById.get(player.team_id)
            return (
              <div key={player.id} className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/70 text-[10px] font-semibold">
                  {getInitials(player.name)}
                </div>
                <div className="min-w-0 space-y-1">
                  <div className="truncate text-sm font-medium">{player.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {team?.name ?? "Team unassigned"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Updated {new Date(player.updated_at).toLocaleDateString()}{" "}
                    {new Date(player.updated_at).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}

export function OrganizationPlayersView({
  divisions,
  organization,
  players,
  teams,
}: {
  divisions: Division[]
  organization: Organization
  players: Player[]
  teams: Team[]
}) {
  const createPlayerMutation = useCreatePlayerMutation(organization.id)
  const updatePlayerMutation = useUpdatePlayerMutation(organization.id)
  const deletePlayerMutation = useDeletePlayerMutation(organization.id)
  const [createModalOpen, setCreateModalOpen] = React.useState(false)
  const [playerToDelete, setPlayerToDelete] = React.useState<Player | null>(null)
  const [playerToEdit, setPlayerToEdit] = React.useState<Player | null>(null)
  const [search, setSearch] = React.useState("")
  const [teamFilter, setTeamFilter] = React.useState("all")
  const [divisionFilter, setDivisionFilter] = React.useState("all")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [sortBy, setSortBy] = React.useState("recent")

  const divisionsById = React.useMemo(
    () => new Map(divisions.map((division) => [division.id, division])),
    [divisions],
  )
  const teamsById = React.useMemo(
    () => new Map(teams.map((team) => [team.id, team])),
    [teams],
  )

  const filteredPlayers = React.useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    const nextPlayers = players.filter((player) => {
      const team = teamsById.get(player.team_id)
      const division = team ? divisionsById.get(team.division_id) : undefined

      const matchesSearch =
        !normalizedSearch ||
        player.name.toLowerCase().includes(normalizedSearch) ||
        player.jersey_number.toLowerCase().includes(normalizedSearch)
      const matchesTeam = teamFilter === "all" || player.team_id === teamFilter
      const matchesDivision =
        divisionFilter === "all" || team?.division_id === divisionFilter
      const matchesStatus = statusFilter === "all" || player.status === statusFilter

      return matchesSearch && matchesTeam && matchesDivision && matchesStatus
    })

    nextPlayers.sort((left, right) => {
      if (sortBy === "name") return left.name.localeCompare(right.name)
      if (sortBy === "team") {
        const leftTeam = teamsById.get(left.team_id)?.name ?? ""
        const rightTeam = teamsById.get(right.team_id)?.name ?? ""
        return leftTeam.localeCompare(rightTeam)
      }
      return new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime()
    })

    return nextPlayers
  }, [divisionFilter, divisionsById, players, search, sortBy, statusFilter, teamFilter, teamsById])

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

  async function handleCreatePlayer(payload: {
    jerseyNumber: string
    name: string
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
          name: organization.name,
          slug: organization.slug,
          status: organization.status,
        }}
      />
      <SidebarInset>
        <WorkspaceHeader
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
              <p className="text-sm text-muted-foreground">People setup</p>
              <h1 className="text-3xl font-semibold tracking-tight">Players</h1>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                Manage player records, jersey numbers, team assignments, and roster
                readiness across the organization.
              </p>
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

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_320px]">
            <div className="space-y-6">
              <Card className="border border-border/60 bg-card/95 shadow-none">
                <CardContent className="space-y-4 p-4">
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_140px_180px_130px]">
                    <div className="relative">
                      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        placeholder="Search players..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                      />
                    </div>
                    <NativeSelect
                      value={teamFilter}
                      onChange={(event) => setTeamFilter(event.target.value)}
                    >
                      <NativeSelectOption value="all">All teams</NativeSelectOption>
                      {teams.map((team) => (
                        <NativeSelectOption key={team.id} value={team.id}>
                          {team.name}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
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
                      <NativeSelectOption value="active">Active</NativeSelectOption>
                      <NativeSelectOption value="inactive">Inactive</NativeSelectOption>
                    </NativeSelect>
                    <NativeSelect
                      value={sortBy}
                      onChange={(event) => setSortBy(event.target.value)}
                    >
                      <NativeSelectOption value="recent">Sort: Recently updated</NativeSelectOption>
                      <NativeSelectOption value="name">Sort: Player name</NativeSelectOption>
                      <NativeSelectOption value="team">Sort: Team</NativeSelectOption>
                    </NativeSelect>
                    <div className="flex gap-2">
                      <Button className="flex-1" variant="outline">
                        <Filter className="size-4" />
                        View options
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <PlayersTable
                divisionsById={divisionsById}
                onDeletePlayer={setPlayerToDelete}
                onEditPlayer={setPlayerToEdit}
                players={filteredPlayers}
                teamsById={teamsById}
              />
            </div>

            <div className="space-y-6">
              <Card className="border border-border/60 bg-card/95 shadow-none">
                <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
                  <div className="space-y-1">
                    <CardTitle className="text-base">Player operations</CardTitle>
                    <CardDescription>
                      Register players and keep roster eligibility current.
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>

              <PlayerSetupNotesCard />
              <PlayersRecentActivityCard players={players} teamsById={teamsById} />
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
