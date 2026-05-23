/**
 * Commerce admin panel public URL (rewrite target remains internal `/admin`).
 * Set NEXT_PUBLIC_ADMIN_PANEL_PATH in env — use a long random segment in production.
 */
const SEGMENT_RE = /^[a-z0-9][a-z0-9-]{2,62}$/i;
const FALLBACK_ADMIN_SEGMENT = "vg-console-8f3k2p";

function normalizeSegment(
  raw: string | undefined,
  fallback: string
): string {
  const seg = raw?.trim().replace(/^\/+|\/+$/g, "") ?? "";
  return seg && SEGMENT_RE.test(seg) ? seg : fallback;
}

export const ADMIN_PANEL_SEGMENT = normalizeSegment(
  process.env.NEXT_PUBLIC_ADMIN_PANEL_PATH ?? process.env.ADMIN_PANEL_PATH,
  FALLBACK_ADMIN_SEGMENT
);

/** Public browser path for commerce admin (e.g. /vg-console-8f3k2p). */
export const ADMIN_PANEL_BASE = `/${ADMIN_PANEL_SEGMENT}` as const;

/** Internal Next.js app route — do not link in UI. */
export const ADMIN_INTERNAL_BASE = "/admin" as const;

export function adminPath(suffix = ""): string {
  if (!suffix) return ADMIN_PANEL_BASE;
  const normalized = suffix.startsWith("/") ? suffix : `/${suffix}`;
  return `${ADMIN_PANEL_BASE}${normalized}`;
}

export function isAdminPanelPath(pathname: string): boolean {
  return (
    pathname === ADMIN_PANEL_BASE ||
    pathname.startsWith(`${ADMIN_PANEL_BASE}/`)
  );
}

export function isAdminPanelLoginPath(pathname: string): boolean {
  return pathname === adminPath("/login");
}

/** Guessable legacy URLs — must not expose admin (proxy redirects to /). */
export function isLegacyAdminPath(pathname: string): boolean {
  return (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/admindeoghar" ||
    pathname.startsWith("/admindeoghar/")
  );
}

export function isCommerceAdminPath(pathname: string): boolean {
  return isAdminPanelPath(pathname) || isLegacyAdminPath(pathname);
}

/** Safe post-login redirect: only paths under the configured admin base. */
export function safeAdminRedirect(raw: string | null): string {
  if (!raw) return ADMIN_PANEL_BASE;
  let path = raw.trim();
  try {
    path = decodeURIComponent(path);
  } catch {
    return ADMIN_PANEL_BASE;
  }
  if (!path.startsWith("/") || path.startsWith("//")) return ADMIN_PANEL_BASE;
  if (!isAdminPanelPath(path)) return ADMIN_PANEL_BASE;
  return path;
}
