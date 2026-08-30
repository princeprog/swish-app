# Basketball League OS MVP Goal Implementation Plan

> **For agentic workers:** Execute this plan in goal mode on the existing `dev` branches. Use test-driven development for behavior changes and verify every commit before moving to the next checkpoint.

**Goal:** Complete the web MVP from season setup through official scoring, player statistics, standings, playoff progression, awards, and public league records.

**Architecture:** A season supplies game and competition defaults that each division may override before locking. The API generates a deterministic matchup graph for round-robin and elimination formats, keeps scheduled games separate from unscheduled matchups, and coordinates finalization, standings, and advancement transactionally. Official scoring and player statistics use separate append-only event streams and device controls.

**Tech Stack:** NestJS 11, Kysely, PostgreSQL, Jest, Next.js 16 App Router, React 19, TanStack Query, Tailwind CSS, and shadcn-style components.

## Global Constraints

- Work directly on `dev` in `swish-api-v2` and `swish-app`; do not create another branch.
- Do not push or open a pull request unless separately requested.
- Keep the document-compliance subsystem parked outside the MVP user flow; retain roster limits, approval, eligibility, and published snapshots.
- Keep scorekeeper control authoritative for clocks and official team scores.
- Player statistics never mutate the official team score and must reconcile before finalization when a statistician is assigned.
- Only finalized competition games affect standings and playoff progression.
- All user-facing messages must be calm, concise, and non-technical.
- Mobile, registration, payments, forfeits, offline-first scoring, shooting attempts, blocks, minutes played, and best-of series remain deferred.

## Delivery Milestones

1. Stabilize invitation tests and lint verification; park compliance navigation and start enforcement.
2. Add season defaults, division competition settings, pools, matchup graphs, standings projections, statistics, and awards through reversible migrations.
3. Implement deterministic single/double round-robin and single/double-elimination generation, including byes, crossover seeds, losers-bracket paths, and reset finals.
4. Add needs-scheduling matchups, 90-minute default slots, and team/venue overlap protection.
5. Add a statistician role, assignment-scoped console, append-only player stats, reconciliation, and audited overrides.
6. Add roster snapshots, player-attributed fouls, period totals, and correction history to official scoring.
7. Centralize finalization, standings explanations, tie decisions, qualification, advancement, reopening safeguards, and notifications.
8. Add Player of the Game suggestions and confirmation, admin competition views, responsive brackets, and the public league portal.
9. Verify an eight-team, two-pool crossover pilot and a direct double-elimination tournament with a reset final.

## Commit Checkpoints

Use separate tested commits for baseline stabilization, each schema group, competition contracts, each generator, format locking, scheduling, statistician access, statistics, scorekeeping extensions, finalization, progression, admin UI, public UI, and final pilot documentation. Do not create empty or artificial commits.

## Completion Gate

- All migrations apply and reverse, and generated Kysely types contain the new tables.
- API tests, build, and non-mutating lint check pass.
- Frontend tests, lint, typecheck, and build pass.
- Round-robin and elimination invariants pass for odd, even, and non-power-of-two team counts.
- The pilot proves scheduling, separate score/stat operators, reconciliation, official standings, crossover qualification, bracket progression, champion confirmation, leaders, and Player of the Game in admin and public views.
