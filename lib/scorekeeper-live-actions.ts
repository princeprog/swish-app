const PERIOD_CLOCK_DISPLAY_ZERO_THRESHOLD_MS = 1000;

export function areLivePeriodActionsDisabled(
  gameClockRemainingMs: number,
): boolean {
  return gameClockRemainingMs < PERIOD_CLOCK_DISPLAY_ZERO_THRESHOLD_MS;
}
