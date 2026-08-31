import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3100";

export default defineConfig({
  fullyParallel: true,
  reporter: [["list"], ["html", { open: "never" }]],
  testDir: "./tests/browser",
  timeout: 30_000,
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "pnpm exec next start -p 3100",
        reuseExistingServer: true,
        timeout: 120_000,
        url: `${baseURL}/login`,
      },
  projects: [
    {
      name: "desktop",
      testIgnore: "**/live.*.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      testIgnore: "**/live.*.spec.ts",
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "live",
      testMatch: "**/live.*.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
