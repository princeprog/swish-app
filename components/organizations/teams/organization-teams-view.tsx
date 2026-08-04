"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
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
  canCreateTeams as canCreateTeamsForPermissions,
  canDeleteTeams as canDeleteTeamsForPermissions,
  canEditTeams as canEditTeamsForPermissions,
  canManageTeamSetup as canManageTeamSetupForPermissions,
  isProfileOnlyTeamEdit as isProfileOnlyTeamEditForPermissions,
} from "@/lib/team-action-permissions"
import {
  useCreateTeamMutation,
  useDeleteTeamMutation,
  useUpdateTeamMutation,
} from "@/hooks/use-team"
import type { Division } from "@/services/division.service"
import type { Organization } from "@/services/organization.service"
import type { PageSizeOption, PaginationMeta } from "@/services/pagination"
import type { Player } from "@/services/player.service"
import type { Team } from "@/services/team.service"

type TeamTableFilters = {
  divisionFilter: string
  search: string
  sortBy: "division" | "name" | "recent"
  statusFilter: string
}

function slugifyName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
}

function statusTone(status: string) {
  if (status === "active") {
    return "border-emerald-600 bg-emerald-600 text-white"
  }

  return "border-zinc-600 bg-zinc-600 text-white"
}

function getTeamInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

function TeamActionsPopover({
  canDeleteTeam,
  canEditTeam,
  organizationSlug,
  onDelete,
  onEdit,
  team,
}: {
  canDeleteTeam: boolean
  canEditTeam: boolean
  organizationSlug: string
  onDelete: () => void
  onEdit: () => void
  team: Team
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

      setMenuPosition({
        left: rect.right - 176,
        top: rect.bottom + 8,
      })
    }

    updatePosition()

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement | null

      if (!target?.closest(`[data-team-actions="${team.id}"]`)) {
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
  }, [open, team.id])

  return (
    <div className="relative inline-flex justify-end" data-team-actions={team.id}>
      <Button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Open actions for ${team.name}`}
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
              <div data-team-actions={team.id}>
                <Button
                  asChild
                  className="w-full justify-start"
                  size="sm"
                  variant="ghost"
                >
                  <Link
                    href={`/organizations/${organizationSlug}/players?teamId=${team.id}`}
                  >
                    <Users2 className="size-4" />
                    Manage roster
                  </Link>
                </Button>
                {canEditTeam ? (
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
                    Edit team
                  </Button>
                ) : null}
                {canDeleteTeam ? (
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
                    Delete team
                  </Button>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

function TeamFormModal({
  divisions,
  errorMessage,
  mode,
  onClose,
  onSubmit,
  pending,
  profileOnly = false,
  team,
}: {
  divisions: Division[]
  errorMessage?: string | null
  mode: "create" | "edit"
  onClose: () => void
  onSubmit: (payload: {
    color?: string
    divisionId: string
    name: string
    status: "active" | "inactive"
  }) => Promise<void>
  pending: boolean
  profileOnly?: boolean
  team?: Team | null
}) {
  const [name, setName] = React.useState(team?.name ?? "")
  const [divisionId, setDivisionId] = React.useState(
    team?.division_id ?? divisions[0]?.id ?? "",
  )
  const [status, setStatus] = React.useState<"active" | "inactive">(
    (team?.status as "active" | "inactive") ?? "active",
  )
  const [color, setColor] = React.useState(team?.color ?? "")
  const [validationError, setValidationError] = React.useState<string | null>(null)
  const previewColor = color.trim() || "#1d4ed8"

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!profileOnly && !divisionId) {
      setValidationError("Division is required.")
      return
    }

    if (!name.trim()) {
      setValidationError("Team name is required.")
      return
    }

    setValidationError(null)

    await onSubmit({
      color: color.trim() || undefined,
      divisionId,
      name: name.trim(),
      status,
    })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[calc(100vh-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-2xl">
        <DialogHeader className="gap-1.5 border-b border-border/60 px-6 py-5 pr-14">
          <DialogTitle className="text-lg">
            {mode === "create" ? "Create team" : "Edit team"}
          </DialogTitle>
          <DialogDescription>
            {profileOnly
              ? "Update the team name and color used across league pages."
              : "Add a team to a division and configure how it appears across the league."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5 px-6 py-5">
            <div className={cn("grid gap-5", profileOnly ? "sm:grid-cols-1" : "sm:grid-cols-2")}>
              <Field>
                <FieldLabel htmlFor="team-name">Team name</FieldLabel>
                <FieldContent>
                  <Input
                    id="team-name"
                    placeholder="Central Ballers"
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                  <FieldDescription>
                    Used in schedules, standings, and public pages.
                  </FieldDescription>
                </FieldContent>
              </Field>

              {profileOnly ? null : (
                <Field>
                  <FieldLabel htmlFor="team-division">Division</FieldLabel>
                  <FieldContent>
                    <NativeSelect
                      className="w-full"
                      id="team-division"
                      required
                      value={divisionId}
                      onChange={(event) => setDivisionId(event.target.value)}
                    >
                      <NativeSelectOption value="">Select a division</NativeSelectOption>
                      {divisions.map((division) => (
                        <NativeSelectOption key={division.id} value={division.id}>
                          {division.name}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                    <FieldDescription>
                      Determines where the team competes.
                    </FieldDescription>
                  </FieldContent>
                </Field>
              )}
            </div>

            <Field>
              <FieldLabel htmlFor="team-color">Team color</FieldLabel>
              <FieldContent>
                <div className="flex items-center gap-2">
                  <div
                    aria-hidden="true"
                    className="size-10 shrink-0 rounded-md border border-border/70"
                    style={{ backgroundColor: previewColor }}
                  />
                  <Input
                    id="team-color"
                    placeholder="#1d4ed8"
                    value={color}
                    onChange={(event) => setColor(event.target.value)}
                  />
                  <Input
                    aria-label="Pick team color"
                    className="size-10 shrink-0 cursor-pointer overflow-hidden p-1"
                    type="color"
                    value={previewColor}
                    onChange={(event) => setColor(event.target.value)}
                  />
                </div>
                <FieldDescription>
                  Used as the team accent color across the league.
                </FieldDescription>
              </FieldContent>
            </Field>

            {profileOnly ? null : (
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
                          aria-pressed={selected}
                          className={cn(
                            "flex h-10 items-center gap-2 rounded-md border px-3 text-sm transition-colors",
                            selected
                              ? "border-primary/40 bg-primary/10 text-foreground"
                              : "border-border/70 bg-background text-muted-foreground hover:bg-muted/50",
                          )}
                          type="button"
                          onClick={() => setStatus(value)}
                        >
                          <span
                            aria-hidden="true"
                            className={cn(
                              "size-2.5 rounded-full",
                              value === "active" ? "bg-emerald-500" : "bg-zinc-400",
                            )}
                          />
                          <span>{label}</span>
                          {selected ? <Check className="ml-auto size-4" /> : null}
                        </button>
                      )
                    })}
                  </div>
                  <FieldDescription>
                    Active teams can be added to schedules and standings.
                  </FieldDescription>
                </FieldContent>
              </Field>
            )}

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
                  {mode === "create" ? "Creating" : "Saving"}
                </>
              ) : (
                <>
                  {mode === "create" ? (
                    <Plus className="size-4" />
                  ) : (
                    <PencilLine className="size-4" />
                  )}
                  {mode === "create" ? "Create team" : "Save changes"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteTeamModal({
  errorMessage,
  onClose,
  onDelete,
  pending,
  team,
}: {
  errorMessage?: string | null
  onClose: () => void
  onDelete: () => Promise<void>
  pending: boolean
  team: Team
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 py-8 backdrop-blur-sm">
      <Card className="w-full max-w-lg border border-border/70 bg-card shadow-2xl">
        <CardHeader>
          <CardTitle>Delete team</CardTitle>
          <CardDescription>
            You are about to delete <span className="font-medium">{team.name}</span>.
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
              onClick={() => {
                void onDelete()
              }}
            >
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Deleting
                </>
              ) : (
                <>
                  <Trash2 className="size-4" />
                  Delete team
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function TeamsTable({
  canDeleteTeams,
  canEditTeams,
  divisionsById,
  onPageChange,
  onPageSizeChange,
  organizationSlug,
  onDeleteTeam,
  onEditTeam,
  pagination,
  playersByTeamId,
  teams,
}: {
  canDeleteTeams: boolean
  canEditTeams: boolean
  divisionsById: Map<string, Division>
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: PageSizeOption) => void
  organizationSlug: string
  onDeleteTeam: (team: Team) => void
  onEditTeam: (team: Team) => void
  pagination: PaginationMeta
  playersByTeamId: Map<string, Player[]>
  teams: Team[]
}) {
  if (teams.length === 0) {
    return (
      <Empty className="border bg-card">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Users2 className="size-5" />
          </EmptyMedia>
          <EmptyTitle>No teams yet</EmptyTitle>
          <EmptyDescription>
            Create the first team for this organization so divisions can start
            holding real participants for schedules and standings.
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
              <TableHead className="h-10 w-10 px-3">
                <Checkbox aria-label="Select all teams" />
              </TableHead>
              <TableHead className="h-10 text-muted-foreground">Team</TableHead>
              <TableHead className="text-muted-foreground">Division</TableHead>
              <TableHead className="text-muted-foreground">Color</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Roster</TableHead>
              <TableHead className="text-muted-foreground">Updated</TableHead>
              <TableHead className="w-14 text-right"> </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.map((team) => {
              const division = divisionsById.get(team.division_id)
              const rosterPlayers = playersByTeamId.get(team.id) ?? []
              const activeRosterPlayers = rosterPlayers.filter(
                (player) => player.status === "active",
              ).length

              return (
                <TableRow
                  key={team.id}
                  className="h-14 border-border/60 hover:bg-muted/30"
                >
                  <TableCell className="px-3">
                    <Checkbox aria-label={`Select ${team.name}`} />
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <div className="flex items-center gap-2">
                      <Avatar className="rounded-md">
                        <AvatarFallback
                          className="rounded-md text-[10px] font-semibold"
                          style={{
                            boxShadow: team.color
                              ? `inset 0 0 0 1px ${team.color}33`
                              : undefined,
                          }}
                        >
                          {getTeamInitials(team.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <div className="font-medium">{team.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {team.id.slice(0, 8).toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{division?.name ?? "Unknown division"}</div>
                  </TableCell>
                  <TableCell>
                    {team.color ? (
                      <Badge variant="outline" className="gap-2 font-normal text-muted-foreground">
                        <span
                          className="size-3 rounded-full border border-white/10"
                          style={{ backgroundColor: team.color }}
                        />
                        {team.color}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusTone(team.status)} variant="outline">
                      {team.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="font-medium">
                        {rosterPlayers.length} {rosterPlayers.length === 1 ? "player" : "players"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {activeRosterPlayers} active
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <div>{new Date(team.updated_at).toLocaleDateString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(team.updated_at).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <TeamActionsPopover
                      canDeleteTeam={canDeleteTeams}
                      canEditTeam={canEditTeams}
                      organizationSlug={organizationSlug}
                      onDelete={() => onDeleteTeam(team)}
                      onEdit={() => onEditTeam(team)}
                      team={team}
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

function TeamsSummaryCards({
  activeTeams,
  divisionsWithTeams,
  recentlyUpdatedTeams,
  totalTeams,
}: {
  activeTeams: number
  divisionsWithTeams: number
  recentlyUpdatedTeams: number
  totalTeams: number
}) {
  const cards = [
    {
      description: "All registered teams",
      icon: Users2,
      title: "Total teams",
      value: totalTeams,
    },
    {
      description: "Currently active",
      icon: CheckCircle2,
      title: "Active teams",
      value: activeTeams,
    },
    {
      description: "Divisions with at least one team",
      icon: Shield,
      title: "Divisions with teams",
      value: divisionsWithTeams,
    },
    {
      description: "In the last 7 days",
      icon: Clock3,
      title: "Recently updated teams",
      value: recentlyUpdatedTeams,
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

export function OrganizationTeamsView({
  divisions,
  filters,
  onFiltersChange,
  onPageChange,
  onPageSizeChange,
  organization,
  pagination,
  players,
  teams,
}: {
  divisions: Division[]
  filters: TeamTableFilters
  onFiltersChange: (filters: TeamTableFilters) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: PageSizeOption) => void
  organization: Organization
  pagination: PaginationMeta
  players: Player[]
  teams: Team[]
}) {
  const createTeamMutation = useCreateTeamMutation(organization.id)
  const updateTeamMutation = useUpdateTeamMutation(organization.id)
  const deleteTeamMutation = useDeleteTeamMutation(organization.id)
  const [createModalOpen, setCreateModalOpen] = React.useState(false)
  const [teamToDelete, setTeamToDelete] = React.useState<Team | null>(null)
  const [teamToEdit, setTeamToEdit] = React.useState<Team | null>(null)
  const permissions = organization.access.permissions
  const canCreateTeams = canCreateTeamsForPermissions(permissions)
  const canDeleteTeams = canDeleteTeamsForPermissions(permissions)
  const canUpdateTeams = canEditTeamsForPermissions(permissions)
  const canManageTeamSetup = canManageTeamSetupForPermissions(permissions)
  const profileOnlyTeamEdit = isProfileOnlyTeamEditForPermissions(permissions)
  const divisionsById = React.useMemo(
    () => new Map(divisions.map((division) => [division.id, division])),
    [divisions],
  )
  const playersByTeamId = React.useMemo(() => {
    const nextMap = new Map<string, Player[]>()

    for (const player of players) {
      const nextPlayers = nextMap.get(player.team_id) ?? []
      nextPlayers.push(player)
      nextMap.set(player.team_id, nextPlayers)
    }

    return nextMap
  }, [players])
  const totalTeams = teams.length
  const activeTeams = teams.filter((team) => team.status === "active").length
  const divisionsWithTeams = new Set(teams.map((team) => team.division_id)).size
  const recentThreshold = Date.now() - 7 * 24 * 60 * 60 * 1000
  const recentlyUpdatedTeams = teams.filter(
    (team) => new Date(team.updated_at).getTime() >= recentThreshold,
  ).length

  async function handleCreateTeam(payload: {
    color?: string
    divisionId: string
    name: string
    status: "active" | "inactive"
  }) {
    try {
      const team = await createTeamMutation.mutateAsync({
        ...payload,
        slug: slugifyName(payload.name),
      })
      toast.success(`Created ${team.name}`)
      setCreateModalOpen(false)
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  async function handleUpdateTeam(payload: {
    color?: string
    divisionId: string
    name: string
    status: "active" | "inactive"
  }) {
    if (!teamToEdit) return

    try {
      const updatePayload = canManageTeamSetup
        ? {
            ...payload,
            slug: slugifyName(payload.name),
          }
        : {
            color: payload.color,
            name: payload.name,
          }
      const team = await updateTeamMutation.mutateAsync({
        payload: updatePayload,
        teamId: teamToEdit.id,
      })
      toast.success(`Updated ${team.name}`)
      setTeamToEdit(null)
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  async function handleDeleteTeam() {
    if (!teamToDelete) return

    try {
      await deleteTeamMutation.mutateAsync(teamToDelete.id)
      toast.success(`Deleted ${teamToDelete.name}`)
      setTeamToDelete(null)
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
          pageTitle="Teams"
          primaryAction={
            canCreateTeams
              ? {
                  disabled: divisions.length === 0,
                  label: "New team",
                  onClick: () => setCreateModalOpen(true),
                }
              : null
          }
        />

        <main className="flex flex-1 flex-col gap-4 bg-background px-4 py-4 lg:px-6 lg:py-5">
          <section className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight">Teams</h1>
            </div>
          </section>

          <TeamsSummaryCards
            activeTeams={activeTeams}
            divisionsWithTeams={divisionsWithTeams}
            recentlyUpdatedTeams={recentlyUpdatedTeams}
            totalTeams={totalTeams}
          />

          {divisions.length === 0 ? (
            <Card className="border border-dashed border-border/70 bg-card/70 shadow-none">
              <CardHeader className="p-4">
                <CardTitle className="text-base">Create a division first</CardTitle>
                <CardDescription className="text-sm">
                  Teams belong to a division. Add a division before creating team
                  records for this organization.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          <section className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(260px,1fr)_minmax(160px,180px)_minmax(140px,160px)_minmax(190px,210px)_minmax(140px,160px)]">
              <div className="relative md:col-span-2 xl:col-span-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-10 w-full pl-9"
                  placeholder="Search teams..."
                  value={filters.search}
                  onChange={(event) =>
                    onFiltersChange({ ...filters, search: event.target.value })
                  }
                />
              </div>
              <NativeSelect
                className="h-10 w-full"
                value={filters.divisionFilter}
                onChange={(event) =>
                  onFiltersChange({
                    ...filters,
                    divisionFilter: event.target.value,
                  })
                }
              >
                <NativeSelectOption value="all">All divisions</NativeSelectOption>
                {divisions.map((division) => (
                  <NativeSelectOption key={division.id} value={division.id}>
                    {division.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <NativeSelect
                className="h-10 w-full"
                value={filters.statusFilter}
                onChange={(event) =>
                  onFiltersChange({ ...filters, statusFilter: event.target.value })
                }
              >
                <NativeSelectOption value="all">All status</NativeSelectOption>
                <NativeSelectOption value="active">Active</NativeSelectOption>
                <NativeSelectOption value="inactive">Inactive</NativeSelectOption>
              </NativeSelect>
              <NativeSelect
                className="h-10 w-full"
                value={filters.sortBy}
                onChange={(event) =>
                  onFiltersChange({
                    ...filters,
                    sortBy: event.target.value as TeamTableFilters["sortBy"],
                  })
                }
              >
                <NativeSelectOption value="recent">Sort: Recently updated</NativeSelectOption>
                <NativeSelectOption value="name">Sort: Team name</NativeSelectOption>
                <NativeSelectOption value="division">Sort: Division</NativeSelectOption>
              </NativeSelect>
              <Button className="h-10 w-full justify-center" variant="outline">
                <Filter className="size-4" />
                View options
              </Button>
            </div>

            <TeamsTable
              canDeleteTeams={canDeleteTeams}
              canEditTeams={canUpdateTeams}
              divisionsById={divisionsById}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
              organizationSlug={organization.slug}
              onDeleteTeam={setTeamToDelete}
              onEditTeam={setTeamToEdit}
              pagination={pagination}
              playersByTeamId={playersByTeamId}
              teams={teams}
            />
          </section>
        </main>
      </SidebarInset>

      {createModalOpen && canCreateTeams ? (
        <TeamFormModal
          divisions={divisions}
          errorMessage={
            createTeamMutation.isError ? getApiErrorMessage(createTeamMutation.error) : null
          }
          mode="create"
          pending={createTeamMutation.isPending}
          onClose={() => setCreateModalOpen(false)}
          onSubmit={handleCreateTeam}
        />
      ) : null}

      {teamToEdit ? (
        <TeamFormModal
          divisions={divisions}
          errorMessage={
            updateTeamMutation.isError ? getApiErrorMessage(updateTeamMutation.error) : null
          }
          mode="edit"
          pending={updateTeamMutation.isPending}
          profileOnly={profileOnlyTeamEdit}
          team={teamToEdit}
          onClose={() => setTeamToEdit(null)}
          onSubmit={handleUpdateTeam}
        />
      ) : null}

      {teamToDelete && canDeleteTeams ? (
        <DeleteTeamModal
          errorMessage={
            deleteTeamMutation.isError ? getApiErrorMessage(deleteTeamMutation.error) : null
          }
          pending={deleteTeamMutation.isPending}
          team={teamToDelete}
          onClose={() => setTeamToDelete(null)}
          onDelete={handleDeleteTeam}
        />
      ) : null}
    </SidebarProvider>
  )
}
