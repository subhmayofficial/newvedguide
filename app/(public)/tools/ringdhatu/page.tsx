import type { Metadata } from "next";
import { RingDhatuTool } from "@/components/sections/ring-dhatu-tool";

export const metadata: Metadata = {
  title: "Ring Dhatu Check — Rashi se metal",
  description:
    "Select your Moon sign (Rashi) and see which metal (dhatu) ring/kada is generally recommended. Free tool by VedGuide.",
};

export default function RingDhatuToolPage() {
  return (
    <div className="min-h-[70vh] bg-background">
      <RingDhatuTool />
    </div>
  );
}
