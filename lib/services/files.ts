import "server-only";
import { getViewer } from "@/lib/dal/session";
import { runIdSchema } from "@/lib/schemas/runs";
import { NotFoundError } from "@/lib/errors";
import { archiveKey, buildOwnedArchiveFile } from "@/lib/services/archive";
import { readLocalFile } from "@/lib/storage";

// Local storage only (INFRA_MODE=local; Vercel Blob serves its own URLs). Convention for every stored key:
// `<area>/<ownerId>/<file>`. A file is readable by its owner only; anything else is "not found".
export async function readOwnedFile(key: string): Promise<Buffer> {
  const viewer = await getViewer();
  const ownerId = key.split("/")[1];
  if (!viewer || ownerId !== viewer.id) throw new NotFoundError("File");
  // A run archive is rebuilt from the database, the stored file being only a copy (see buildOwnedArchiveFile).
  const archiveRunId = /^runs\/[^/]+\/([^/]+)\.json$/.exec(key)?.[1];
  if (archiveRunId && key === archiveKey(viewer.id, archiveRunId)) {
    if (!runIdSchema.safeParse(archiveRunId).success) throw new NotFoundError("File");
    return buildOwnedArchiveFile(archiveRunId);
  }
  const data = await readLocalFile(key);
  if (!data) throw new NotFoundError("File");
  return data;
}

const CONTENT_TYPES: Record<string, string> = { json: "application/json", pdf: "application/pdf" };

// The type follows the stored file's extension; anything unknown is an opaque download.
export function contentTypeFor(key: string): string {
  const extension = key.split("/").pop()?.split(".").pop()?.toLowerCase() ?? "";
  return Object.hasOwn(CONTENT_TYPES, extension) ? CONTENT_TYPES[extension]! : "application/octet-stream";
}
