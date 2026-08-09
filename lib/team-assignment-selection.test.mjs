import assert from "node:assert/strict"
import test from "node:test"

import {
  getInvitationTeamIds,
  groupTeamsBySeason,
  replaceSeasonSelection,
  validateInvitationAssignments,
} from "./team-assignment-selection.ts"

const teams = [
  { id: "team-a", name: "Falcons", leagueSeasonId: "season-1", leagueSeasonName: "2026" },
  { id: "team-b", name: "Tigers", leagueSeasonId: "season-1", leagueSeasonName: "2026" },
  { id: "team-c", name: "Bulls", leagueSeasonId: "season-2", leagueSeasonName: "2027" },
]

test("groups team options by season without changing option order", () => {
  assert.deepEqual(groupTeamsBySeason(teams), [
    {
      seasonId: "season-1",
      seasonLabel: "2026",
      teams: [teams[0], teams[1]],
    },
    {
      seasonId: "season-2",
      seasonLabel: "2027",
      teams: [teams[2]],
    },
  ])
})

test("replaces only the selected season assignment", () => {
  assert.deepEqual(
    replaceSeasonSelection(["team-a", "team-c"], ["team-a", "team-b"], "team-b"),
    ["team-c", "team-b"],
  )
})

test("requires one team when assigning teams now", () => {
  assert.equal(validateInvitationAssignments("team_manager", "now", []), "Select at least one team.")
  assert.equal(validateInvitationAssignments("team_manager", "later", []), null)
})

test("clears team IDs for non-manager invitations", () => {
  assert.deepEqual(getInvitationTeamIds("admin", "now", ["team-a"]), [])
  assert.deepEqual(getInvitationTeamIds("team_manager", "now", ["team-a"]), ["team-a"])
  assert.deepEqual(getInvitationTeamIds("team_manager", "later", ["team-a"]), [])
})
