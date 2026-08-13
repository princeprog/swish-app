"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  complianceService,
  type ComplianceResponseType,
  type CreateComplianceRequirementPayload,
  type UpdateComplianceSettingsPayload,
} from "@/services/compliance.service"
import {
  buildReviewQueueParams,
  type ReviewInboxFilters,
} from "@/lib/compliance-review-inbox"

const DEFAULT_REVIEW_INBOX_FILTERS: ReviewInboxFilters = {
  page: 1,
  pageSize: 20,
  scope: "needs_review",
  search: "",
}

export const COMPLIANCE_QUERY_KEYS = {
  division: (organizationId: string, divisionId: string) =>
    ["compliance", "division", organizationId, divisionId] as const,
  overview: (organizationId: string, divisionId: string) =>
    ["compliance", "overview", organizationId, divisionId] as const,
  reviewQueue: (
    organizationId: string,
    divisionId: string,
    filters: ReviewInboxFilters = DEFAULT_REVIEW_INBOX_FILTERS,
  ) =>
    [
      "compliance",
      "review-queue",
      organizationId,
      divisionId,
      filters.scope,
      filters.search,
      filters.page,
      filters.pageSize,
    ] as const,
  reviewDetail: (organizationId: string, submissionId: string) =>
    ["compliance", "review-detail", organizationId, submissionId] as const,
  history: (organizationId: string, teamId: string, requirementId: string) =>
    ["compliance", "history", organizationId, teamId, requirementId] as const,
  team: (organizationId: string, teamId: string) =>
    ["compliance", "team", organizationId, teamId] as const,
}

export function useDivisionComplianceQuery(
  organizationId?: string,
  divisionId?: string,
) {
  return useQuery({
    enabled: Boolean(organizationId && divisionId),
    queryFn: () => complianceService.getDivision(organizationId!, divisionId!),
    queryKey: COMPLIANCE_QUERY_KEYS.division(
      organizationId ?? "unknown",
      divisionId ?? "unknown",
    ),
    retry: false,
  })
}

export function useDivisionComplianceOverviewQuery(
  organizationId?: string,
  divisionId?: string,
) {
  return useQuery({
    enabled: Boolean(organizationId && divisionId),
    queryFn: () =>
      complianceService.getOverview(organizationId!, divisionId!),
    queryKey: COMPLIANCE_QUERY_KEYS.overview(
      organizationId ?? "unknown",
      divisionId ?? "unknown",
    ),
    retry: false,
  })
}

export function useComplianceReviewQueueQuery(
  organizationId?: string,
  divisionId?: string,
  filters: ReviewInboxFilters = DEFAULT_REVIEW_INBOX_FILTERS,
) {
  return useQuery({
    enabled: Boolean(organizationId && divisionId),
    queryFn: () =>
      complianceService.getReviewQueue(organizationId!, divisionId!, {
        ...buildReviewQueueParams(filters),
      }),
    queryKey: COMPLIANCE_QUERY_KEYS.reviewQueue(
      organizationId ?? "unknown",
      divisionId ?? "unknown",
      filters,
    ),
    retry: false,
  })
}

export function useComplianceReviewDetailQuery(
  organizationId?: string,
  submissionId?: string,
  enabled = true,
) {
  return useQuery({
    enabled: Boolean(enabled && organizationId && submissionId),
    queryFn: () =>
      complianceService.getReviewDetail(organizationId!, submissionId!),
    queryKey: COMPLIANCE_QUERY_KEYS.reviewDetail(
      organizationId ?? "unknown",
      submissionId ?? "unknown",
    ),
    retry: false,
  })
}

export function useComplianceHistoryQuery(
  organizationId?: string,
  teamId?: string,
  requirementId?: string,
  enabled = true,
) {
  return useQuery({
    enabled: Boolean(
      enabled && organizationId && teamId && requirementId,
    ),
    queryFn: () =>
      complianceService.history(organizationId!, teamId!, requirementId!),
    queryKey: COMPLIANCE_QUERY_KEYS.history(
      organizationId ?? "unknown",
      teamId ?? "unknown",
      requirementId ?? "unknown",
    ),
    retry: false,
  })
}

export function useTeamComplianceQuery(
  organizationId?: string,
  teamId?: string,
  enabled = true,
) {
  return useQuery({
    enabled: Boolean(enabled && organizationId && teamId),
    queryFn: () => complianceService.getTeam(organizationId!, teamId!),
    queryKey: COMPLIANCE_QUERY_KEYS.team(
      organizationId ?? "unknown",
      teamId ?? "unknown",
    ),
    retry: false,
  })
}

function useComplianceInvalidation(organizationId: string) {
  const queryClient = useQueryClient()
  return async () => {
    await queryClient.invalidateQueries({ queryKey: ["compliance"] })
    await queryClient.invalidateQueries({
      queryKey: ["team-manager-workspace", organizationId],
    })
  }
}

export function useUpdateComplianceSettingsMutation(
  organizationId: string,
  divisionId: string,
) {
  const invalidate = useComplianceInvalidation(organizationId)
  return useMutation({
    mutationFn: (payload: UpdateComplianceSettingsPayload) =>
      complianceService.updateDivisionSettings(
        organizationId,
        divisionId,
        payload,
      ),
    onSuccess: invalidate,
  })
}

export function useCreateComplianceRequirementMutation(
  organizationId: string,
  divisionId: string,
) {
  const invalidate = useComplianceInvalidation(organizationId)
  return useMutation({
    mutationFn: (payload: CreateComplianceRequirementPayload) =>
      complianceService.createRequirement(organizationId, divisionId, payload),
    onSuccess: invalidate,
  })
}

export function useUpdateComplianceRequirementMutation(
  organizationId: string,
  divisionId: string,
  requirementId: string,
) {
  const invalidate = useComplianceInvalidation(organizationId)
  return useMutation({
    mutationFn: (payload: Partial<CreateComplianceRequirementPayload>) =>
      complianceService.updateRequirement(
        organizationId,
        divisionId,
        requirementId,
        payload,
      ),
    onSuccess: invalidate,
  })
}

export function useArchiveComplianceRequirementMutation(
  organizationId: string,
  divisionId: string,
  requirementId: string,
) {
  const invalidate = useComplianceInvalidation(organizationId)
  return useMutation({
    mutationFn: () =>
      complianceService.archiveRequirement(
        organizationId,
        divisionId,
        requirementId,
      ),
    onSuccess: invalidate,
  })
}

export function usePublishComplianceMutation(
  organizationId: string,
  divisionId: string,
) {
  const invalidate = useComplianceInvalidation(organizationId)
  return useMutation({
    mutationFn: () => complianceService.publish(organizationId, divisionId),
    onSuccess: invalidate,
  })
}

export function useSaveComplianceDraftMutation(
  organizationId: string,
  teamId: string,
  requirementId: string,
) {
  const invalidate = useComplianceInvalidation(organizationId)
  return useMutation({
    mutationFn: (response: unknown) =>
      complianceService.saveDraft(
        organizationId,
        teamId,
        requirementId,
        response,
      ),
    onSuccess: invalidate,
  })
}

export function useSubmitComplianceMutation(
  organizationId: string,
  teamId: string,
  requirementId: string,
) {
  const invalidate = useComplianceInvalidation(organizationId)
  return useMutation({
    mutationFn: (response?: unknown) =>
      complianceService.submit(
        organizationId,
        teamId,
        requirementId,
        response,
      ),
    onSuccess: invalidate,
  })
}

export function useComplianceReviewMutation(
  organizationId: string,
  teamId: string,
  requirementId: string,
) {
  const invalidate = useComplianceInvalidation(organizationId)
  return {
    approve: useMutation({
      mutationFn: () =>
        complianceService.approve(organizationId, teamId, requirementId),
      onSuccess: invalidate,
    }),
    requestChanges: useMutation({
      mutationFn: (reason: string) =>
        complianceService.requestChanges(
          organizationId,
          teamId,
          requirementId,
          reason,
        ),
      onSuccess: invalidate,
    }),
    waive: useMutation({
      mutationFn: (payload: { expiresAt?: string; reason: string }) =>
        complianceService.waive(
          organizationId,
          teamId,
          requirementId,
          payload.reason,
          payload.expiresAt,
        ),
      onSuccess: invalidate,
    }),
    reopen: useMutation({
      mutationFn: (reason: string) =>
        complianceService.reopen(
          organizationId,
          teamId,
          requirementId,
          reason,
        ),
      onSuccess: invalidate,
    }),
  }
}

export type { ComplianceResponseType }
