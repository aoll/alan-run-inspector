import { NotFoundError } from "@/lib/errors";
import { readOwnedFile } from "@/lib/services/files";

// Local storage only (INFRA_MODE=local): serves a stored file to its owner. On Vercel, Blob serves its own URLs.
export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  try {
    const data = await readOwnedFile(path.join("/"));
    return new Response(new Uint8Array(data), { headers: { "content-type": "application/pdf" } });
  } catch (error) {
    if (error instanceof NotFoundError) return new Response(null, { status: 404 });
    throw error;
  }
}
