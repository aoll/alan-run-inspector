"use server";

import { refresh } from "next/cache";
import { NotFoundError, UnauthorizedError } from "@/lib/errors";
import { decideStepSchema } from "@/lib/schemas/review";
import { RunNotDoneError, decideStep } from "@/lib/services/review";

// Entries only parse, call a service and translate the outcome into a code the UI maps to a message.
export type DecideStepState =
  | { status: "idle" }
  | { status: "saved" }
  | { status: "error"; error: "invalid" | "unauthorized" | "notFound" | "notDone" | "failed" };

export async function decideStepAction(_previous: DecideStepState, formData: FormData): Promise<DecideStepState> {
  const input = decideStepSchema.safeParse({
    runId: formData.get("runId"),
    position: formData.get("position"),
    decision: formData.get("decision"),
    note: formData.get("note") ?? undefined,
  });
  if (!input.success) return { status: "error", error: "invalid" };
  try {
    await decideStep(input.data);
  } catch (error) {
    if (error instanceof UnauthorizedError) return { status: "error", error: "unauthorized" };
    if (error instanceof NotFoundError) return { status: "error", error: "notFound" };
    if (error instanceof RunNotDoneError) return { status: "error", error: "notDone" };
    console.error("[review] decision failed", error);
    return { status: "error", error: "failed" };
  }
  refresh();
  return { status: "saved" };
}
