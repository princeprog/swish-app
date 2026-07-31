export const mvpUserStories = [
  {
    role: "League Admin",
    story:
      "As a league admin, I can create an organization, league season, divisions, teams, players, venues, and initial roles so the league has an official setup record.",
    acceptance:
      "The league has at least one division, teams can be added manually, players have jersey numbers, and the league can be viewed by admins.",
  },
  {
    role: "League Admin",
    story:
      "As a league admin, I can configure a guided basketball format, tiebreaker order, qualifier counts, and playoff shape so the system knows how teams advance.",
    acceptance:
      "The format is saved, visible in admin review, and unresolved tie cases require a manual decision before rankings are official.",
  },
  {
    role: "League Admin",
    story:
      "As a league admin, I can create and publish scheduled games with teams, venue, date, time, and assigned scorer so the league schedule is clear.",
    acceptance:
      "Scheduled games appear in admin and public views with clear status labels.",
  },
  {
    role: "Scorekeeper",
    story:
      "As a scorekeeper, I can open an assigned game and record team points, team fouls, team timeouts, clocks, quarter changes, corrections, and finalization events.",
    acceptance:
      "Every accepted scoring command creates an append-only event and updates a current-state projection; player attribution and timeout-duration countdowns remain deferred.",
  },
  {
    role: "League Admin",
    story:
      "As a league admin, I can reopen a finalized game and enter a correction reason so disputes are handled without hiding history.",
    acceptance:
      "Reopen and re-finalize actions are recorded, and standings update only after the corrected game is finalized again.",
  },
  {
    role: "Public Viewer",
    story:
      "As a public viewer, I can open a league page and see schedules, results, standings, rosters, brackets, and leaders without seeing private admin data.",
    acceptance:
      "Public pages display official finalized data by default and mark live data as unofficial if live display is enabled.",
  },
];

export const permissionMatrix = [
  {
    capability: "Manage organization settings and staff access",
    owner: "Full",
    admin: "No",
    scorer: "No",
    coach: "No",
    player: "No",
    publicViewer: "No",
  },
  {
    capability: "Manage league setup",
    owner: "Full",
    admin: "Full",
    scorer: "No",
    coach: "No",
    player: "No",
    publicViewer: "Public only",
  },
  {
    capability: "Manage teams and players",
    owner: "Full",
    admin: "Full",
    scorer: "No",
    coach: "Assigned team roster",
    player: "No",
    publicViewer: "Public only",
  },
  {
    capability: "Create or edit schedule",
    owner: "Full",
    admin: "Full",
    scorer: "View assigned games",
    coach: "Games involving assigned teams",
    player: "No",
    publicViewer: "Public only",
  },
  {
    capability: "Score assigned game",
    owner: "Admin override",
    admin: "Admin override",
    scorer: "Assigned games with active control",
    coach: "No",
    player: "No",
    publicViewer: "No",
  },
  {
    capability: "Finalize game",
    owner: "Yes",
    admin: "Yes",
    scorer: "If permitted",
    coach: "No",
    player: "No",
    publicViewer: "No",
  },
  {
    capability: "Reopen finalized game",
    owner: "Yes",
    admin: "Yes",
    scorer: "No",
    coach: "No",
    player: "No",
    publicViewer: "No",
  },
  {
    capability: "Resolve manual tiebreaker",
    owner: "Yes",
    admin: "Yes",
    scorer: "No",
    coach: "No",
    player: "No",
    publicViewer: "No",
  },
  {
    capability: "View public league page",
    owner: "Yes",
    admin: "Yes",
    scorer: "Yes",
    coach: "Yes",
    player: "Yes",
    publicViewer: "Yes when public",
  },
];

export const gameLifecycle = [
  {
    status: "Draft",
    meaning: "Game exists in admin setup but is not ready for public schedule.",
    allowedNext: "Scheduled, Cancelled",
  },
  {
    status: "Scheduled",
    meaning:
      "Game is published or ready to publish with teams, venue, and time.",
    allowedNext: "Live, Postponed, Cancelled",
  },
  {
    status: "Live",
    meaning: "Scoring is open and events may be recorded.",
    allowedNext: "Final, Postponed",
  },
  {
    status: "Final",
    meaning: "Game result is official and can affect standings and playoffs.",
    allowedNext: "Reopened by admin",
  },
  {
    status: "Reopened",
    meaning:
      "A finalized game was reopened for dispute correction with a reason.",
    allowedNext: "Live, Final",
  },
  {
    status: "Postponed",
    meaning: "Game will be rescheduled and should not affect standings.",
    allowedNext: "Scheduled, Cancelled",
  },
  {
    status: "Cancelled",
    meaning:
      "Game will not be played and should not affect standings unless future forfeit rules say otherwise.",
    allowedNext: "Scheduled only by admin override",
  },
];

export const scoringEvents = [
  {
    type: "score.record",
    payload: "gameId, teamId, points, period, clocks, actorMemberId",
    rule: "Points must be 1, 2, or 3 and the team must belong to the scheduled game.",
  },
  {
    type: "team_foul.record",
    payload: "gameId, teamId, period, clocks, actorMemberId",
    rule: "Increments current-period team fouls for the selected team and marks penalty at four team fouls.",
  },
  {
    type: "timeout.record",
    payload: "gameId, teamId, inferred segment, period, clocks, actorMemberId",
    rule: "Consumes one FIBA team timeout for the current segment, pauses both clocks atomically, rejects depleted teams, and can be immediately undone.",
  },
  {
    type: "clocks.start / clocks.pause",
    payload: "gameId, period, gameClockRemainingMs, shotClockRemainingMs, actorMemberId",
    rule: "Game start is allowed only from pregame for scheduled games with active control; primary Start/Pause controls both clocks using server timestamp anchors.",
  },
  {
    type: "shot_clock.reset / shot_clock.adjust",
    payload: "gameId, resetTo or remainingMs, reason when adjusting, actorMemberId",
    rule: "Shot clock can be reset independently; manual clock adjustments require a reason.",
  },
  {
    type: "event.reverse",
    payload: "gameId, correctionOfEventId, reason when not immediate undo, actorMemberId",
    rule: "Corrections never delete the original event.",
  },
  {
    type: "period.end / period.start",
    payload: "gameId, fromPeriod, toPeriod, clocks, reason when manually ending early",
    rule: "Starting the next period resets the game clock, shot clock, current-period team fouls, and timeout usage at Q3 and every overtime.",
  },
  {
    type: "game.finalize",
    payload: "gameId, finalHomeScore, finalAwayScore, actorMemberId",
    rule: "Requires paused clocks, completed regulation or overtime, no queued commands, and a non-tied score.",
  },
  {
    type: "game.reopen",
    payload: "gameId, reason, actorMemberId",
    rule: "Owner/admin override only; clears official finalization while retaining scoring history.",
  },
];

export const standingsRules = [
  "Only Final games affect official standings.",
  "A win is awarded to the team with the higher final score.",
  "Postponed and Cancelled games do not affect standings in the MVP.",
  "Forfeits are deferred unless the pilot league requires them before launch.",
  "Default tiebreaker order is win-loss record, head-to-head result, point differential, points scored, then manual admin decision.",
  "If a 3+ team head-to-head tie cannot be resolved clearly, the system must request a manual admin decision with a reason.",
  "Manual decisions must be visible to admins and summarized for public viewers without exposing private audit internals.",
];

export const publicDataBoundary = [
  {
    category: "Public",
    data: "League name, organization name, divisions, team names, rosters, schedule, game statuses, finalized scores, standings, brackets, and basic leaders.",
  },
  {
    category: "Private",
    data: "Role invites, invite tokens, admin notes, scorer assignment internals, correction audit details, user contact details, and private dispute notes.",
  },
  {
    category: "Conditional",
    data: "Live scores may be public only if enabled, and must be marked unofficial until finalization.",
  },
];

export const invitationFlow = [
  "Only the active organization owner can invite, resend, revoke, assign staff scopes, suspend members, or transfer ownership.",
  "A user has one role per organization, but may hold a different role in another organization.",
  "Invitations are sent for admin, team manager, or scorekeeper roles only; ownership moves through explicit transfer.",
  "Invitation tokens are single-use, stored only as hashes, expire after seven days, and require the signed-in email to match.",
  "Team managers are scoped to assigned teams and rosters. Scorekeepers are scoped to explicitly assigned games.",
  "After invitation acceptance, users land in the workspace that matches their role for that organization.",
];

export const scorekeeperWorkspaceFlow = [
  "Scorekeepers land at /organizations/[slug]/scorekeeper instead of the admin workspace.",
  "The scorekeeper shell has no sidebar, setup navigation, member controls, or schedule-management actions.",
  "The frontend loads only the signed-in user's organizations and assignment-scoped game endpoints.",
  "Assigned games are grouped by local browser time into needs-attention, today, upcoming, and completed sections.",
  "Assigned game detail pages open the live console at /organizations/[slug]/scorekeeper/games/[gameId].",
  "The live console uses the approved phone/tablet reference image in public/design-references/scorekeeper-console-reference.png as the hierarchy baseline.",
  "One device controls a game at a time through claim, heartbeat, release, expiry, and takeover records.",
  "Commands use idempotency keys and expected versions; short offline scoring queues locally for up to 90 seconds before the UI should block new mutations.",
  "The console uses serverTime to display running clocks, records FIBA timeouts as append-only events, and queues only genuine network failures.",
  "Finalization writes the official result to competition.games; standings continue to read only finalized results.",
  "The API remains authoritative: unassigned or cross-organization games return 404, and suspended access returns 403.",
];

export const pilotDefinition = [
  "One league season with one organization and one primary division.",
  "8 to 12 teams, manually entered by the league admin.",
  "At least 8 players per team, with jersey numbers.",
  "Manual schedule covering at least one round-robin stage.",
  "At least two scorers assigned to games.",
  "At least 10 finalized games used to calculate standings.",
  "Top 4 single-elimination playoff bracket.",
  "Public page shared with coaches, players, and viewers.",
];

export const apiBoundary = [
  {
    area: "Frontend",
    owner: "swish-app",
    boundary:
      "Owns admin/public UI, scorekeeper shell, docs, form state, route structure, and API client calls.",
  },
  {
    area: "Backend",
    owner: "swish-api-v2",
    boundary:
      "Owns auth/session integration, permissions, persistence, domain rules, scoring calculations, standings, brackets, and public read models.",
  },
  {
    area: "Contracts",
    owner: "Shared later",
    boundary:
      "DTOs and generated clients should be introduced deliberately when API endpoints stabilize.",
  },
  {
    area: "First API style",
    owner: "swish-api-v2",
    boundary:
      "Start with REST endpoints and explicit DTOs before introducing more complex transport patterns.",
  },
];
