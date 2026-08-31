# MVP release-readiness snapshot

Updated 2026-09-01 (Asia/Manila).

This snapshot records what is verified in the current `dev` branches. It is a
release checklist, not a claim that the application is ready for unsupervised
production game-day use.

## Verified

- API unit suite: 88 suites, 500 tests passing.
- API e2e suite: 3 suites, 4 tests passing, including the authenticated HTTP
  registration, season setup, and public-portal smoke flow.
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
- The built Next.js server smoke check returns 200 for `/docs` and `/login`,
  and redirects unauthenticated `/` and `/organizations` requests to `/login`.
- Official result reopening, generated fixture revisions, archived history,
  online-only scoring, statistic invalidation, and player archive permissions
  have focused regression coverage.

## Open release gates

- The browser pilots currently use release-shaped fixtures intercepted at the
  browser boundary. A full authenticated browser run against a live API and
  the eight-team crossover plus direct double-elimination reset-final data is
  still not verified end to end.
- Production operations remain separate work: hosting, email delivery,
  monitoring, backups, restore drills, and game-day support procedures.

## Decision

The code is suitable for a controlled, supervised pilot using the verified
database workflows and browser smoke coverage. Do not treat it as
production-ready until the live-data browser pilot and production operations
are in place.
