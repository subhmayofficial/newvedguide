/** Paid-ads funnel URLs — mirror astro-path under /ads for attribution separation */

export const ADS_FUNNEL = {
  tools: {
    kundalDhatu: "/ads/tools/kundal-dhatu",
  },
  freeKundli: "/ads/free-kundli",
  freeKundliResult: "/ads/free-kundli/result",
  freeKundliResultB: "/ads/free-kundli/result/b",
  checkoutKundli: "/ads/checkout/kundli",
} as const;

export const ADS_SOURCES = {
  kundalDhatu: "ads_kundal_dhatu",
  freeKundliPage: "ads_free_kundli_page",
  checkout: "ads_kundli",
} as const;

export function adsCheckoutHref(resultPath: string): string {
  const params = new URLSearchParams({
    source: ADS_SOURCES.checkout,
    back: resultPath,
  });
  return `${ADS_FUNNEL.checkoutKundli}?${params.toString()}`;
}

export function adsFreeKundliHref(source: string = ADS_SOURCES.kundalDhatu): string {
  const params = new URLSearchParams({ source });
  return `${ADS_FUNNEL.freeKundli}?${params.toString()}`;
}
