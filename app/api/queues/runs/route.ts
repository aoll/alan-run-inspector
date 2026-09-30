import { handleCallback, type MessageMetadata } from "@vercel/queue";
import { z } from "zod";
import { env } from "@/lib/env";
import { LOCAL_QUEUE_HEADER } from "@/lib/queue";
import { runIdSchema } from "@/lib/schemas/runs";
import { processRun } from "@/lib/services/runs";
import { routing } from "@/i18n/routing";

const messageSchema = z.object({ runId: runIdSchema, locale: z.enum(routing.locales) });

// Exported separately from POST so tests can call it with a fake (message, metadata) pair.
export async function handleRunMessage(raw: unknown, metadata: Pick<MessageMetadata, "deliveryCount">) {
  await processRun(messageSchema.parse(raw), { deliveryCount: metadata.deliveryCount });
}

// INFRA_MODE=vercel: Vercel Queues invokes this route (registered in vercel.json) and handleCallback
// verifies its signature. INFRA_MODE=local: lib/queue.ts posts the message with a shared secret.
const vercelHandler = handleCallback(handleRunMessage);

export async function POST(request: Request) {
  if (env.INFRA_MODE === "vercel") return vercelHandler(request);
  if (request.headers.get(LOCAL_QUEUE_HEADER) !== env.BETTER_AUTH_SECRET) return new Response(null, { status: 401 });
  const parsed = messageSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new Response(null, { status: 400 });
  await handleRunMessage(parsed.data, { deliveryCount: 1 });
  return new Response(null, { status: 204 });
}
