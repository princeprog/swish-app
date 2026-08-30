import assert from "node:assert/strict";
import test from "node:test";

import {
  canSendScoringCommand,
  hasFreshServerState,
  shouldApplyScoringState,
  transitionScoringConnection,
} from "./scoring-connection-policy.ts";

test("online and ready permits one scoring mutation", () => {
  assert.deepEqual(
    canSendScoringCommand({
      connection: "ready",
      controlValid: true,
      mutationPending: false,
    }),
    { allowed: true },
  );
});

test("offline blocks without invoking a mutation", () => {
  assert.deepEqual(
    canSendScoringCommand({
      connection: "offline",
      controlValid: true,
      mutationPending: false,
    }),
    { allowed: false, reason: "offline" },
  );
});

test("reconnection remains blocked until server state is confirmed", () => {
  assert.equal(
    transitionScoringConnection("offline", "online"),
    "reconnecting",
  );
  assert.deepEqual(
    canSendScoringCommand({
      connection: "reconnecting",
      controlValid: true,
      mutationPending: false,
    }),
    { allowed: false, reason: "reconnecting" },
  );
  assert.equal(
    transitionScoringConnection("reconnecting", "server-state-confirmed"),
    "ready",
  );
});

test("pending mutations are blocked until the server confirms the prior command", () => {
  assert.deepEqual(
    canSendScoringCommand({
      connection: "pending",
      controlValid: true,
      mutationPending: true,
    }),
    { allowed: false, reason: "pending" },
  );
  assert.equal(
    transitionScoringConnection("pending", "command-confirmed"),
    "ready",
  );
});

test("only server state and command confirmation may apply scoring state", () => {
  assert.equal(shouldApplyScoringState("optimistic"), false);
  assert.equal(shouldApplyScoringState("server-state"), true);
  assert.equal(shouldApplyScoringState("command-confirmed"), true);
});

test("cached data from a failed refresh never unlocks scoring", () => {
  assert.equal(
    hasFreshServerState({ data: { version: 4 }, isSuccess: false }),
    false,
  );
  assert.equal(
    hasFreshServerState({ data: { version: 4 }, isSuccess: true }),
    true,
  );
  assert.equal(
    hasFreshServerState({ data: undefined, isSuccess: true }),
    false,
  );
});
