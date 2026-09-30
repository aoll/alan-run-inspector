import { defineConfig } from "drizzle-kit";
import * as nextEnvNs from "@next/env";

// Namespace import: @next/env is CJS and loaders unwrap its exports differently.
const { loadEnvConfig } = (nextEnvNs as { default?: typeof nextEnvNs }).default ?? nextEnvNs;
loadEnvConfig(process.cwd());

export default defineConfig({
  schema: ["./lib/db/schema.ts", "./lib/db/auth-schema.ts"],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
