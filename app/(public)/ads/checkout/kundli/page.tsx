import type { Metadata } from "next";
import { Suspense } from "react";
import { KundliCheckout } from "@/components/sections/kundli-checkout";
import { ADS_FUNNEL, ADS_SOURCES } from "@/lib/constants/ads-funnel";

export const metadata: Metadata = {
  title: "Complete Kundli Checkout — ₹399",
  description:
    "Ads funnel checkout for personalized Vedic Kundli report. Secure payment and report delivery in 24–48 hours.",
};

export default function AdsKundliCheckoutPage() {
  return (
    <Suspense>
      <KundliCheckout
        variant="v2"
        checkoutPagePath={ADS_FUNNEL.checkoutKundli}
        defaultBackPath={ADS_FUNNEL.freeKundliResult}
        defaultSourceFunnel={ADS_SOURCES.checkout}
      />
    </Suspense>
  );
}
