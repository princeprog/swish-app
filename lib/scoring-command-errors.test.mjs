import assert from "node:assert/strict";
import test from "node:test";

import { getFriendlyScoringCommandErrorMessage } from "./scoring-command-errors.ts";

test("uses clear period copy when the official clock still has time", () => {
  assert.equal(
    getFriendlyScoringCommandErrorMessage({
      data: { code: "PERIOD_TIME_REMAINING" },
    }),
    "The official period clock still has time left. Wait until it shows 0:00, then try again.",
  );
});

test("uses clear stale-state copy when the game was updated", () => {
  assert.equal(
    getFriendlyScoringCommandErrorMessage({
      data: { code: "STALE_SCORING_STATE" },
    }),
    "The game was updated while you were confirming. We refreshed it for you, so please try again.",
  );
});
