import type { Metadata } from "next";
import { KundliResultView } from "@/components/sections/kundli-result-view";

export const metadata: Metadata = {
  title: "Your Free Kundli Result",
  description:
    "Your Vedic birth chart is ready. Explore your Lagna, Moon sign, Nakshatra, and planetary positions — and unlock your full personalized report.",
};

export default function FreeKundliResultPage() {
  return <KundliResultView />;
}
