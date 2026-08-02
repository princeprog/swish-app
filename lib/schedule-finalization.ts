export type ManualFinalScoreInput = {
  awayScore: string;
  homeScore: string;
};

export function canManuallyFinalizeScheduleGame(status: string) {
  return status === "scheduled";
}

export function getManualFinalScoreValidationError({
  awayScore,
  homeScore,
}: ManualFinalScoreInput) {
  const trimmedHomeScore = homeScore.trim();
  const trimmedAwayScore = awayScore.trim();

  if (!trimmedHomeScore || !trimmedAwayScore) {
    return "Enter the final score for both teams.";
  }

  const homeScoreNumber = Number(trimmedHomeScore);
  const awayScoreNumber = Number(trimmedAwayScore);

  if (
    !Number.isInteger(homeScoreNumber) ||
    !Number.isInteger(awayScoreNumber) ||
    homeScoreNumber < 0 ||
    awayScoreNumber < 0
  ) {
    return "Scores must be whole numbers of 0 or higher.";
  }

  if (homeScoreNumber === awayScoreNumber) {
    return "Basketball games need a winning team before they can be finalized.";
  }

  return null;
}

export function parseManualFinalScores({
  awayScore,
  homeScore,
}: ManualFinalScoreInput) {
  return {
    awayScore: Number(awayScore.trim()),
    homeScore: Number(homeScore.trim()),
  };
}
