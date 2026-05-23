import type { MetadataRoute } from "next";

import { ADMIN_PANEL_BASE } from "@/lib/admin/admin-paths";
import { ASTRO_OPS_BASE } from "@/lib/admin/astro-ops-paths";
import { getSiteUrl } from "@/lib/site-url";

const siteUrl = getSiteUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          ADMIN_PANEL_BASE,
          `${ADMIN_PANEL_BASE}/*`,
          "/admin",
          "/admin/*",
          "/admindeoghar",
          "/admindeoghar/*",
          ASTRO_OPS_BASE,
          `${ASTRO_OPS_BASE}/*`,
          "/astro-ops",
          "/astro-ops/*",
          "/checkout/*",
          "/thank-you/*",
          "/api/*",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
