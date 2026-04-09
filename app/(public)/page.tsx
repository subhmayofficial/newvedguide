import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <section className="spiritual-pattern flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-brand">
        Vedic Astrology · Ancient Wisdom
      </p>
      <h1 className="font-heading max-w-3xl text-5xl font-bold leading-tight text-foreground md:text-7xl">
        Know Your Stars.
        <br />
        <span className="brand-gradient-text">Know Yourself.</span>
      </h1>
      <p className="mt-6 max-w-xl text-lg text-muted-foreground">
        Discover your Kundli, understand your life path, and get personalized
        Vedic astrology guidance — grounded in tradition, built for today.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <Button
          size="lg"
          className="bg-brand hover:bg-brand-hover px-8 text-white"
          render={<Link href="/free-kundli" />}
        >
          Get Your Free Kundli
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="px-8"
          render={<Link href="/consultation" />}
        >
          Book a Consultation
        </Button>
      </div>
      <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
        <span>⭐ 4.9/5 Rating</span>
        <span>2,400+ Kundlis Generated</span>
        <span>100% Secure Payments</span>
      </div>
    </section>
  );
}
