import type { Metadata } from "next";
import { KundliResultView } from "@/components/sections/kundli-result-view";

export const metadata: Metadata = {
  title: "Your Free Kundli Result (B)",
  description:
    "Free kundli result variant B with Mangal Dosha context when applicable.",
};

export default function AstroPathFreeKundliResultPageB() {
  return (
    <KundliResultView
      variant="b"
      fallbackInputPath="/astro-path/free-kundli"
      checkoutHref="/astro-path/checkout/kundli?source=kfp_v2&back=%2Fastro-path%2Ffree-kundli%2Fresult%2Fb"
      ctaSourcePage="free_kundli_result_v2"
      idPrefix="free-kundli-result-v2"
      videoEmbedUrl="https://player.mediadelivery.net/play/550381/2a2bf641-1191-4b83-98b5-dc37a5184255"
      videoHeadline="VERY IMPORTANT: WATCH THIS"
      videoPlacement="below_core_chart"
    />
  );
}
