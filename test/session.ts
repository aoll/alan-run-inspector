import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { users } from "@/lib/db/auth-schema";

type TestUser = { id: string; name: string; email: string; role: "user" | "admin" };

let current: TestUser | null = null;

/** What the mocked Better Auth returns as the session (null = signed out). */
export function currentSession() {
  return current ? { user: current } : null;
}

export function signInAs(user: TestUser | null) {
  current = user;
}

/** Inserts a real user (each test uses its own, so no cleanup is needed) and signs in as them. */
export async function createUser(role: "user" | "admin" = "user"): Promise<TestUser> {
  const id = randomUUID();
  const user = { id, name: "Test User", email: `${id}@example.com`, role };
  await db.insert(users).values(user);
  return user;
}
