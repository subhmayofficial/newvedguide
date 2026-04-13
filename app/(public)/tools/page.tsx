import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { TOOLS } from "@/lib/tools";

export const metadata: Metadata = {
  title: "Free Astrology Tools",
  description:
    "Use VedGuide tools to get fast, practical astrology insights. Start with Free Kundli and move to detailed reports or consultation when you are ready.",
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
            Free Astrology Tools That Help You Decide Faster
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
            Career, shaadi, paisa, ya timing confusion? In tools se quick clarity lo, phir next step
            confidence ke saath choose karo.
          </p>
          <p className="mx-auto mt-2 max-w-xl text-[13px] font-medium text-brand/90">
            100% online • instant results • beginner-friendly
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

        <div className="mt-10 rounded-2xl border border-brand/20 bg-gradient-to-r from-brand/5 via-gold-light/30 to-brand/5 p-5 text-center shadow-sm">
          <h2 className="font-heading text-xl font-bold text-foreground">
            Want Deeper Personal Guidance?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Start with free tools, then unlock full personalized reading based on your birth details.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2.5">
            <Link
              href="/free-kundli"
              className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover"
            >
              Start Free Kundli
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/consultation"
              className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-background px-4 py-2 text-sm font-semibold text-brand transition hover:border-brand hover:bg-brand/5"
            >
              Book Consultation
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
