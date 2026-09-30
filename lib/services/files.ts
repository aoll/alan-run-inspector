import "server-only";
import { getViewer } from "@/lib/dal/session";
import { NotFoundError } from "@/lib/errors";
import { readLocalFile } from "@/lib/storage";

// Local storage only (INFRA_MODE=local; Vercel Blob serves its own URLs). Convention for every stored key:
// `<area>/<ownerId>/<file>`. A file is readable by its owner only; anything else is "not found".
export async function readOwnedFile(key: string): Promise<Buffer> {
  const viewer = await getViewer();
  const ownerId = key.split("/")[1];
  if (!viewer || ownerId !== viewer.id) throw new NotFoundError("File");
  const data = await readLocalFile(key);
  if (!data) throw new NotFoundError("File");
  return data;
}
