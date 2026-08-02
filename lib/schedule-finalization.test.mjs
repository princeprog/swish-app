import assert from "node:assert/strict";
import test from "node:test";

import {
  canManuallyFinalizeScheduleGame,
  getManualFinalScoreValidationError,
} from "./schedule-finalization.ts";

test("allows manual finalization only for scheduled games", () => {
  assert.equal(canManuallyFinalizeScheduleGame("scheduled"), true);

  for (const status of [
    "draft",
    "live",
    "final",
    "reopened",
    "postponed",
    "cancelled",
  ]) {
    assert.equal(canManuallyFinalizeScheduleGame(status), false);
  }
});

test("requires both final scores", () => {
  assert.equal(
    getManualFinalScoreValidationError({ awayScore: "77", homeScore: "" }),
    "Enter the final score for both teams.",
  );
});

test("requires whole-number final scores of zero or higher", () => {
  assert.equal(
    getManualFinalScoreValidationError({ awayScore: "77.5", homeScore: "80" }),
    "Scores must be whole numbers of 0 or higher.",
  );
  assert.equal(
    getManualFinalScoreValidationError({ awayScore: "77", homeScore: "-1" }),
    "Scores must be whole numbers of 0 or higher.",
  );
});

test("rejects tied basketball final scores", () => {
  assert.equal(
    getManualFinalScoreValidationError({ awayScore: "80", homeScore: "80" }),
    "Basketball games need a winning team before they can be finalized.",
  );
});

test("accepts valid non-tied final scores", () => {
  assert.equal(
    getManualFinalScoreValidationError({ awayScore: "79", homeScore: "82" }),
    null,
  );
});
