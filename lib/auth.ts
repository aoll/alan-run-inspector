import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins";
import { db } from "@/lib/db";
import { accounts, magicLinkOutbox, sessions, users, verifications } from "@/lib/db/auth-schema";
import { env } from "@/lib/env";

// The simulated email: the link is stored in `magic_link_outbox` instead of being sent.
// Swap this function for a real email provider in a demo that needs one.
const sendMagicLink: Parameters<typeof magicLink>[0]["sendMagicLink"] = async ({ email, url }) => {
  await db.insert(magicLinkOutbox).values({ email, url });
};

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
    schema: { users, sessions, accounts, verifications },
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  user: {
    additionalFields: {
      role: { type: "string", input: false, defaultValue: "user" },
    },
  },
  // Better Auth's own limits (3 sign-ups / sign-ins per 10 s per IP) are active under `next start`, so parallel E2E runs
  // from one IP would be refused. Like BotID, they are enforced on a real Vercel deployment only.
  rateLimit: { enabled: env.VERCEL === "1" },
  emailAndPassword: { enabled: true },
  plugins: [
    magicLink({ sendMagicLink }),
    nextCookies(), // must stay last
  ],
});
