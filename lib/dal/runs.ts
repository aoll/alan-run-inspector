import "server-only";
import { and, count, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { runs } from "@/lib/db/schema";
import { requireViewer } from "./session";

export type RunDto = {
  id: string;
  title: string;
  scenario: "fix-invoice-test" | "rename-config-option";
  status: "queued" | "running" | "done" | "failed";
  verdict: "none" | "accepted" | "needs_changes";
  archiveUrl: string | null;
  createdAt: Date;
  finishedAt: Date | null;
};

// Explicit columns: `ipHash` and `userId` never leave the DAL.
const columns = {
  id: runs.id,
  title: runs.title,
  scenario: runs.scenario,
  status: runs.status,
  verdict: runs.verdict,
  archiveUrl: runs.archiveUrl,
  createdAt: runs.createdAt,
  finishedAt: runs.finishedAt,
} as const;

// Ownership is part of every query (`user_id = viewer`): another user's run is simply "not found".
export async function listRuns(): Promise<RunDto[]> {
  const viewer = await requireViewer();
  return db.select(columns).from(runs).where(eq(runs.userId, viewer.id)).orderBy(desc(runs.createdAt));
}

export async function getRun(id: string): Promise<RunDto | null> {
  const viewer = await requireViewer();
  const [run] = await db
    .select(columns)
    .from(runs)
    .where(and(eq(runs.id, id), eq(runs.userId, viewer.id)));
  return run ?? null;
}

export async function createRun(input: {
  title: string;
  scenario: RunDto["scenario"];
  ipHash: string;
}): Promise<RunDto> {
  const viewer = await requireViewer();
  const [run] = await db
    .insert(runs)
    .values({ userId: viewer.id, title: input.title, scenario: input.scenario, ipHash: input.ipHash })
    .returning(columns);
  if (!run) throw new Error("Insert returned no row");
  return run;
}

// Runs started in the last `windowSeconds`, by the viewer and by the same IP hash (database clock).
export async function countRecentRuns(input: {
  ipHash: string;
  windowSeconds: number;
}): Promise<{ byUser: number; byIp: number }> {
  const viewer = await requireViewer();
  const since = sql`now() - make_interval(secs => ${input.windowSeconds})`;
  const [byUser] = await db
    .select({ n: count() })
    .from(runs)
    .where(and(eq(runs.userId, viewer.id), gt(runs.createdAt, since)));
  const [byIp] = await db
    .select({ n: count() })
    .from(runs)
    .where(and(eq(runs.ipHash, input.ipHash), gt(runs.createdAt, since)));
  return { byUser: byUser?.n ?? 0, byIp: byIp?.n ?? 0 };
}
