# Basketball League OS Blocker Remediation Plan

## Goal

Make `swish-api-v2` and `swish-app` code-ready for a controlled real-data basketball league pilot by closing confirmed official-record, authorization, concurrency, scoring, statistics, standings, migration, archival, frontend, and dependency blockers.

Passing this plan makes the code eligible for a controlled pilot. Hosting, production email, monitoring, backups, and game-day operations remain separate readiness requirements.

## Execution Contract

- Work directly on each repository's existing `dev` branch.
- Do not create another branch, push, or open a pull request.
- Use small, independently meaningful, tested commits.
- Check Manila time before starting every commit-sized task.
- Keep the `/goal` active until every gate passes.
- Stop all implementation at 09:00 on August 31, 2026, Asia/Manila if incomplete.
- Stop starting features at 08:40 and run only targeted verification or commit already-green work after 08:50.
- At 09:00, terminate running commands and subagents and perform no further mutations.
- If gates remain open at the deadline, leave the `/goal` unfinished rather than marking it complete or blocked.
- Do not continue automatically after the deadline; wait for a new user request.
- Never rush, hide a failing gate, or create an artificial commit to meet the deadline.

## Safety-First Order

1. Restrict official-result reopening to owners/admins with explicit override permission.
2. Close generic official-game creation and editing bypasses.
3. Block hard deletion until reversible archival exists.
4. Reject premature statistic-sheet submission.
5. Remove offline scoring queues and optimistic official scores.
6. Protect generated fixture identity.
7. Serialize matchup scheduling and resource assignments.
8. Validate and serialize scoring commands and control sessions.
9. Add append-only historical corrections and stat-sheet invalidation.
10. Unify standings, tie decisions, qualification, and progression.
11. Complete archival, migration/concurrency harnesses, browser pilots, and release gates.

## Official Records and Scheduling

- Generic game creation is exhibition-only and cannot accept official scores, matchups, competition kinds, or official lifecycle states.
- Qualifier and playoff games originate only from the current locked generated matchup.
- Generated season, division, teams, matchup, competition kind, and revision are immutable.
- Only scoring/result commands may enter `live`, `final`, or `reopened` states.
- Live and manual finalization both use `OfficialResultCoordinator`.
- Scheduling, staff assignment, audit writes, and matchup transitions occur atomically.
- Team, venue, scorekeeper, and statistician overlap checks use half-open time slots so exact boundary handoffs remain valid.

## Scoring and Statistics

- Use closed, discriminated, strictly validated scoring commands with user-safe errors.
- Enforce official-result override permission inside the reopen service transaction.
- Revalidate device ownership inside every scoring/statistics mutation transaction.
- Snapshot exactly two published rosters only when a game starts.
- Reverse any active score or foul event from the same game, retain append-only history, and rebuild all affected projections.
- Require a stopped, finalizable game before stat submission.
- Lock official score state and the stat sheet during reconciliation/finalization.
- Provide an audited pre-final stat-entry resume action and invalidate submitted sheets after scoring corrections.
- Official scores change only after server confirmation; offline or ambiguous connections disable controls.

## Competition and Standings

- Serialize format, pool, generation, reset, and scheduling changes on the division format.
- Preserve superseded generated graphs as void revisions.
- Validate qualifiers against real pool sizes and use every crossover seed exactly once.
- Require `manual_decision` as the final tiebreaker and stop automatic ranking when it is reached.
- Use `competition.standings_projections` as the sole standings source.
- Resolve one persisted unresolved tie group against an expected standings revision.
- Persist tie decisions, standings rebuilds, qualification, seeding, audits, and notifications atomically.

## Archival and History

- Add reversible archive/restore operations for seasons, divisions, teams, players, venues, and games.
- Prevent physical deletion at the database boundary and deprecate delete routes as archive aliases.
- Exclude archived records from active lists and reject new operational activity on them.
- Preserve finalized archived games in standings, brackets, leaders, awards, and public history.
- Reject archiving live/reopened games and return an archived unstarted generated fixture's matchup to `ready`.

## Release Gates

- Populated-database migrations pass `up -> down -> up` in an isolated PostgreSQL harness.
- Cross-organization and mismatched matchup links are rejected.
- Concurrent scheduling, control, finalization, submission, and tie decisions remain atomic.
- Assigned scorekeepers cannot reopen official results.
- Historical basket/foul reversals rebuild projections accurately.
- Offline scoring sends no mutation and changes no official score.
- Admin, competition, team-manager, and public standings agree exactly.
- Authenticated HTTP and browser pilots pass the two-pool crossover and direct double-elimination reset-final flows.
- API unit, E2E, migration, strict TypeScript, lint, build, and production audit gates pass.
- Frontend zero-warning lint, typecheck, component, Playwright, build, and production audit gates pass.
- Both worktrees are clean and every accepted commit is reported.

If any gate remains open at the hard deadline, leave the goal unfinished, stop all mutations, and report the exact next checkpoint.
