import { defineConfig, devices } from "@playwright/test";

// `npm run e2e`: real API (pg-mem, seed) + Vite web, Chromium only. Not part of `npm run check`.
// Each test creates a customer with a unique name, so a reused dev server (`npm run dev`) is fine too.
export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:8080",
    locale: "tr-TR",
    timezoneId: "Europe/Istanbul",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "npm run start -w @rabbitqa/api",
      url: "http://127.0.0.1:3001/api/health",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: "npm run dev -w @rabbitqa/web",
      url: "http://localhost:8080",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
