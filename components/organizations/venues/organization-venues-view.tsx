"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import {
  Loader2,
  MapPin,
  MoreHorizontal,
  PencilLine,
  Plus,
  Trash2,
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
import { getApiErrorMessage } from "@/hooks/use-auth"
import {
  useCreateVenueMutation,
  useDeleteVenueMutation,
  useUpdateVenueMutation,
} from "@/hooks/use-venue"
import type { LeagueSeason } from "@/services/league-season.service"
import type { Organization } from "@/services/organization.service"
import type { Venue } from "@/services/venue.service"

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

function VenueActionsPopover({
  onDelete,
  onEdit,
  venue,
}: {
  onDelete: () => void
  onEdit: () => void
  venue: Venue
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
      if (!target?.closest(`[data-venue-actions="${venue.id}"]`)) {
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
  }, [open, venue.id])

  return (
    <div className="relative inline-flex justify-end" data-venue-actions={venue.id}>
      <Button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Open actions for ${venue.name}`}
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
              <div data-venue-actions={venue.id}>
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
                  Edit venue
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
                  Delete venue
                </Button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

function VenueFormModal({
  errorMessage,
  mode,
  onClose,
  onSubmit,
  pending,
  seasons,
  venue,
}: {
  errorMessage?: string | null
  mode: "create" | "edit"
  onClose: () => void
  onSubmit: (payload: {
    leagueSeasonId: string
    name: string
    status: "active" | "inactive"
  }) => Promise<void>
  pending: boolean
  seasons: LeagueSeason[]
  venue?: Venue | null
}) {
  const [name, setName] = React.useState(venue?.name ?? "")
  const [leagueSeasonId, setLeagueSeasonId] = React.useState(
    venue?.league_season_id ?? seasons[0]?.id ?? "",
  )
  const [status, setStatus] = React.useState<"active" | "inactive">(
    (venue?.status as "active" | "inactive") ?? "active",
  )
  const [validationError, setValidationError] = React.useState<string | null>(null)
  const previewName = name.trim() || "Venue name"
  const previewSlug = slugifyName(name) || "venue-name"
  const previewSeason =
    seasons.find((season) => season.id === leagueSeasonId)?.name ?? "League season"

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!leagueSeasonId) {
      setValidationError("League season is required.")
      return
    }
    if (!name.trim()) {
      setValidationError("Venue name is required.")
      return
    }
    setValidationError(null)
    await onSubmit({
      leagueSeasonId,
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
                {mode === "create" ? "Create venue" : "Edit venue"}
              </CardTitle>
              <CardDescription>
                Venues are attached to a season and used for schedules, scoring,
                and public competition pages.
              </CardDescription>
            </div>
            <Button
              aria-label={`Close ${mode} venue modal`}
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
            <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="space-y-5 p-6">
                <Field>
                  <FieldLabel htmlFor="venue-season">League season</FieldLabel>
                  <FieldContent>
                    <NativeSelect
                      id="venue-season"
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
                  <FieldLabel htmlFor="venue-name">Venue name</FieldLabel>
                  <FieldContent>
                    <Input
                      id="venue-name"
                      placeholder="Barangay Central Gym"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                    />
                    <FieldDescription>
                      The venue slug will be generated automatically from the venue name.
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
                            className={`flex h-11 items-center gap-2 rounded-md border px-3 text-sm transition-colors ${
                              selected
                                ? "border-primary/40 bg-primary/10 text-foreground"
                                : "border-border/70 bg-background/60 text-muted-foreground hover:bg-background"
                            }`}
                            type="button"
                            onClick={() => setStatus(value)}
                          >
                            <span
                              className={`size-2.5 rounded-full ${
                                value === "active" ? "bg-emerald-400" : "bg-zinc-400"
                              }`}
                            />
                            <span>{label}</span>
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
                  <h3 className="text-sm font-semibold">Venue preview</h3>
                  <p className="text-sm text-muted-foreground">
                    This is how the venue record will appear in the system.
                  </p>
                </div>

                <div className="mt-5 rounded-xl border border-border/70 bg-background/60 p-6">
                  <div className="rounded-xl border border-border/60 bg-gradient-to-b from-background to-card px-6 py-8 text-center">
                    <div className="mx-auto flex size-24 items-center justify-center rounded-full border border-border/70 bg-background/70">
                      <MapPin className="size-9 text-muted-foreground" />
                    </div>
                    <div className="mt-6 space-y-3">
                      <div className="text-3xl font-semibold tracking-tight">
                        {previewName}
                      </div>
                      <div className="mx-auto inline-flex items-center gap-2 rounded-md border border-border/70 bg-background/70 px-3 py-2 text-sm text-muted-foreground">
                        <span>{previewSeason}</span>
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
                    {mode === "create" ? <Plus className="size-4" /> : <PencilLine className="size-4" />}
                    {mode === "create" ? "Create venue" : "Save changes"}
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

function DeleteVenueModal({
  errorMessage,
  onClose,
  onDelete,
  pending,
  venue,
}: {
  errorMessage?: string | null
  onClose: () => void
  onDelete: () => Promise<void>
  pending: boolean
  venue: Venue
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 py-8 backdrop-blur-sm">
      <Card className="w-full max-w-lg border border-border/70 bg-card shadow-2xl">
        <CardHeader>
          <CardTitle>Delete venue</CardTitle>
          <CardDescription>
            You are about to delete <span className="font-medium">{venue.name}</span>.
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
                  Delete venue
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function VenuesTable({
  onDeleteVenue,
  onEditVenue,
  seasonsById,
  venues,
}: {
  onDeleteVenue: (venue: Venue) => void
  onEditVenue: (venue: Venue) => void
  seasonsById: Map<string, LeagueSeason>
  venues: Venue[]
}) {
  if (venues.length === 0) {
    return (
      <Empty className="border bg-card">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MapPin className="size-5" />
          </EmptyMedia>
          <EmptyTitle>No venues yet</EmptyTitle>
          <EmptyDescription>
            Create the first venue for this organization so games can be scheduled
            in official locations.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <Card className="border border-border/60 bg-card/95 shadow-none">
      <CardHeader>
        <CardTitle>Venues</CardTitle>
        <CardAction>
          <div className="text-sm text-muted-foreground">{venues.length} total</div>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-border/60 hover:bg-transparent">
              <TableHead>Venue</TableHead>
              <TableHead>Season</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-14 text-right"> </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {venues.map((venue) => {
              const season = seasonsById.get(venue.league_season_id)

              return (
                <TableRow key={venue.id} className="border-border/50 hover:bg-background/40">
                  <TableCell className="whitespace-normal">
                    <div className="space-y-1">
                      <div className="font-medium">{venue.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Venue ID: {venue.id}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{season?.name ?? "Unknown season"}</div>
                      <div className="text-xs text-muted-foreground">
                        {season?.status ?? "Unavailable"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="inline-flex rounded-md border border-border/70 bg-background/60 px-2 py-1 font-mono text-xs text-muted-foreground">
                      {venue.slug}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`rounded-full border px-2 py-1 text-xs font-medium ${statusTone(venue.status)}`}
                    >
                      {venue.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div>{new Date(venue.updated_at).toLocaleDateString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(venue.updated_at).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <VenueActionsPopover
                      onDelete={() => onDeleteVenue(venue)}
                      onEdit={() => onEditVenue(venue)}
                      venue={venue}
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

export function OrganizationVenuesView({
  organization,
  seasons,
  venues,
}: {
  organization: Organization
  seasons: LeagueSeason[]
  venues: Venue[]
}) {
  const createVenueMutation = useCreateVenueMutation(organization.id)
  const updateVenueMutation = useUpdateVenueMutation(organization.id)
  const deleteVenueMutation = useDeleteVenueMutation(organization.id)
  const [createModalOpen, setCreateModalOpen] = React.useState(false)
  const [venueToDelete, setVenueToDelete] = React.useState<Venue | null>(null)
  const [venueToEdit, setVenueToEdit] = React.useState<Venue | null>(null)
  const seasonsById = React.useMemo(
    () => new Map(seasons.map((season) => [season.id, season])),
    [seasons],
  )

  async function handleCreateVenue(payload: {
    leagueSeasonId: string
    name: string
    status: "active" | "inactive"
  }) {
    try {
      const venue = await createVenueMutation.mutateAsync({
        ...payload,
        slug: slugifyName(payload.name),
      })
      toast.success(`Created ${venue.name}`)
      setCreateModalOpen(false)
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  async function handleUpdateVenue(payload: {
    leagueSeasonId: string
    name: string
    status: "active" | "inactive"
  }) {
    if (!venueToEdit) return
    try {
      const venue = await updateVenueMutation.mutateAsync({
        payload: {
          ...payload,
          slug: slugifyName(payload.name),
        },
        venueId: venueToEdit.id,
      })
      toast.success(`Updated ${venue.name}`)
      setVenueToEdit(null)
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  async function handleDeleteVenue() {
    if (!venueToDelete) return
    try {
      await deleteVenueMutation.mutateAsync(venueToDelete.id)
      toast.success(`Deleted ${venueToDelete.name}`)
      setVenueToDelete(null)
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
        <WorkspaceHeader organizationName={organization.name} />

        <main className="flex flex-1 flex-col gap-6 bg-background px-4 py-4 lg:px-6 lg:py-5">
          <section className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Competition setup</p>
              <h1 className="text-3xl font-semibold tracking-tight">Venues</h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Manage official playing locations for {organization.name}. Venues
                are used when building schedules, assigning games, and publishing
                competition details.
              </p>
            </div>

            <Button
              onClick={() => setCreateModalOpen(true)}
              disabled={seasons.length === 0}
            >
              <Plus className="size-4" />
              New venue
            </Button>
          </section>

          {seasons.length === 0 ? (
            <Card className="border border-dashed border-border/70 bg-card/70 shadow-none">
              <CardHeader>
                <CardTitle>Create a season first</CardTitle>
                <CardDescription>
                  Venues belong to a league season. Add a season before creating
                  venue records for this organization.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          <section className="grid gap-6">
            <VenuesTable
              onDeleteVenue={setVenueToDelete}
              onEditVenue={setVenueToEdit}
              seasonsById={seasonsById}
              venues={venues}
            />
          </section>
        </main>
      </SidebarInset>

      {createModalOpen ? (
        <VenueFormModal
          errorMessage={
            createVenueMutation.isError ? getApiErrorMessage(createVenueMutation.error) : null
          }
          mode="create"
          pending={createVenueMutation.isPending}
          seasons={seasons}
          onClose={() => setCreateModalOpen(false)}
          onSubmit={handleCreateVenue}
        />
      ) : null}

      {venueToEdit ? (
        <VenueFormModal
          errorMessage={
            updateVenueMutation.isError ? getApiErrorMessage(updateVenueMutation.error) : null
          }
          mode="edit"
          pending={updateVenueMutation.isPending}
          seasons={seasons}
          venue={venueToEdit}
          onClose={() => setVenueToEdit(null)}
          onSubmit={handleUpdateVenue}
        />
      ) : null}

      {venueToDelete ? (
        <DeleteVenueModal
          errorMessage={
            deleteVenueMutation.isError ? getApiErrorMessage(deleteVenueMutation.error) : null
          }
          pending={deleteVenueMutation.isPending}
          venue={venueToDelete}
          onClose={() => setVenueToDelete(null)}
          onDelete={handleDeleteVenue}
        />
      ) : null}
    </SidebarProvider>
  )
}
