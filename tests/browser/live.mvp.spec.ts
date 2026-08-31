import { expect, test } from "@playwright/test";

const livePilot = {
  gameId: process.env.PLAYWRIGHT_LIVE_GAME_ID,
  organizationId: process.env.PLAYWRIGHT_LIVE_ORGANIZATION_ID,
  organizationSlug: process.env.PLAYWRIGHT_LIVE_ORGANIZATION_SLUG,
  scorekeeperEmail: process.env.PLAYWRIGHT_LIVE_SCOREKEEPER_EMAIL,
  scorekeeperPassword: process.env.PLAYWRIGHT_LIVE_SCOREKEEPER_PASSWORD,
  seasonSlug: process.env.PLAYWRIGHT_LIVE_SEASON_SLUG,
  statisticianEmail: process.env.PLAYWRIGHT_LIVE_STATISTICIAN_EMAIL,
  statisticianPassword: process.env.PLAYWRIGHT_LIVE_STATISTICIAN_PASSWORD,
};

const hasLivePilot = Object.values(livePilot).every(Boolean);
const liveApiBaseUrl =
  process.env.PLAYWRIGHT_LIVE_API_BASE_URL ?? "http://localhost:3001";

type LiveResponse = {
  body: unknown;
  status: number;
};

async function liveRequest(
  page: import("@playwright/test").Page,
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
        // Keep the response text for a useful failure message below.
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

async function liveScoringCommand(
  page: import("@playwright/test").Page,
  type: string,
  controlToken: string,
  expectedVersion: number,
  payload?: Record<string, unknown>,
) {
  const response = await liveRequest(
    page,
    "POST",
    `/organizations/${livePilot.organizationId}/games/${livePilot.gameId}/scoring/commands`,
    {
      controlToken,
      expectedVersion,
      idempotencyKey: `live-browser-${Date.now()}-${type.replaceAll(".", "-")}`,
      occurredAt: new Date().toISOString(),
      payload,
      type,
    },
  );
  expect(response.status).toBe(201);
  const result = response.body as { state: { version: number } };
  return result.state.version;
}

async function liveScoringState(page: import("@playwright/test").Page) {
  const response = await liveRequest(
    page,
    "GET",
    `/organizations/${livePilot.organizationId}/games/${livePilot.gameId}/scoring`,
  );
  expect(response.status).toBe(200);
  return response.body as { version: number };
}

async function waitForScoringCommand(
  page: import("@playwright/test").Page,
  action: () => Promise<void>,
) {
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/scoring/commands") &&
      response.request().method() === "POST",
  );
  await action();
  const response = await responsePromise;
  expect(response.status()).toBe(201);
}

test("live pilot loads public data and both assigned staff workspaces", async ({
  browser,
  page,
}) => {
  test.skip(
    !hasLivePilot,
    "Set the PLAYWRIGHT_LIVE_* variables for a seeded API pilot.",
  );

  await page.goto("/login");
  await page.getByLabel("Your Email").fill(livePilot.scorekeeperEmail!);
  await page.getByLabel("Password").fill(livePilot.scorekeeperPassword!);
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(/\/organizations(?:\?.*)?$/);

  await page.goto(
    `/leagues/${livePilot.organizationSlug}/${livePilot.seasonSlug}`,
  );
  await expect(page.getByRole("tab", { name: "Schedule" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Standings" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Bracket" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Leaders" })).toBeVisible();

  await expect(page.getByText("A1 Live Team")).toBeVisible();
  await page.getByRole("tab", { name: "Bracket" }).click();
  await expect(page.getByText("Championship")).toBeVisible();
  await page.getByRole("tab", { name: "Teams & Rosters" }).click();
  await expect(page.getByText("1 player").first()).toBeVisible();

  await page.goto(
    `/organizations/${livePilot.organizationSlug}/scorekeeper/games/${livePilot.gameId}`,
  );
  await expect(page.getByText("Pregame review")).toBeVisible();
  await expect(page.getByText("Start Game")).toBeVisible();

  const claimResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/scoring/control/claim") &&
      response.request().method() === "POST",
  );
  const startCommandPromise = page.waitForResponse(
    (response) =>
      response.url().includes("/scoring/commands") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Start Game" }).click();
  await page.getByRole("button", { name: "Start live scoring" }).click();
  const claimResponse = await claimResponsePromise;
  const startCommandResponse = await startCommandPromise;
  expect(claimResponse.status()).toBe(201);
  expect(startCommandResponse.status()).toBe(201);
  const control = (await claimResponse.json()) as { controlToken: string };
  let scoringVersion = (
    (await startCommandResponse.json()) as { state: { version: number } }
  ).state.version;

  await waitForScoringCommand(page, () =>
    page
      .getByRole("button", { name: /Add 2 points for .* Live Team/ })
      .first()
      .click(),
  );
  await waitForScoringCommand(page, () =>
    page
      .getByRole("button", { name: /Add 3 points for .* Live Team/ })
      .last()
      .click(),
  );
  scoringVersion = (await liveScoringState(page)).version;

  for (let period = 1; period <= 4; period += 1) {
    scoringVersion = await liveScoringCommand(
      page,
      "game_clock.adjust",
      control.controlToken,
      scoringVersion,
      {
        reason: `End quarter ${period} in the live browser pilot`,
        remainingMs: 0,
      },
    );
    scoringVersion = await liveScoringCommand(
      page,
      "clocks.pause",
      control.controlToken,
      scoringVersion,
    );
    scoringVersion = await liveScoringCommand(
      page,
      "period.end",
      control.controlToken,
      scoringVersion,
    );
    if (period < 4) {
      scoringVersion = await liveScoringCommand(
        page,
        "period.start",
        control.controlToken,
        scoringVersion,
      );
    }
  }

  const releaseResponse = await liveRequest(
    page,
    "DELETE",
    `/organizations/${livePilot.organizationId}/games/${livePilot.gameId}/scoring/control`,
    { controlToken: control.controlToken },
  );
  expect(releaseResponse.status).toBe(200);
  await page.reload();
  await page.getByRole("button", { name: "More" }).click();
  await page.getByRole("button", { name: "Claim" }).click();
  await expect(page.getByRole("button", { name: "Finalize" })).toBeEnabled();

  const statisticianContext = await browser.newContext();
  try {
    const statisticianPage = await statisticianContext.newPage();
    await statisticianPage.goto("/login");
    await statisticianPage
      .getByLabel("Your Email")
      .fill(livePilot.statisticianEmail!);
    await statisticianPage
      .getByLabel("Password")
      .fill(livePilot.statisticianPassword!);
    await statisticianPage.getByRole("button", { name: "Login" }).click();
    await expect(statisticianPage).toHaveURL(/\/organizations(?:\?.*)?$/);
    await statisticianPage.goto(
      `/organizations/${livePilot.organizationSlug}/statistician/games/${livePilot.gameId}`,
    );
    await expect(statisticianPage.getByText("Stat sheet")).toBeVisible();
    await expect(
      statisticianPage.getByRole("button", { name: "Claim control" }),
    ).toBeVisible();
    await expect(
      statisticianPage.getByRole("button", { name: "Submit stat sheet" }),
    ).toBeVisible();
    await statisticianPage
      .getByRole("button", { name: "Claim control" })
      .click();
    await expect(statisticianPage.getByText("Control active")).toBeVisible();
    await statisticianPage
      .getByRole("button", { name: "+2 PT" })
      .first()
      .click();
    await statisticianPage
      .getByRole("button", { name: "+3 PT" })
      .last()
      .click();
    for (const label of ["+REB", "+AST", "+STL", "+TOV"]) {
      await statisticianPage
        .getByRole("button", { name: label })
        .first()
        .click();
    }
    await statisticianPage
      .getByRole("button", { name: "Submit stat sheet" })
      .click();
    await expect(
      statisticianPage.getByText("The stat sheet is submitted"),
    ).toBeVisible();

    await page.getByRole("button", { name: "Finalize" }).click();
    await page.getByRole("button", { name: "Finalize game" }).click();
    await expect(page.getByText("FINAL", { exact: true })).toBeVisible();

    await statisticianPage.reload();
    await expect(
      statisticianPage.getByRole("button", { name: "Confirm award" }),
    ).toBeVisible();
    await statisticianPage
      .getByRole("button", { name: "Confirm award" })
      .click();
    await expect(
      statisticianPage.getByText("Player of the Game"),
    ).toBeVisible();
  } finally {
    await statisticianContext.close();
  }

  await page.goto(
    `/leagues/${livePilot.organizationSlug}/${livePilot.seasonSlug}`,
  );
  await page.getByRole("tab", { name: "Results" }).click();
  await expect(page.getByText("Final", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Standings" }).click();
  await expect(page.getByText("A1 Live Team")).toBeVisible();
  await page.getByRole("tab", { name: "Leaders" }).click();
  await expect(page.getByText("A1 Captain")).toBeVisible();
});
