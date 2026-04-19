/** Pure helpers — safe for Server Components (do not import from `"use client"` modules). */

const MS_HOUR = 60 * 60 * 1000;

/** True if this order should use the 12h FastTrack SLA (standalone addon or paid kundli + FastTrack line item). */
export function orderHasFastTrackSla(
  mainProductSlug: string,
  orderItems?: { product_slug?: string | null }[] | null
): boolean {
  if (mainProductSlug === "fast-track-addon") return true;
  return (orderItems ?? []).some((i) => (i?.product_slug ?? "") === "fast-track-addon");
}

export function slaWindowHours(productSlug: string, hasFastTrackAddon?: boolean): 12 | 48 {
  if (hasFastTrackAddon || productSlug === "fast-track-addon") return 12;
  return 48;
}

export function slaDeadlineMs(
  createdAtIso: string,
  productSlug: string,
  hasFastTrackAddon?: boolean
): number | null {
  const start = Date.parse(createdAtIso);
  if (Number.isNaN(start)) return null;
  return start + slaWindowHours(productSlug, hasFastTrackAddon) * MS_HOUR;
}
