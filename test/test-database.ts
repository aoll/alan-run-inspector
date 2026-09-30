import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

// The test database of a checkout is `<its DATABASE_URL database>_test`: every git worktree has its own database
// (scripts/worktree-db.ts), so parallel worktrees never migrate the same test database at once.
// TEST_DATABASE_URL overrides it. Used by vitest.config.mts and test/global-setup.ts (Node, not Next).
const FALLBACK = "postgres://postgres:postgres@localhost:5432/alan_run_inspector_test";

// `.env.local` is read directly: Next's loader skips it when NODE_ENV=test, which Vitest sets.
function checkoutDatabaseUrl(): string | undefined {
  const file = path.resolve(process.cwd(), ".env.local");
  if (existsSync(file)) {
    const match = /^DATABASE_URL=(.+)$/m.exec(readFileSync(file, "utf8"));
    if (match?.[1]) return match[1].trim();
  }
  return process.env.DATABASE_URL;
}

export function testDatabaseUrl(): string {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;
  const dev = checkoutDatabaseUrl();
  if (!dev) return FALLBACK;
  const url = new URL(dev);
  if (!url.pathname.endsWith("_test")) url.pathname = `${url.pathname}_test`;
  return url.toString();
}

/** The same server, database `postgres`: used to create the test database when it does not exist yet. */
export function adminUrlFor(databaseUrl: string): string {
  const url = new URL(databaseUrl);
  url.pathname = "/postgres";
  return url.toString();
}
