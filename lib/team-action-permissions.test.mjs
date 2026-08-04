import assert from "node:assert/strict"
import test from "node:test"

import {
  canCreateTeams,
  canDeleteTeams,
  canEditTeams,
  isProfileOnlyTeamEdit,
} from "./team-action-permissions.js"

test("team managers can edit assigned team profiles without setup actions", () => {
  const permissions = ["teams.read.assigned", "teams.update.assigned"]

  assert.equal(canCreateTeams(permissions), false)
  assert.equal(canDeleteTeams(permissions), false)
  assert.equal(canEditTeams(permissions), true)
  assert.equal(isProfileOnlyTeamEdit(permissions), true)
})

test("admins keep full team setup actions", () => {
  const permissions = ["teams.create", "teams.update", "teams.delete"]

  assert.equal(canCreateTeams(permissions), true)
  assert.equal(canDeleteTeams(permissions), true)
  assert.equal(canEditTeams(permissions), true)
  assert.equal(isProfileOnlyTeamEdit(permissions), false)
})
