export type ScoringConnectionState =
  | "offline"
  | "reconnecting"
  | "ready"
  | "pending";

export type ScoringConnectionEvent =
  | "offline"
  | "online"
  | "server-state-confirmed"
  | "command-confirmed";

export type ScoringMutationDecision =
  | { allowed: true }
  | {
      allowed: false;
      reason: "offline" | "reconnecting" | "pending" | "control";
    };

export function canSendScoringCommand(input: {
  connection: ScoringConnectionState;
  controlValid: boolean;
  mutationPending: boolean;
}): ScoringMutationDecision {
  if (input.connection === "offline")
    return { allowed: false, reason: "offline" };
  if (input.connection === "reconnecting") {
    return { allowed: false, reason: "reconnecting" };
  }
  if (input.mutationPending || input.connection === "pending") {
    return { allowed: false, reason: "pending" };
  }
  if (!input.controlValid) return { allowed: false, reason: "control" };
  return { allowed: true };
}

export function transitionScoringConnection(
  current: ScoringConnectionState,
  event: ScoringConnectionEvent,
): ScoringConnectionState {
  if (event === "offline") return "offline";
  if (event === "online") return "reconnecting";
  if (event === "server-state-confirmed" || event === "command-confirmed") {
    return "ready";
  }
  return current;
}

export function shouldApplyScoringState(
  event: "server-state" | "command-confirmed" | "optimistic",
) {
  return event !== "optimistic";
}

export function hasFreshServerState<T>(result: {
  data?: T;
  isSuccess: boolean;
}): result is { data: T; isSuccess: true } {
  return result.isSuccess && result.data != null;
}
