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
export const PROTECTED_ROUTE_PREFIXES = ["/organizations"] as const

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
  },
  organizationInvitations: {
    create: (organizationId: string) =>
      `/organizations/${organizationId}/invitations`,
    list: (organizationId: string) =>
      `/organizations/${organizationId}/invitations`,
    resend: (organizationId: string, invitationId: string) =>
      `/organizations/${organizationId}/invitations/${invitationId}/resend`,
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
    create: (organizationId: string) =>
      `/organizations/${organizationId}/league-seasons`,
    list: (organizationId: string) =>
      `/organizations/${organizationId}/league-seasons`,
  },
  divisions: {
    create: (organizationId: string) =>
      `/organizations/${organizationId}/divisions`,
    list: (organizationId: string) =>
      `/organizations/${organizationId}/divisions`,
  },
  teams: {
    create: (organizationId: string) =>
      `/organizations/${organizationId}/teams`,
    list: (organizationId: string) =>
      `/organizations/${organizationId}/teams`,
  },
  players: {
    create: (organizationId: string) =>
      `/organizations/${organizationId}/players`,
    list: (organizationId: string) =>
      `/organizations/${organizationId}/players`,
  },
  venues: {
    create: (organizationId: string) =>
      `/organizations/${organizationId}/venues`,
    list: (organizationId: string) =>
      `/organizations/${organizationId}/venues`,
  },
  schedules: {
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
  },
  standings: {
    list: (organizationId: string) =>
      `/organizations/${organizationId}/standings`,
  },
} as const
