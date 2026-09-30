import "server-only";
import { getOwnedRunArchive } from "@/lib/dal/run-archive";
import { getRun } from "@/lib/dal/runs";
import { NotFoundError } from "@/lib/errors";
import { getCurrentViewer } from "@/lib/services/session";
import { putFile } from "@/lib/storage";

type Archive = NonNullable<Awaited<ReturnType<typeof getOwnedRunArchive>>>;

export const archiveKey = (userId: string, runId: string) => `runs/${userId}/${runId}.json`;

const serialize = (archive: Archive) => JSON.stringify(archive, null, 2);

// Stores the archive under `runs/<userId>/<runId>.json` (same key: the file is overwritten) and returns its URL.
export async function storeArchive(userId: string, archive: Archive): Promise<string> {
  const { url } = await putFile({
    key: archiveKey(userId, archive.run.id),
    data: Buffer.from(serialize(archive)),
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

// What the download serves: always rebuilt from the database for the owner (never `ipHash` nor `userId`), so a
// missing or outdated stored file (a failed write after the run or a decision) can never reach the reader. The
// stored file is only a copy. Another user's run, an unknown run or a run not done yet: not found.
export async function buildOwnedArchiveFile(runId: string): Promise<Buffer> {
  const archive = await getOwnedRunArchive(runId);
  if (archive?.run.status !== "done") throw new NotFoundError("File");
  return Buffer.from(serialize(archive));
}
