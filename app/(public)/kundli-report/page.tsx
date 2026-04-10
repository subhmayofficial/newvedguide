import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, FileText, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SalesPageTracker } from "@/components/analytics/sales-page-tracker";

export const metadata: Metadata = {
  title: "Personalized Kundli Report",
  description:
    "40–45 page manual Vedic kundli analysis — dasha, houses, remedies, and clear timing. ₹399.",
};

const INCLUDES = [
  "Full birth chart with manual review (not auto-generated fluff)",
  "Mahadasha / Antardasha roadmap — next 20 years sketched clearly",
  "House-by-house themes: career, marriage, health, money",
  "Dosha & yog — what actually matters for you + practical remedies",
  "40–45 page PDF + WhatsApp delivery",
];

export default function KundliReportSalesPage() {
  return (
    <div className="bg-background">
      <SalesPageTracker sourcePage="/kundli-report" />
      <section className="border-b border-border/50 bg-gradient-to-b from-gold-light/35 via-background to-background px-4 py-14 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-3 inline-flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-brand">
            <Sparkles className="size-3.5" />
            Most popular
          </p>
          <h1 className="font-heading text-3xl font-black leading-tight text-foreground sm:text-4xl md:text-5xl">
            Personalized Kundli Report
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">
            A real astrologer reads your chart and writes a detailed PDF — clear language, no
            generic printouts. One-time payment, no subscription.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              className="h-11 min-w-[200px] bg-brand px-8 text-base font-bold text-white hover:bg-brand-hover"
              render={<Link href="/free-kundli" />}
            >
              Start with free kundli
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-11 min-w-[200px] border-brand/40 font-bold text-brand"
              render={<Link href="/checkout/kundli?source=kundli_report_page" />}
            >
              Buy report — ₹399
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            <Lock className="mr-1 inline size-3 align-middle" />
            Secure checkout · 24–48h delivery · Optional FastTrack
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <div className="flex items-center gap-2 text-brand">
          <FileText className="size-5" />
          <h2 className="font-heading text-2xl font-bold text-foreground">What you get</h2>
        </div>
        <ul className="mt-6 space-y-4">
          {INCLUDES.map((line) => (
            <li key={line} className="flex gap-3 text-[15px] leading-relaxed text-foreground">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-brand" />
              <span>{line}</span>
            </li>
          ))}
        </ul>

        <div className="mt-12 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <p className="text-center text-sm font-medium text-muted-foreground">
            New here? Generate your{" "}
            <Link href="/free-kundli" className="font-bold text-brand underline-offset-4 hover:underline">
              free kundli
            </Link>{" "}
            first — then unlock the full report from your result page or checkout directly.
          </p>
          <div className="mt-6 flex justify-center">
            <Button
              className="h-11 bg-brand px-8 text-base font-bold text-white hover:bg-brand-hover"
              render={<Link href="/checkout/kundli?source=kundli_report_page" />}
            >
              Pay ₹399 &amp; get my report
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
