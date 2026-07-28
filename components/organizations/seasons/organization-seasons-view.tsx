"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import {
  CalendarDays,
  Loader2,
  MoreHorizontal,
  PencilLine,
  Trash2,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { AppSidebar } from "@/components/app-sidebar"
import { WorkspaceHeader } from "@/components/organizations/shared/workspace-header"
import { DataTablePagination } from "@/components/organizations/shared/data-table-pagination"
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
  EmptyContent,
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
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
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
  useCreateLeagueSeasonMutation,
  useDeleteLeagueSeasonMutation,
  useUpdateLeagueSeasonMutation,
} from "@/hooks/use-league-season"
import type { Organization } from "@/services/organization.service"
import type { LeagueSeason } from "@/services/league-season.service"
import type { PageSizeOption, PaginationMeta } from "@/services/pagination"

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

  if (status === "inactive") {
    return "border-zinc-500/20 bg-zinc-500/10 text-zinc-300"
  }

  return "border-amber-500/20 bg-amber-500/10 text-amber-300"
}

function SeasonCreateModal({
  onClose,
  organization,
}: {
  onClose: () => void
  organization: Organization
}) {
  const createLeagueSeasonMutation = useCreateLeagueSeasonMutation(organization.id)
  const [name, setName] = React.useState("")
  const [status, setStatus] = React.useState<"draft" | "active" | "inactive">("draft")
  const [publicEnabled, setPublicEnabled] = React.useState(false)
  const [validationError, setValidationError] = React.useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!name.trim()) {
      setValidationError("Season name is required.")
      return
    }

    const slug = slugifyName(name)

    if (!slug) {
      setValidationError("Season slug is required.")
      return
    }

    setValidationError(null)

    try {
      const season = await createLeagueSeasonMutation.mutateAsync({
        name: name.trim(),
        organizationId: organization.id,
        publicEnabled,
        slug,
        status,
      })

      toast.success(`Created ${season.name}`)
      onClose()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 py-8 backdrop-blur-sm">
      <Card className="w-full max-w-2xl border border-border/70 bg-card shadow-2xl">
        <CardHeader className="gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-xl">Create season</CardTitle>
              <CardDescription>
                Add a new league season for {organization.name}.
              </CardDescription>
            </div>
            <Button
              aria-label="Close create season modal"
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
            <Field>
              <FieldLabel htmlFor="new-season-name">Season name</FieldLabel>
              <FieldContent>
                <Input
                  id="new-season-name"
                  placeholder="2026 Summer League"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
                <FieldDescription>
                  The season slug will be generated automatically from this name.
                </FieldDescription>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="new-season-status">Status</FieldLabel>
              <FieldContent>
                <NativeSelect
                  id="new-season-status"
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as "draft" | "active" | "inactive")
                  }
                >
                  <NativeSelectOption value="draft">Draft</NativeSelectOption>
                  <NativeSelectOption value="active">Active</NativeSelectOption>
                  <NativeSelectOption value="inactive">Inactive</NativeSelectOption>
                </NativeSelect>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="new-season-public">Public page visibility</FieldLabel>
              <FieldContent>
                <label
                  htmlFor="new-season-public"
                  className="flex items-center gap-3 rounded-md border border-border/70 bg-background/60 px-3 py-2 text-sm"
                >
                  <input
                    id="new-season-public"
                    checked={publicEnabled}
                    className="size-4 accent-primary"
                    type="checkbox"
                    onChange={(event) => setPublicEnabled(event.target.checked)}
                  />
                  <span>Enable public season pages</span>
                </label>
              </FieldContent>
            </Field>

            {validationError || createLeagueSeasonMutation.isError ? (
              <FieldError>
                {validationError ?? getApiErrorMessage(createLeagueSeasonMutation.error)}
              </FieldError>
            ) : null}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={createLeagueSeasonMutation.isPending}>
                {createLeagueSeasonMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Creating
                  </>
                ) : (
                  <>
                    <CalendarDays className="size-4" />
                    Create season
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

function SeasonEditModal({
  onClose,
  organization,
  season,
}: {
  onClose: () => void
  organization: Organization
  season: LeagueSeason
}) {
  const updateLeagueSeasonMutation = useUpdateLeagueSeasonMutation(organization.id)
  const [name, setName] = React.useState(season.name)
  const [slug, setSlug] = React.useState(season.slug)
  const [status, setStatus] = React.useState<
    "draft" | "active" | "inactive"
  >(season.status as "draft" | "active" | "inactive")
  const [publicEnabled, setPublicEnabled] = React.useState(season.public_enabled)
  const [validationError, setValidationError] = React.useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!name.trim()) {
      setValidationError("Season name is required.")
      return
    }

    if (!slug.trim()) {
      setValidationError("Season slug is required.")
      return
    }

    setValidationError(null)

    try {
      const updatedSeason = await updateLeagueSeasonMutation.mutateAsync({
        leagueSeasonId: season.id,
        payload: {
          name: name.trim(),
          publicEnabled,
          slug: slug.trim(),
          status,
        },
      })

      toast.success(`Updated ${updatedSeason.name}`)
      onClose()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 py-8 backdrop-blur-sm">
      <Card className="w-full max-w-2xl border border-border/70 bg-card shadow-2xl">
        <CardHeader className="gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-xl">Edit season</CardTitle>
              <CardDescription>
                Update the season record for {organization.name}.
              </CardDescription>
            </div>
            <Button
              aria-label="Close edit season modal"
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
            <Field>
              <FieldLabel htmlFor="season-name">Season name</FieldLabel>
              <FieldContent>
                <Input
                  id="season-name"
                  value={name}
                  onChange={(event) => {
                    const nextName = event.target.value
                    setName(nextName)

                    if (!slug.trim() || slug === slugifyName(name)) {
                      setSlug(slugifyName(nextName))
                    }
                  }}
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="season-slug">Season slug</FieldLabel>
              <FieldContent>
                <Input
                  id="season-slug"
                  value={slug}
                  onChange={(event) => setSlug(slugifyName(event.target.value))}
                />
                <FieldDescription>
                  Lowercase letters, numbers, and hyphens only.
                </FieldDescription>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="season-status">Status</FieldLabel>
              <FieldContent>
                <NativeSelect
                  id="season-status"
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as "draft" | "active" | "inactive")
                  }
                >
                  <NativeSelectOption value="draft">Draft</NativeSelectOption>
                  <NativeSelectOption value="active">Active</NativeSelectOption>
                  <NativeSelectOption value="inactive">Inactive</NativeSelectOption>
                </NativeSelect>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="season-public">Public page visibility</FieldLabel>
              <FieldContent>
                <label
                  htmlFor="season-public"
                  className="flex items-center gap-3 rounded-md border border-border/70 bg-background/60 px-3 py-2 text-sm"
                >
                  <input
                    id="season-public"
                    checked={publicEnabled}
                    className="size-4 accent-primary"
                    type="checkbox"
                    onChange={(event) => setPublicEnabled(event.target.checked)}
                  />
                  <span>Enable public season pages</span>
                </label>
              </FieldContent>
            </Field>

            {validationError || updateLeagueSeasonMutation.isError ? (
              <FieldError>
                {validationError ?? getApiErrorMessage(updateLeagueSeasonMutation.error)}
              </FieldError>
            ) : null}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateLeagueSeasonMutation.isPending}>
                {updateLeagueSeasonMutation.isPending ? (
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

function SeasonDeleteModal({
  onClose,
  organizationId,
  season,
}: {
  onClose: () => void
  organizationId: string
  season: LeagueSeason
}) {
  const deleteLeagueSeasonMutation = useDeleteLeagueSeasonMutation(organizationId)

  async function handleDelete() {
    try {
      await deleteLeagueSeasonMutation.mutateAsync(season.id)
      toast.success(`Deleted ${season.name}`)
      onClose()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 py-8 backdrop-blur-sm">
      <Card className="w-full max-w-lg border border-border/70 bg-card shadow-2xl">
        <CardHeader>
          <CardTitle>Delete season</CardTitle>
          <CardDescription>
            You are about to delete <span className="font-medium">{season.name}</span>.
            This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {deleteLeagueSeasonMutation.isError ? (
            <FieldError>{getApiErrorMessage(deleteLeagueSeasonMutation.error)}</FieldError>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteLeagueSeasonMutation.isPending}
              onClick={handleDelete}
            >
              {deleteLeagueSeasonMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Deleting
                </>
              ) : (
                <>
                  <Trash2 className="size-4" />
                  Delete season
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SeasonActionsPopover({
  onDelete,
  onEdit,
  season,
}: {
  onDelete: () => void
  onEdit: () => void
  season: LeagueSeason
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

      if (!target?.closest(`[data-season-actions="${season.id}"]`)) {
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
  }, [open, season.id])

  return (
    <div className="relative inline-flex justify-end" data-season-actions={season.id}>
      <Button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Open actions for ${season.name}`}
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
              style={{
                left: Math.max(menuPosition.left, 12),
                top: menuPosition.top,
              }}
            >
              <div data-season-actions={season.id}>
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
                  Edit season
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
                  Delete season
                </Button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

function SeasonsTable({
  onPageChange,
  onPageSizeChange,
  onDeleteSeason,
  onEditSeason,
  organizationSlug,
  pagination,
  seasons,
}: {
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: PageSizeOption) => void
  onDeleteSeason: (season: LeagueSeason) => void
  onEditSeason: (season: LeagueSeason) => void
  organizationSlug: string
  pagination: PaginationMeta
  seasons: LeagueSeason[]
}) {
  if (seasons.length === 0) {
    return (
      <Empty className="border bg-card">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CalendarDays className="size-5" />
          </EmptyMedia>
          <EmptyTitle>No seasons yet</EmptyTitle>
          <EmptyDescription>
            Add the first season for this organization to start managing
            divisions, schedules, standings, and public season pages.
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
                <Checkbox aria-label="Select all seasons" />
              </TableHead>
              <TableHead className="h-12 text-muted-foreground">Season</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Public</TableHead>
              <TableHead className="text-muted-foreground">Updated</TableHead>
              <TableHead className="w-14 text-right"> </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {seasons.map((season) => (
              <TableRow
                key={season.id}
                className="h-18 border-border/60 hover:bg-muted/30"
              >
                <TableCell className="px-4">
                  <Checkbox aria-label={`Select ${season.name}`} />
                </TableCell>
                <TableCell className="whitespace-normal">
                  <div className="font-medium">{season.name}</div>
                </TableCell>
                <TableCell>
                  <Badge className={statusTone(season.status)} variant="outline">
                    {season.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      season.public_enabled
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                        : "border-border/70 bg-background/60 text-muted-foreground"
                    }
                    variant="outline"
                  >
                    {season.public_enabled ? "Published" : "Private"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <div>{new Date(season.updated_at).toLocaleDateString()}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(season.updated_at).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <SeasonActionsPopover
                    onDelete={() => onDeleteSeason(season)}
                    onEdit={() => onEditSeason(season)}
                    season={season}
                  />
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

export function OrganizationSeasonsView({
  onPageChange,
  onPageSizeChange,
  organization,
  pagination,
  seasons,
}: {
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: PageSizeOption) => void
  organization: Organization
  pagination: PaginationMeta
  seasons: LeagueSeason[]
}) {
  const [createModalOpen, setCreateModalOpen] = React.useState(false)
  const [seasonToDelete, setSeasonToDelete] = React.useState<LeagueSeason | null>(null)
  const [seasonToEdit, setSeasonToEdit] = React.useState<LeagueSeason | null>(null)

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
          pageTitle="Seasons"
          primaryAction={{
            label: "New season",
            onClick: () => setCreateModalOpen(true),
          }}
        />

        <main className="flex flex-1 flex-col gap-6 bg-background px-4 py-4 lg:px-6 lg:py-5">
          <section className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Competition setup</p>
              <h1 className="text-3xl font-semibold tracking-tight">Seasons</h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Manage all league seasons for {organization.name}. Each season
                becomes the base record for divisions, schedules, scoring, and
                public competition pages.
              </p>
            </div>
          </section>

          <section className="grid gap-6">
            <SeasonsTable
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
              onDeleteSeason={setSeasonToDelete}
              onEditSeason={setSeasonToEdit}
              organizationSlug={organization.slug}
              pagination={pagination}
              seasons={seasons}
            />
          </section>
        </main>
      </SidebarInset>

      {createModalOpen ? (
        <SeasonCreateModal
          organization={organization}
          onClose={() => setCreateModalOpen(false)}
        />
      ) : null}

      {seasonToEdit ? (
        <SeasonEditModal
          organization={organization}
          season={seasonToEdit}
          onClose={() => setSeasonToEdit(null)}
        />
      ) : null}

      {seasonToDelete ? (
        <SeasonDeleteModal
          organizationId={organization.id}
          season={seasonToDelete}
          onClose={() => setSeasonToDelete(null)}
        />
      ) : null}
    </SidebarProvider>
  )
}
