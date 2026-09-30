import "server-only";
import { send } from "@vercel/queue";
import { after } from "next/server";
import { env } from "@/lib/env";

// The queue brick, generic over topics: a topic `<name>` is consumed by the route app/api/queues/<name>
// (registered in vercel.json under `experimentalTriggers`).
// INFRA_MODE=vercel: Vercel Queues. INFRA_MODE=local: after the response, the message is POSTed to the
// consumer route, signed with a shared secret (there is no Vercel signature locally), so the whole flow
// runs on a laptop.

export const LOCAL_QUEUE_HEADER = "x-local-queue-secret";

export async function enqueue(topic: string, message: unknown): Promise<void> {
  if (env.INFRA_MODE === "vercel") {
    await send(topic, message);
    return;
  }
  after(async () => {
    const response = await fetch(new URL(`/api/queues/${topic}`, env.BETTER_AUTH_URL), {
      method: "POST",
      headers: { "content-type": "application/json", [LOCAL_QUEUE_HEADER]: env.BETTER_AUTH_SECRET },
      body: JSON.stringify(message),
    });
    if (!response.ok) console.error("[queue] local consumer answered", response.status);
  });
}
