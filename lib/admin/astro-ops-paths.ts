/**
 * Live Astrology ops console — chat, sessions, wallet ledger, cashback.
 * Separate from main commerce admin (`/admindeoghar`).
 */
export const ASTRO_OPS_BASE = "/astro-ops" as const;

export function astroOpsPath(suffix: "" | `/${string}`): string {
  return suffix ? `${ASTRO_OPS_BASE}${suffix}` : ASTRO_OPS_BASE;
}
