import { expect, test } from "@playwright/test";

const tournamentPilot = {
  crossoverDivisionId: process.env.PLAYWRIGHT_LIVE_CROSSOVER_DIVISION_ID,
  directDivisionId: process.env.PLAYWRIGHT_LIVE_DIRECT_DIVISION_ID,
  organizationId: process.env.PLAYWRIGHT_LIVE_ORGANIZATION_ID,
  organizationSlug: process.env.PLAYWRIGHT_LIVE_ORGANIZATION_SLUG,
  ownerEmail: process.env.PLAYWRIGHT_LIVE_OWNER_EMAIL,
  ownerPassword: process.env.PLAYWRIGHT_LIVE_OWNER_PASSWORD,
  scorekeeperEmail: process.env.PLAYWRIGHT_LIVE_SCOREKEEPER_EMAIL,
  scorekeeperPassword: process.env.PLAYWRIGHT_LIVE_SCOREKEEPER_PASSWORD,
  seasonSlug: process.env.PLAYWRIGHT_LIVE_SEASON_SLUG,
  statisticianEmail: process.env.PLAYWRIGHT_LIVE_STATISTICIAN_EMAIL,
  statisticianPassword: process.env.PLAYWRIGHT_LIVE_STATISTICIAN_PASSWORD,
};

const hasTournamentPilot = Object.values(tournamentPilot).every(Boolean);
const liveApiBaseUrl =
  process.env.PLAYWRIGHT_LIVE_API_BASE_URL ?? "http://localhost:3001";

type LivePage = import("@playwright/test").Page;

type Matchup = {
  away_team_id: string | null;
  bracket_side: string;
  home_team_id: string | null;
  id: string;
  is_reset_final: boolean;
  label: string | null;
  position: number;
  round_number: number;
  stage: string;
  status: string;
  winner_team_id: string | null;
};

type CompetitionWorkspace = {
  format: { status: string };
  matchups: Matchup[];
  pools: Array<{
    teams: Array<{ id: string; seed: number | null }>;
  }>;
};

type LiveResponse = {
  body: unknown;
  status: number;
};

async function liveRequest(
  page: LivePage,
  method: string,
  path: string,
  body?: unknown,
): Promise<LiveResponse> {
  return page.evaluate(
    async ({ body: requestBody, method: requestMethod, url }) => {
      const response = await fetch(url, {
        body:
          requestBody === undefined ? undefined : JSON.stringify(requestBody),
        credentials: "include",
        headers: { "content-type": "application/json" },
        method: requestMethod,
      });
      const text = await response.text();
      let parsed: unknown = text;
      try {
        parsed = text ? JSON.parse(text) : undefined;
      } catch {
        // Preserve non-JSON responses for the failure below.
      }
      return { body: parsed, status: response.status };
    },
    {
      body,
      method,
      url: `${liveApiBaseUrl}${path}`,
    },
  );
}

async function requestJson<T>(
  page: LivePage,
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const response = await liveRequest(page, method, path, body);
  if (response.status < 200 || response.status >= 300) {
    throw new Error(
      `${method} ${path} returned ${response.status}: ${JSON.stringify(response.body)}`,
    );
  }
  return response.body as T;
}

async function login(page: LivePage, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Your Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(/\/organizations(?:\?.*)?$/);
}

function scoreEvents(score: number) {
  const events: number[] = [];
  let remaining = score;
  for (const points of [3, 2, 1]) {
    while (remaining >= points) {
      events.push(points);
      remaining -= points;
    }
  }
  if (remaining !== 0) throw new Error(`Unable to represent score ${score}.`);
  return events;
}

async function playGame(
  ownerPage: LivePage,
  scorekeeperPage: LivePage,
  statisticianPage: LivePage,
  input: {
    divisionId: string;
    matchup: Matchup;
    statisticianMemberId: string;
    scorekeeperMemberId: string;
    venueId: string;
    gameNumber: number;
  },
) {
  const schedulePath =
    `/organizations/${tournamentPilot.organizationId}/divisions/${input.divisionId}` +
    `/competition/matchups/${input.matchup.id}/schedule`;
  const scheduled = await requestJson<{ id: string }>(
    ownerPage,
    "POST",
    schedulePath,
    {
      startsAt: new Date(
        Date.UTC(2030, 0, 1, 0, input.gameNumber * 2),
      ).toISOString(),
      statisticianMemberId: input.statisticianMemberId,
      scorekeeperMemberId: input.scorekeeperMemberId,
      venueId: input.venueId,
    },
  );
  if (!scheduled.id)
    throw new Error("The scheduled game did not return an id.");

  const gamePath = `/organizations/${tournamentPilot.organizationId}/games/${scheduled.id}`;
  const scoringPath = `${gamePath}/scoring`;
  const statisticsPath = `${gamePath}/statistics`;
  const awayWins =
    input.matchup.bracket_side === "finals" &&
    input.matchup.label === "Grand Final" &&
    !input.matchup.is_reset_final;
  const homeScore = awayWins ? 3 : 5;
  const awayScore = awayWins ? 5 : 3;

  const initial = await requestJson<{ version: number }>(
    scorekeeperPage,
    "GET",
    scoringPath,
  );
  const control = await requestJson<{ controlToken: string }>(
    scorekeeperPage,
    "POST",
    `${scoringPath}/control/claim`,
    { deviceLabel: "Browser tournament scorekeeper" },
  );
  let scoringVersion = initial.version;
  let scoringSequence = 0;
  const scoringCommand = async (
    type: string,
    payload?: Record<string, unknown>,
  ) => {
    const result = await requestJson<{ state: { version: number } }>(
      scorekeeperPage,
      "POST",
      `${scoringPath}/commands`,
      {
        controlToken: control.controlToken,
        expectedVersion: scoringVersion,
        idempotencyKey: `browser-tournament-${scheduled.id}-${scoringSequence++}`,
        occurredAt: new Date().toISOString(),
        payload,
        type,
      },
    );
    scoringVersion = result.state.version;
  };

  await scoringCommand("game.start");
  for (const points of scoreEvents(homeScore)) {
    await scoringCommand("score.record", {
      points,
      teamId: input.matchup.home_team_id,
    });
  }
  for (const points of scoreEvents(awayScore)) {
    await scoringCommand("score.record", {
      points,
      teamId: input.matchup.away_team_id,
    });
  }
  for (let period = 1; period <= 4; period += 1) {
    await scoringCommand("game_clock.adjust", {
      reason: `End period ${period} in the browser tournament pilot`,
      remainingMs: 0,
    });
    await scoringCommand("clocks.pause");
    await scoringCommand("period.end");
    if (period < 4) await scoringCommand("period.start");
  }

  const release = await liveRequest(
    scorekeeperPage,
    "DELETE",
    `${scoringPath}/control`,
    { controlToken: control.controlToken },
  );
  if (release.status !== 200) {
    throw new Error(`Scorekeeper control release returned ${release.status}.`);
  }

  const statisticsControl = await requestJson<{ controlToken: string }>(
    statisticianPage,
    "POST",
    `${statisticsPath}/control/claim`,
    { deviceLabel: "Browser tournament statistician" },
  );
  const statisticsState = await requestJson<{
    roster: Array<{ id: string; team_id: string }>;
    version: number;
  }>(statisticianPage, "GET", statisticsPath);
  const homePlayer = statisticsState.roster.find(
    (player) => player.team_id === input.matchup.home_team_id,
  );
  const awayPlayer = statisticsState.roster.find(
    (player) => player.team_id === input.matchup.away_team_id,
  );
  if (!homePlayer || !awayPlayer) {
    throw new Error(
      `Roster snapshots were not returned for game ${scheduled.id}.`,
    );
  }

  let statisticsVersion = statisticsState.version;
  let statisticsSequence = 0;
  const statistic = async (
    playerId: string,
    type: "points" | "rebound" | "assist" | "steal" | "turnover",
    value: number,
  ) => {
    const result = await requestJson<{ version: number }>(
      statisticianPage,
      "POST",
      `${statisticsPath}/events`,
      {
        controlToken: statisticsControl.controlToken,
        expectedVersion: statisticsVersion,
        idempotencyKey: `browser-tournament-stat-${scheduled.id}-${statisticsSequence++}`,
        occurredAt: new Date().toISOString(),
        playerId,
        type,
        value,
      },
    );
    statisticsVersion = result.version;
  };
  for (const points of scoreEvents(homeScore)) {
    await statistic(homePlayer.id, "points", points);
  }
  for (const points of scoreEvents(awayScore)) {
    await statistic(awayPlayer.id, "points", points);
  }
  for (const type of ["rebound", "assist", "steal", "turnover"] as const) {
    await statistic(homePlayer.id, type, 1);
  }
  await requestJson(statisticianPage, "POST", `${statisticsPath}/submit`, {
    controlToken: statisticsControl.controlToken,
  });

  const finalControl = await requestJson<{ controlToken: string }>(
    scorekeeperPage,
    "POST",
    `${scoringPath}/control/claim`,
    { deviceLabel: "Browser tournament finalization" },
  );
  const finalState = await requestJson<{ state: { phase: string } }>(
    scorekeeperPage,
    "POST",
    `${scoringPath}/commands`,
    {
      controlToken: finalControl.controlToken,
      expectedVersion: scoringVersion,
      idempotencyKey: `browser-tournament-${scheduled.id}-finalize`,
      occurredAt: new Date().toISOString(),
      type: "game.finalize",
    },
  );
  expect(finalState.state.phase).toBe("final");

  const award = await requestJson<{
    suggestion: { playerId: string };
  }>(statisticianPage, "GET", `${statisticsPath}/player-of-game`);
  await requestJson(
    statisticianPage,
    "POST",
    `${statisticsPath}/player-of-game/confirm`,
    { playerId: award.suggestion.playerId },
  );
}

async function getWorkspace(
  ownerPage: LivePage,
  divisionId: string,
): Promise<CompetitionWorkspace> {
  return requestJson(
    ownerPage,
    "GET",
    `/organizations/${tournamentPilot.organizationId}/divisions/${divisionId}/competition`,
  );
}

async function runTournament(
  ownerPage: LivePage,
  scorekeeperPage: LivePage,
  statisticianPage: LivePage,
  input: {
    directSeedTeamIds?: string[];
    divisionId: string;
    statisticianMemberId: string;
    scorekeeperMemberId: string;
    venueId: string;
  },
) {
  const competitionPath = `/organizations/${tournamentPilot.organizationId}/divisions/${input.divisionId}/competition`;
  await requestJson(
    ownerPage,
    "POST",
    `${competitionPath}/generate`,
    input.directSeedTeamIds
      ? { directSeedTeamIds: input.directSeedTeamIds }
      : {},
  );

  let gameNumber = 0;
  for (let attempt = 0; attempt < 64; attempt += 1) {
    const workspace = await getWorkspace(ownerPage, input.divisionId);
    if (workspace.format.status === "completed") {
      const finalMatchups = workspace.matchups.filter(
        (matchup) => matchup.status === "final",
      );
      return {
        gameCount: gameNumber,
        matchups: workspace.matchups,
        finalMatchups,
      };
    }
    const ready = workspace.matchups
      .filter(
        (matchup) =>
          matchup.status === "ready" &&
          matchup.home_team_id !== null &&
          matchup.away_team_id !== null,
      )
      .sort(
        (left, right) =>
          left.round_number - right.round_number ||
          left.position - right.position,
      );
    if (ready.length === 0) {
      throw new Error(
        `No playable matchup remains while ${input.divisionId} is ${workspace.format.status}.`,
      );
    }
    await playGame(ownerPage, scorekeeperPage, statisticianPage, {
      divisionId: input.divisionId,
      matchup: ready[0],
      statisticianMemberId: input.statisticianMemberId,
      scorekeeperMemberId: input.scorekeeperMemberId,
      venueId: input.venueId,
      gameNumber,
    });
    gameNumber += 1;
  }
  throw new Error(`The ${input.divisionId} tournament exceeded 64 games.`);
}

test("browser pilot completes crossover and double-elimination tournaments", async ({
  browser,
  page,
}) => {
  test.skip(
    !hasTournamentPilot,
    "Set the full PLAYWRIGHT_LIVE_* tournament variables for this pilot.",
  );
  test.setTimeout(180_000);

  await login(
    page,
    tournamentPilot.ownerEmail!,
    tournamentPilot.ownerPassword!,
  );
  const members = await requestJson<
    Array<{ email: string; id: string; role: string }>
  >(page, "GET", `/organizations/${tournamentPilot.organizationId}/members`);
  const scorekeeper = members.find(
    (member) =>
      member.role === "scorekeeper" &&
      member.email === tournamentPilot.scorekeeperEmail,
  );
  const statistician = members.find(
    (member) =>
      member.role === "statistician" &&
      member.email === tournamentPilot.statisticianEmail,
  );
  if (!scorekeeper || !statistician) {
    throw new Error(
      "The browser fixture is missing its assigned staff members.",
    );
  }
  const venues = await requestJson<{ data: Array<{ id: string }> }>(
    page,
    "GET",
    `/organizations/${tournamentPilot.organizationId}/venues?pageSize=50`,
  );
  const venue = venues.data[0];
  if (!venue) throw new Error("The browser fixture is missing a venue.");

  const directTeams = await requestJson<{
    data: Array<{ id: string; name: string }>;
  }>(
    page,
    "GET",
    `/organizations/${tournamentPilot.organizationId}/teams?divisionId=${tournamentPilot.directDivisionId}&pageSize=50&sortBy=name`,
  );
  const directSeedTeamIds = [...directTeams.data]
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((team) => team.id);
  expect(directSeedTeamIds).toHaveLength(8);

  const scorekeeperContext = await browser.newContext();
  const statisticianContext = await browser.newContext();
  try {
    const scorekeeperPage = await scorekeeperContext.newPage();
    const statisticianPage = await statisticianContext.newPage();
    await login(
      scorekeeperPage,
      tournamentPilot.scorekeeperEmail!,
      tournamentPilot.scorekeeperPassword!,
    );
    await login(
      statisticianPage,
      tournamentPilot.statisticianEmail!,
      tournamentPilot.statisticianPassword!,
    );

    const crossover = await runTournament(
      page,
      scorekeeperPage,
      statisticianPage,
      {
        divisionId: tournamentPilot.crossoverDivisionId!,
        statisticianMemberId: statistician.id,
        scorekeeperMemberId: scorekeeper.id,
        venueId: venue.id,
      },
    );
    expect(crossover.gameCount).toBe(15);
    expect(crossover.finalMatchups).toHaveLength(15);

    const direct = await runTournament(
      page,
      scorekeeperPage,
      statisticianPage,
      {
        directSeedTeamIds,
        divisionId: tournamentPilot.directDivisionId!,
        statisticianMemberId: statistician.id,
        scorekeeperMemberId: scorekeeper.id,
        venueId: venue.id,
      },
    );
    expect(direct.gameCount).toBe(15);
    expect(direct.finalMatchups).toHaveLength(15);
    const resetFinal = direct.finalMatchups.find(
      (matchup) => matchup.is_reset_final,
    );
    expect(resetFinal?.winner_team_id).toBeTruthy();

    const portal = await requestJson<{
      awards: unknown[];
      bracket: Array<{
        division_name: string;
        is_reset_final: boolean;
        status: string;
        winner_team_id: string | null;
      }>;
      leaders: unknown[];
      results: unknown[];
      standings: unknown[];
    }>(
      page,
      "GET",
      `/public/organizations/${tournamentPilot.organizationSlug}/seasons/${tournamentPilot.seasonSlug}/portal`,
    );
    expect(portal.results).toHaveLength(30);
    expect(portal.awards).toHaveLength(30);
    expect(portal.leaders.length).toBeGreaterThan(0);
    expect(portal.standings.length).toBeGreaterThanOrEqual(8);
    const publicResetFinal = portal.bracket.find(
      (matchup) =>
        matchup.division_name === "Double Elimination Division" &&
        matchup.is_reset_final,
    );
    expect(publicResetFinal?.status).toBe("final");
    expect(publicResetFinal?.winner_team_id).toBeTruthy();

    await page.goto(
      `/leagues/${tournamentPilot.organizationSlug}/${tournamentPilot.seasonSlug}`,
    );
    await page.getByRole("tab", { name: "Results" }).click();
    await expect(
      page.getByText("Final", { exact: true }).first(),
    ).toBeVisible();
    await page.getByRole("tab", { name: "Bracket" }).click();
    await expect(page.getByText("Grand Final Reset")).toBeVisible();
    await expect(page.getByText("Crossover Division")).toBeVisible();
    await page.getByRole("tab", { name: "Leaders" }).click();
    await expect(page.getByText("Captain").first()).toBeVisible();
  } finally {
    await statisticianContext.close();
    await scorekeeperContext.close();
  }
});
