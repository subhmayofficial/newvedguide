import type { Metadata } from "next";
import { SevenHorsesProductPage } from "@/components/sections/seven-horses-product-page";

export const metadata: Metadata = {
  title: "7 Horses on Raw Pyrite Frame — VedGuide",
  description:
    "Vastu-aligned 7 Horses on Raw Pyrite Frame for career growth, wealth attraction, and prosperity. Limited Edition. Cash on Delivery available. Free shipping.",
  openGraph: {
    title: "7 Horses on Raw Pyrite Frame — VedGuide",
    description:
      "Attract fame, prosperity & career success with the Surya Dev 7 Horses on Raw Pyrite Frame. Vastu-aligned. COD available.",
  },
};

export default function SevenHorsesPage() {
  return <SevenHorsesProductPage />;
}
