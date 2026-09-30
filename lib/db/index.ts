import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as authSchema from "./auth-schema";
import * as schema from "./schema";

const APP_POOL_MAX = 10;
const TEST_POOL_MAX = 5;

const createDb = () =>
  drizzle(postgres(env.DATABASE_URL, { max: env.NODE_ENV === "test" ? TEST_POOL_MAX : APP_POOL_MAX }), {
    schema: { ...schema, ...authSchema },
  });

// Cached on globalThis outside production: Next's dev server re-evaluates modules on every edit
// and Vitest's `vi.resetModules()` re-imports them; both must reuse the same pool.
const globalForDb = globalThis as unknown as { hubDb?: ReturnType<typeof createDb> };

export const db = globalForDb.hubDb ?? createDb();
if (env.NODE_ENV !== "production") globalForDb.hubDb = db;
