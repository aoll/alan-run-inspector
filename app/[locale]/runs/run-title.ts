// The title of a run as shown: translated from its scenario in the current locale (`runs.scenarios.<scenario>`),
// falling back to the title stored at creation when the scenario has no translation. Step texts are not
// translated: they stay as recorded when the run was created.
export function runTitle(
  t: { has: (key: `scenarios.${string}`) => boolean; (key: `scenarios.${string}`): string },
  run: { scenario: string; title: string },
): string {
  const key = `scenarios.${run.scenario}` as const;
  return t.has(key) ? t(key) : run.title;
}
