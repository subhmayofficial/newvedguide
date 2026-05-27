import type { Metadata } from "next";
import { KundliResultView } from "@/components/sections/kundli-result-view";
import { ADS_FUNNEL, adsCheckoutHref } from "@/lib/constants/ads-funnel";

export const metadata: Metadata = {
  title: "Your Free Kundli Result",
  description:
    "Explore your Lagna, Moon sign, and Nakshatra, then continue to detailed kundli checkout.",
};

export default function AdsFreeKundliResultPage() {
  return (
    <KundliResultView
      variant="a"
      fallbackInputPath={ADS_FUNNEL.freeKundli}
      checkoutHref={adsCheckoutHref(ADS_FUNNEL.freeKundliResult)}
      ctaSourcePage="free_kundli_result_ads"
      idPrefix="free-kundli-result-ads"
      videoEmbedUrl="https://player.mediadelivery.net/play/550381/2a2bf641-1191-4b83-98b5-dc37a5184255"
      videoHeadline="VERY IMPORTANT: WATCH THIS"
      videoPlacement="below_core_chart"
    />
  );
}
