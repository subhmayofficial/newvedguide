import type { Metadata } from "next";
import { KadaProductPage } from "@/components/sections/kada-product-page";

export const metadata: Metadata = {
  title: "Astrological Protection Kada — VedGuide",
  description:
    "Vedic Silver Kada for mental peace, emotional stability, and Shani-Rahu dosh nivaran. Pure Silver & Silver Plated options. Cash on Delivery available. Personalized delivery in 15-20 days.",
  openGraph: {
    title: "Astrological Protection Kada — VedGuide",
    description:
      "Control your emotions & attract positive energy with an Astrological Vedic Kada. Shani-Rahu dosh nivaran. COD available.",
  },
};

export default function KadaPage() {
  return <KadaProductPage />;
}
