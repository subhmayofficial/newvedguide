import type { Metadata } from "next";
import { SevenHorsesProductPage } from "@/components/sections/seven-horses-product-page";

export const metadata: Metadata = {
  title: "7 Horses on Frame — VedGuide",
  description:
    "Vastu-aligned 7 Horses on Frame for career growth, wealth attraction, and prosperity. 100% anti-scratchable. Limited Edition. Cash on Delivery available. Free shipping.",
  openGraph: {
    title: "7 Horses on Frame — VedGuide",
    description:
      "Attract fame, prosperity & career success with the Surya Dev 7 Horses on Frame. Vastu-aligned. 100% anti-scratchable. COD available.",
  },
};

export default function SevenHorsesPage() {
  return <SevenHorsesProductPage />;
}
