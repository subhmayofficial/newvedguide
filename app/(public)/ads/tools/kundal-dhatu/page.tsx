import type { Metadata } from "next";
import { KundalDhatuTool } from "@/components/sections/kundal-dhatu-tool";
import { adsFreeKundliHref } from "@/lib/constants/ads-funnel";

export const metadata: Metadata = {
  title: "Kundal Dhatu Check — Quick Match",
  description:
    "Select your Rashi and get the recommended kundal metal, then continue to the free kundli flow.",
};

export default function AdsKundalDhatuToolPage() {
  return (
    <div className="min-h-[70vh] bg-background">
      <KundalDhatuTool
        variant="astro"
        freeKundliHref={adsFreeKundliHref()}
        idPrefix="kundal-dhatu-ads"
      />
    </div>
  );
}
