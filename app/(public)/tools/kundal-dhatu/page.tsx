import type { Metadata } from "next";
import { KundalDhatuTool } from "@/components/sections/kundal-dhatu-tool";

export const metadata: Metadata = {
  title: "Kundal Dhatu Check — Rashi se metal",
  description:
    "Select your Moon sign (Rashi) and see which metal (dhatu) kundal/kada is generally recommended. Free tool by VedGuide.",
};

export default function KundalDhatuToolPage() {
  return (
    <div className="min-h-[70vh] bg-background">
      <KundalDhatuTool />
    </div>
  );
}
