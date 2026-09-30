import { readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { routing } from "./routing";
import { ZONES } from "./zones";

function keys(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) => keys(child, prefix ? `${prefix}.${key}` : key));
}

async function load(locale: string, zone: string): Promise<unknown> {
  return ((await import(`@/messages/${locale}/${zone}.json`)) as { default: unknown }).default;
}

describe("messages", () => {
  it("has exactly the declared zones in every locale", () => {
    for (const locale of routing.locales) {
      const files = readdirSync(path.join(process.cwd(), "messages", locale)).map((file) => file.replace(".json", ""));
      expect(files.sort(), locale).toEqual([...ZONES].sort());
    }
  });

  it("has the same keys in every locale, and no empty message", async () => {
    for (const zone of ZONES) {
      const [reference, ...others] = await Promise.all(routing.locales.map((locale) => load(locale, zone)));
      for (const other of others) expect(keys(other).sort(), zone).toEqual(keys(reference).sort());
      for (const locale of routing.locales) {
        expect(JSON.stringify(await load(locale, zone)), `${locale}/${zone}`).not.toMatch(/:\s*""/);
      }
    }
  });
});
