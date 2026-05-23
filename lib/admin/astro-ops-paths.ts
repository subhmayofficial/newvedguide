/**
 * Live astrology ops console — chat, sessions, wallet ledger.
 * Separate from commerce admin. Set NEXT_PUBLIC_ASTRO_OPS_PATH in production.
 */
const SEGMENT_RE = /^[a-z0-9][a-z0-9-]{2,62}$/i;
const FALLBACK_ASTRO_OPS_SEGMENT = "vg-astral-9m4q1x";

function normalizeSegment(
  raw: string | undefined,
  fallback: string
): string {
  const seg = raw?.trim().replace(/^\/+|\/+$/g, "") ?? "";
  return seg && SEGMENT_RE.test(seg) ? seg : fallback;
}

export const ASTRO_OPS_SEGMENT = normalizeSegment(
  process.env.NEXT_PUBLIC_ASTRO_OPS_PATH ?? process.env.ASTRO_OPS_PATH,
  FALLBACK_ASTRO_OPS_SEGMENT
);

export const ASTRO_OPS_BASE = `/${ASTRO_OPS_SEGMENT}` as const;

/** Internal Next.js app route. */
export const ASTRO_OPS_INTERNAL_BASE = "/astro-ops" as const;

export function astroOpsPath(suffix = ""): string {
  if (!suffix) return ASTRO_OPS_BASE;
  const normalized = suffix.startsWith("/") ? suffix : `/${suffix}`;
  return `${ASTRO_OPS_BASE}${normalized}`;
}

export function isAstroOpsPath(pathname: string): boolean {
  return (
    pathname === ASTRO_OPS_BASE || pathname.startsWith(`${ASTRO_OPS_BASE}/`)
  );
}

export function isLegacyAstroOpsPath(pathname: string): boolean {
  return (
    pathname === "/astro-ops" || pathname.startsWith("/astro-ops/")
  );
}

export function isAnyAstroOpsPath(pathname: string): boolean {
  return isAstroOpsPath(pathname) || isLegacyAstroOpsPath(pathname);
}
