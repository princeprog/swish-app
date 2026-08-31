import { expect, test } from "@playwright/test";

const livePilot = {
  gameId: process.env.PLAYWRIGHT_LIVE_GAME_ID,
  organizationSlug: process.env.PLAYWRIGHT_LIVE_ORGANIZATION_SLUG,
  scorekeeperEmail: process.env.PLAYWRIGHT_LIVE_SCOREKEEPER_EMAIL,
  scorekeeperPassword: process.env.PLAYWRIGHT_LIVE_SCOREKEEPER_PASSWORD,
  seasonSlug: process.env.PLAYWRIGHT_LIVE_SEASON_SLUG,
  statisticianEmail: process.env.PLAYWRIGHT_LIVE_STATISTICIAN_EMAIL,
  statisticianPassword: process.env.PLAYWRIGHT_LIVE_STATISTICIAN_PASSWORD,
};

const hasLivePilot = Object.values(livePilot).every(Boolean);

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
  } finally {
    await statisticianContext.close();
  }
});
