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
      checkoutHref="/checkout/kundli?source=kfp_v2&back=%2Fastro-path%2Ffree-kundli%2Fresult%2Fb"
      ctaSourcePage="free_kundli_result_v2"
    />
  );
}
