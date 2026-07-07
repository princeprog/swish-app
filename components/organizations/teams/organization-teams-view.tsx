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
  useCreateTeamMutation,
  useDeleteTeamMutation,
  useUpdateTeamMutation,
} from "@/hooks/use-team"
import type { Division } from "@/services/division.service"
import type { Organization } from "@/services/organization.service"
import type { Player } from "@/services/player.service"
import type { Team } from "@/services/team.service"

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
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
  }

  return "border-zinc-500/20 bg-zinc-500/10 text-zinc-300"
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
  organizationSlug,
  onDelete,
  onEdit,
  team,
}: {
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
                  <Link href={`/organizations/${organizationSlug}/teams/${team.id}/roster`}>
                    <Users2 className="size-4" />
                    Manage roster
                  </Link>
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
                  Edit team
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
                  Delete team
                </Button>
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
  mode,
  onClose,
  onSubmit,
  pending,
  team,
  errorMessage,
}: {
  divisions: Division[]
  mode: "create" | "edit"
  onClose: () => void
  onSubmit: (payload: {
    color?: string
    divisionId: string
    name: string
    status: "active" | "inactive"
  }) => Promise<void>
  pending: boolean
  team?: Team | null
  errorMessage?: string | null
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
  const previewName = name.trim() || "Team name"
  const previewSlug = slugifyName(name) || "team-slug"
  const previewColor = color.trim() || "#1d4ed8"
  const previewDivision =
    divisions.find((division) => division.id === divisionId)?.name ?? "Division"
  const previewInitials = getTeamInitials(previewName)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!divisionId) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 py-8 backdrop-blur-sm">
      <Card className="w-full max-w-5xl border border-border/70 bg-card shadow-2xl">
        <CardHeader className="gap-4 border-b border-border/60 pb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-xl">
                {mode === "create" ? "Create team" : "Edit team"}
              </CardTitle>
              <CardDescription>
                Teams belong to a division and will be used for schedules,
                standings, and public league pages.
              </CardDescription>
            </div>
            <Button
              aria-label={`Close ${mode} team modal`}
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
                  <FieldLabel htmlFor="team-division">Division</FieldLabel>
                  <FieldContent>
                    <NativeSelect
                      id="team-division"
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
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel htmlFor="team-name">Team name</FieldLabel>
                  <FieldContent>
                    <Input
                      id="team-name"
                      placeholder="Central Ballers"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                    />
                    <FieldDescription>
                      The team slug will be generated automatically from the team
                      name.
                    </FieldDescription>
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel htmlFor="team-color">Team color</FieldLabel>
                  <FieldContent>
                    <div className="flex gap-2">
                      <div
                        className="flex h-10 w-14 shrink-0 items-center justify-center rounded-md border border-border/70"
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
                        className="h-10 w-12 cursor-pointer overflow-hidden p-1"
                        type="color"
                        value={previewColor}
                        onChange={(event) => setColor(event.target.value)}
                      />
                    </div>
                    <FieldDescription>
                      This color will be used for branding and public pages.
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
                  <h3 className="text-sm font-semibold">Team preview</h3>
                  <p className="text-sm text-muted-foreground">
                    This is how your team will appear in the system.
                  </p>
                </div>

                <div className="mt-5 rounded-xl border border-border/70 bg-background/60 p-6">
                  <div
                    className="rounded-xl border border-border/60 bg-gradient-to-b from-background to-card px-6 py-8 text-center"
                    style={{ boxShadow: `inset 0 3px 0 0 ${previewColor}` }}
                  >
                    <div
                      className="mx-auto flex size-28 items-center justify-center rounded-2xl border text-2xl font-bold tracking-tight"
                      style={{
                        borderColor: `${previewColor}66`,
                        boxShadow: `inset 0 0 0 2px ${previewColor}22`,
                        color: previewColor,
                      }}
                    >
                      {previewInitials}
                    </div>

                    <div className="mt-6 space-y-3">
                      <div className="text-3xl font-semibold tracking-tight">
                        {previewName}
                      </div>

                      <div className="mx-auto inline-flex items-center gap-2 rounded-md border border-border/70 bg-background/70 px-3 py-2 text-sm text-muted-foreground">
                        <Shield className="size-4" style={{ color: previewColor }} />
                        <span>{previewDivision}</span>
                      </div>

                      <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                        <span
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: previewColor }}
                        />
                        <span>{previewColor}</span>
                      </div>

                      <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground/80">
                        {previewSlug}
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
                    {mode === "create" ? "Create team" : "Save changes"}
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
  divisionsById,
  organizationSlug,
  onDeleteTeam,
  onEditTeam,
  playersByTeamId,
  teams,
}: {
  divisionsById: Map<string, Division>
  organizationSlug: string
  onDeleteTeam: (team: Team) => void
  onEditTeam: (team: Team) => void
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
    <Card className="border border-border/60 bg-card/95 shadow-none">
      <CardHeader>
        <CardTitle>Teams</CardTitle>
        <CardAction>
          <div className="text-sm text-muted-foreground">{teams.length} total</div>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-border/60 hover:bg-transparent">
              <TableHead>Team</TableHead>
              <TableHead>Division</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Roster</TableHead>
              <TableHead>Updated</TableHead>
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
                  className="border-border/50 hover:bg-background/40"
                >
                  <TableCell className="whitespace-normal">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex size-11 shrink-0 items-center justify-center rounded-md border border-border/70 bg-background/60 text-[11px] font-semibold text-foreground"
                        style={{
                          boxShadow: team.color
                            ? `inset 0 0 0 1px ${team.color}33`
                            : undefined,
                        }}
                      >
                        {getTeamInitials(team.name)}
                      </div>
                      <div className="space-y-1">
                        <div className="font-medium">{team.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {team.id.slice(0, 8).toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{division?.name ?? "Unknown division"}</div>
                      <div className="text-xs text-muted-foreground">
                        {division?.status ?? "Unavailable"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="inline-flex rounded-md border border-border/70 bg-background/60 px-2 py-1 font-mono text-xs text-muted-foreground">
                      {team.slug}
                    </div>
                  </TableCell>
                  <TableCell>
                    {team.color ? (
                      <div className="inline-flex items-center gap-2 rounded-md border border-border/70 bg-background/60 px-2 py-1 text-xs text-muted-foreground">
                        <span
                          className="size-3 rounded-full border border-white/10"
                          style={{ backgroundColor: team.color }}
                        />
                        {team.color}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`rounded-full border px-2 py-1 text-xs font-medium ${statusTone(team.status)}`}
                    >
                      {team.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">
                        {rosterPlayers.length} {rosterPlayers.length === 1 ? "player" : "players"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {activeRosterPlayers} active
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
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
    <section className="grid gap-4 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon

        return (
          <Card
            key={card.title}
            className="border border-border/60 bg-card/95 shadow-none"
          >
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

function TeamSetupNotesCard() {
  const notes = [
    "Assign teams to the correct division.",
    "Add team colors to improve visual clarity.",
    "Manage rosters to keep player counts accurate.",
    "Inactive teams will not appear in schedules or standings.",
  ]

  return (
    <Card className="border border-border/60 bg-card/95 shadow-none">
      <CardHeader>
        <CardTitle className="text-base">Team setup notes</CardTitle>
        <CardDescription>
          Keep your teams organized and up to date.
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

function TeamsRecentActivityCard({
  teams,
}: {
  teams: Team[]
}) {
  const recentTeams = [...teams]
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    )
    .slice(0, 4)

  return (
    <Card className="border border-border/60 bg-card/95 shadow-none">
      <CardHeader>
        <CardTitle className="text-base">Recent activity</CardTitle>
        <CardDescription>Latest team record updates.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentTeams.length === 0 ? (
          <p className="text-sm text-muted-foreground">No team activity yet.</p>
        ) : (
          recentTeams.map((team) => (
            <div key={team.id} className="flex items-start gap-3">
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border/70 bg-background/70 text-[10px] font-semibold"
                style={{
                  boxShadow: team.color ? `inset 0 0 0 1px ${team.color}33` : undefined,
                }}
              >
                {getTeamInitials(team.name)}
              </div>
              <div className="min-w-0 space-y-1">
                <div className="truncate text-sm font-medium">{team.name}</div>
                <div className="text-xs text-muted-foreground">
                  Team record updated
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(team.updated_at).toLocaleDateString()}{" "}
                  {new Date(team.updated_at).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

export function OrganizationTeamsView({
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
  const createTeamMutation = useCreateTeamMutation(organization.id)
  const updateTeamMutation = useUpdateTeamMutation(organization.id)
  const deleteTeamMutation = useDeleteTeamMutation(organization.id)
  const [createModalOpen, setCreateModalOpen] = React.useState(false)
  const [teamToDelete, setTeamToDelete] = React.useState<Team | null>(null)
  const [teamToEdit, setTeamToEdit] = React.useState<Team | null>(null)
  const [search, setSearch] = React.useState("")
  const [divisionFilter, setDivisionFilter] = React.useState("all")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [sortBy, setSortBy] = React.useState("recent")
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
  const filteredTeams = React.useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    const nextTeams = teams.filter((team) => {
      const matchesSearch =
        !normalizedSearch ||
        team.name.toLowerCase().includes(normalizedSearch) ||
        team.slug.toLowerCase().includes(normalizedSearch)
      const matchesDivision =
        divisionFilter === "all" || team.division_id === divisionFilter
      const matchesStatus =
        statusFilter === "all" || team.status === statusFilter

      return matchesSearch && matchesDivision && matchesStatus
    })

    nextTeams.sort((left, right) => {
      if (sortBy === "name") {
        return left.name.localeCompare(right.name)
      }

      if (sortBy === "division") {
        const leftDivision = divisionsById.get(left.division_id)?.name ?? ""
        const rightDivision = divisionsById.get(right.division_id)?.name ?? ""
        return leftDivision.localeCompare(rightDivision)
      }

      return (
        new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime()
      )
    })

    return nextTeams
  }, [divisionFilter, divisionsById, search, sortBy, statusFilter, teams])
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
      const team = await updateTeamMutation.mutateAsync({
        payload: {
          ...payload,
          slug: slugifyName(payload.name),
        },
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
          name: organization.name,
          slug: organization.slug,
          status: organization.status,
        }}
      />
      <SidebarInset>
        <WorkspaceHeader
          organizationName={organization.name}
          organizationSlug={organization.slug}
          pageTitle="Teams"
          primaryAction={{
            disabled: divisions.length === 0,
            label: "New team",
            onClick: () => setCreateModalOpen(true),
          }}
        />

        <main className="flex flex-1 flex-col gap-6 bg-background px-4 py-4 lg:px-6 lg:py-5">
          <section className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">People setup</p>
              <h1 className="text-3xl font-semibold tracking-tight">Teams</h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Manage registered teams for {organization.name}. Teams belong to
                a division and become the official participants for schedules,
                standings, and public competition pages.
              </p>
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
              <CardHeader>
                <CardTitle>Create a division first</CardTitle>
                <CardDescription>
                  Teams belong to a division. Add a division before creating team
                  records for this organization.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_320px]">
            <div className="space-y-6">
              <Card className="border border-border/60 bg-card/95 shadow-none">
                <CardContent className="space-y-4 p-4">
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_140px_180px_130px]">
                    <div className="relative">
                      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        placeholder="Search teams..."
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
                      <NativeSelectOption value="active">Active</NativeSelectOption>
                      <NativeSelectOption value="inactive">Inactive</NativeSelectOption>
                    </NativeSelect>
                    <NativeSelect
                      value={sortBy}
                      onChange={(event) => setSortBy(event.target.value)}
                    >
                      <NativeSelectOption value="recent">Sort: Recently updated</NativeSelectOption>
                      <NativeSelectOption value="name">Sort: Team name</NativeSelectOption>
                      <NativeSelectOption value="division">Sort: Division</NativeSelectOption>
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

              <TeamsTable
                divisionsById={divisionsById}
                organizationSlug={organization.slug}
                onDeleteTeam={setTeamToDelete}
                onEditTeam={setTeamToEdit}
                playersByTeamId={playersByTeamId}
                teams={filteredTeams}
              />
            </div>

            <div className="space-y-6">
              <Card className="border border-border/60 bg-card/95 shadow-none">
                <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
                  <div className="space-y-1">
                    <CardTitle className="text-base">Team operations</CardTitle>
                    <CardDescription>
                      Create and organize the active field of competition.
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>

              <TeamSetupNotesCard />
              <TeamsRecentActivityCard teams={teams} />
            </div>
          </section>
        </main>
      </SidebarInset>

      {createModalOpen ? (
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
          team={teamToEdit}
          onClose={() => setTeamToEdit(null)}
          onSubmit={handleUpdateTeam}
        />
      ) : null}

      {teamToDelete ? (
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
