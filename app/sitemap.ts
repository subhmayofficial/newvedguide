import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vedguide.in";

const PUBLIC_ROUTES = [
  "",
  "/free-kundli",
  "/free-kundli/result",
  "/consultation",
  "/tools",
  "/tools/kundal-dhatu",
  "/tools/name-letter/a",
  "/tools/name-letter/a/free-kundli",
  "/tools/numerology",
  "/tools/muhurat",
  "/kundli-report",
  "/about",
  "/faq",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return PUBLIC_ROUTES.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified,
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.8,
  }));
}
