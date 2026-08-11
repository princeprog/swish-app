import type { PageSizeOption } from "@/services/pagination"

export const REVIEW_INBOX_SCOPES = [
  "needs_review",
  "all",
  "completed",
] as const

export type ComplianceReviewQueueScope = (typeof REVIEW_INBOX_SCOPES)[number]

export type ReviewInboxFilters = {
  scope: ComplianceReviewQueueScope
  search: string
  page: number
  pageSize: PageSizeOption
}

export type ReviewQueueParams = {
  scope: ComplianceReviewQueueScope
  search?: string
  page: number
  pageSize: PageSizeOption
}

export function buildReviewQueueParams(
  filters: ReviewInboxFilters,
): ReviewQueueParams {
  const search = filters.search.trim()
  return {
    page: filters.page,
    pageSize: filters.pageSize,
    scope: filters.scope,
    ...(search ? { search } : {}),
  }
}

export function reviewInboxTabFromParam(
  value: string | null,
): ComplianceReviewQueueScope {
  return value && REVIEW_INBOX_SCOPES.includes(value as ComplianceReviewQueueScope)
    ? (value as ComplianceReviewQueueScope)
    : "needs_review"
}

export function reviewInboxFiltersWithScope(
  filters: ReviewInboxFilters,
  scope: ComplianceReviewQueueScope,
): ReviewInboxFilters {
  return { ...filters, page: 1, scope }
}
