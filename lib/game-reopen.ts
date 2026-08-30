export const MINIMUM_GAME_REOPEN_REASON_LENGTH = 8;

export function getGameReopenReasonError(reason: string) {
  if (reason.trim().length < MINIMUM_GAME_REOPEN_REASON_LENGTH) {
    return `Enter a clear correction reason with at least ${MINIMUM_GAME_REOPEN_REASON_LENGTH} characters.`;
  }

  return null;
}
