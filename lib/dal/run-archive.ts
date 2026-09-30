import "server-only";
import { readArchive, type RunArchive } from "./internal/archive-query";
import { requireViewer } from "./session";

export type { RunArchive };

// The owner's archive (status, verdict, decisions and private notes), read fresh. Another user's run: null.
export async function getOwnedRunArchive(runId: string): Promise<RunArchive | null> {
  const viewer = await requireViewer();
  return readArchive(runId, viewer.id);
}
