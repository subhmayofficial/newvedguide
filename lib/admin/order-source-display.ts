import { ENTRY_PATH } from "@/lib/constants/commerce";

/** Checkout page path saved on orders.source at payment initiation */
export function orderSourceUrlDisplay(
  source: string | null | undefined,
  entryPath: string | null | undefined
): string {
  const page = source?.trim();
  if (page) return page;
  if (!entryPath?.trim()) return "—";
  return entryPath.trim();
}

export function isAdsOrder(
  source: string | null | undefined,
  entryPath: string | null | undefined
): boolean {
  const page = (source ?? "").toLowerCase();
  const entry = (entryPath ?? "").toLowerCase();
  return (
    page.startsWith("/ads") ||
    entry === ENTRY_PATH.ADS ||
    entry.startsWith("ads_")
  );
}

export type OrderSourceUrlFilter = "" | "ads" | "astro-path" | "kundli-lp" | "checkout-kundli";

export function applyOrderSourceUrlFilter<T extends { or: (filter: string) => T }>(
  q: T,
  filter: OrderSourceUrlFilter | undefined
): T {
  switch (filter) {
    case "ads":
      return q.or("source.ilike./ads%,entry_path.eq.ads");
    case "astro-path":
      return q.or("source.ilike./astro-path%,entry_path.eq.funnel2");
    case "kundli-lp":
      return q.or(
        "source.eq./kundli/new-checkout,entry_path.eq.kundli_direct_lp,source.ilike.%kundli_direct_lp%"
      );
    case "checkout-kundli":
      return q.or("source.eq./checkout/kundli,entry_path.eq.direct_sales");
    default:
      return q;
  }
}
