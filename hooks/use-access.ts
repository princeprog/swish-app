"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { accessService, type InvitationMutationResult, type OrganizationMember } from "@/services/access.service"

export const ACCESS_QUERY_KEYS = {
  invitations: (organizationId: string) => ["access", organizationId, "invitations"] as const,
  members: (organizationId: string) => ["access", organizationId, "members"] as const,
}

export function useOrganizationMembersQuery(organizationId?: string) {
  return useQuery({
    enabled: Boolean(organizationId),
    queryFn: () => accessService.listMembers(organizationId!),
    queryKey: ACCESS_QUERY_KEYS.members(organizationId ?? "unknown"),
    retry: false,
  })
}

export function useOrganizationInvitationsQuery(organizationId?: string) {
  return useQuery({
    enabled: Boolean(organizationId),
    queryFn: () => accessService.listInvitations(organizationId!),
    queryKey: ACCESS_QUERY_KEYS.invitations(organizationId ?? "unknown"),
    retry: false,
  })
}

export function useCreateInvitationMutation(organizationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: accessService.createInvitation.bind(null, organizationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ACCESS_QUERY_KEYS.invitations(organizationId) })
    },
  })
}

export function useResendInvitationMutation(organizationId: string) {
  const queryClient = useQueryClient()

  return useMutation<InvitationMutationResult, unknown, string>({
    mutationFn: (invitationId) => accessService.resendInvitation(organizationId, invitationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ACCESS_QUERY_KEYS.invitations(organizationId) })
    },
  })
}

export function useRevokeInvitationMutation(organizationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (invitationId: string) => accessService.revokeInvitation(organizationId, invitationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ACCESS_QUERY_KEYS.invitations(organizationId) })
    },
  })
}

export function useUpdateMemberMutation(organizationId: string) {
  const queryClient = useQueryClient()

  return useMutation<OrganizationMember, unknown, Parameters<typeof accessService.updateMember>[2] & { memberId: string }>({
    mutationFn: ({ memberId, ...payload }) => accessService.updateMember(organizationId, memberId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ACCESS_QUERY_KEYS.members(organizationId) })
    },
  })
}

export function useUpdateTeamAssignmentsMutation(organizationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ memberId, teamIds }: { memberId: string; teamIds: string[] }) =>
      accessService.updateTeamAssignments(organizationId, memberId, teamIds),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ACCESS_QUERY_KEYS.members(organizationId) })
    },
  })
}

export function useUpdateGameAssignmentsMutation(organizationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ gameIds, memberId }: { gameIds: string[]; memberId: string }) =>
      accessService.updateGameAssignments(organizationId, memberId, gameIds),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ACCESS_QUERY_KEYS.members(organizationId) })
    },
  })
}

export function useTransferOwnershipMutation(organizationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: accessService.transferOwnership.bind(null, organizationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ACCESS_QUERY_KEYS.members(organizationId) })
    },
  })
}
