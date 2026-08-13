import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

import {
  buildComplianceReviewHref,
  buildComplianceReviewReturnTo,
  buildReviewQueueParams,
  reviewInboxFiltersWithScope,
  reviewInboxTabFromParam,
  sanitizeComplianceReviewReturnTo,
} from "./compliance-review-inbox.ts"
import { availableComplianceReviewActions } from "./compliance-review-actions.ts"

const organizerScreenSource = readFileSync(
  new URL("../components/organizations/compliance/division-compliance-screen.tsx", import.meta.url),
  "utf8",
)
const organizerBuilderSource = readFileSync(
  new URL("../components/organizations/compliance/division-compliance-builder.tsx", import.meta.url),
  "utf8",
)
const reviewQueueSource = readFileSync(
  new URL("../components/organizations/compliance/division-compliance-review-queue.tsx", import.meta.url),
  "utf8",
)
const reviewDetailSource = readFileSync(
  new URL("../components/organizations/compliance/division-compliance-review-detail.tsx", import.meta.url),
  "utf8",
)
const reviewEvidenceSource = readFileSync(
  new URL("../components/organizations/compliance/division-compliance-review-evidence.tsx", import.meta.url),
  "utf8",
)
const reviewDecisionSource = readFileSync(
  new URL("../components/organizations/compliance/division-compliance-review-decision.tsx", import.meta.url),
  "utf8",
)
const reviewHistorySource = readFileSync(
  new URL("../components/organizations/compliance/division-compliance-review-history.tsx", import.meta.url),
  "utf8",
)
const reviewRouteSource = readFileSync(
  new URL("../app/organizations/[slug]/divisions/[divisionId]/requirements/reviews/[submissionId]/page.tsx", import.meta.url),
  "utf8",
)
const managerContentSource = readFileSync(
  new URL("../components/organizations/compliance/manager-compliance-content.tsx", import.meta.url),
  "utf8",
)
const managerRequirementSource = readFileSync(
  new URL("../components/organizations/compliance/manager-compliance-requirement.tsx", import.meta.url),
  "utf8",
)
const managerSummarySource = readFileSync(
  new URL("../components/organizations/compliance/manager-compliance-summary.tsx", import.meta.url),
  "utf8",
)
const managerHistorySource = readFileSync(
  new URL("../components/organizations/compliance/manager-compliance-history.tsx", import.meta.url),
  "utf8",
)
const complianceServiceSource = readFileSync(
  new URL("../services/compliance.service.ts", import.meta.url),
  "utf8",
)
const notificationHookSource = readFileSync(
  new URL("../hooks/use-notifications.ts", import.meta.url),
  "utf8",
)

test("omits an empty search while preserving page and page size", () => {
  assert.deepEqual(
    buildReviewQueueParams({
      page: 3,
      pageSize: 20,
      scope: "all",
      search: "   ",
    }),
    {
      page: 3,
      pageSize: 20,
      scope: "all",
    },
  )
})

test("resets the page when the queue scope changes", () => {
  assert.equal(
    reviewInboxFiltersWithScope(
      { page: 4, pageSize: 50, scope: "needs_review", search: "eagles" },
      "completed",
    ).page,
    1,
  )
})

test("falls back to needs review for an invalid URL tab", () => {
  assert.equal(reviewInboxTabFromParam("unknown"), "needs_review")
  assert.equal(reviewInboxTabFromParam(null), "needs_review")
  assert.equal(reviewInboxTabFromParam("completed"), "completed")
})

test("builds a safe return URL with the current review filters", () => {
  const returnTo = buildComplianceReviewReturnTo(
    "/organizations/demo/divisions/division-1/requirements",
    new URLSearchParams(
      "scope=completed&search=%20Blue%20Eagles%20&page=3&pageSize=50&view=settings",
    ),
  )

  assert.equal(
    returnTo,
    "/organizations/demo/divisions/division-1/requirements?scope=completed&search=Blue+Eagles&page=3&pageSize=50",
  )
})

test("rejects unsafe or mismatched review return URLs", () => {
  const queuePath = "/organizations/demo/divisions/division-1/requirements"

  assert.equal(
    sanitizeComplianceReviewReturnTo("https://evil.example", queuePath),
    queuePath,
  )
  assert.equal(
    sanitizeComplianceReviewReturnTo(
      "/organizations/other/divisions/division-1/requirements?scope=all",
      queuePath,
    ),
    queuePath,
  )
  assert.equal(
    sanitizeComplianceReviewReturnTo(
      `${queuePath}?scope=invalid&page=-1&returnTo=https%3A%2F%2Fevil.example`,
      queuePath,
    ),
    queuePath,
  )
})

test("builds a dedicated review route with an encoded safe return URL", () => {
  const href = buildComplianceReviewHref(
    "demo",
    "division-1",
    "submission-1",
    "/organizations/demo/divisions/division-1/requirements?search=Blue+Eagles",
  )

  assert.equal(
    href,
    "/organizations/demo/divisions/division-1/requirements/reviews/submission-1?returnTo=%2Forganizations%2Fdemo%2Fdivisions%2Fdivision-1%2Frequirements%3Fsearch%3DBlue%2BEagles",
  )
})

test("exposes only policy-approved review actions for each status", () => {
  assert.deepEqual(availableComplianceReviewActions("submitted"), [
    "approve",
    "request_changes",
    "waive",
  ])
  assert.deepEqual(availableComplianceReviewActions("under_review"), [
    "approve",
    "request_changes",
    "waive",
  ])
  assert.deepEqual(availableComplianceReviewActions("rejected"), [
    "reopen",
    "waive",
  ])
  assert.deepEqual(availableComplianceReviewActions("approved"), ["reopen"])
  assert.deepEqual(availableComplianceReviewActions("waived"), ["reopen"])
  assert.deepEqual(availableComplianceReviewActions("draft"), ["waive"])
  assert.deepEqual(availableComplianceReviewActions("reopened"), ["waive"])
})

test("organizer requirements workspace exposes review and settings tabs", () => {
  assert.match(organizerScreenSource, /Tabs/)
  assert.match(organizerScreenSource, /Review submissions/)
  assert.match(organizerScreenSource, /Checklist settings/)
  assert.match(organizerBuilderSource, /AlertDialog/)
  assert.match(organizerBuilderSource, /DialogHeader/)
  assert.match(organizerBuilderSource, /FieldGroup/)
})

test("requirements tabs animate only on first page-lifetime entry", () => {
  assert.match(organizerScreenSource, /visitedViews/)
  assert.match(organizerScreenSource, /new Set<RequirementsView>\(\[view\]\)/)
  assert.match(organizerScreenSource, /setRevealingView/)
  assert.match(organizerScreenSource, /variant="subtle"/)
  assert.match(organizerScreenSource, /TabPanelReveal/)
})

test("checklist settings use a focused workspace hierarchy", () => {
  assert.match(organizerBuilderSource, /Division checklist/)
  assert.match(organizerBuilderSource, /Publishing summary/)
  assert.match(organizerBuilderSource, /Published changes apply to new submissions/)
  assert.match(organizerBuilderSource, /border-b.*last:border-b-0/)
})

test("review inbox uses an accessible table, pagination, and private downloads", () => {
  assert.match(reviewQueueSource, /Table/)
  assert.match(reviewQueueSource, /Pagination/)
  assert.doesNotMatch(reviewQueueSource, /DivisionComplianceReviewDetail/)
  assert.match(reviewQueueSource, /buildComplianceReviewReturnTo/)
  assert.match(reviewQueueSource, /buildComplianceReviewHref/)
  assert.match(reviewQueueSource, /<Link/)
  assert.match(reviewDecisionSource, /AlertDialog/)
  assert.doesNotMatch(reviewDetailSource, /SheetTitle/)
  assert.doesNotMatch(reviewDetailSource, /SheetDescription/)
  assert.match(reviewEvidenceSource, /downloadUrl/)
})

test("review detail only opens verified evidence files", () => {
  assert.match(reviewEvidenceSource, /file\.verification_status === "verified"/)
  assert.match(reviewEvidenceSource, /File is still being checked/)
  assert.match(reviewEvidenceSource, /verifiedFiles/)
})

test("admin review previews verified evidence inside Swish", () => {
  assert.match(reviewEvidenceSource, /setSelectedFileId/)
  assert.match(reviewEvidenceSource, /previewCache/)
  assert.match(reviewEvidenceSource, /expiresAt/)
  assert.match(reviewEvidenceSource, /<iframe/)
  assert.match(reviewEvidenceSource, /<img/)
  assert.match(reviewEvidenceSource, /Retry/)
  assert.doesNotMatch(reviewEvidenceSource, /window\.open/)
  assert.doesNotMatch(reviewEvidenceSource, /["']_blank["']/)
})

test("admin review opens the focused submission detail and count", () => {
  assert.match(reviewQueueSource, /counts\?\.needs_review/)
  assert.match(reviewDetailSource, /useComplianceReviewDetailQuery/)
  assert.match(complianceServiceSource, /division_id: string/)
  assert.match(reviewDetailSource, /submission\.division_id !== divisionId/)
  assert.doesNotMatch(reviewDetailSource, /useTeamComplianceQuery/)
  assert.doesNotMatch(reviewDetailSource, /useComplianceHistoryQuery/)
})

test("dedicated review routing preserves direct links and has no drawer", () => {
  assert.match(reviewRouteSource, /DivisionComplianceReviewWorkspace/)
  assert.match(reviewDetailSource, /sanitizeComplianceReviewReturnTo/)
  assert.match(reviewDetailSource, /Back to review queue/)
  assert.doesNotMatch(reviewDetailSource, /<Sheet/)
  assert.match(reviewHistorySource, /Accordion/)
})

test("review decisions keep reasons inline and show the next-review flow", () => {
  assert.match(reviewDecisionSource, /Approve/)
  assert.match(reviewDecisionSource, /Request changes/)
  assert.match(reviewDecisionSource, /Waiver expiry/)
  assert.match(reviewDecisionSource, /Reopen/)
  assert.match(reviewDecisionSource, /Decision not saved/)
  assert.match(reviewDecisionSource, /onSaved\(action\)/)
  assert.match(reviewDetailSource, /Review next submission/)
  assert.match(reviewDetailSource, /nextQueueQuery\.refetch/)
})

test("compliance realtime changes refresh only matching organization caches", () => {
  assert.match(notificationHookSource, /resourceType/)
  assert.match(notificationHookSource, /organizationId/)
  assert.match(notificationHookSource, /compliance_submission/)
  assert.match(notificationHookSource, /getQueryCache/)
})

test("manager checklist uses focused shadcn workflow components and retryable uploads", () => {
  assert.match(managerContentSource, /Tabs/)
  assert.match(managerRequirementSource, /Save draft/)
  assert.match(managerRequirementSource, /Submit for review/)
  assert.match(managerContentSource, /Empty/)
  assert.match(managerSummarySource, /Progress/)
  assert.match(managerRequirementSource, /Accordion/)
  assert.match(managerRequirementSource, /FieldGroup/)
  assert.match(managerRequirementSource, /Attachment/)
  assert.match(managerHistorySource, /History/)
  assert.match(managerRequirementSource, /retry/i)
  assert.match(complianceServiceSource, /XMLHttpRequest/)
  assert.match(complianceServiceSource, /onProgress/)
})

test("manager submission uses one atomic request and saves completed uploads", () => {
  const submitStart = managerContentSource.indexOf("async function submit")
  const uploadStart = managerContentSource.indexOf("async function uploadFiles")
  const submitSource = managerContentSource.slice(submitStart, uploadStart)

  assert.doesNotMatch(submitSource, /saveMutation\.mutateAsync/)
  assert.match(submitSource, /submitMutation\.mutateAsync\(\{/)
  assert.match(submitSource, /response: responses\[requirement\.requirement_id\]/)
  assert.match(managerContentSource, /File uploaded and saved/)
  assert.match(managerContentSource, /setSavingId/)
  assert.match(managerContentSource, /savingId === requirement\.requirement_id/)
  assert.match(complianceServiceSource, /response === undefined \? undefined : \{ response \}/)
})
