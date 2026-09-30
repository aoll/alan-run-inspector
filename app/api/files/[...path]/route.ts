import { NotFoundError } from "@/lib/errors";
import { contentTypeFor, readOwnedFile } from "@/lib/services/files";

// Local storage only (INFRA_MODE=local): serves a stored file to its owner. On Vercel, Blob serves its own URLs.
export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  try {
    const key = path.join("/");
    const data = await readOwnedFile(key);
    return new Response(new Uint8Array(data), { headers: { "content-type": contentTypeFor(key) } });
  } catch (error) {
    if (error instanceof NotFoundError) return new Response(null, { status: 404 });
    throw error;
  }
}
