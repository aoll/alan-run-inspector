import { ZONES } from "./zones";

export async function loadMessages(locale: string): Promise<Record<string, unknown>> {
  const entries = await Promise.all(
    ZONES.map(async (zone) => {
      const zoneFile = (await import(`@/messages/${locale}/${zone}.json`)) as { default: unknown };
      return [zone, zoneFile.default] as const;
    }),
  );
  return Object.fromEntries(entries);
}
