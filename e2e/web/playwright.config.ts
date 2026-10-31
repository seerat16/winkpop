import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for WinKPop's **web** end-to-end tests.
 *
 * It boots the Expo web dev server (`npm run web`) and runs the specs against
 * it. Run with: `npm run test:e2e:web` (see package.json).
 */
const PORT = 8081;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./specs",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // Emulate a phone viewport too, since the app is mobile-first.
    { name: "mobile-safari", use: { ...devices["iPhone 13"] } },
  ],
  // Start the Expo web server automatically before the tests.
  webServer: {
    command: "npm run web",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
