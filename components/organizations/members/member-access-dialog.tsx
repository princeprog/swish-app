"use client"

import * as React from "react"
import { toast } from "sonner"

import {
  validateInvitationAssignments,
  type InvitationAssignmentMode,
} from "@/lib/team-assignment-selection"
import {
  useUpdateMemberMutation,
  useUpdateTeamAssignmentsMutation,
} from "@/hooks/use-access"
import { getApiErrorMessage } from "@/hooks/use-auth"
import type { OrganizationMember } from "@/services/access.service"
import type { OrganizationRole } from "@/services/organization.service"
import type { Team } from "@/services/team.service"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { TeamAssignmentPicker } from "./team-assignment-picker"

const editableRoles = ["admin", "team_manager", "scorekeeper", "statistician"] as const

function roleLabel(role: string) {
  return role.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function MemberAccessDialog({
  isTeamLoading,
  member,
  onClose,
  organizationId,
  organizationSlug,
  teamError,
  teams,
}: {
  isTeamLoading: boolean
  member: OrganizationMember
  onClose: () => void
  organizationId: string
  organizationSlug: string
  teamError?: unknown
  teams: Team[]
}) {
  const updateMember = useUpdateMemberMutation(organizationId)
  const updateTeams = useUpdateTeamAssignmentsMutation(organizationId)
  const [role, setRole] = React.useState<OrganizationRole>(member.role)
  const [status, setStatus] = React.useState(member.status)
  const [assignmentMode, setAssignmentMode] = React.useState<InvitationAssignmentMode>(
    member.teamAssignments.length ? "now" : "later",
  )
  const [selectedIds, setSelectedIds] = React.useState(
    member.teamAssignments.map((item) => item.id),
  )
  const [assignmentError, setAssignmentError] = React.useState<string | null>(null)
  const isPending = updateMember.isPending || updateTeams.isPending

  function handleRoleChange(nextRole: OrganizationRole) {
    setRole(nextRole)
    setAssignmentError(null)
    setAssignmentMode(nextRole === "team_manager" && teams.length ? "now" : "later")
  }

  async function save() {
    const validationError = validateInvitationAssignments(
      role,
      assignmentMode,
      selectedIds,
    )
    setAssignmentError(validationError)

    if (validationError) return

    try {
      await updateMember.mutateAsync({
        memberId: member.id,
        role: role as Exclude<OrganizationRole, "owner">,
        status,
      })

      if (role === "team_manager" && status === "active") {
        await updateTeams.mutateAsync({
          memberId: member.id,
          teamIds: assignmentMode === "now" ? selectedIds : [],
        })
      }

      toast.success("Member access updated")
      onClose()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[calc(100vh-2rem)] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit member access</DialogTitle>
          <DialogDescription>
            {member.name} uses {member.email}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="member-role">Role</FieldLabel>
              <Select
                disabled={member.role === "owner"}
                value={role}
                onValueChange={(value) => handleRoleChange(value as OrganizationRole)}
              >
                <SelectTrigger id="member-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {member.role === "owner" ? (
                      <SelectItem value="owner">Owner</SelectItem>
                    ) : null}
                    {editableRoles.map((item) => (
                      <SelectItem key={item} value={item}>
                        {roleLabel(item)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="member-status">Status</FieldLabel>
              <Select
                disabled={member.role === "owner"}
                value={status}
                onValueChange={(value) => setStatus(value as typeof status)}
              >
                <SelectTrigger id="member-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>Suspended members cannot use this organization.</FieldDescription>
            </Field>

            {role === "team_manager" ? (
              <TeamAssignmentPicker
                assignmentMode={assignmentMode}
                disabled={isPending || member.role === "owner"}
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

            {teamError ? (
              <p className="text-sm text-destructive">{getApiErrorMessage(teamError)}</p>
            ) : null}
          </FieldGroup>
        </div>

        <DialogFooter className="shrink-0">
          <Button disabled={isPending} variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={isPending || member.role === "owner"} onClick={save}>
            {isPending ? <Spinner data-icon="inline-start" /> : null}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
