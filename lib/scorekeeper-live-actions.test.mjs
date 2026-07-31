import assert from "node:assert/strict";
import test from "node:test";

import { areLivePeriodActionsDisabled } from "./scorekeeper-live-actions.ts";

test("keeps scoring actions enabled while period time remains", () => {
  assert.equal(areLivePeriodActionsDisabled(1), false);
});

test("disables scoring actions when the period clock reaches zero", () => {
  assert.equal(areLivePeriodActionsDisabled(0), true);
});
