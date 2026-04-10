import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Muhurat & Panchang",
  description: "Auspicious timings and panchang view — coming soon on VedGuide.",
};

export default function MuhuratToolPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:py-20">
      <p className="text-center text-[11px] font-bold uppercase tracking-widest text-brand">
        Coming soon
      </p>
      <h1 className="font-heading mt-2 text-center text-3xl font-black text-foreground">
        Muhurat &amp; Panchang
      </h1>
      <p className="mx-auto mt-3 max-w-md text-center text-[15px] leading-relaxed text-muted-foreground">
        A clean daily panchang and muhurat finder for travel, purchases, and important starts —
        aligned with VedGuide calculations.
      </p>
      <div className="mt-10 rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          For personalized timing on career, marriage, and major life moves, a full chart review
          already covers the right windows.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button className="bg-brand hover:bg-brand-hover text-white" render={<Link href="/free-kundli" />}>
            Free Kundli
          </Button>
          <Button variant="outline" render={<Link href="/consultation" />}>
            Consultation
          </Button>
        </div>
      </div>
      <p className="mt-8 text-center text-sm">
        <Link href="/tools" className="font-medium text-brand hover:underline">
          ← All tools
        </Link>
      </p>
    </div>
  );
}
