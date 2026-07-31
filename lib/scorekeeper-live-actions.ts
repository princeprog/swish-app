export function areLivePeriodActionsDisabled(
  gameClockRemainingMs: number,
): boolean {
  return gameClockRemainingMs <= 0;
}
