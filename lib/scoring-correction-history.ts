export type CorrectionHistoryEvent = {
  id: string;
  payload: Record<string, unknown>;
  reverses_event_id: string | null;
  sequence: number;
  type: string;
};

export type CorrectionHistoryContext = {
  awayTeamId: string;
  awayTeamName: string;
  homeTeamId: string;
  homeTeamName: string;
  latestEventId: string | null;
};

export type CorrectionHistoryItem = CorrectionHistoryEvent & {
  canCorrect: boolean;
  isReversed: boolean;
  label: string;
  requiresReason: boolean;
};

const REVERSIBLE_EVENT_TYPES = new Set([
  "personal_foul.record",
  "score.record",
  "team_foul.record",
  "timeout.record",
]);

export function getCorrectionHistory(
  events: CorrectionHistoryEvent[],
  context: CorrectionHistoryContext,
): CorrectionHistoryItem[] {
  const reversedIds = new Set(
    events.flatMap((event) =>
      event.reverses_event_id ? [event.reverses_event_id] : [],
    ),
  );

  return [...events]
    .sort((left, right) => right.sequence - left.sequence)
    .map((event) => {
      const isReversed = reversedIds.has(event.id);
      const canCorrect =
        !isReversed && REVERSIBLE_EVENT_TYPES.has(event.type);
      return {
        ...event,
        canCorrect,
        isReversed,
        label: formatCorrectionEvent(event, context),
        requiresReason: canCorrect && event.id !== context.latestEventId,
      };
    });
}

export function formatCorrectionEvent(
  event: CorrectionHistoryEvent,
  context: Pick<
    CorrectionHistoryContext,
    "awayTeamId" | "awayTeamName" | "homeTeamId" | "homeTeamName"
  >,
) {
  const teamId = event.payload.teamId;
  const teamName =
    teamId === context.homeTeamId
      ? context.homeTeamName
      : teamId === context.awayTeamId
        ? context.awayTeamName
        : "Team";

  if (event.type === "score.record") {
    return `${teamName} +${String(event.payload.points ?? "?")}`;
  }
  if (event.type === "personal_foul.record") {
    return `${teamName} personal foul`;
  }
  if (event.type === "team_foul.record") {
    return `${teamName} team foul`;
  }
  if (event.type === "timeout.record") {
    return `${teamName} timeout`;
  }
  if (event.type === "event.reverse") {
    return "Correction recorded";
  }
  if (event.type === "game_clock.adjust") {
    return "Game clock adjusted";
  }
  if (event.type === "shot_clock.adjust") {
    return "Shot clock adjusted";
  }
  return event.type.replaceAll(".", " ");
}
