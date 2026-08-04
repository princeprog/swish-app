import { API_ENDPOINTS } from "@/constants/api-config"
import { apiService } from "@/services/api.service"
import type { OrganizationRole } from "@/services/organization.service"

export type StaffAssignment = {
  id: string
  leagueSeasonId?: string
  leagueSeasonName?: string
  name?: string
  slug?: string
  homeTeamName?: string | null
  awayTeamName?: string | null
  startsAt?: string | null
}

export type OrganizationMember = {
  created_at: string
  email: string
  id: string
  name: string
  role: OrganizationRole
  status: "active" | "suspended"
  teamAssignments: StaffAssignment[]
  updated_at: string
  user_id: string
}

export type OrganizationInvitation = {
  accepted_at: string | null
  created_at: string
  email: string
  expires_at: string
  id: string
  revoked_at: string | null
  role: Exclude<OrganizationRole, "owner">
  status: "pending" | "accepted" | "expired" | "revoked"
  updated_at: string
}

export type InvitationMutationResult = OrganizationInvitation & {
  acceptanceUrl?: string
}

export type InvitationPreview = {
  email: string
  expires_at: string
  organization: {
    name: string
    slug: string
  }
  role: OrganizationRole
  status: string
}

export const accessService = {
  acceptInvitation: (token: string) =>
    apiService.post<{ membershipId?: string; success: boolean }, { token: string }>(
      API_ENDPOINTS.invitations.accept,
      { token },
      { credentials: "include" },
    ),
  createInvitation: (
    organizationId: string,
    data: { email: string; role: Exclude<OrganizationRole, "owner"> },
  ) =>
    apiService.post<InvitationMutationResult, typeof data>(
      API_ENDPOINTS.organizationInvitations.create(organizationId),
      data,
      { credentials: "include" },
    ),
  listInvitations: (organizationId: string) =>
    apiService.get<OrganizationInvitation[]>(
      API_ENDPOINTS.organizationInvitations.list(organizationId),
      { credentials: "include" },
    ),
  listMembers: (organizationId: string) =>
    apiService.get<OrganizationMember[]>(
      API_ENDPOINTS.organizationMembers.list(organizationId),
      { credentials: "include" },
    ),
  previewInvitation: (token: string) =>
    apiService.get<InvitationPreview>(API_ENDPOINTS.invitations.preview, {
      query: { token },
    }),
  resendInvitation: (organizationId: string, invitationId: string) =>
    apiService.post<InvitationMutationResult>(
      API_ENDPOINTS.organizationInvitations.resend(organizationId, invitationId),
      undefined,
      { credentials: "include" },
    ),
  revokeInvitation: (organizationId: string, invitationId: string) =>
    apiService.delete<OrganizationInvitation>(
      API_ENDPOINTS.organizationInvitations.revoke(organizationId, invitationId),
      { credentials: "include" },
    ),
  transferOwnership: (
    organizationId: string,
    data: { confirmationSlug: string; targetMemberId: string },
  ) =>
    apiService.post<{ success: boolean }, typeof data>(
      API_ENDPOINTS.organizationMembers.transferOwnership(organizationId),
      data,
      { credentials: "include" },
    ),
  updateMember: (
    organizationId: string,
    memberId: string,
    data: { role?: Exclude<OrganizationRole, "owner">; status?: "active" | "suspended" },
  ) =>
    apiService.patch<OrganizationMember, typeof data>(
      API_ENDPOINTS.organizationMembers.update(organizationId, memberId),
      data,
      { credentials: "include" },
    ),
  updateTeamAssignments: (
    organizationId: string,
    memberId: string,
    teamIds: string[],
  ) =>
    apiService.put<{ success: boolean; teamIds: string[] }, { teamIds: string[] }>(
      API_ENDPOINTS.organizationMembers.teamAssignments(organizationId, memberId),
      { teamIds },
      { credentials: "include" },
    ),
}
