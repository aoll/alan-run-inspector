import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import { env } from "@/lib/env";

// The blob brick. INFRA_MODE=vercel: Vercel Blob. INFRA_MODE=local: files under .data/files, served by
// app/api/files (owner-checked, services/files.ts), so the whole app runs without any Vercel service.
const LOCAL_ROOT = path.join(process.cwd(), ".data", "files");

function localPath(key: string): string {
  const resolved = path.resolve(LOCAL_ROOT, key);
  if (!resolved.startsWith(LOCAL_ROOT + path.sep)) throw new Error("Invalid storage key");
  return resolved;
}

// Idempotent: the same key overwrites the same file, so a redelivered queue message leaves no orphan.
export async function putFile(input: { key: string; data: Buffer; contentType: string }): Promise<{ url: string }> {
  if (env.INFRA_MODE === "vercel") {
    const blob = await put(input.key, input.data, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: input.contentType,
      token: env.BLOB_READ_WRITE_TOKEN,
    });
    return { url: blob.url };
  }
  const target = localPath(input.key);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, input.data);
  return { url: `/api/files/${input.key}` };
}

// Local mode only (Vercel Blob URLs are served by Vercel).
export async function readLocalFile(key: string): Promise<Buffer | null> {
  try {
    return await readFile(localPath(key));
  } catch {
    return null;
  }
}
