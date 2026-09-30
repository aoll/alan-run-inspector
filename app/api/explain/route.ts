import { headers } from "next/headers";
import { NotFoundError, RateLimitedError, UnauthorizedError } from "@/lib/errors";
import { explainBodySchema } from "@/lib/schemas/explain";
import { clientIp, guardBot, hashIp } from "@/lib/security";
import { explainStep } from "@/lib/services/explain";

// Route handlers cannot read the locale param: the client sends it in the body.
export async function POST(request: Request) {
  const parsed = explainBodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 });

  const requestHeaders = await headers();
  const guard = await guardBot(requestHeaders);
  if (!guard.ok) return Response.json({ error: guard.reason }, { status: 403 });

  try {
    const result = await explainStep({ ...parsed.data, ipHash: hashIp(clientIp(requestHeaders)) });
    return result.toTextStreamResponse();
  } catch (error) {
    if (error instanceof UnauthorizedError) return Response.json({ error: "unauthorized" }, { status: 401 });
    if (error instanceof NotFoundError) return Response.json({ error: "notFound" }, { status: 404 });
    if (error instanceof RateLimitedError) return Response.json({ error: "rateLimited" }, { status: 429 });
    throw error;
  }
}
