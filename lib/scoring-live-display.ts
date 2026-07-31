import type { ScoringState } from "../services/scoring.service";

export function materializeClientScoringState(
  state: ScoringState,
  clientNowMs: number,
): ScoringState {
  const next: ScoringState = structuredClone(state);
  const serverTimeMs = new Date(state.serverTime).getTime();
  const elapsedSinceServerStateMs = Math.max(0, clientNowMs - serverTimeMs);

  if (next.clock.gameClockRunning && next.clock.gameClockStartedAt) {
    next.clock.gameClockRemainingMs = Math.max(
      0,
      next.clock.gameClockRemainingMs - elapsedSinceServerStateMs,
    );
  }

  if (next.clock.shotClockRunning && next.clock.shotClockStartedAt) {
    next.clock.shotClockRemainingMs = Math.max(
      0,
      next.clock.shotClockRemainingMs - elapsedSinceServerStateMs,
    );
  }

  return next;
}

export function rebaseClientScoringState(
  state: ScoringState,
  clientNowMs: number,
): ScoringState {
  const next = materializeClientScoringState(state, clientNowMs);
  const nowIso = new Date(clientNowMs).toISOString();

  next.serverTime = nowIso;
  if (next.clock.gameClockRunning) {
    next.clock.gameClockStartedAt = nowIso;
  }
  if (next.clock.shotClockRunning) {
    next.clock.shotClockStartedAt = nowIso;
  }

  return next;
}

export function isQueueableScoringError(error: unknown) {
  return !(
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "ApiRequestError"
  );
}
