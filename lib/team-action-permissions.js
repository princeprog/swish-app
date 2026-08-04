export function canCreateTeams(permissions) {
  return permissions.includes("teams.create")
}

export function canDeleteTeams(permissions) {
  return permissions.includes("teams.delete")
}

export function canEditTeams(permissions) {
  return (
    permissions.includes("teams.update") ||
    permissions.includes("teams.update.assigned")
  )
}

export function canManageTeamSetup(permissions) {
  return permissions.includes("teams.update")
}

export function isProfileOnlyTeamEdit(permissions) {
  return permissions.includes("teams.update.assigned") && !canManageTeamSetup(permissions)
}
