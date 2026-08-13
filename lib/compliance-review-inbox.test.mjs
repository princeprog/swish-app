import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

import {
  buildReviewQueueParams,
  reviewInboxFiltersWithScope,
  reviewInboxTabFromParam,
} from "./compliance-review-inbox.ts"

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

test("review inbox uses accessible table, sheet, pagination, and private downloads", () => {
  assert.match(reviewQueueSource, /Table/)
  assert.match(reviewQueueSource, /Pagination/)
  assert.match(reviewDetailSource, /AlertDialog/)
  assert.match(reviewDetailSource, /SheetTitle/)
  assert.match(reviewDetailSource, /SheetDescription/)
  assert.match(reviewDetailSource, /downloadUrl/)
})

test("review detail only opens verified evidence files", () => {
  assert.match(reviewDetailSource, /file\.verification_status === "verified"/)
  assert.match(reviewDetailSource, /File is still being checked/)
  assert.match(reviewDetailSource, /file\.verification_status !== "verified"/)
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
