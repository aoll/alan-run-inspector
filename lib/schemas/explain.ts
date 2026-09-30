import { z } from "zod";
import { routing } from "@/i18n/routing";
import { runIdSchema } from "./runs";

// A step is identified by its run and its position (unique per run).
export const explainBodySchema = z.object({
  runId: runIdSchema,
  position: z.number().int().min(1),
  locale: z.enum(routing.locales),
});
export type ExplainBody = z.infer<typeof explainBodySchema>;
