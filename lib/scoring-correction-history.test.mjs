import assert from "node:assert/strict";
import test from "node:test";

import { getCorrectionHistory } from "./scoring-correction-history.ts";

const events = [
  {
    id: "reverse-1",
    payload: { eventId: "score-1", reason: "Wrong basket" },
    reverses_event_id: "score-1",
    sequence: 3,
    type: "event.reverse",
  },
  {
    id: "score-2",
    payload: { points: 3, teamId: "away" },
    reverses_event_id: null,
    sequence: 2,
    type: "score.record",
  },
  {
    id: "score-1",
    payload: { points: 2, teamId: "home" },
    reverses_event_id: null,
    sequence: 1,
    type: "score.record",
  },
];

test("marks reversed events and leaves only active score events correctable", () => {
  const history = getCorrectionHistory(events, {
    awayTeamId: "away",
    awayTeamName: "Away",
    homeTeamId: "home",
    homeTeamName: "Home",
    latestEventId: "score-2",
  });

  assert.equal(history.find((event) => event.id === "score-1")?.isReversed, true);
  assert.equal(history.find((event) => event.id === "score-1")?.canCorrect, false);
  assert.equal(history.find((event) => event.id === "score-2")?.label, "Away +3");
  assert.equal(history.find((event) => event.id === "score-2")?.canCorrect, true);
});

test("requires a reason for an older active event", () => {
  const [older] = getCorrectionHistory(
    [
      {
        id: "foul-1",
        payload: { teamId: "home" },
        reverses_event_id: null,
        sequence: 1,
        type: "team_foul.record",
      },
    ],
    {
      awayTeamId: "away",
      awayTeamName: "Away",
      homeTeamId: "home",
      homeTeamName: "Home",
      latestEventId: "another-event",
    },
  );

  assert.equal(older?.requiresReason, true);
  assert.equal(older?.label, "Home team foul");
});
