import "server-only";
import { getOwnedRunArchive } from "@/lib/dal/run-archive";
import { getRun } from "@/lib/dal/runs";
import { getCurrentViewer } from "@/lib/services/session";
import { putFile } from "@/lib/storage";

type Archive = NonNullable<Awaited<ReturnType<typeof getOwnedRunArchive>>>;

export const archiveKey = (userId: string, runId: string) => `runs/${userId}/${runId}.json`;

// Stores the archive under `runs/<userId>/<runId>.json` (same key: the file is overwritten) and returns its URL.
export async function storeArchive(userId: string, archive: Archive): Promise<string> {
  const { url } = await putFile({
    key: archiveKey(userId, archive.run.id),
    data: Buffer.from(JSON.stringify(archive, null, 2)),
    contentType: "application/json",
  });
  return url;
}

// Called after each decision: the archive is the owner's private copy of the run as reviewed (status, verdict,
// decisions, notes), so it is rewritten to match. A run without an archive yet has nothing to refresh.
export async function refreshArchive(runId: string): Promise<void> {
  const run = await getRun(runId);
  const viewer = await getCurrentViewer();
  if (!run?.archiveUrl || !viewer) return;
  const archive = await getOwnedRunArchive(runId);
  if (archive) await storeArchive(viewer.id, archive);
}
