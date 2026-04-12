import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, MessageCircle, Video } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Consultation",
  description: "Book a personal astrology consultation with VedGuide.",
};

const STEPS = [
  {
    icon: MessageCircle,
    title: "Share your question",
    body: "Career, marriage, health, timing — whatever you want clarity on, in your own words.",
  },
  {
    icon: CalendarClock,
    title: "Pick a slot",
    body: "We will coordinate a suitable time. You get focused time with the astrologer, not a rushed call.",
  },
  {
    icon: Video,
    title: "Get clear guidance",
    body: "Practical steps rooted in your chart — not vague one-liners.",
  },
];

export default function ConsultationPage() {
  return (
    <div className="bg-background">
      <section className="border-b border-border/50 bg-gradient-to-b from-brand-light/25 to-background px-4 py-14 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-heading text-3xl font-black text-foreground sm:text-4xl">
            Personal consultation
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
            Talk directly with AstroGuru Ashutosh for chart-based answers to your real-life questions.
            Ideal when you need dialogue, not only a PDF.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <h2 className="font-heading text-center text-xl font-bold text-foreground">How it works</h2>
        <ul className="mt-8 space-y-8">
          {STEPS.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <Icon className="size-5" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold text-foreground">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-12 rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
          <p className="text-sm font-medium text-foreground">
            Booking &amp; pricing are shared on WhatsApp or email — tell us what you need and we will
            reply with next steps.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              id="consultation-get-chart-first-cta"
              className="bg-brand font-bold text-white hover:bg-brand-hover"
              render={<Link href="/free-kundli" />}
            >
              Get your chart first (free)
            </Button>
            <Button id="consultation-see-report-cta" variant="outline" render={<Link href="/kundli-report" />}>
              See report option
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
