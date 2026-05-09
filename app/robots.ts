import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site-url";

const siteUrl = getSiteUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admindeoghar",
          "/admindeoghar/*",
          "/admin",
          "/admin/*",
          "/astro-ops",
          "/astro-ops/*",
          "/checkout/*",
          "/thank-you/*",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
