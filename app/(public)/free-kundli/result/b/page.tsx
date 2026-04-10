import type { Metadata } from "next";
import { KundliResultView } from "@/components/sections/kundli-result-view";

export const metadata: Metadata = {
  title: "Your Free Kundli Result (B)",
  description:
    "Your Vedic birth chart is ready — variant B includes Mangal Dosha context when applicable.",
};

/** Version B — same funnel as A, with Mangal Dosha highlight block for A/B testing. */
export default function FreeKundliResultPageB() {
  return <KundliResultView variant="b" />;
}
