import assert from "node:assert/strict";
import test from "node:test";

import { materializeClientScoringState } from "./scoring-live-display.ts";

function scoringState(overrides = {}) {
  return {
    clock: {
      gameClockRemainingMs: 600000,
      gameClockRunning: true,
      gameClockStartedAt: "2026-07-31T02:00:00.000Z",
      shotClockRemainingMs: 24000,
      shotClockRunning: true,
      shotClockStartedAt: "2026-07-31T02:00:00.000Z",
    },
    config: {
      overtimeDurationMs: 300000,
      periodDurationMs: 600000,
      regulationPeriods: 4,
      shotClockFullMs: 24000,
      shotClockShortMs: 14000,
    },
    control: {
      controlledByMe: true,
      expiresAt: "2026-07-31T02:02:00.000Z",
      sessionId: "session-1",
      status: "claimed",
    },
    fouls: {
      away: 0,
      awayInPenalty: false,
      home: 0,
      homeInPenalty: false,
      penaltyAt: 4,
    },
    game: {
      awayTeam: { id: "away-team", name: "Away" },
      divisionName: "Open",
      homeTeam: { id: "home-team", name: "Home" },
      id: "game-1",
      startsAt: "2026-07-31T02:00:00.000Z",
      status: "live",
      venueName: "Court 1",
    },
    latestReversibleEvent: null,
    period: {
      label: "Q1",
      number: 1,
      overtimeNumber: 0,
    },
    phase: "live",
    scores: {
      away: 0,
      home: 0,
    },
    serverTime: "2026-07-31T02:00:05.000Z",
    timeouts: {
      allowancePerTeam: 2,
      away: { remaining: 2, used: 0 },
      home: { remaining: 2, used: 0 },
      segment: "first_half",
    },
    version: 1,
    ...overrides,
  };
}

test("materializes live clocks from the API serverTime instead of device start anchors", () => {
  const displayed = materializeClientScoringState(
    scoringState(),
    new Date("2026-07-31T02:00:08.000Z").getTime(),
  );

  assert.equal(displayed.clock.gameClockRemainingMs, 597000);
  assert.equal(displayed.clock.shotClockRemainingMs, 21000);
});
