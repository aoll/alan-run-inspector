import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { adminUrlFor, testDatabaseUrl } from "./test-database";

// Creates the test database when missing, then applies the migrations, once per run.
export default async function setup() {
  const url = testDatabaseUrl();
  const name = new URL(url).pathname.slice(1);

  const admin = postgres(adminUrlFor(url), { max: 1, onnotice: () => {} });
  const [exists] = await admin`SELECT 1 FROM pg_database WHERE datname = ${name}`;
  if (!exists) await admin.unsafe(`CREATE DATABASE "${name.replaceAll('"', '""')}"`);
  await admin.end();

  const client = postgres(url, { max: 1 });
  await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
  await client.end();
}
