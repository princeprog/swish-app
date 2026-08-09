"use client"

import * as React from "react"
import Link from "next/link"
import { Clipboard, RefreshCw, ShieldCheck, UserPlus } from "lucide-react"
import { toast } from "sonner"

import { AppSidebar } from "@/components/app-sidebar"
import {
  ComponentReveal,
  PageEntrance,
  RevealGroup,
} from "@/components/motion/page-motion"
import { InvitationAccessDialog } from "@/components/organizations/members/invitation-access-dialog"
import { MemberAccessDialog } from "@/components/organizations/members/member-access-dialog"
import { WorkspaceHeader } from "@/components/organizations/shared/workspace-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  useAssignableTeamsQuery,
  useOrganizationInvitationsQuery,
  useOrganizationMembersQuery,
  useResendInvitationMutation,
  useRevokeInvitationMutation,
} from "@/hooks/use-access"
import { getApiErrorMessage } from "@/hooks/use-auth"
import { useOrganizationsQuery } from "@/hooks/use-organization"
import { STAFF_ACCESS_TABS } from "@/lib/staff-access-tabs"
import type { OrganizationInvitation, OrganizationMember, StaffAssignment } from "@/services/access.service"

function roleLabel(role: string) {
  return role.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function LoadingState() {
  return (
    <PageEntrance asChild>
      <main className="min-h-screen bg-background p-6 text-foreground">
        <ComponentReveal asChild>
          <div className="mx-auto flex max-w-7xl flex-col gap-4">
            <Skeleton className="h-10 w-80" />
            <Skeleton className="h-40" />
            <Skeleton className="h-96" />
          </div>
        </ComponentReveal>
      </main>
    </PageEntrance>
  )
}

function EmptyShell({ description, title }: { description: string; title: string }) {
  return (
    <PageEntrance asChild>
      <main className="min-h-screen bg-background p-6 text-foreground">
        <ComponentReveal asChild>
          <div className="mx-auto max-w-3xl">
            <Empty className="border bg-card">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ShieldCheck />
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
        </ComponentReveal>
      </main>
    </PageEntrance>
  )
}

function TeamAccessSummary({ assignments }: { assignments: StaffAssignment[] }) {
  if (!assignments.length) {
    return <Badge variant="outline">Needs team assignment</Badge>
  }

  return (
    <div className="flex flex-col gap-1">
      {assignments.map((assignment) => (
        <div key={`${assignment.leagueSeasonId}-${assignment.id}`} className="text-sm">
          <div className="font-medium">{assignment.name ?? "Team"}</div>
          <div className="text-xs text-muted-foreground">{assignment.leagueSeasonName ?? "Season"}</div>
        </div>
      ))}
    </div>
  )
}

export function StaffAccessScreen({ slug }: { slug: string }) {
  const organizationsQuery = useOrganizationsQuery()
  const organization = organizationsQuery.data?.find((item) => item.slug === slug)
  const membersQuery = useOrganizationMembersQuery(organization?.id)
  const invitationsQuery = useOrganizationInvitationsQuery(organization?.id)
  const [inviteOpen, setInviteOpen] = React.useState(false)
  const [memberToEdit, setMemberToEdit] = React.useState<OrganizationMember | null>(null)
  const [invitationToEdit, setInvitationToEdit] = React.useState<OrganizationInvitation | null>(null)
  const [lastLink, setLastLink] = React.useState<string | null>(null)
  const editorOpen = inviteOpen || Boolean(memberToEdit) || Boolean(invitationToEdit)
  const teamsQuery = useAssignableTeamsQuery(organization?.id, editorOpen)
  const resendInvitation = useResendInvitationMutation(organization?.id ?? "")
  const revokeInvitation = useRevokeInvitationMutation(organization?.id ?? "")

  if (
    organizationsQuery.isLoading ||
    (organization && (membersQuery.isLoading || invitationsQuery.isLoading))
  ) {
    return <LoadingState />
  }

  if (organizationsQuery.isError) {
    return <EmptyShell title="We couldn't load this organization" description={getApiErrorMessage(organizationsQuery.error)} />
  }

  if (!organization) {
    return <EmptyShell title="Organization not found" description="This workspace does not exist or you do not have access to it." />
  }

  if (!organization.access.permissions.includes("members.manage")) {
    return <EmptyShell title="Staff access is owner-only" description="Your current role cannot manage invitations or assignments for this organization." />
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

  const members = membersQuery.data ?? []
  const invitations = invitationsQuery.data ?? []
  const teams = teamsQuery.data ?? []

  return (
    <SidebarProvider>
      <AppSidebar organization={{ access: organization.access, name: organization.name, slug: organization.slug, status: organization.status }} />
      <SidebarInset>
        <WorkspaceHeader
          organizationAccess={organization.access}
          organizationName={organization.name}
          organizationSlug={organization.slug}
          pageTitle="Staff & access"
          primaryAction={{ label: "Invite staff", onClick: () => setInviteOpen(true) }}
        />
        <PageEntrance asChild>
          <main className="flex flex-1 flex-col gap-4 bg-background px-4 py-4 lg:px-6 lg:py-5">
            <RevealGroup className="contents">
              <ComponentReveal asChild>
                <section className="flex flex-wrap items-start justify-between gap-4">
                  <h1 className="text-3xl font-semibold tracking-tight">Staff & access</h1>
                  <Button onClick={() => setInviteOpen(true)}>
                    <UserPlus data-icon="inline-start" />
                    Invite staff
                  </Button>
                </section>
              </ComponentReveal>

              {lastLink ? (
                <ComponentReveal asChild>
                  <Alert>
                    <Clipboard />
                    <AlertTitle>Invitation link ready</AlertTitle>
                    <AlertDescription className="flex flex-wrap items-center gap-2">
                      <span className="min-w-0 flex-1 truncate">{lastLink}</span>
                      <Button variant="outline" onClick={() => navigator.clipboard.writeText(lastLink)}>
                        <Clipboard data-icon="inline-start" />
                        Copy link
                      </Button>
                    </AlertDescription>
                  </Alert>
                </ComponentReveal>
              ) : null}

              <Tabs defaultValue="members">
                <TabsList>
                  {STAFF_ACCESS_TABS.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value}>
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <ComponentReveal asChild trigger="active">
                  <TabsContent value="members">
                    <Card className="border-border/60 shadow-none">
                      <CardHeader>
                        <CardTitle>Members</CardTitle>
                        <CardDescription>Roles are organization-specific and control what each member can manage.</CardDescription>
                      </CardHeader>
                      <CardContent className="overflow-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Member</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead>Team access</TableHead>
                              <TableHead>Status</TableHead>
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
                                <TableCell><TeamAccessSummary assignments={member.teamAssignments} /></TableCell>
                                <TableCell><Badge variant={member.status === "active" ? "secondary" : "outline"}>{roleLabel(member.status)}</Badge></TableCell>
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
                </ComponentReveal>

                <ComponentReveal asChild trigger="active">
                  <TabsContent value="invitations">
                    <Card className="border-border/60 shadow-none">
                      <CardHeader>
                        <CardTitle>Invitations</CardTitle>
                        <CardDescription>Pending invitations can be edited, resent, or revoked before they are accepted.</CardDescription>
                      </CardHeader>
                      <CardContent className="overflow-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Email</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead>Team access</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Expires</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {invitations.map((invitation) => (
                              <TableRow key={invitation.id}>
                                <TableCell>{invitation.email}</TableCell>
                                <TableCell><Badge variant="outline">{roleLabel(invitation.role)}</Badge></TableCell>
                                <TableCell><TeamAccessSummary assignments={invitation.teamAssignments} /></TableCell>
                                <TableCell><Badge variant="outline">{roleLabel(invitation.status)}</Badge></TableCell>
                                <TableCell>{new Date(invitation.expires_at).toLocaleDateString()}</TableCell>
                                <TableCell>
                                  <div className="flex justify-end gap-2">
                                    <Button disabled={invitation.status !== "pending"} size="sm" variant="outline" onClick={() => setInvitationToEdit(invitation)}>
                                      Edit
                                    </Button>
                                    <Button disabled={invitation.status !== "pending"} size="sm" variant="outline" onClick={() => resend(invitation.id)}>
                                      <RefreshCw data-icon="inline-start" />
                                      Resend
                                    </Button>
                                    <Button disabled={invitation.status !== "pending"} size="sm" variant="outline" onClick={() => revoke(invitation.id)}>
                                      Revoke
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </ComponentReveal>
              </Tabs>
            </RevealGroup>
          </main>
        </PageEntrance>
      </SidebarInset>

      {inviteOpen || invitationToEdit ? (
        <InvitationAccessDialog
          invitation={invitationToEdit ?? undefined}
          isTeamLoading={teamsQuery.isLoading}
          onClose={() => {
            setInviteOpen(false)
            setInvitationToEdit(null)
          }}
          onCreatedLink={setLastLink}
          organizationId={organization.id}
          organizationSlug={organization.slug}
          teamError={teamsQuery.error}
          teams={teams}
        />
      ) : null}

      {memberToEdit ? (
        <MemberAccessDialog
          isTeamLoading={teamsQuery.isLoading}
          member={memberToEdit}
          onClose={() => setMemberToEdit(null)}
          organizationId={organization.id}
          organizationSlug={organization.slug}
          teamError={teamsQuery.error}
          teams={teams}
        />
      ) : null}
    </SidebarProvider>
  )
}
