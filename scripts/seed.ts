// Seeds a demo account so a fresh database can be explored right away.
// Usage: pnpm db:seed   (idempotent: does nothing when the account already exists)
import * as nextEnvNs from "@next/env";
import { DEMO_EMAIL, DEMO_NAME, DEMO_PASSWORD } from "../lib/auth-demo";

const { loadEnvConfig } = (nextEnvNs as { default?: typeof nextEnvNs }).default ?? nextEnvNs;
loadEnvConfig(process.cwd());

const EMAIL = DEMO_EMAIL;
const PASSWORD = DEMO_PASSWORD;

async function main() {
  // Imported after loadEnvConfig: lib/env validates process.env when first imported.
  const { eq } = await import("drizzle-orm");
  const { auth } = await import("@/lib/auth");
  const { db } = await import("@/lib/db");
  const { users } = await import("@/lib/db/auth-schema");

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, EMAIL));
  if (existing) return console.log("Seed: demo account already exists");

  await auth.api.signUpEmail({ body: { name: DEMO_NAME, email: EMAIL, password: PASSWORD } });
  console.log(`Seed: created ${EMAIL} / ${PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
