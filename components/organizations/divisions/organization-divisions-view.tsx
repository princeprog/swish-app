"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import {
  Layers3,
  Loader2,
  MoreHorizontal,
  PencilLine,
  Plus,
  Trash2,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { AppSidebar } from "@/components/app-sidebar"
import { WorkspaceHeader } from "@/components/organizations/shared/workspace-header"
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
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select"
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
  useCreateDivisionMutation,
  useDeleteDivisionMutation,
  useUpdateDivisionMutation,
} from "@/hooks/use-division"
import type { Division } from "@/services/division.service"
import type { LeagueSeason } from "@/services/league-season.service"
import type { Organization } from "@/services/organization.service"

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

function DivisionActionsPopover({
  division,
  onDelete,
  onEdit,
}: {
  division: Division
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

      if (!target?.closest(`[data-division-actions="${division.id}"]`)) {
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
  }, [division.id, open])

  return (
    <div className="relative inline-flex justify-end" data-division-actions={division.id}>
      <Button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Open actions for ${division.name}`}
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
              <div data-division-actions={division.id}>
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
                  Edit division
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
                  Delete division
                </Button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

function EditDivisionModal({
  division,
  onClose,
  organization,
  seasons,
}: {
  division: Division
  onClose: () => void
  organization: Organization
  seasons: LeagueSeason[]
}) {
  const updateDivisionMutation = useUpdateDivisionMutation(organization.id)
  const [name, setName] = React.useState(division.name)
  const [slug, setSlug] = React.useState(division.slug)
  const [leagueSeasonId, setLeagueSeasonId] = React.useState(division.league_season_id)
  const [status, setStatus] = React.useState<"active" | "inactive">(
    division.status as "active" | "inactive",
  )
  const [validationError, setValidationError] = React.useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!leagueSeasonId) {
      setValidationError("League season is required.")
      return
    }

    if (!name.trim()) {
      setValidationError("Division name is required.")
      return
    }

    if (!slug.trim()) {
      setValidationError("Division slug is required.")
      return
    }

    setValidationError(null)

    try {
      const updatedDivision = await updateDivisionMutation.mutateAsync({
        divisionId: division.id,
        payload: {
          leagueSeasonId,
          name: name.trim(),
          slug: slug.trim(),
          status,
        },
      })

      toast.success(`Updated ${updatedDivision.name}`)
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
              <CardTitle className="text-xl">Edit division</CardTitle>
              <CardDescription>
                Update the division record for {organization.name}.
              </CardDescription>
            </div>
            <Button
              aria-label="Close edit division modal"
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
              <FieldLabel htmlFor="edit-division-season">League season</FieldLabel>
              <FieldContent>
                <NativeSelect
                  id="edit-division-season"
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
              <FieldLabel htmlFor="edit-division-name">Division name</FieldLabel>
              <FieldContent>
                <Input
                  id="edit-division-name"
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
              <FieldLabel htmlFor="edit-division-slug">Division slug</FieldLabel>
              <FieldContent>
                <Input
                  id="edit-division-slug"
                  value={slug}
                  onChange={(event) => setSlug(slugifyName(event.target.value))}
                />
                <FieldDescription>
                  Lowercase letters, numbers, and hyphens only.
                </FieldDescription>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="edit-division-status">Status</FieldLabel>
              <FieldContent>
                <NativeSelect
                  id="edit-division-status"
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as "active" | "inactive")
                  }
                >
                  <NativeSelectOption value="active">Active</NativeSelectOption>
                  <NativeSelectOption value="inactive">Inactive</NativeSelectOption>
                </NativeSelect>
              </FieldContent>
            </Field>

            {validationError || updateDivisionMutation.isError ? (
              <FieldError>
                {validationError ?? getApiErrorMessage(updateDivisionMutation.error)}
              </FieldError>
            ) : null}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateDivisionMutation.isPending}>
                {updateDivisionMutation.isPending ? (
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

function DeleteDivisionModal({
  division,
  onClose,
  organizationId,
}: {
  division: Division
  onClose: () => void
  organizationId: string
}) {
  const deleteDivisionMutation = useDeleteDivisionMutation(organizationId)

  async function handleDelete() {
    try {
      await deleteDivisionMutation.mutateAsync(division.id)
      toast.success(`Deleted ${division.name}`)
      onClose()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 py-8 backdrop-blur-sm">
      <Card className="w-full max-w-lg border border-border/70 bg-card shadow-2xl">
        <CardHeader>
          <CardTitle>Delete division</CardTitle>
          <CardDescription>
            You are about to delete <span className="font-medium">{division.name}</span>.
            This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {deleteDivisionMutation.isError ? (
            <FieldError>{getApiErrorMessage(deleteDivisionMutation.error)}</FieldError>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteDivisionMutation.isPending}
              onClick={handleDelete}
            >
              {deleteDivisionMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Deleting
                </>
              ) : (
                <>
                  <Trash2 className="size-4" />
                  Delete division
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function CreateDivisionModal({
  onClose,
  organization,
  seasons,
}: {
  onClose: () => void
  organization: Organization
  seasons: LeagueSeason[]
}) {
  const createDivisionMutation = useCreateDivisionMutation(organization.id)
  const [name, setName] = React.useState("")
  const [slug, setSlug] = React.useState("")
  const [leagueSeasonId, setLeagueSeasonId] = React.useState(seasons[0]?.id ?? "")
  const [status, setStatus] = React.useState<"active" | "inactive">("active")
  const [validationError, setValidationError] = React.useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!leagueSeasonId) {
      setValidationError("League season is required.")
      return
    }

    if (!name.trim()) {
      setValidationError("Division name is required.")
      return
    }

    if (!slug.trim()) {
      setValidationError("Division slug is required.")
      return
    }

    setValidationError(null)

    try {
      const division = await createDivisionMutation.mutateAsync({
        leagueSeasonId,
        name: name.trim(),
        slug: slug.trim(),
        status,
      })

      toast.success(`Created ${division.name}`)
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
              <CardTitle className="text-xl">Create division</CardTitle>
              <CardDescription>
                Add a new competition division under {organization.name}. This
                can represent categories like Senior Open, Under 18, or Women&apos;s.
              </CardDescription>
            </div>
            <Button
              aria-label="Close create division modal"
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
              <FieldLabel htmlFor="division-season">League season</FieldLabel>
              <FieldContent>
                <NativeSelect
                  id="division-season"
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
                <FieldDescription>
                  Divisions belong to a single league season.
                </FieldDescription>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="division-name">Division name</FieldLabel>
              <FieldContent>
                <Input
                  id="division-name"
                  placeholder="Senior Open"
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
              <FieldLabel htmlFor="division-slug">Division slug</FieldLabel>
              <FieldContent>
                <Input
                  id="division-slug"
                  placeholder="senior-open"
                  value={slug}
                  onChange={(event) => setSlug(slugifyName(event.target.value))}
                />
                <FieldDescription>
                  Lowercase letters, numbers, and hyphens only.
                </FieldDescription>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="division-status">Status</FieldLabel>
              <FieldContent>
                <NativeSelect
                  id="division-status"
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as "active" | "inactive")
                  }
                >
                  <NativeSelectOption value="active">Active</NativeSelectOption>
                  <NativeSelectOption value="inactive">Inactive</NativeSelectOption>
                </NativeSelect>
              </FieldContent>
            </Field>

            {validationError || createDivisionMutation.isError ? (
              <FieldError>
                {validationError ?? getApiErrorMessage(createDivisionMutation.error)}
              </FieldError>
            ) : null}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={createDivisionMutation.isPending}>
                {createDivisionMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Creating
                  </>
                ) : (
                  <>
                    <Plus className="size-4" />
                    Create division
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

function DivisionsTable({
  divisions,
  onDeleteDivision,
  onEditDivision,
  organizationSlug,
  seasonsById,
}: {
  divisions: Division[]
  onDeleteDivision: (division: Division) => void
  onEditDivision: (division: Division) => void
  organizationSlug: string
  seasonsById: Map<string, LeagueSeason>
}) {
  if (divisions.length === 0) {
    return (
      <Empty className="border bg-card">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Layers3 className="size-5" />
          </EmptyMedia>
          <EmptyTitle>No divisions yet</EmptyTitle>
          <EmptyDescription>
            Create the first division for this organization so teams, schedules,
            standings, and playoffs have a competition category to belong to.
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
                <Checkbox aria-label="Select all divisions" />
              </TableHead>
              <TableHead className="h-12 text-muted-foreground">Division</TableHead>
              <TableHead className="text-muted-foreground">Season</TableHead>
              <TableHead className="text-muted-foreground">Slug</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Updated</TableHead>
              <TableHead className="w-14 text-right"> </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {divisions.map((division) => {
              const season = seasonsById.get(division.league_season_id)

              return (
                <TableRow
                  key={division.id}
                  className="h-18 border-border/60 hover:bg-muted/30"
                >
                  <TableCell className="px-4">
                    <Checkbox aria-label={`Select ${division.name}`} />
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <div className="font-medium">{division.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {season?.name ?? "Unknown season"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono font-normal text-muted-foreground">
                      {division.slug}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusTone(division.status)} variant="outline">
                      {division.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div>{new Date(division.updated_at).toLocaleDateString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(division.updated_at).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DivisionActionsPopover
                      division={division}
                      onDelete={() => onDeleteDivision(division)}
                      onEdit={() => onEditDivision(division)}
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

export function OrganizationDivisionsView({
  divisions,
  organization,
  seasons,
}: {
  divisions: Division[]
  organization: Organization
  seasons: LeagueSeason[]
}) {
  const [createModalOpen, setCreateModalOpen] = React.useState(false)
  const [divisionToDelete, setDivisionToDelete] = React.useState<Division | null>(null)
  const [divisionToEdit, setDivisionToEdit] = React.useState<Division | null>(null)
  const seasonsById = React.useMemo(
    () => new Map(seasons.map((season) => [season.id, season])),
    [seasons],
  )

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
          pageTitle="Divisions"
          primaryAction={{
            disabled: seasons.length === 0,
            label: "New division",
            onClick: () => setCreateModalOpen(true),
          }}
        />

        <main className="flex flex-1 flex-col gap-6 bg-background px-4 py-4 lg:px-6 lg:py-5">
          <section className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Competition setup</p>
              <h1 className="text-3xl font-semibold tracking-tight">Divisions</h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Organize competition categories for {organization.name}. Divisions
                define where teams compete and how schedules, standings, and
                playoffs are grouped inside a season.
              </p>
            </div>

          </section>

          {seasons.length === 0 ? (
            <Card className="border border-dashed border-border/70 bg-card/70 shadow-none">
              <CardHeader>
                <CardTitle>Create a season first</CardTitle>
                <CardDescription>
                  Divisions belong to a league season. Add a season before creating
                  competition categories for this organization.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          <section className="grid gap-6">
            <DivisionsTable
              divisions={divisions}
              onDeleteDivision={setDivisionToDelete}
              onEditDivision={setDivisionToEdit}
              organizationSlug={organization.slug}
              seasonsById={seasonsById}
            />
          </section>
        </main>
      </SidebarInset>

      {createModalOpen ? (
        <CreateDivisionModal
          organization={organization}
          seasons={seasons}
          onClose={() => setCreateModalOpen(false)}
        />
      ) : null}

      {divisionToEdit ? (
        <EditDivisionModal
          division={divisionToEdit}
          organization={organization}
          seasons={seasons}
          onClose={() => setDivisionToEdit(null)}
        />
      ) : null}

      {divisionToDelete ? (
        <DeleteDivisionModal
          division={divisionToDelete}
          organizationId={organization.id}
          onClose={() => setDivisionToDelete(null)}
        />
      ) : null}
    </SidebarProvider>
  )
}
