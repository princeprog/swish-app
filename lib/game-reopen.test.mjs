import assert from "node:assert/strict";
import test from "node:test";

import { getGameReopenReasonError } from "./game-reopen.ts";

test("requires a meaningful audited reason before reopening a game", () => {
  assert.equal(
    getGameReopenReasonError("fix"),
    "Enter a clear correction reason with at least 8 characters.",
  );
  assert.equal(getGameReopenReasonError("  Wrong score entered  "), null);
});
