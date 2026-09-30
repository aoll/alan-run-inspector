// The two recorded scenarios an agent run replays. Everything is fictional: no model, no repository.
// Texts exist in every locale; `evidence: null` is a claim nobody backed up.
import fixInvoiceTest from "./fix-invoice-test.json";
import renameConfigOption from "./rename-config-option.json";

export type ScenarioId = "fix-invoice-test" | "rename-config-option";
export type StepKind = "read" | "tool_call" | "test" | "source" | "claim";
type Localized = { en: string; fr: string };
export type ScenarioLocale = keyof Localized;

export type ScenarioStep = {
  kind: StepKind;
  delayMs: number;
  title: Localized;
  input: Localized;
  output: Localized;
  evidence: Localized | null;
};
export type Scenario = { title: Localized; steps: ScenarioStep[] };

export const SCENARIO_IDS = ["fix-invoice-test", "rename-config-option"] as const satisfies readonly ScenarioId[];

const SCENARIOS: Record<ScenarioId, Scenario> = {
  "fix-invoice-test": fixInvoiceTest as Scenario,
  "rename-config-option": renameConfigOption as Scenario,
};

export const MAX_SIMULATED_MS = 6000;

export function getScenario(id: ScenarioId): Scenario {
  return SCENARIOS[id];
}

export function pickLocale(locale: string): ScenarioLocale {
  return locale === "fr" ? "fr" : "en";
}

export type LocalizedStep = {
  position: number;
  kind: StepKind;
  delayMs: number;
  title: string;
  input: string;
  output: string;
  evidence: string | null;
};

export function scenarioTitle(id: ScenarioId, locale: string): string {
  return SCENARIOS[id].title[pickLocale(locale)];
}

// Steps in position order (1-based), texts in the run's language.
export function scenarioSteps(id: ScenarioId, locale: string): LocalizedStep[] {
  const l = pickLocale(locale);
  return SCENARIOS[id].steps.map((step, index) => ({
    position: index + 1,
    kind: step.kind,
    delayMs: step.delayMs,
    title: step.title[l],
    input: step.input[l],
    output: step.output[l],
    evidence: step.evidence ? step.evidence[l] : null,
  }));
}
