import type { Metadata } from "next";
import { Suspense } from "react";
import { KundliCheckout } from "@/components/sections/kundli-checkout";

export const metadata: Metadata = {
  title: "Complete V2 Kundli Checkout — ₹399",
  description:
    "V2 checkout flow for personalized Vedic Kundli report. Secure payment and report delivery in 24–48 hours.",
};

export default function AstroPathKundliCheckoutPage() {
  return (
    <Suspense>
      <KundliCheckout
        variant="v2"
        checkoutPagePath="/astro-path/checkout/kundli"
      />
    </Suspense>
  );
}

