export type TeamAssignmentOption = {
  id: string
  leagueSeasonId: string
  leagueSeasonName: string
  name: string
}

export type TeamAssignmentSeasonGroup = {
  seasonId: string
  seasonLabel: string
  teams: TeamAssignmentOption[]
}

export type InvitationAssignmentMode = "later" | "now"

export function groupTeamsBySeason(
  teams: TeamAssignmentOption[],
): TeamAssignmentSeasonGroup[] {
  return teams.reduce<TeamAssignmentSeasonGroup[]>((groups, team) => {
    const group = groups.find((item) => item.seasonId === team.leagueSeasonId)

    if (group) {
      group.teams.push(team)
    } else {
      groups.push({
        seasonId: team.leagueSeasonId,
        seasonLabel: team.leagueSeasonName,
        teams: [team],
      })
    }

    return groups
  }, [])
}

export function replaceSeasonSelection(
  selectedIds: string[],
  seasonTeamIds: string[],
  nextTeamId: string,
): string[] {
  const otherSeasonTeamIds = selectedIds.filter(
    (id) => !seasonTeamIds.includes(id),
  )

  return nextTeamId === "none"
    ? otherSeasonTeamIds
    : [...otherSeasonTeamIds, nextTeamId]
}

export function validateInvitationAssignments(
  role: string,
  assignmentMode: InvitationAssignmentMode,
  selectedIds: string[],
): string | null {
  if (role === "team_manager" && assignmentMode === "now" && !selectedIds.length) {
    return "Select at least one team."
  }

  return null
}

export function getInvitationTeamIds(
  role: string,
  assignmentMode: InvitationAssignmentMode,
  selectedIds: string[],
): string[] {
  if (role !== "team_manager" || assignmentMode === "later") {
    return []
  }

  return selectedIds
}
