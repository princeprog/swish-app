import assert from "node:assert/strict";
import test from "node:test";

import { getTimeoutControlDialog } from "./scorekeeper-timeout-controls.ts";

test("shows a confirmation dialog when a team has timeouts left", () => {
  const dialog = getTimeoutControlDialog({
    remaining: 2,
    teamName: "Bugho Slashers",
  });

  assert.equal(dialog.blocked, false);
  assert.equal(dialog.confirmLabel, "Record timeout");
  assert.match(dialog.title, /Bugho Slashers/);
});

test("blocks timeout confirmation when none remain", () => {
  const dialog = getTimeoutControlDialog({
    remaining: 0,
    teamName: "Cebu",
  });

  assert.equal(dialog.blocked, true);
  assert.equal(dialog.confirmLabel, "Close");
  assert.match(dialog.description, /no timeouts left/i);
});
