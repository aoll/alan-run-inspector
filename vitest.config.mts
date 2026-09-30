import { defineConfig } from "vite";
import { configDefaults } from "vitest/config";
import { testDatabaseUrl } from "./test/test-database.ts";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    exclude: [...configDefaults.exclude, "e2e/**"],
    env: {
      DATABASE_URL: testDatabaseUrl(),
      BETTER_AUTH_SECRET: "test-secret-test-secret-test-secret-123",
      BETTER_AUTH_URL: "http://localhost:3000",
      AI_MODE: "mock",
      INFRA_MODE: "local",
    },
    globalSetup: ["./test/global-setup.ts"],
    setupFiles: ["./test/setup.ts"],
    coverage: { provider: "v8", include: ["lib/**"] },
  },
});
