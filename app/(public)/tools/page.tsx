import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { TOOLS } from "@/lib/tools";

export const metadata: Metadata = {
  title: "Astrology Tools",
  description:
    "Free kundli calculator and more Vedic astrology tools from VedGuide. Full reports are sold separately.",
};

export default function ToolsHomePage() {
  return (
    <div className="min-h-[70vh] bg-background">
      <section className="border-b border-border/50 bg-gradient-to-b from-gold-light/30 to-background px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand/5 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-brand">
            <Sparkles className="size-3.5" />
            VedGuide tools
          </p>
          <h1 className="font-heading text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Tools & calculators
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
            Free calculators only. The detailed paid kundli report lives on its own page — linked at
            the bottom.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-12">
        <ul className="space-y-4">
          {TOOLS.map((tool) => (
            <li key={tool.slug}>
              <Link
                href={tool.href}
                className="group flex items-start gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:border-brand/30 hover:shadow-md"
              >
                <span
                  className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gold-light/80 to-brand-light/40 text-2xl"
                  aria-hidden
                >
                  {tool.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-heading text-lg font-bold text-foreground">
                      {tool.title}
                    </h2>
                    {tool.status === "coming_soon" && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                        Coming soon
                      </span>
                    )}
                    {tool.status === "live" && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                        Live
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {tool.blurb}
                  </p>
                </div>
                <ArrowRight className="mt-1 size-5 shrink-0 text-brand opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100" />
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          For the full paid PDF report (not a free tool), see{" "}
          <Link href="/kundli-report" className="font-semibold text-brand underline-offset-4 hover:underline">
            Personalized Kundli Report
          </Link>
          . Or{" "}
          <Link href="/consultation" className="font-semibold text-brand underline-offset-4 hover:underline">
            book a consultation
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
