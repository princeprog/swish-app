import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

import {
  buildComplianceReviewHref,
  buildComplianceReviewReturnTo,
  sanitizeComplianceReviewReturnTo,
} from "./compliance-review-inbox.ts"

const queueSource = readFileSync(
  new URL(
    "../components/organizations/compliance/division-compliance-review-queue.tsx",
    import.meta.url,
  ),
  "utf8",
)

test("preserves only validated review queue filters in returnTo", () => {
  assert.equal(
    buildComplianceReviewReturnTo(
      "/organizations/demo/divisions/division-1/requirements",
      new URLSearchParams(
        "scope=completed&search=%20Blue%20Eagles%20&page=3&pageSize=50&view=settings",
      ),
    ),
    "/organizations/demo/divisions/division-1/requirements?scope=completed&search=Blue+Eagles&page=3&pageSize=50",
  )
})

test("rejects external, mismatched, and malformed return destinations", () => {
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
      `${queuePath}?scope=invalid&page=-1`,
      queuePath,
    ),
    queuePath,
  )
})

test("queue rows link to the dedicated review page", () => {
  assert.match(queueSource, /buildComplianceReviewHref/)
  assert.match(queueSource, /buildComplianceReviewReturnTo/)
  assert.match(queueSource, /<Link href=\{href\}>Open review<\/Link>/)
  assert.doesNotMatch(queueSource, /DivisionComplianceReviewDetail/)
})

test("encodes a dedicated review route without opening a new browser tab", () => {
  assert.equal(
    buildComplianceReviewHref(
      "demo",
      "division-1",
      "submission-1",
      "/organizations/demo/divisions/division-1/requirements?search=Blue+Eagles",
    ),
    "/organizations/demo/divisions/division-1/requirements/reviews/submission-1?returnTo=%2Forganizations%2Fdemo%2Fdivisions%2Fdivision-1%2Frequirements%3Fsearch%3DBlue%2BEagles",
  )
  assert.doesNotMatch(queueSource, /window\.open/)
  assert.doesNotMatch(queueSource, /["']_blank["']/)
})
