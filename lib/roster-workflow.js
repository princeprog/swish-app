export function getRosterStatusLabel(status) {
  if (status === "submitted") return "Submitted"
  if (status === "approved") return "Approved"
  if (status === "returned") return "Returned"
  return "Draft"
}

export function canEditRosterPlayers(visibility, status) {
  return visibility === "working" && (status === "draft" || status === "returned")
}

export function getRosterVisibilityMessage(visibility) {
  if (visibility === "hidden") {
    return "Official rosters for other teams will be visible after roster release."
  }

  if (visibility === "published") {
    return "Published roster"
  }

  return "Working roster"
}
