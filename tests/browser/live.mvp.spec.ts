import { expect, test } from "@playwright/test";

const livePilot = {
  gameId: process.env.PLAYWRIGHT_LIVE_GAME_ID,
  organizationSlug: process.env.PLAYWRIGHT_LIVE_ORGANIZATION_SLUG,
  scorekeeperEmail: process.env.PLAYWRIGHT_LIVE_SCOREKEEPER_EMAIL,
  scorekeeperPassword: process.env.PLAYWRIGHT_LIVE_SCOREKEEPER_PASSWORD,
  seasonSlug: process.env.PLAYWRIGHT_LIVE_SEASON_SLUG,
};

const hasLivePilot = Object.values(livePilot).every(Boolean);

test("live pilot loads the public league and assigned scorekeeper game", async ({
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

  await page.goto(
    `/organizations/${livePilot.organizationSlug}/scorekeeper/games/${livePilot.gameId}`,
  );
  await expect(page.getByText("Pregame review")).toBeVisible();
  await expect(page.getByText("Start Game")).toBeVisible();
});
