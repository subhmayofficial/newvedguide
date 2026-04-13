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
      checkoutHref="/checkout/kundli?source=kfp_v2&back=%2Fastro-path%2Ffree-kundli%2Fresult"
      ctaSourcePage="free_kundli_result_v2"
    />
  );
}
