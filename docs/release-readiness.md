# MVP release-readiness snapshot

Updated 2026-09-01 (Asia/Manila).

This snapshot records what is verified in the current `dev` branches. It is a
release checklist, not a claim that the application is ready for unsupervised
production game-day use.

## Verified

- API unit suite: 89 suites, 502 tests passing.
- API e2e suite: 3 suites, 5 tests passing, including the authenticated HTTP
  registration, season setup, public-portal smoke flow, and a real HTTP
  scorekeeper/statistician finalization pilot.
- API TypeScript, lint, production build, and high-severity audit gates pass.
- All 34 checked-in database migrations are applied in the development
  database.
- The disposable PostgreSQL migration release harness passes a full
  up → rollback-all → up → list cycle across all 34 migrations.
- The two-connection PostgreSQL concurrency release harness passes row-lock,
  active-control, and score/stat reversal uniqueness checks on an isolated
  migrated database.
- The migration release harness also seeds a representative league, roster,
  format, matchup, game, and scoring state before a full up → rollback-all →
  up → list cycle; the populated rehearsal passes.
- The database pilot covers the two-pool crossover, direct double-elimination
  reset final, Player of the Game, public leaders, and the 32-team double
  round-robin performance check.
- Frontend typecheck, production build, pure component/data tests (83 passing,
  1 intentionally skipped), zero-warning lint, and the high-severity production
  audit gate pass.
- Frontend Playwright smoke pilots pass on both desktop and mobile projects (6
  tests): guest auth redirects, public schedule/results/bracket/leaders tabs,
  and the assigned scorekeeper pregame console using release-shaped API
  fixtures.
- A separate `test:browser:live` project is available for an authenticated
  browser run against a running API. It takes the seeded organization, season,
  game, API origin, scorekeeper credentials, and statistician credentials through
  `PLAYWRIGHT_LIVE_API_BASE_URL`, `PLAYWRIGHT_LIVE_ORGANIZATION_ID`,
  `PLAYWRIGHT_LIVE_ORGANIZATION_SLUG`, `PLAYWRIGHT_LIVE_SEASON_SLUG`,
  `PLAYWRIGHT_LIVE_GAME_ID`, `PLAYWRIGHT_LIVE_SCOREKEEPER_EMAIL`,
  `PLAYWRIGHT_LIVE_SCOREKEEPER_PASSWORD`,
  `PLAYWRIGHT_LIVE_STATISTICIAN_EMAIL`, and
  `PLAYWRIGHT_LIVE_STATISTICIAN_PASSWORD`; it does not alter the deterministic
  default smoke command.
- The complete tournament project additionally requires
  `PLAYWRIGHT_LIVE_OWNER_EMAIL`, `PLAYWRIGHT_LIVE_OWNER_PASSWORD`,
  `PLAYWRIGHT_LIVE_CROSSOVER_DIVISION_ID`, and
  `PLAYWRIGHT_LIVE_DIRECT_DIVISION_ID` so it can generate and schedule both
  competition graphs.
- The API repository includes `node scripts/seed-browser-tournament.mjs
  --keep`, which creates a disposable migrated database with separate owner,
  scorekeeper, and statistician accounts, published one-player rosters, an
  eight-team two-pool crossover division, and an eight-team direct
  double-elimination division. The fixture prints the IDs and credentials
  needed by both live browser projects and is safe to drop after the run.
- On 2026-09-01, that live project passed against a disposable migrated
  PostgreSQL database seeded with eight teams in two pools, generated
  crossover playoff matchups, published rosters, and one scheduled game. The
  browser verified public schedule/standings/bracket/leaders/team-roster data,
  took the assigned scorekeeper through four-period online scoring, released
  and reclaimed the official control, submitted a separate statistician sheet
  with player points and box-score events, finalized the reconciled result,
  confirmed Player of the Game, and re-read the public result, standings, and
  leaders.
- On 2026-09-01, the full live tournament project passed against the persistent
  browser fixture. It generated and completed 15 crossover games and 15 direct
  double-elimination games, including a forced Grand Final Reset, confirmed
  every award, and verified the public 30-result portal, standings, leaders,
  bracket champion, and reset-final state.
- The built Next.js server smoke check returns 200 for `/docs` and `/login`,
  and redirects unauthenticated `/` and `/organizations` requests to `/login`.
- Official result reopening, generated fixture revisions, archived history,
  online-only scoring, statistic invalidation, and player archive permissions
  have focused regression coverage.

## Open release gates

- Production operations remain separate work: hosting, email delivery,
  monitoring, backups, restore drills, and game-day support procedures.

## Decision

The code is suitable for a controlled, supervised pilot using the verified
database workflows and live browser coverage. Do not treat it as
production-ready until production operations are in place.
