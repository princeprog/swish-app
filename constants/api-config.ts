export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3001"

export const AUTH_COOKIE_NAMES = {
  access:
    process.env.AUTH_ACCESS_COOKIE_NAME ??
    process.env.NEXT_PUBLIC_AUTH_ACCESS_COOKIE_NAME ??
    "swish_access_token",
  refresh:
    process.env.AUTH_REFRESH_COOKIE_NAME ??
    process.env.NEXT_PUBLIC_AUTH_REFRESH_COOKIE_NAME ??
    "swish_refresh_token",
} as const

export const AUTH_ROUTES = ["/login", "/signup"] as const
export const AUTHENTICATED_REDIRECT_ROUTE = "/organizations"
export const PROTECTED_ROUTE_PREFIXES = ["/organizations", "/notifications"] as const

export const API_ENDPOINTS = {
  auth: {
    login: "/auth/login",
    logout: "/auth/logout",
    me: "/auth/me",
    refresh: "/auth/refresh",
    register: "/auth/register",
  },
  organizations: {
    create: "/organizations",
    list: "/organizations",
  },
  invitations: {
    accept: "/invitations/accept",
    preview: "/invitations/preview",
    byId: (invitationId: string) => `/invitations/${invitationId}`,
    acceptById: (invitationId: string) =>
      `/invitations/${invitationId}/accept`,
  },
  notifications: {
    list: "/notifications",
    unreadCount: "/notifications/unread-count",
    read: (notificationId: string) => `/notifications/${notificationId}`,
    readAll: "/notifications/read-all",
    stream: "/notifications/stream",
  },
  organizationInvitations: {
    create: (organizationId: string) =>
      `/organizations/${organizationId}/invitations`,
    list: (organizationId: string) =>
      `/organizations/${organizationId}/invitations`,
    resend: (organizationId: string, invitationId: string) =>
      `/organizations/${organizationId}/invitations/${invitationId}/resend`,
    update: (organizationId: string, invitationId: string) =>
      `/organizations/${organizationId}/invitations/${invitationId}`,
    revoke: (organizationId: string, invitationId: string) =>
      `/organizations/${organizationId}/invitations/${invitationId}`,
  },
  organizationMembers: {
    list: (organizationId: string) =>
      `/organizations/${organizationId}/members`,
    teamAssignments: (organizationId: string, memberId: string) =>
      `/organizations/${organizationId}/members/${memberId}/team-assignments`,
    transferOwnership: (organizationId: string) =>
      `/organizations/${organizationId}/ownership/transfer`,
    update: (organizationId: string, memberId: string) =>
      `/organizations/${organizationId}/members/${memberId}`,
  },
  leagueSeasons: {
    archive: (organizationId: string, leagueSeasonId: string) =>
      `/organizations/${organizationId}/league-seasons/${leagueSeasonId}/archive`,
    create: (organizationId: string) =>
      `/organizations/${organizationId}/league-seasons`,
    list: (organizationId: string) =>
      `/organizations/${organizationId}/league-seasons`,
    restore: (organizationId: string, leagueSeasonId: string) =>
      `/organizations/${organizationId}/league-seasons/${leagueSeasonId}/restore`,
  },
  divisions: {
    archive: (organizationId: string, divisionId: string) =>
      `/organizations/${organizationId}/divisions/${divisionId}/archive`,
    create: (organizationId: string) =>
      `/organizations/${organizationId}/divisions`,
    list: (organizationId: string) =>
      `/organizations/${organizationId}/divisions`,
    restore: (organizationId: string, divisionId: string) =>
      `/organizations/${organizationId}/divisions/${divisionId}/restore`,
  },
  teams: {
    archive: (organizationId: string, teamId: string) =>
      `/organizations/${organizationId}/teams/${teamId}/archive`,
    create: (organizationId: string) =>
      `/organizations/${organizationId}/teams`,
    list: (organizationId: string) =>
      `/organizations/${organizationId}/teams`,
    restore: (organizationId: string, teamId: string) =>
      `/organizations/${organizationId}/teams/${teamId}/restore`,
  },
  teamManagerWorkspace: {
    get: (organizationId: string) =>
      `/organizations/${organizationId}/team-manager-workspace`,
  },
  players: {
    archive: (organizationId: string, playerId: string) =>
      `/organizations/${organizationId}/players/${playerId}/archive`,
    create: (organizationId: string) =>
      `/organizations/${organizationId}/players`,
    list: (organizationId: string) =>
      `/organizations/${organizationId}/players`,
    restore: (organizationId: string, playerId: string) =>
      `/organizations/${organizationId}/players/${playerId}/restore`,
  },
  rosters: {
    approveTeam: (organizationId: string, teamId: string) =>
      `/organizations/${organizationId}/teams/${teamId}/roster/approve`,
    division: (organizationId: string, divisionId: string) =>
      `/organizations/${organizationId}/divisions/${divisionId}/rosters`,
    history: (organizationId: string, teamId: string) =>
      `/organizations/${organizationId}/teams/${teamId}/roster/history`,
    publishDivision: (organizationId: string, divisionId: string) =>
      `/organizations/${organizationId}/divisions/${divisionId}/rosters/publish`,
    returnTeam: (organizationId: string, teamId: string) =>
      `/organizations/${organizationId}/teams/${teamId}/roster/return`,
    settings: (organizationId: string, divisionId: string) =>
      `/organizations/${organizationId}/divisions/${divisionId}/roster-settings`,
    startAmendment: (organizationId: string, teamId: string) =>
      `/organizations/${organizationId}/teams/${teamId}/roster/start-amendment`,
    submitTeam: (organizationId: string, teamId: string) =>
      `/organizations/${organizationId}/teams/${teamId}/roster/submit`,
    team: (organizationId: string, teamId: string) =>
      `/organizations/${organizationId}/teams/${teamId}/roster`,
  },
  venues: {
    archive: (organizationId: string, venueId: string) =>
      `/organizations/${organizationId}/venues/${venueId}/archive`,
    create: (organizationId: string) =>
      `/organizations/${organizationId}/venues`,
    list: (organizationId: string) =>
      `/organizations/${organizationId}/venues`,
    restore: (organizationId: string, venueId: string) =>
      `/organizations/${organizationId}/venues/${venueId}/restore`,
  },
  schedules: {
    archive: (organizationId: string, gameId: string) =>
      `/organizations/${organizationId}/games/${gameId}/archive`,
    create: (organizationId: string) =>
      `/organizations/${organizationId}/games`,
    finalize: (organizationId: string, gameId: string) =>
      `/organizations/${organizationId}/games/${gameId}/finalize`,
    list: (organizationId: string) =>
      `/organizations/${organizationId}/games`,
    scorekeeper: (organizationId: string, gameId: string) =>
      `/organizations/${organizationId}/games/${gameId}/scorekeeper`,
    scorekeepers: (organizationId: string) =>
      `/organizations/${organizationId}/games/scorekeepers`,
    restore: (organizationId: string, gameId: string) =>
      `/organizations/${organizationId}/games/${gameId}/restore`,
  },
  standings: {
    list: (organizationId: string) =>
      `/organizations/${organizationId}/standings`,
  },
  competition: {
    workspace: (organizationId: string, divisionId: string) =>
      `/organizations/${organizationId}/divisions/${divisionId}/competition`,
  },
  compliance: {
    divisionSettings: (organizationId: string, divisionId: string) =>
      `/organizations/${organizationId}/divisions/${divisionId}/compliance/settings`,
    updateDivisionSettings: (organizationId: string, divisionId: string) =>
      `/organizations/${organizationId}/divisions/${divisionId}/compliance/settings`,
    createRequirement: (organizationId: string, divisionId: string) =>
      `/organizations/${organizationId}/divisions/${divisionId}/compliance/requirements`,
    updateRequirement: (
      organizationId: string,
      divisionId: string,
      requirementId: string,
    ) =>
      `/organizations/${organizationId}/divisions/${divisionId}/compliance/requirements/${requirementId}`,
    archiveRequirement: (
      organizationId: string,
      divisionId: string,
      requirementId: string,
    ) =>
      `/organizations/${organizationId}/divisions/${divisionId}/compliance/requirements/${requirementId}`,
    publish: (organizationId: string, divisionId: string) =>
      `/organizations/${organizationId}/divisions/${divisionId}/compliance/publish`,
    overview: (organizationId: string, divisionId: string) =>
      `/organizations/${organizationId}/divisions/${divisionId}/compliance/overview`,
    reviewQueue: (organizationId: string, divisionId: string) =>
      `/organizations/${organizationId}/divisions/${divisionId}/compliance/review-queue`,
    reviewDetail: (organizationId: string, submissionId: string) =>
      `/organizations/${organizationId}/compliance/submissions/${submissionId}/review-detail`,
    team: (organizationId: string, teamId: string) =>
      `/organizations/${organizationId}/teams/${teamId}/compliance`,
    saveDraft: (
      organizationId: string,
      teamId: string,
      requirementId: string,
    ) =>
      `/organizations/${organizationId}/teams/${teamId}/compliance/requirements/${requirementId}/draft`,
    submit: (
      organizationId: string,
      teamId: string,
      requirementId: string,
    ) =>
      `/organizations/${organizationId}/teams/${teamId}/compliance/requirements/${requirementId}/submit`,
    approve: (
      organizationId: string,
      teamId: string,
      requirementId: string,
    ) =>
      `/organizations/${organizationId}/teams/${teamId}/compliance/requirements/${requirementId}/approve`,
    requestChanges: (
      organizationId: string,
      teamId: string,
      requirementId: string,
    ) =>
      `/organizations/${organizationId}/teams/${teamId}/compliance/requirements/${requirementId}/request-changes`,
    waive: (
      organizationId: string,
      teamId: string,
      requirementId: string,
    ) =>
      `/organizations/${organizationId}/teams/${teamId}/compliance/requirements/${requirementId}/waive`,
    reopen: (
      organizationId: string,
      teamId: string,
      requirementId: string,
    ) =>
      `/organizations/${organizationId}/teams/${teamId}/compliance/requirements/${requirementId}/reopen`,
    history: (
      organizationId: string,
      teamId: string,
      requirementId: string,
    ) =>
      `/organizations/${organizationId}/teams/${teamId}/compliance/requirements/${requirementId}/history`,
    prepareUpload: (
      organizationId: string,
      teamId: string,
      requirementId: string,
    ) =>
      `/organizations/${organizationId}/teams/${teamId}/compliance/requirements/${requirementId}/uploads/prepare`,
    completeUpload: (
      organizationId: string,
      teamId: string,
      requirementId: string,
      fileId: string,
    ) =>
      `/organizations/${organizationId}/teams/${teamId}/compliance/requirements/${requirementId}/uploads/${fileId}/complete`,
    deleteUpload: (
      organizationId: string,
      teamId: string,
      requirementId: string,
      fileId: string,
    ) =>
      `/organizations/${organizationId}/teams/${teamId}/compliance/requirements/${requirementId}/uploads/${fileId}`,
    downloadUrl: (organizationId: string, teamId: string, fileId: string) =>
      `/organizations/${organizationId}/teams/${teamId}/compliance/files/${fileId}/download-url`,
  },
} as const
