import "server-only";
import { scenarioSteps, scenarioTitle } from "@/fixtures/runs";
import * as runJobsDal from "@/lib/dal/run-jobs";
import * as runsDal from "@/lib/dal/runs";
import { env } from "@/lib/env";
import { RateLimitedError } from "@/lib/errors";
import type { StartRunInput } from "@/lib/schemas/runs";
import { enqueue } from "@/lib/queue";
import { putFile } from "@/lib/storage";

export type { RunDto } from "@/lib/dal/runs";

export type RunMessage = { runId: string; locale: string };

const WINDOW_SECONDS = 60;

export const listRuns = runsDal.listRuns;

// Order: rate limit (also refuses an anonymous caller), create the row, then hand the play to the queue.
// The rate limit is a plain count-then-insert: bounded, and enough for a demo.
export async function startRun(input: StartRunInput & { ipHash: string; locale: string }) {
  const { byUser, byIp } = await runsDal.countRecentRuns({ ipHash: input.ipHash, windowSeconds: WINDOW_SECONDS });
  const limit = env.GENERATION_RATE_LIMIT_PER_MINUTE;
  if (byUser >= limit || byIp >= limit) throw new RateLimitedError();

  const run = await runsDal.createRun({
    title: scenarioTitle(input.scenario, input.locale),
    scenario: input.scenario,
    ipHash: input.ipHash,
  });
  await enqueue("runs", { runId: run.id, locale: input.locale } satisfies RunMessage);
  return run;
}

// A message redelivered more times than this is a poison message: record a definitive failure.
export const MAX_DELIVERIES = 5;

const realSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// The queue consumer's job (no user session: see lib/dal/run-jobs.ts). Plays the scenario step by step,
// writing each step as it happens so the UI fills in progressively. Idempotent: a finished run is left
// alone, and a step already written is kept (unique on run and position).
export async function processRun(
  message: RunMessage,
  context: { deliveryCount: number; sleep?: (ms: number) => Promise<void> },
): Promise<void> {
  if (context.deliveryCount > MAX_DELIVERIES) {
    await runJobsDal.failRunJob(message.runId);
    return;
  }
  const job = await runJobsDal.startRunJob(message.runId);
  if (!job) return;
  const sleep = context.sleep ?? realSleep;
  try {
    for (const { delayMs, ...step } of scenarioSteps(job.scenario, message.locale)) {
      await sleep(delayMs);
      await runJobsDal.writeRunStep(job.id, step);
    }
    const archive = await runJobsDal.getRunArchive(job.id);
    const { url } = await putFile({
      key: `runs/${job.userId}/${job.id}.json`,
      data: Buffer.from(JSON.stringify(archive, null, 2)),
      contentType: "application/json",
    });
    await runJobsDal.completeRunJob(job.id, url);
  } catch (error) {
    console.error("[runs] job failed", job.id, error);
    await runJobsDal.failRunJob(job.id);
  }
}
