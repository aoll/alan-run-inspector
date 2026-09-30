import { z } from "zod";
import { SCENARIO_IDS } from "@/fixtures/runs";

// Shared by the entry (parsing) and the services (types): what starting or delivering a run accepts.
export const scenarioSchema = z.enum(SCENARIO_IDS);
export const startRunSchema = z.object({ scenario: scenarioSchema });
export type StartRunInput = z.infer<typeof startRunSchema>;

export const runIdSchema = z.uuid();
