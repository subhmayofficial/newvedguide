import type { Metadata } from "next";
import { Suspense } from "react";
import { KundliCheckout } from "@/components/sections/kundli-checkout";

export const metadata: Metadata = {
  title: "Get Your Personalized Kundli Report — ₹399",
  description:
    "Complete your order for a personalized Vedic Kundli report. One-time payment. Standard delivery 24–48 hours; optional FastTrack in 12 hours.",
};

export default function KundliCheckoutPage() {
  return (
    <Suspense>
      <KundliCheckout />
    </Suspense>
  );
}
