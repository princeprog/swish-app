export type PeriodControlAction = "end" | "next";

type PeriodControlDialog = {
  blocked: boolean;
  confirmLabel: string;
  description: string;
  title: string;
};

export function isPeriodTransitionBlocked(
  gameClockRemainingMs: number,
): boolean {
  return gameClockRemainingMs > 0;
}

export function canRetryNextPeriodAfterRefresh(input: {
  commandType: string;
  gameClockRemainingMs: number;
}): boolean {
  return input.commandType === "period.start" && input.gameClockRemainingMs <= 0;
}

export function getPeriodControlDialog(
  action: PeriodControlAction,
  gameClockRemainingMs: number,
): PeriodControlDialog {
  const blocked = isPeriodTransitionBlocked(gameClockRemainingMs);

  if (action === "end") {
    return {
      blocked,
      confirmLabel: "End period",
      description: blocked
        ? "There is still time left in this period. Let the clock reach 0:00 before ending it."
        : "This will stop the period and prepare the game for the next one.",
      title: blocked ? "This period still has time left" : "End this period?",
    };
  }

  return {
    blocked,
    confirmLabel: "Start next period",
    description: blocked
      ? "There is still time left in the current period. Let the clock reach 0:00 before moving on."
      : "This will reset the clocks and team fouls for the next period.",
    title: blocked ? "The next period is not ready yet" : "Start next period?",
  };
}

export function getPeriodCommandFailureMessage(
  action: PeriodControlAction,
): string {
  if (action === "end") {
    return "We couldn't end the period. Please check that the clock shows 0:00, then try again.";
  }

  return "We couldn't start the next period. Please check that the clock shows 0:00, then try again.";
}
