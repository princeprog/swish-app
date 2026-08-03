import assert from "node:assert/strict"
import test from "node:test"

import {
  canEditRosterPlayers,
  getRosterStatusLabel,
  getRosterVisibilityMessage,
} from "./roster-workflow.js"

test("labels roster workflow statuses for staff and managers", () => {
  assert.equal(getRosterStatusLabel("draft"), "Draft")
  assert.equal(getRosterStatusLabel("submitted"), "Submitted")
  assert.equal(getRosterStatusLabel("returned"), "Returned")
  assert.equal(getRosterStatusLabel("approved"), "Approved")
})

test("allows player edits only for working draft and returned rosters", () => {
  assert.equal(canEditRosterPlayers("working", "draft"), true)
  assert.equal(canEditRosterPlayers("working", "returned"), true)
  assert.equal(canEditRosterPlayers("working", "submitted"), false)
  assert.equal(canEditRosterPlayers("published", "approved"), false)
})

test("uses calm locked roster copy before release", () => {
  assert.equal(
    getRosterVisibilityMessage("hidden"),
    "Official rosters for other teams will be visible after roster release.",
  )
  assert.equal(getRosterVisibilityMessage("published"), "Published roster")
})
