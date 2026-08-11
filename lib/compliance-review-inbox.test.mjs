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

test("review inbox uses accessible table, sheet, pagination, and private downloads", () => {
  assert.match(reviewQueueSource, /Table/)
  assert.match(reviewQueueSource, /Pagination/)
  assert.match(reviewDetailSource, /AlertDialog/)
  assert.match(reviewDetailSource, /SheetTitle/)
  assert.match(reviewDetailSource, /SheetDescription/)
  assert.match(reviewDetailSource, /downloadUrl/)
})
