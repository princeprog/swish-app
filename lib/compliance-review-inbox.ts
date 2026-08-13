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

const REVIEW_PAGE_SIZE_OPTIONS = [10, 20, 50] as const

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

function validPositiveInteger(value: string | null) {
  if (!value || !/^\d+$/.test(value)) return null
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
}

function validPageSize(value: string | null): PageSizeOption | null {
  const parsed = Number(value)
  return REVIEW_PAGE_SIZE_OPTIONS.includes(parsed as (typeof REVIEW_PAGE_SIZE_OPTIONS)[number])
    ? (parsed as PageSizeOption)
    : null
}

export function buildComplianceReviewReturnTo(
  pathname: string,
  searchParams: Pick<URLSearchParams, "get">,
) {
  const safeParams = new URLSearchParams()
  const scope = searchParams.get("scope")
  const search = searchParams.get("search")?.trim()
  const page = validPositiveInteger(searchParams.get("page"))
  const pageSize = validPageSize(searchParams.get("pageSize"))

  if (scope && REVIEW_INBOX_SCOPES.includes(scope as ComplianceReviewQueueScope)) {
    safeParams.set("scope", scope)
  }
  if (search) safeParams.set("search", search)
  if (page) safeParams.set("page", String(page))
  if (pageSize) safeParams.set("pageSize", String(pageSize))

  const query = safeParams.toString()
  return query ? `${pathname}?${query}` : pathname
}

export function sanitizeComplianceReviewReturnTo(
  value: string | null | undefined,
  queuePath: string,
) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return queuePath
  }

  try {
    const parsed = new URL(value, "https://swish.local")
    if (
      parsed.origin !== "https://swish.local" ||
      parsed.pathname !== queuePath ||
      parsed.hash
    ) {
      return queuePath
    }

    return buildComplianceReviewReturnTo(queuePath, parsed.searchParams)
  } catch {
    return queuePath
  }
}

export function buildComplianceReviewHref(
  slug: string,
  divisionId: string,
  submissionId: string,
  returnTo: string,
) {
  const reviewPath = `/organizations/${encodeURIComponent(slug)}/divisions/${encodeURIComponent(divisionId)}/requirements/reviews/${encodeURIComponent(submissionId)}`
  const params = new URLSearchParams({ returnTo })
  return `${reviewPath}?${params.toString()}`
}
