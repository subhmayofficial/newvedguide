/**
 * Interactive tools / calculators on /tools only.
 * Product sales pages (e.g. /kundli-report) belong in nav and home — not listed here.
 */
export type ToolStatus = "live" | "coming_soon";

export type ToolDefinition = {
  slug: string;
  title: string;
  blurb: string;
  href: string;
  status: ToolStatus;
  emoji: string;
};

export const TOOLS: ToolDefinition[] = [
  {
    slug: "free-kundli",
    title: "Free Kundli",
    blurb: "Instant Vedic birth chart — lagna, Moon sign, nakshatra, and key placements.",
    href: "/free-kundli",
    status: "live",
    emoji: "🔮",
  },
  {
    slug: "kundal-dhatu",
    title: "Kundal dhatu check",
    blurb: "Apni Rashi select karein — kaunsa dhatu ka kada / kundal pehanna chahiye, quick answer.",
    href: "/tools/kundal-dhatu",
    status: "live",
    emoji: "📿",
  },
  {
    slug: "numerology",
    title: "Numerology snapshot",
    blurb: "Life path & name number — quick insight from your date of birth.",
    href: "/tools/numerology",
    status: "coming_soon",
    emoji: "🔢",
  },
  {
    slug: "muhurat",
    title: "Muhurat & Panchang",
    blurb: "Auspicious windows for important starts — calendar view coming soon.",
    href: "/tools/muhurat",
    status: "coming_soon",
    emoji: "🌙",
  },
];
