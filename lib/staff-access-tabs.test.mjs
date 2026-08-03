import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { STAFF_ACCESS_TABS } from "./staff-access-tabs.ts";

test("shows only members and invitations in staff access", () => {
  assert.deepEqual(STAFF_ACCESS_TABS, [
    { label: "Members", value: "members" },
    { label: "Invitations", value: "invitations" },
  ]);
});

test("keeps the staff access header concise", async () => {
  const source = await readFile(
    new URL("../components/organizations/members/staff-access-screen.tsx", import.meta.url),
    "utf8",
  );

  assert.equal(source.includes("Owner controls"), false);
  assert.equal(source.includes("Manage organization staff"), false);
});
