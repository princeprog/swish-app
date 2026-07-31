import assert from "node:assert/strict";
import test from "node:test";

import { areLivePeriodActionsDisabled } from "./scorekeeper-live-actions.ts";

test("keeps scoring actions enabled while period time remains", () => {
  assert.equal(areLivePeriodActionsDisabled(1000), false);
});

test("disables scoring actions when the visible period clock reaches zero", () => {
  assert.equal(areLivePeriodActionsDisabled(999), true);
  assert.equal(areLivePeriodActionsDisabled(0), true);
});
