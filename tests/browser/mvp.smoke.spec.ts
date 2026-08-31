import { expect, test, type Page } from "@playwright/test";

const organization = {
  access: {
    membershipId: "member-1",
    permissions: ["game.score.assigned", "games.read.assigned"],
    role: "scorekeeper",
  },
  created_at: "2026-08-01T00:00:00.000Z",
  id: "org-1",
  name: "Demo League",
  slug: "demo-league",
  status: "active",
  updated_at: "2026-08-01T00:00:00.000Z",
};

const scoringState = {
  clock: {
    gameClockRemainingMs: 600000,
    gameClockRunning: false,
    gameClockStartedAt: null,
    shotClockRemainingMs: 24000,
    shotClockRunning: false,
    shotClockStartedAt: null,
  },
  config: {
    overtimeDurationMs: 300000,
    periodDurationMs: 600000,
    regulationPeriods: 4,
    shotClockEnabled: true,
    shotClockFullMs: 24000,
    shotClockShortMs: 14000,
    teamFoulsBeforePenalty: 4,
    timeoutsFirstHalf: 2,
    timeoutsPerOvertime: 1,
    timeoutsSecondHalf: 3,
  },
  control: {
    controlledByMe: false,
    expiresAt: null,
    status: "available",
  },
  fouls: {
    away: 0,
    awayInPenalty: false,
    home: 0,
    homeInPenalty: false,
    penaltyAt: 4,
  },
  game: {
    awayTeam: { id: "team-away", name: "Away Lions" },
    divisionName: "Open Division",
    homeTeam: { id: "team-home", name: "Home Bears" },
    id: "game-1",
    startsAt: "2026-08-01T10:00:00.000Z",
    status: "scheduled",
    venueName: "Main Court",
  },
  latestReversibleEvent: null,
  periodScores: [],
  playerFouls: [],
  roster: [],
  period: { label: "Q1", number: 1, overtimeNumber: 0 },
  phase: "pregame",
  scores: { away: 0, home: 0 },
  serverTime: "2026-08-01T09:50:00.000Z",
  timeouts: {
    allowancePerTeam: 2,
    away: { remaining: 2, used: 0 },
    home: { remaining: 2, used: 0 },
    segment: "first_half",
  },
  version: 0,
};

const publicPortal = {
  awards: [
    {
      confirmed_at: "2026-08-01T12:00:00.000Z",
      game_id: "result-1",
      player_id: "player-1",
      player_name: "Jordan Santos",
      team_id: "team-home",
      team_name: "Home Bears",
    },
  ],
  bracket: [
    {
      away_team_id: "team-away",
      away_team_name: "Away Lions",
      bracket_side: "finals",
      division_id: "division-1",
      division_name: "Open Division",
      home_team_id: "team-home",
      home_team_name: "Home Bears",
      id: "bracket-1",
      is_reset_final: false,
      label: "Championship",
      position: 1,
      round_number: 1,
      stage: "playoff",
      status: "ready",
      winner_team_id: null,
      winner_team_name: null,
    },
  ],
  divisions: [
    {
      id: "division-1",
      name: "Open Division",
      slug: "open",
      teams: [
        {
          color: "#111111",
          id: "team-home",
          name: "Home Bears",
          players: [
            { id: "player-1", jerseyNumber: "7", name: "Jordan Santos" },
          ],
          slug: "home-bears",
        },
      ],
    },
  ],
  leaders: [
    {
      assists: 4,
      player_id: "player-1",
      player_name: "Jordan Santos",
      points: 18,
      rebounds: 8,
      steals: 2,
      team_id: "team-home",
      team_name: "Home Bears",
      turnovers: 1,
    },
  ],
  organization: { id: "org-1", name: "Demo League", slug: "demo-league" },
  results: [
    {
      awayScore: 61,
      awayTeam: { id: "team-away", name: "Away Lions" },
      competitionKind: "stage",
      division: { id: "division-1", name: "Open Division" },
      homeScore: 72,
      homeTeam: { id: "team-home", name: "Home Bears" },
      id: "result-1",
      liveScoreIsUnofficial: false,
      startsAt: "2026-08-01T10:00:00.000Z",
      status: "final",
      venueName: "Main Court",
    },
  ],
  schedule: [],
  season: { id: "season-1", name: "Summer 2026", slug: "summer-2026" },
  standings: [
    {
      division_id: "division-1",
      division_name: "Open Division",
      games_played: 1,
      losses: 0,
      point_differential: 11,
      points_against: 61,
      points_for: 72,
      pool_code: "A",
      pool_name: "Pool A",
      qualification_status: "qualified",
      rank: 1,
      ranking_explanation: [],
      team_id: "team-home",
      team_name: "Home Bears",
      win_percentage: 1,
      wins: 1,
    },
  ],
};

async function mockApi(page: Page) {
  await page.route("**/auth/me", (route) =>
    route.fulfill({
      body: JSON.stringify({
        user: {
          email: "scorekeeper@example.test",
          id: "user-1",
          name: "Scorekeeper",
        },
      }),
      contentType: "application/json",
      status: 200,
    }),
  );
  await page.route("**/organizations", (route) =>
    route.fulfill({
      body: JSON.stringify([organization]),
      contentType: "application/json",
      status: 200,
    }),
  );
  await page.route("**/organizations/org-1/games/game-1/scoring", (route) =>
    route.fulfill({
      body: JSON.stringify(scoringState),
      contentType: "application/json",
      status: 200,
    }),
  );
  await page.route(
    "**/organizations/org-1/games/game-1/scoring/events**",
    (route) =>
      route.fulfill({
        body: JSON.stringify([]),
        contentType: "application/json",
        status: 200,
      }),
  );
}

test("guest can reach the sign-in surface and protected routes redirect", async ({
  page,
}) => {
  await page.route("**/auth/me", (route) =>
    route.fulfill({
      body: JSON.stringify({ message: "Please sign in to continue." }),
      contentType: "application/json",
      status: 401,
    }),
  );
  await page.route("**/auth/refresh", (route) =>
    route.fulfill({
      body: JSON.stringify({ message: "Please sign in to continue." }),
      contentType: "application/json",
      status: 401,
    }),
  );
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: "Welcome Back to Swish League OS" }),
  ).toBeVisible();
  await expect(page.getByLabel("Your Email")).toBeVisible();
  await page.goto("/organizations");
  await expect(page).toHaveURL(/\/login$/);
});

test("public league portal exposes the official tabs and result", async ({
  page,
}) => {
  await page.route(
    "**/public/organizations/demo-league/seasons/summer-2026/portal",
    (route) =>
      route.fulfill({
        body: JSON.stringify(publicPortal),
        contentType: "application/json",
        status: 200,
      }),
  );
  await page.goto("/leagues/demo-league/summer-2026");
  await expect(
    page.getByRole("heading", { name: "Demo League" }),
  ).toBeVisible();
  await expect(page.getByRole("tab", { name: "Schedule" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Results" })).toBeVisible();
  await page.getByRole("tab", { name: "Results" }).click();
  await expect(page.getByText("Home Bears").first()).toBeVisible();
  await expect(page.getByText("72–61")).toBeVisible();
  await page.getByRole("tab", { name: "Bracket" }).click();
  await expect(page.getByText("Championship")).toBeVisible();
  await page.getByRole("tab", { name: "Leaders" }).click();
  await expect(page.getByText("Jordan Santos")).toBeVisible();
});

test("assigned scorekeeper can open the pregame console", async ({
  context,
  page,
}) => {
  await context.addCookies([
    {
      name: "swish_access_token",
      url: "http://127.0.0.1:3100",
      value: "browser-test",
    },
  ]);
  await mockApi(page);
  await page.goto("/organizations/demo-league/scorekeeper/games/game-1");
  await expect(page.getByText("Pregame review")).toBeVisible();
  await expect(page.getByText("Home Bears vs Away Lions")).toBeVisible();
  await expect(page.getByRole("button", { name: "Start Game" })).toBeVisible();
});
