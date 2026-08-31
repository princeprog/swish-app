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
- All 33 checked-in database migrations are applied in the development
  database.
- The disposable PostgreSQL migration release harness passes a full
  up → rollback-all → up → list cycle across all 33 migrations.
- The database pilot covers the two-pool crossover, direct double-elimination
  reset final, Player of the Game, public leaders, and the 32-team double
  round-robin performance check.
- Frontend typecheck, production build, pure component/data tests (83 passing,
  1 intentionally skipped), zero-warning lint, and the high-severity production
  audit gate pass.
- Official result reopening, generated fixture revisions, archived history,
  online-only scoring, statistic invalidation, and player archive permissions
  have focused regression coverage.

## Open release gates

- A real browser Playwright/component harness is not installed in this
  checkout, so authenticated desktop/mobile browser pilots are not verified.
- A dedicated multi-connection PostgreSQL concurrency/release harness and a
  populated-database full up/down/up migration rehearsal still need to run in
  CI or a disposable release database.
- Production operations remain separate work: hosting, email delivery,
  monitoring, backups, restore drills, and game-day support procedures.

## Decision

The code is suitable for a controlled, supervised pilot using the verified
database workflows. Do not treat it as production-ready until the open gates
above are closed and the browser and release-database pilots pass.
