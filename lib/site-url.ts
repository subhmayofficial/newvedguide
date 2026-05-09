/**
 * Canonical public site URL for metadata, sitemap, robots, and absolute links.
 *
 * In development, if NEXT_PUBLIC_SITE_URL points at localhost with a stale/wrong
 * port (nothing listening), metadata and OG resolution break (e.g. requests to
 * http://localhost:7071/...). We align localhost URLs with PORT (Next default 3000).
 */
export function getSiteUrl(): string {
  const fallbackProd = "https://vedguide.in";
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");

  if (process.env.NODE_ENV !== "development") {
    return raw || fallbackProd;
  }

  const devPort = process.env.PORT?.trim() || "3000";

  if (!raw) {
    return `http://localhost:${devPort}`;
  }

  try {
    const u = new URL(raw);
    if (u.hostname === "localhost" || u.hostname === "127.0.0.1") {
      u.port = devPort;
      return u.toString().replace(/\/$/, "");
    }
    return raw;
  } catch {
    return `http://localhost:${devPort}`;
  }
}
