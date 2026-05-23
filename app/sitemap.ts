import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site-url";
import { PUBLIC_SITEMAP_ROUTES } from "@/lib/site-routes";

const siteUrl = getSiteUrl();

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return PUBLIC_SITEMAP_ROUTES.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
