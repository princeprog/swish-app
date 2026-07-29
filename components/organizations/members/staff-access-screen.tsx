"use client"

import * as React from "react"
import Link from "next/link"
import {
  Clipboard,
  KeyRound,
  Loader2,
  RefreshCw,
  ShieldCheck,
  UserPlus,
} from "lucide-react"
import { toast } from "sonner"

import { AppSidebar } from "@/components/app-sidebar"
import { WorkspaceHeader } from "@/components/organizations/shared/workspace-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  useCreateInvitationMutation,
  useOrganizationInvitationsQuery,
  useOrganizationMembersQuery,
  useResendInvitationMutation,
  useRevokeInvitationMutation,
  useTransferOwnershipMutation,
  useUpdateGameAssignmentsMutation,
  useUpdateMemberMutation,
  useUpdateTeamAssignmentsMutation,
} from "@/hooks/use-access"
import { getApiErrorMessage } from "@/hooks/use-auth"
import { useOrganizationsQuery } from "@/hooks/use-organization"
import { useSchedulesQuery } from "@/hooks/use-schedule"
import { useTeamsQuery } from "@/hooks/use-team"
import type { OrganizationMember } from "@/services/access.service"
import type { OrganizationRole } from "@/services/organization.service"

const editableRoles = ["admin", "team_manager", "scorekeeper"] as const

function roleLabel(role: string) {
  return role.replace("_", " ")
}

function LoadingState() {
  return (
    <main className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-7xl space-y-4">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-40" />
        <Skeleton className="h-96" />
      </div>
    </main>
  )
}

function EmptyShell({ description, title }: { description: string; title: string }) {
  return (
    <main className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-3xl">
        <Empty className="border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ShieldCheck className="size-5" />
            </EmptyMedia>
            <EmptyTitle>{title}</EmptyTitle>
            <EmptyDescription>{description}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href="/organizations">Back to organizations</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    </main>
  )
}

function InviteDialog({
  onClose,
  organizationId,
}: {
  onClose: () => void
  organizationId: string
}) {
  const createInvitation = useCreateInvitationMutation(organizationId)
  const [email, setEmail] = React.useState("")
  const [role, setRole] = React.useState<(typeof editableRoles)[number]>("admin")
  const [link, setLink] = React.useState<string | null>(null)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      const result = await createInvitation.mutateAsync({ email, role })
      setLink(result.acceptanceUrl ?? null)
      toast.success("Invitation created")
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite staff</DialogTitle>
          <DialogDescription>
            Send a seven-day invitation for an operational organization role.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <Field>
            <FieldLabel htmlFor="invite-email">Email</FieldLabel>
            <FieldContent>
              <Input id="invite-email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor="invite-role">Role</FieldLabel>
            <FieldContent>
              <NativeSelect id="invite-role" value={role} onChange={(event) => setRole(event.target.value as typeof role)}>
                {editableRoles.map((item) => (
                  <NativeSelectOption key={item} value={item}>
                    {roleLabel(item)}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <FieldDescription>Owners are assigned only through ownership transfer.</FieldDescription>
            </FieldContent>
          </Field>
          {createInvitation.isError ? <FieldError>{getApiErrorMessage(createInvitation.error)}</FieldError> : null}
          {link ? (
            <div className="rounded-md border bg-muted/30 p-3 text-sm">
              <p className="mb-2 font-medium">Development invitation link</p>
              <div className="flex gap-2">
                <Input readOnly value={link} />
                <Button type="button" variant="outline" onClick={() => navigator.clipboard.writeText(link)}>
                  <Clipboard className="size-4" />
                  Copy
                </Button>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button disabled={createInvitation.isPending} type="submit">
              {createInvitation.isPending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
              Invite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function MemberEditor({
  games,
  member,
  onClose,
  organizationId,
  teams,
}: {
  games: { id: string; home_team_name: string; away_team_name: string; starts_at: string }[]
  member: OrganizationMember
  onClose: () => void
  organizationId: string
  teams: { id: string; name: string }[]
}) {
  const updateMember = useUpdateMemberMutation(organizationId)
  const updateTeams = useUpdateTeamAssignmentsMutation(organizationId)
  const updateGames = useUpdateGameAssignmentsMutation(organizationId)
  const [role, setRole] = React.useState<OrganizationRole>(member.role)
  const [status, setStatus] = React.useState(member.status)
  const [teamIds, setTeamIds] = React.useState(member.teamAssignments.map((item) => item.id))
  const [gameIds, setGameIds] = React.useState(member.gameAssignments.map((item) => item.id))

  async function save() {
    try {
      if (member.role !== "owner") {
        await updateMember.mutateAsync({ memberId: member.id, role: role as Exclude<OrganizationRole, "owner">, status })
      }
      if (role === "team_manager") {
        await updateTeams.mutateAsync({ memberId: member.id, teamIds })
      }
      if (role === "scorekeeper") {
        await updateGames.mutateAsync({ gameIds, memberId: member.id })
      }
      toast.success("Member access updated")
      onClose()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit member access</DialogTitle>
          <DialogDescription>{member.name} uses {member.email}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <Field>
            <FieldLabel>Role</FieldLabel>
            <FieldContent>
              <NativeSelect disabled={member.role === "owner"} value={role} onChange={(event) => setRole(event.target.value as OrganizationRole)}>
                {member.role === "owner" ? <NativeSelectOption value="owner">owner</NativeSelectOption> : null}
                {editableRoles.map((item) => (
                  <NativeSelectOption key={item} value={item}>
                    {roleLabel(item)}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Status</FieldLabel>
            <FieldContent>
              <NativeSelect disabled={member.role === "owner"} value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
                <NativeSelectOption value="active">active</NativeSelectOption>
                <NativeSelectOption value="suspended">suspended</NativeSelectOption>
              </NativeSelect>
            </FieldContent>
          </Field>
          {role === "team_manager" ? (
            <AssignmentList
              items={teams.map((team) => ({ id: team.id, label: team.name }))}
              selectedIds={teamIds}
              title="Assigned teams"
              onChange={setTeamIds}
            />
          ) : null}
          {role === "scorekeeper" ? (
            <AssignmentList
              items={games.map((game) => ({
                id: game.id,
                label: `${game.home_team_name} vs ${game.away_team_name}`,
              }))}
              selectedIds={gameIds}
              title="Assigned games"
              onChange={setGameIds}
            />
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={updateMember.isPending || updateTeams.isPending || updateGames.isPending} onClick={save}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AssignmentList({
  items,
  onChange,
  selectedIds,
  title,
}: {
  items: { id: string; label: string }[]
  onChange: (ids: string[]) => void
  selectedIds: string[]
  title: string
}) {
  return (
    <div className="rounded-md border p-3">
      <p className="mb-2 text-sm font-medium">{title}</p>
      <div className="grid max-h-48 gap-2 overflow-auto">
        {items.map((item) => {
          const checked = selectedIds.includes(item.id)
          return (
            <label key={item.id} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={checked}
                onCheckedChange={(nextChecked) =>
                  onChange(nextChecked ? [...selectedIds, item.id] : selectedIds.filter((id) => id !== item.id))
                }
              />
              <span>{item.label}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}

export function StaffAccessScreen({ slug }: { slug: string }) {
  const organizationsQuery = useOrganizationsQuery()
  const organization = organizationsQuery.data?.find((item) => item.slug === slug)
  const membersQuery = useOrganizationMembersQuery(organization?.id)
  const invitationsQuery = useOrganizationInvitationsQuery(organization?.id)
  const teamsQuery = useTeamsQuery(organization?.id, { pageSize: 50 })
  const gamesQuery = useSchedulesQuery(organization?.id)
  const resendInvitation = useResendInvitationMutation(organization?.id ?? "")
  const revokeInvitation = useRevokeInvitationMutation(organization?.id ?? "")
  const transferOwnership = useTransferOwnershipMutation(organization?.id ?? "")
  const [inviteOpen, setInviteOpen] = React.useState(false)
  const [memberToEdit, setMemberToEdit] = React.useState<OrganizationMember | null>(null)
  const [transferTargetId, setTransferTargetId] = React.useState("")
  const [confirmationSlug, setConfirmationSlug] = React.useState("")
  const [lastLink, setLastLink] = React.useState<string | null>(null)

  if (organizationsQuery.isLoading || (organization && (membersQuery.isLoading || invitationsQuery.isLoading || teamsQuery.isLoading || gamesQuery.isLoading))) {
    return <LoadingState />
  }

  if (organizationsQuery.isError) {
    return <EmptyShell title="We couldn't load this organization" description={getApiErrorMessage(organizationsQuery.error)} />
  }

  if (!organization) {
    return <EmptyShell title="Organization not found" description="This workspace does not exist or you do not have access to it." />
  }

  if (!organization.access.permissions.includes("members.manage")) {
    return <EmptyShell title="Staff access is owner-only" description="Your current role cannot manage invitations, assignments, or ownership for this organization." />
  }

  async function resend(invitationId: string) {
    try {
      const result = await resendInvitation.mutateAsync(invitationId)
      setLastLink(result.acceptanceUrl ?? null)
      toast.success("Invitation resent")
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  async function revoke(invitationId: string) {
    try {
      await revokeInvitation.mutateAsync(invitationId)
      toast.success("Invitation revoked")
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  async function transfer() {
    if (!transferTargetId) return
    try {
      await transferOwnership.mutateAsync({ confirmationSlug, targetMemberId: transferTargetId })
      toast.success("Ownership transferred")
      setConfirmationSlug("")
      setTransferTargetId("")
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  const members = membersQuery.data ?? []
  const invitations = invitationsQuery.data ?? []
  const activeAdmins = members.filter((member) => member.role === "admin" && member.status === "active")

  return (
    <SidebarProvider>
      <AppSidebar organization={{ access: organization.access, name: organization.name, slug: organization.slug, status: organization.status }} />
      <SidebarInset>
        <WorkspaceHeader organizationName={organization.name} organizationSlug={organization.slug} pageTitle="Staff & access" primaryAction={{ label: "Invite staff", onClick: () => setInviteOpen(true) }} />
        <main className="flex flex-1 flex-col gap-4 bg-background px-4 py-4 lg:px-6 lg:py-5">
          <section className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Owner controls</p>
              <h1 className="text-3xl font-semibold tracking-tight">Staff & access</h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Manage organization staff, scoped assignments, invitations, and owner transfer for {organization.name}.
              </p>
            </div>
            <Button onClick={() => setInviteOpen(true)}>
              <UserPlus className="size-4" />
              Invite staff
            </Button>
          </section>

          {lastLink ? (
            <Card className="border-border/60 shadow-none">
              <CardContent className="flex flex-wrap items-center gap-2 p-3">
                <Input readOnly className="min-w-64 flex-1" value={lastLink} />
                <Button variant="outline" onClick={() => navigator.clipboard.writeText(lastLink)}>
                  <Clipboard className="size-4" />
                  Copy link
                </Button>
              </CardContent>
            </Card>
          ) : null}

          <Tabs defaultValue="members">
            <TabsList>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="invitations">Invitations</TabsTrigger>
              <TabsTrigger value="ownership">Ownership</TabsTrigger>
            </TabsList>
            <TabsContent value="members">
              <Card className="border-border/60 shadow-none">
                <CardHeader>
                  <CardTitle>Members</CardTitle>
                  <CardDescription>Roles are organization-specific and assignments narrow access further.</CardDescription>
                </CardHeader>
                <CardContent className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Assignments</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div className="font-medium">{member.name}</div>
                            <div className="text-xs text-muted-foreground">{member.email}</div>
                          </TableCell>
                          <TableCell><Badge variant="outline">{roleLabel(member.role)}</Badge></TableCell>
                          <TableCell>{member.status}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {member.role === "team_manager"
                              ? `${member.teamAssignments.length} teams`
                              : member.role === "scorekeeper"
                                ? `${member.gameAssignments.length} games`
                                : "Full organization scope"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" onClick={() => setMemberToEdit(member)}>
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="invitations">
              <Card className="border-border/60 shadow-none">
                <CardHeader>
                  <CardTitle>Invitations</CardTitle>
                  <CardDescription>Pending invitations can be resent or revoked without exposing tokens in lists.</CardDescription>
                </CardHeader>
                <CardContent className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invitations.map((invitation) => (
                        <TableRow key={invitation.id}>
                          <TableCell>{invitation.email}</TableCell>
                          <TableCell>{roleLabel(invitation.role)}</TableCell>
                          <TableCell><Badge variant="outline">{invitation.status}</Badge></TableCell>
                          <TableCell>{new Date(invitation.expires_at).toLocaleDateString()}</TableCell>
                          <TableCell className="space-x-2 text-right">
                            <Button disabled={invitation.status !== "pending"} size="sm" variant="outline" onClick={() => resend(invitation.id)}>
                              <RefreshCw className="size-4" />
                              Resend
                            </Button>
                            <Button disabled={invitation.status !== "pending"} size="sm" variant="outline" onClick={() => revoke(invitation.id)}>
                              Revoke
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="ownership">
              <Card className="border-border/60 shadow-none">
                <CardHeader>
                  <CardTitle>Transfer ownership</CardTitle>
                  <CardDescription>Transfer to an active admin by typing the organization slug.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:max-w-xl">
                  <NativeSelect value={transferTargetId} onChange={(event) => setTransferTargetId(event.target.value)}>
                    <NativeSelectOption value="">Select active admin</NativeSelectOption>
                    {activeAdmins.map((member) => (
                      <NativeSelectOption key={member.id} value={member.id}>{member.name}</NativeSelectOption>
                    ))}
                  </NativeSelect>
                  <Input placeholder={organization.slug} value={confirmationSlug} onChange={(event) => setConfirmationSlug(event.target.value)} />
                  <Button disabled={!transferTargetId || confirmationSlug !== organization.slug || transferOwnership.isPending} onClick={transfer}>
                    <KeyRound className="size-4" />
                    Transfer ownership
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </SidebarInset>
      {inviteOpen ? <InviteDialog organizationId={organization.id} onClose={() => setInviteOpen(false)} /> : null}
      {memberToEdit ? (
        <MemberEditor
          games={(gamesQuery.data ?? []) as never}
          member={memberToEdit}
          organizationId={organization.id}
          teams={teamsQuery.data?.data ?? []}
          onClose={() => setMemberToEdit(null)}
        />
      ) : null}
    </SidebarProvider>
  )
}
