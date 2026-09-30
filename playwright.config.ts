import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.E2E_PORT ?? "3100";
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    // Sandboxes pin a browser build that may differ from Playwright's own: PW_CHROMIUM_PATH overrides it.
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm db:migrate && pnpm build && pnpm start --port ${PORT}`,
    url: `${baseURL}/sign-in`,
    reuseExistingServer: false,
    timeout: 300_000,
    env: { AI_MODE: "mock", INFRA_MODE: "local", BETTER_AUTH_URL: baseURL },
  },
});
