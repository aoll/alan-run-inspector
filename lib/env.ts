// Validated environment variables. Application code reads `env.*`, never `process.env`.
// No `import "server-only"`: next.config.ts, drizzle-kit and scripts import this module outside a request.
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const createAppEnv = (source: Record<string, string | undefined>) =>
  createEnv({
    server: {
      DATABASE_URL: z.url(),
      BETTER_AUTH_SECRET: z.string().min(32),
      BETTER_AUTH_URL: z.url(),
      AI_MODE: z.enum(["mock", "live"]).default("mock"),
      INFRA_MODE: z.enum(["local", "vercel"]).default("local"),
      AI_GATEWAY_API_KEY: z.string().min(1).optional(),
      BLOB_READ_WRITE_TOKEN: z.string().min(1).optional(),
      GENERATION_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(10),
      // Vercel sets it to "1" at build time and at runtime; absent elsewhere. lib/security.ts reads it
      // to tell a real Vercel deployment (BotID enforced) from local or self-hosted runs.
      VERCEL: z.string().optional(),
      // Pre-fills the sign-in form with the seeded demo account (lib/auth-demo.ts). Off unless "true".
      DEMO_PREFILL: z.stringbool().default(false),
      QA_BYPASS_SECRET: z.string().optional(),
      NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    },
    runtimeEnv: source,
    emptyStringAsUndefined: true,
  });

export const env = createAppEnv(process.env);
