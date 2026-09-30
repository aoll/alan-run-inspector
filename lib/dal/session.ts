import "server-only";
import { io } from "next/cache";
import { headers } from "next/headers";
import { cache } from "react";
import { auth } from "@/lib/auth";
import { UnauthorizedError } from "@/lib/errors";

// The DTO of the signed-in user: the only shape of a session that leaves the DAL.
export type Viewer = { id: string; name: string; email: string; role: "user" | "admin" };

// `await io()` first: Better Auth reads `new Date()`, which Cache Components flags while prerendering.
// Memoized per render pass with React's `cache`.
export const getViewer = cache(async (): Promise<Viewer | null> => {
  await io();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const { id, name, email, role } = session.user;
  return { id, name, email, role: role === "admin" ? "admin" : "user" };
});

// Every DAL function starts with this: authorization lives next to the data, where it cannot be forgotten.
export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) throw new UnauthorizedError();
  return viewer;
}
