import assert from "node:assert/strict";
import test from "node:test";

import {
  canRetryNextPeriodAfterRefresh,
  getPeriodCommandFailureMessage,
  getPeriodControlDialog,
  isPeriodTransitionBlocked,
} from "./scorekeeper-period-controls.ts";

test("blocks ending a period when game-clock time remains", () => {
  assert.equal(isPeriodTransitionBlocked(1000), true);
  assert.equal(getPeriodControlDialog("end", 1000).blocked, true);
});

test("blocks starting the next period when game-clock time remains", () => {
  assert.equal(isPeriodTransitionBlocked(1000), true);
  assert.equal(getPeriodControlDialog("next", 1000).blocked, true);
});

test("allows period controls when the game clock has reached zero", () => {
  assert.equal(isPeriodTransitionBlocked(0), false);
  assert.equal(getPeriodControlDialog("end", 0).blocked, false);
  assert.equal(getPeriodControlDialog("next", 0).blocked, false);
});

test("allows period controls when the visible clock has reached zero", () => {
  assert.equal(isPeriodTransitionBlocked(999), false);
  assert.equal(getPeriodControlDialog("next", 999).blocked, false);
});

test("uses clear copy when starting the next period fails", () => {
  assert.equal(
    getPeriodCommandFailureMessage("next"),
    "We couldn't start the next period. Please check that the clock shows 0:00, then try again.",
  );
});

test("allows retrying next period after refresh when only the game clock has expired", () => {
  assert.equal(
    canRetryNextPeriodAfterRefresh({
      commandType: "period.start",
      gameClockRemainingMs: 999,
    }),
    true,
  );
});

test("does not retry next period after refresh while game-clock time remains", () => {
  assert.equal(
    canRetryNextPeriodAfterRefresh({
      commandType: "period.start",
      gameClockRemainingMs: 1000,
    }),
    false,
  );
});
