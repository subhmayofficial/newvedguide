import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About VedGuide",
  description: "Vedic astrology by AstroGuru Ashutosh — tradition-backed, practical guidance.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:py-20">
      <h1 className="font-heading text-3xl font-black text-foreground sm:text-4xl">About VedGuide</h1>
      <p className="mt-2 text-sm font-semibold text-brand">by AstroGuru Ashutosh</p>

      <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-muted-foreground">
        <p>
          VedGuide exists to make serious Vedic astrology accessible — clear language, honest
          timelines, and guidance you can actually use in career, relationships, and major life
          decisions.
        </p>
        <p>
          We combine classical chart principles with a practical mindset: what the planets suggest,
          what it means for you this year, and what to do next.
        </p>
        <p>
          Whether you start with a{" "}
          <Link href="/free-kundli" className="font-semibold text-brand underline-offset-4 hover:underline">
            free kundli
          </Link>{" "}
          or go straight to a{" "}
          <Link href="/kundli-report" className="font-semibold text-brand underline-offset-4 hover:underline">
            full personalized report
          </Link>
          , the goal is the same — clarity without fear-mongering.
        </p>
      </div>

      <p className="mt-10 text-sm text-muted-foreground">
        <Link href="/faq" className="font-medium text-brand hover:underline">
          Read FAQ
        </Link>
        {" · "}
        <Link href="/tools" className="font-medium text-brand hover:underline">
          Tools
        </Link>
      </p>
    </div>
  );
}
