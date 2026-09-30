// One JSON file per zone and locale: messages/<locale>/<zone>.json, namespace = zone name.
// A feature adds its zone here (one line) and ships the file in every locale.
export const ZONES = ["common", "landing", "auth", "dashboard"] as const;
export type Zone = (typeof ZONES)[number];
