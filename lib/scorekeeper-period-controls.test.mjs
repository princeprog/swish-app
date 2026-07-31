import assert from "node:assert/strict";
import test from "node:test";

import {
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
