export const mvpUserStories = [
  {
    role: "League Admin",
    story:
      "As a league admin, I can create an organization, league season, divisions, teams, players, venues, and initial roles so the league has an official setup record.",
    acceptance:
      "Season creation records game length, overtime, shot-clock use, foul penalty, and timeout rules before divisions or games are added.",
  },
  {
    role: "League Admin",
    story:
      "As a league admin, I can configure pools, round-robin qualification, crossover seeds, tiebreaker order, and single- or double-elimination playoffs so the system knows how teams advance.",
    acceptance:
      "The format is saved, visible in admin review, and unresolved tie cases require a manual decision before rankings are official.",
  },
  {
    role: "League Admin",
    story:
      "As a league admin, I can generate matchups and assign a venue, date, time, primary scorekeeper, and optional statistician so every ready game can be played.",
    acceptance:
      "Generated matchups remain in Needs scheduling until assigned, and team or venue overlaps are rejected using the season slot duration.",
  },
  {
    role: "Scorekeeper",
    story:
      "As a scorekeeper, I can open an assigned game and record official team points, player or bench fouls, timeouts, clocks, periods, corrections, and finalization events.",
    acceptance:
      "Every accepted scoring command creates an append-only event, starts from a published roster snapshot, and updates period, player-foul, team-foul, and official-score projections.",
  },
  {
    role: "Statistician",
    story:
      "As an assigned statistician, I can record player points, rebounds, assists, steals, and turnovers without changing the official scoreboard.",
    acceptance:
      "The stat sheet uses separate device control and append-only events, reconciles player points to both official team scores, and requires an audited override for a discrepancy.",
  },
  {
    role: "League Admin",
    story:
      "As a league admin, I can reopen a finalized game and enter a correction reason so disputes are handled without hiding history.",
    acceptance:
      "Reopen and re-finalize actions are recorded, dependent playoff games are protected, and standings update only after the corrected game is finalized again.",
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
    statistician: "No",
    coach: "No",
    player: "No",
    publicViewer: "No",
  },
  {
    capability: "Manage league setup",
    owner: "Full",
    admin: "Full",
    scorer: "No",
    statistician: "No",
    coach: "No",
    player: "No",
    publicViewer: "Public only",
  },
  {
    capability: "Manage teams and players",
    owner: "Full",
    admin: "Full",
    scorer: "No",
    statistician: "No",
    coach: "Assigned team roster",
    player: "No",
    publicViewer: "Public only",
  },
  {
    capability: "Create or edit schedule",
    owner: "Full",
    admin: "Full",
    scorer: "View assigned games",
    statistician: "View assigned games",
    coach: "Games involving assigned teams",
    player: "No",
    publicViewer: "Public only",
  },
  {
    capability: "Score assigned game",
    owner: "Admin override",
    admin: "Admin override",
    scorer: "Assigned games with active control",
    statistician: "No",
    coach: "No",
    player: "No",
    publicViewer: "No",
  },
  {
    capability: "Record assigned player statistics",
    owner: "Admin override",
    admin: "Admin override",
    scorer: "No",
    statistician: "Assigned games with active control",
    coach: "No",
    player: "No",
    publicViewer: "No",
  },
  {
    capability: "Finalize game",
    owner: "Yes",
    admin: "Yes",
    scorer: "If permitted",
    statistician: "No",
    coach: "No",
    player: "No",
    publicViewer: "No",
  },
  {
    capability: "Reopen finalized game",
    owner: "Yes",
    admin: "Yes",
    scorer: "No",
    statistician: "No",
    coach: "No",
    player: "No",
    publicViewer: "No",
  },
  {
    capability: "Confirm Player of the Game",
    owner: "Yes",
    admin: "Yes",
    scorer: "No",
    statistician: "Assigned statistician",
    coach: "No",
    player: "No",
    publicViewer: "No",
  },
  {
    capability: "Resolve manual tiebreaker",
    owner: "Yes",
    admin: "Yes",
    scorer: "No",
    statistician: "No",
    coach: "No",
    player: "No",
    publicViewer: "No",
  },
  {
    capability: "View public league page",
    owner: "Yes",
    admin: "Yes",
    scorer: "Yes",
    statistician: "Yes",
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
    rule: "Records an unattributed bench or team foul, increments the current-period team total, and marks the configured penalty threshold.",
  },
  {
    type: "personal_foul.record",
    payload: "gameId, teamId, rosterPlayerId, period, clocks, actorMemberId",
    rule: "Attributes the foul to the published game roster, derives the team-foul total, and marks foul-out at the season limit.",
  },
  {
    type: "timeout.record",
    payload: "gameId, teamId, inferred segment, period, clocks, actorMemberId",
    rule: "Consumes one FIBA team timeout for the current segment, pauses both clocks atomically, rejects depleted teams, and can be immediately undone.",
  },
  {
    type: "clocks.start / clocks.pause",
    payload:
      "gameId, period, gameClockRemainingMs, shotClockRemainingMs, actorMemberId",
    rule: "Game start is allowed only from pregame for scheduled games with active control; primary Start/Pause controls the game clock and the shot clock when that season uses one.",
  },
  {
    type: "shot_clock.reset / shot_clock.adjust",
    payload:
      "gameId, resetTo or remainingMs, reason when adjusting, actorMemberId",
    rule: "Shot clock can be reset independently; manual clock adjustments require a reason.",
  },
  {
    type: "event.reverse",
    payload:
      "gameId, correctionOfEventId, reason when not immediate undo, actorMemberId",
    rule: "Corrections never delete the original event.",
  },
  {
    type: "period.end / period.start",
    payload:
      "gameId, fromPeriod, toPeriod, clocks, reason when manually ending early",
    rule: "Starting the next period resets the game clock, shot clock, current-period team fouls, and timeout usage at Q3 and every overtime.",
  },
  {
    type: "game.finalize",
    payload: "gameId, finalHomeScore, finalAwayScore, actorMemberId",
    rule: "Requires completed regulation or overtime, a non-tied score, roster snapshots, and a reconciled or explicitly overridden assigned stat sheet.",
  },
  {
    type: "game.reopen",
    payload: "gameId, reason, actorMemberId",
    rule: "Owner/admin override only; clears official finalization while retaining scoring history.",
  },
];

export const statisticsEvents = [
  {
    type: "player.points",
    rule: "Adds 1, 2, or 3 points to one rostered player's box score without mutating the official team score.",
  },
  {
    type: "player.rebound / assist / steal / turnover",
    rule: "Adds one attributed box-score statistic through the statistician's independent append-only event stream.",
  },
  {
    type: "event.reverse",
    rule: "Reverses a statistic event without deleting its original history or changing official scoring events.",
  },
  {
    type: "sheet.submit",
    rule: "Reconciles player points for both teams to the official score projection before game finalization.",
  },
];

export const standingsRules = [
  "Only Final games affect official standings.",
  "A win is awarded to the team with the higher final score.",
  "Postponed and Cancelled games do not affect standings in the MVP.",
  "Forfeits are deferred unless the pilot league requires them before launch.",
  "Default tiebreaker order is win percentage, head-to-head mini-table, point differential, points scored, then an audited manual admin decision.",
  "If a 3+ team head-to-head tie cannot be resolved clearly, the system must request a manual admin decision with a reason.",
  "Manual decisions must be visible to admins and summarized for public viewers without exposing private audit internals.",
];

export const publicDataBoundary = [
  {
    category: "Public",
    data: "League name, organization name, divisions, team names, published rosters, schedule, game statuses, finalized scores, standings, brackets, leaders, and confirmed Player of the Game awards.",
  },
  {
    category: "Private",
    data: "Role invites, invite tokens, admin notes, scorekeeper/statistician assignments and device sessions, correction reasons, audit details, contact details, and private dispute notes.",
  },
  {
    category: "Conditional",
    data: "Live scores may be public only if enabled, and must be marked unofficial until finalization.",
  },
];

export const invitationFlow = [
  "Only the active organization owner can invite, resend, revoke, assign team-manager team scopes, suspend members, or transfer ownership.",
  "A user has one role per organization, but may hold a different role in another organization.",
  "Invitations are sent for admin, team manager, scorekeeper, or statistician roles; ownership moves through explicit transfer.",
  "Invitation tokens are single-use, stored only as hashes, expire after seven days, and require the signed-in email to match.",
  "Team managers are scoped to assigned teams and rosters. Scorekeepers and statisticians are scoped independently to games assigned from Schedules.",
  "After invitation acceptance, users land in the workspace that matches their role for that organization.",
];

export const notificationRoleRules = [
  {
    role: "Owner, admin, team manager, scorekeeper, and statistician",
    rule: "Receive a global inbox that follows the signed-in user across organizations. Operational fan-out uses the member's current role and team or game scope.",
  },
  {
    role: "Invitation recipient",
    rule: "May receive an invitation notification by normalized email before an account or organization membership exists. An authenticated preview and accept action requires the signed-in email to match.",
  },
  {
    role: "Player and public viewer",
    rule: "No authenticated inbox is reserved for launch. Player notifications remain deferred until player accounts are approved.",
  },
];

export const notificationDeliveryRules = [
  "PostgreSQL notification rows are the source of truth. The inbox is global across organizations, while organization filters only narrow results.",
  "Rows snapshot safe title, body, organization label, action URL, actor/resource references, priority, and action expiry. Destination permissions are checked live when a user follows an action.",
  "Authenticated Server-Sent Events send only an inbox-invalidated signal. Clients refetch after a signal, reconnect, tab focus, and network recovery; no notification content depends on the stream.",
  "The API excludes the actor by default, excludes suspended memberships, applies current role/team/game scope, and deduplicates overlapping recipient rules.",
  "Unread state supports one item, all items, and optional organization mark-all actions. Ordinary history is retained for 90 days; invitation history remains until 90 days after acceptance, revocation, or expiry.",
  "Reminder sweeps are idempotent: games notify at 24 hours and 1 hour, rosters at 72 hours and 24 hours, invitations once within 48 hours of expiry, and overdue or unassigned escalations once.",
];

export const notificationEventCatalog = [
  {
    event: "access.invitation_received",
    recipients: "Matched user or normalized invite email",
    priority: "Action",
    phase: "Launch",
  },
  {
    event: "access.invitation_resent",
    recipients: "Invitee",
    priority: "Action",
    phase: "Launch",
  },
  {
    event: "access.invitation_expiring",
    recipients: "Invitee",
    priority: "Urgent",
    phase: "Launch",
  },
  {
    event: "access.invitation_scope_changed",
    recipients: "Invitee",
    priority: "Important",
    phase: "Launch",
  },
  {
    event: "access.invitation_revoked",
    recipients: "Invitee",
    priority: "Important",
    phase: "Launch",
  },
  {
    event: "access.invitation_accepted",
    recipients: "Inviter and current owner",
    priority: "Informational",
    phase: "Launch",
  },
  {
    event: "access.member_role_changed",
    recipients: "Affected member",
    priority: "Important",
    phase: "Launch",
  },
  {
    event: "access.member_team_scope_changed",
    recipients: "Affected team manager",
    priority: "Important",
    phase: "Launch",
  },
  {
    event: "access.member_suspended",
    recipients: "Affected member",
    priority: "Urgent",
    phase: "Launch",
  },
  {
    event: "access.member_reactivated",
    recipients: "Affected member",
    priority: "Informational",
    phase: "Launch",
  },
  {
    event: "access.ownership_received",
    recipients: "New owner",
    priority: "Urgent",
    phase: "Launch",
  },
  {
    event: "access.ownership_transferred",
    recipients: "Previous owner",
    priority: "Important",
    phase: "Launch",
  },
  {
    event: "roster.deadline_set",
    recipients: "Assigned team managers",
    priority: "Important",
    phase: "Launch",
  },
  {
    event: "roster.deadline_changed",
    recipients: "Assigned team managers",
    priority: "Important",
    phase: "Launch",
  },
  {
    event: "roster.deadline_reminder",
    recipients: "Assigned manager at 72 and 24 hours",
    priority: "Action",
    phase: "Launch",
  },
  {
    event: "roster.overdue",
    recipients: "Assigned manager, owner, and admins",
    priority: "Urgent",
    phase: "Launch",
  },
  {
    event: "roster.submitted",
    recipients: "Owner and roster reviewers",
    priority: "Action",
    phase: "Launch",
  },
  {
    event: "roster.returned",
    recipients: "Assigned manager with review note",
    priority: "Action",
    phase: "Launch",
  },
  {
    event: "roster.approved",
    recipients: "Assigned manager",
    priority: "Informational",
    phase: "Launch",
  },
  {
    event: "roster.published",
    recipients: "Assigned manager",
    priority: "Informational",
    phase: "Launch",
  },
  {
    event: "roster.amendment_started",
    recipients: "Assigned manager",
    priority: "Action",
    phase: "Launch",
  },
  {
    event: "schedule.scorekeeper_assigned",
    recipients: "Newly assigned scorekeeper",
    priority: "Action",
    phase: "Launch",
  },
  {
    event: "schedule.scorekeeper_unassigned",
    recipients: "Previous scorekeeper",
    priority: "Important",
    phase: "Launch",
  },
  {
    event: "schedule.game_published",
    recipients: "Affected managers and scorekeeper",
    priority: "Informational",
    phase: "Launch",
  },
  {
    event: "schedule.game_changed",
    recipients: "Affected managers and scorekeeper",
    priority: "Important",
    phase: "Launch",
  },
  {
    event: "schedule.game_postponed",
    recipients: "Affected managers and scorekeeper",
    priority: "Urgent",
    phase: "Launch",
  },
  {
    event: "schedule.game_removed",
    recipients: "Affected published-game recipients",
    priority: "Urgent",
    phase: "Launch",
  },
  {
    event: "schedule.game_reminder",
    recipients: "Managers and scorekeeper at 24 hours and 1 hour",
    priority: "Action",
    phase: "Launch",
  },
  {
    event: "schedule.unassigned_game_reminder",
    recipients: "Owner and admins",
    priority: "Urgent",
    phase: "Launch",
  },
  {
    event: "scoring.control_taken_over",
    recipients: "Displaced scorekeeper",
    priority: "Urgent",
    phase: "Launch",
  },
  {
    event: "scoring.game_finalized",
    recipients: "Managers of both teams",
    priority: "Informational",
    phase: "Launch",
  },
  {
    event: "scoring.game_reopened",
    recipients: "Managers, scorekeeper, owner, and admins",
    priority: "Urgent",
    phase: "Launch",
  },
  {
    event: "scoring.result_corrected",
    recipients: "Managers, owner, and admins",
    priority: "Important",
    phase: "Launch",
  },
  {
    event: "standings.tie_requires_decision",
    recipients: "Owner and competition admins",
    priority: "Action",
    phase: "Launch",
  },
  {
    event: "standings.tie_decision_published",
    recipients: "Affected team managers",
    priority: "Informational",
    phase: "Launch",
  },
  {
    event: "playoffs.qualification_confirmed",
    recipients: "Qualifying team managers",
    priority: "Informational",
    phase: "Launch",
  },
  {
    event: "playoffs.matchup_set",
    recipients: "Both team managers and assigned staff",
    priority: "Action",
    phase: "Launch",
  },
  {
    event: "playoffs.matchup_changed",
    recipients: "Previously and newly affected recipients",
    priority: "Important",
    phase: "Launch",
  },
  {
    event: "playoffs.team_advanced",
    recipients: "Advancing team manager",
    priority: "Informational",
    phase: "Launch",
  },
  {
    event: "playoffs.team_eliminated",
    recipients: "Eliminated team manager",
    priority: "Informational",
    phase: "Launch",
  },
  {
    event: "playoffs.champion_confirmed",
    recipients: "Champion manager, owner, and admins",
    priority: "Informational",
    phase: "Launch",
  },
];

export const scorekeeperWorkspaceFlow = [
  "Scorekeepers land at /organizations/[slug]/scorekeeper instead of the admin workspace.",
  "The scorekeeper shell has no sidebar, setup navigation, member controls, or schedule-management actions.",
  "The frontend loads only the signed-in user's organizations and assignment-scoped game endpoints.",
  "Each game supports one optional primary scorekeeper; assignment changes are available only before the game begins.",
  "Assigned games are grouped by local browser time into needs-attention, today, upcoming, and completed sections.",
  "Assigned game detail pages open the live console at /organizations/[slug]/scorekeeper/games/[gameId].",
  "The live console uses the approved phone/tablet reference image in public/design-references/scorekeeper-console-reference.png as the hierarchy baseline.",
  "One device controls a game at a time through claim, heartbeat, release, expiry, and takeover records.",
  "Commands use idempotency keys and expected versions; short offline scoring queues locally for up to 90 seconds before the UI should block new mutations.",
  "The console uses serverTime to display running clocks, records FIBA timeouts as append-only events, and queues only genuine network failures.",
  "Finalization writes the official result to competition.games; standings continue to read only finalized results.",
  "The API remains authoritative: unassigned or cross-organization games return 404, and suspended access returns 403.",
  "Pregame scoring loads the season's latest game rules; starting the game stores a snapshot so later season edits cannot change a live or official game.",
];

export const statisticianWorkspaceFlow = [
  "Statisticians land at /organizations/[slug]/statistician and see only games assigned to them.",
  "One statistician device controls a stat sheet at a time through claim, heartbeat, expiry, and audited takeover records.",
  "Player points, rebounds, assists, steals, and turnovers use a separate append-only event stream and never change the official team score.",
  "Submission compares each team's player-point total with the official score; owners and admins may approve a discrepancy only with a private audit reason.",
  "Finalized sheets require official game reopening before correction so standings, downstream playoffs, and Player of the Game remain consistent.",
  "After finalization, the system suggests Player of the Game using points + rebounds + assists + steals - turnovers, with the winning team breaking ties.",
];

export const pilotDefinition = [
  "Eight teams split into Pools A and B with one single round-robin stage per pool.",
  "A1 vs B2 and B1 vs A2 crossover semifinals feeding a single-elimination championship game.",
  "Published roster snapshots with separate scorekeeper and statistician assignments.",
  "Every official result has reconciled player points, deterministic standings, qualifiers, progression, leaders, and Player of the Game.",
  "The public season page shows schedules, results, standings, bracket, leaders, teams, rosters, and awards without private staff or audit data.",
  "A second direct-seeded eight-team double-elimination pilot forces and completes the reset final with no team eliminated before two losses.",
  "Document-based team compliance remains parked; roster minimum/maximum rules, approval, eligibility, and published snapshots remain active.",
];

export const apiBoundary = [
  {
    area: "Frontend",
    owner: "swish-app",
    boundary:
      "Owns admin/public UI, scorekeeper and statistician shells, bracket views, docs, form state, route structure, and API client calls.",
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
