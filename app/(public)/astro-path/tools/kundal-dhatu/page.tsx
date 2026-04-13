import type { Metadata } from "next";
import { KundalDhatuTool } from "@/components/sections/kundal-dhatu-tool";

export const metadata: Metadata = {
  title: "Kundal Dhatu Check — Quick Match",
  description:
    "Select your Rashi and get the recommended kundal metal, then continue to the free kundli flow.",
};

export default function AstroPathKundalDhatuToolPage() {
  return (
    <div className="min-h-[70vh] bg-background">
      <KundalDhatuTool
        variant="astro"
        freeKundliHref="/astro-path/free-kundli?source=kfp_v2_kundal_dhatu"
        idPrefix="kundal-dhatu-v2"
      />
    </div>
  );
}
