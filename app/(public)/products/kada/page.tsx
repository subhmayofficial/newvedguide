import type { Metadata } from "next";
import { KadaProductPage } from "@/components/sections/kada-product-page";
import { createServiceClient } from "@/lib/supabase/server";
import { getKadaPricing } from "@/lib/products/kada-pricing-server";

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

export const dynamic = "force-dynamic";

export default async function KadaPage() {
  const pricing = await getKadaPricing(createServiceClient());
  return <KadaProductPage pricing={pricing} />;
}
