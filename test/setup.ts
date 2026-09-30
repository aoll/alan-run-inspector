import { vi } from "vitest";
import { currentSession } from "./session";

// `server-only` throws outside a Server Component; tests run in plain Node.
vi.mock("server-only", () => ({}));

// The framework boundary of the DAL: no request exists in Vitest, so the session comes from test/session.ts.
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/cache", () => ({
  io: async () => undefined,
  refresh: () => undefined,
  updateTag: () => undefined,
  cacheLife: () => undefined,
  cacheTag: () => undefined,
}));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: async () => currentSession() } } }));
