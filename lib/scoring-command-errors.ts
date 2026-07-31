type ApiErrorLike = {
  data?: {
    code?: unknown;
  };
};

export function getFriendlyScoringCommandErrorMessage(
  error: unknown,
): string | null {
  const code =
    typeof error === "object" && error !== null && "data" in error
      ? (error as ApiErrorLike).data?.code
      : null;

  if (code === "PERIOD_TIME_REMAINING") {
    return "The official period clock still has time left. Wait until it shows 0:00, then try again.";
  }

  if (code === "STALE_SCORING_STATE") {
    return "The game was updated while you were confirming. We refreshed it for you, so please try again.";
  }

  return null;
}
