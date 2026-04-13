import type { Metadata } from "next";
import { KundliResultView } from "@/components/sections/kundli-result-view";

export const metadata: Metadata = {
  title: "Your Free Kundli Result",
  description:
    "Explore your Lagna, Moon sign, and Nakshatra, then continue to detailed kundli checkout.",
};

export default function AstroPathFreeKundliResultPage() {
  return (
    <KundliResultView
      variant="a"
      fallbackInputPath="/astro-path/free-kundli"
      checkoutHref="/astro-path/checkout/kundli?source=kfp_v2&back=%2Fastro-path%2Ffree-kundli%2Fresult"
      ctaSourcePage="free_kundli_result_v2"
      idPrefix="free-kundli-result-v2"
      videoEmbedUrl="https://player.mediadelivery.net/play/550381/2a2bf641-1191-4b83-98b5-dc37a5184255"
      videoHeadline="VERY IMPORTANT: WATCH THIS"
      videoPlacement="below_core_chart"
    />
  );
}
