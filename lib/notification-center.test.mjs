import assert from "node:assert/strict";
import test from "node:test";

import { buildNotificationQuery } from "./notification-center.ts";

test("builds the global notification query without an all-category value", () => {
  assert.deepEqual(
    buildNotificationQuery({ category: "all", status: "unread" }, null),
    { category: undefined, cursor: undefined, limit: 20, organizationId: undefined, status: "unread" },
  );
});

test("keeps organization and pagination filters in the API query", () => {
  assert.deepEqual(
    buildNotificationQuery(
      { category: "schedule", organizationId: "org-1", status: "all" },
      "next-page",
    ),
    { category: "schedule", cursor: "next-page", limit: 20, organizationId: "org-1", status: "all" },
  );
});
