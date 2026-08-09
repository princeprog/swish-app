"use client"

import * as React from "react"
import { Clipboard, UserPlus } from "lucide-react"
import { toast } from "sonner"

import {
  validateInvitationAssignments,
  type InvitationAssignmentMode,
} from "@/lib/team-assignment-selection"
import {
  useCreateInvitationMutation,
  useUpdateInvitationMutation,
} from "@/hooks/use-access"
import { getApiErrorMessage } from "@/hooks/use-auth"
import type {
  OrganizationInvitation,
  UpdateInvitationAccessInput,
} from "@/services/access.service"
import type { OrganizationRole } from "@/services/organization.service"
import type { Team } from "@/services/team.service"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { TeamAssignmentPicker, resolveTeamAssignmentIds } from "./team-assignment-picker"

const staffRoles = ["admin", "team_manager", "scorekeeper"] as const
type StaffRole = (typeof staffRoles)[number]

function roleLabel(role: string) {
  return role.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function InvitationAccessDialog({
  invitation,
  isTeamLoading,
  onClose,
  onCreatedLink,
  organizationId,
  organizationSlug,
  teamError,
  teams,
}: {
  invitation?: OrganizationInvitation
  isTeamLoading: boolean
  onClose: () => void
  onCreatedLink?: (link: string) => void
  organizationId: string
  organizationSlug: string
  teamError?: unknown
  teams: Team[]
}) {
  const createInvitation = useCreateInvitationMutation(organizationId)
  const updateInvitation = useUpdateInvitationMutation(organizationId)
  const [email, setEmail] = React.useState(invitation?.email ?? "")
  const [role, setRole] = React.useState<StaffRole>(
    (invitation?.role as StaffRole | undefined) ?? "admin",
  )
  const [assignmentMode, setAssignmentMode] = React.useState<InvitationAssignmentMode>(
    invitation?.teamAssignments.length ? "now" : "later",
  )
  const [selectedIds, setSelectedIds] = React.useState(
    invitation?.teamAssignments.map((assignment) => assignment.id) ?? [],
  )
  const [assignmentError, setAssignmentError] = React.useState<string | null>(null)
  const [link, setLink] = React.useState<string | null>(null)
  const initializedTeamMode = React.useRef(Boolean(invitation))
  const isEditing = Boolean(invitation)
  const isPending = createInvitation.isPending || updateInvitation.isPending

  React.useEffect(() => {
    if (initializedTeamMode.current || isTeamLoading) return

    setAssignmentMode(teams.length ? "now" : "later")
    initializedTeamMode.current = true
  }, [isTeamLoading, teams.length])

  function handleRoleChange(nextRole: StaffRole) {
    setRole(nextRole)
    setAssignmentError(null)

    if (nextRole === "team_manager") {
      setAssignmentMode(teams.length ? "now" : "later")
    } else {
      setAssignmentMode("later")
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationError = validateInvitationAssignments(
      role,
      assignmentMode,
      selectedIds,
    )
    setAssignmentError(validationError)

    if (validationError) return

    const teamIds = resolveTeamAssignmentIds(role, assignmentMode, selectedIds)

    try {
      if (invitation) {
        const payload: UpdateInvitationAccessInput = { role, teamIds }
        await updateInvitation.mutateAsync({
          invitationId: invitation.id,
          ...payload,
        })
        toast.success("Invitation access updated")
        onClose()
        return
      }

      const result = await createInvitation.mutateAsync({ email, role, teamIds })
      const acceptanceLink = result.acceptanceUrl ?? null
      setLink(acceptanceLink)
      if (acceptanceLink) onCreatedLink?.(acceptanceLink)
      toast.success("Invitation sent")
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[calc(100vh-2rem)] flex-col sm:max-w-2xl">
        <form className="flex min-h-0 flex-1 flex-col gap-6" onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit invitation access" : "Invite staff"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the role and team access before this invitation is accepted."
                : "Send a seven-day invitation for an operational organization role."}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="invite-email">Email</FieldLabel>
                <Input
                  id="invite-email"
                  readOnly={isEditing}
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
                {isEditing ? (
                  <FieldDescription>The invited email cannot be changed.</FieldDescription>
                ) : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="invite-role">Role</FieldLabel>
                <Select value={role} onValueChange={(value) => handleRoleChange(value as StaffRole)}>
                  <SelectTrigger id="invite-role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {staffRoles.map((item) => (
                        <SelectItem key={item} value={item}>
                          {roleLabel(item)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldDescription>The owner role cannot be assigned from an invitation.</FieldDescription>
              </Field>

              {role === "team_manager" ? (
                <TeamAssignmentPicker
                  assignmentMode={assignmentMode}
                  disabled={isPending}
                  error={assignmentError ?? undefined}
                  isLoading={isTeamLoading}
                  onChange={setSelectedIds}
                  onModeChange={(mode) => {
                    setAssignmentMode(mode)
                    setAssignmentError(null)
                  }}
                  organizationSlug={organizationSlug}
                  selectedIds={selectedIds}
                  teams={teams}
                />
              ) : null}

              {teamError ? <FieldError>{getApiErrorMessage(teamError)}</FieldError> : null}
              {createInvitation.isError ? <FieldError>{getApiErrorMessage(createInvitation.error)}</FieldError> : null}
              {updateInvitation.isError ? <FieldError>{getApiErrorMessage(updateInvitation.error)}</FieldError> : null}

              {link ? (
                <Alert>
                  <Clipboard />
                  <AlertTitle>Invitation sent</AlertTitle>
                  <AlertDescription className="flex flex-col gap-3">
                    Team access will begin after the invitation is accepted.
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input readOnly value={link} />
                      <Button
                        className="shrink-0"
                        type="button"
                        variant="outline"
                        onClick={() => navigator.clipboard.writeText(link)}
                      >
                        <Clipboard data-icon="inline-start" />
                        Copy link
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : null}
            </FieldGroup>
          </div>

          <DialogFooter className="shrink-0">
            <Button type="button" variant="outline" onClick={onClose}>
              {link ? "Done" : "Cancel"}
            </Button>
            {!link ? (
              <Button disabled={isPending} type="submit">
                {isPending ? <Spinner data-icon="inline-start" /> : <UserPlus data-icon="inline-start" />}
                {isEditing ? "Save access" : "Invite"}
              </Button>
            ) : null}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
