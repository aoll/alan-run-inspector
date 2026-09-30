import { z } from "zod";
import { runIdSchema } from "./runs";

export const NOTE_MAX_LENGTH = 500;

export const decisionSchema = z.enum(["approved", "rejected"]);
export type Decision = z.infer<typeof decisionSchema>;

// A step is identified by (run, position). The note is optional and private; a blank note is no note.
export const decideStepSchema = z.object({
  runId: runIdSchema,
  position: z.coerce.number().int().min(1),
  decision: decisionSchema,
  note: z
    .string()
    .trim()
    .max(NOTE_MAX_LENGTH)
    .optional()
    .transform((note) => note || undefined),
});
export type DecideStepInput = z.infer<typeof decideStepSchema>;
