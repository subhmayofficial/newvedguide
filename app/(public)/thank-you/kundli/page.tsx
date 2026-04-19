"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  MessageCircle,
  Clock,
  FileText,
  ChevronRight,
  Sparkles,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics/events";

const CONSULTATION_OFFER = {
  title: "Live consultation — doubts clear karein",
  bullets: [
    "15 min focused session — seedha aapki chart pe baat",
    "Career, rishte, shaadi, health — jahan bhi clarity chahiye",
    "Practical next steps, na ki generic advice",
  ],
  price: "₹1,499",
  href: "/consultation",
};

/**
 * Survives React Strict Mode double-mount: first effect clears sessionStorage,
 * second run would see empty storage and wrongly redirect home without this.
 */
let thankYouOrderIdCache: string | null = null;

export default function KundliThankYouPage() {
  const router = useRouter();
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("order_complete");
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { orderId?: string };
        const id = parsed.orderId;
        if (typeof id === "string" && id.length > 0) {
          thankYouOrderIdCache = id;
          track.thankYouView(id);
          sessionStorage.removeItem("order_complete");
          sessionStorage.removeItem("kundli_result");
          const raf = requestAnimationFrame(() => setOrderId(id));
          return () => cancelAnimationFrame(raf);
        }
      } catch {
        /* fall through */
      }
    }

    if (thankYouOrderIdCache) {
      const cid = thankYouOrderIdCache;
      const raf = requestAnimationFrame(() => setOrderId(cid));
      return () => cancelAnimationFrame(raf);
    }

    router.replace("/");
  }, [router]);

  if (!orderId) return null;

  return (
    <div className="min-h-screen spiritual-pattern">
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        {/* Success icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50 ring-8 ring-green-50/50">
          <CheckCircle2 size={40} className="text-green-600" />
        </div>

        <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-brand">
          Order Confirmed
        </p>
        <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
          Your Kundli Report
          <br />
          is on its way
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground">
          We&apos;ve received your order and our astrologer is preparing your
          personalized report. You&apos;ll receive it within 24–48 hours (or faster
          if you chose FastTrack).
        </p>

        {/* What happens next */}
        <div className="mx-auto mt-10 max-w-md rounded-2xl border border-border/60 bg-card p-6 text-left shadow-sm">
          <h2 className="font-heading mb-4 text-lg font-semibold text-foreground">
            What happens next
          </h2>
          <div className="space-y-4">
            {[
              {
                icon: FileText,
                title: "Report preparation",
                description:
                  "Our astrologer reviews your birth data and prepares your 40–45 page personalized PDF — manually written for you, not auto-generated.",
              },
              {
                icon: Clock,
                title: "Delivery timeline",
                description:
                  "Standard: 24–48 hours on WhatsApp (+ email if you shared it). FastTrack orders get priority within ~12 hours.",
              },
              {
                icon: MessageCircle,
                title: "Questions? Reach out",
                description:
                  "WhatsApp us if you have any questions about your order or report.",
              },
            ].map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-light">
                  <Icon size={15} className="text-brand" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* WhatsApp CTA */}
        <div className="mt-6">
          <Button
            size="lg"
            className="bg-[#25D366] hover:bg-[#1DAE52] px-8 text-white"
            render={
              <a
                href="https://wa.me/91XXXXXXXXXX?text=Hi%20VedGuide%2C%20I%20just%20placed%20a%20Kundli%20Report%20order."
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            <MessageCircle size={18} />
            Message us on WhatsApp
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            For fastest response
          </p>
        </div>

        {/* Consultation upsell */}
        <div className="relative mx-auto mt-12 max-w-md overflow-hidden rounded-3xl border-2 border-brand/35 bg-gradient-to-br from-amber-100/80 via-white to-brand-light/40 p-[1px] shadow-[0_20px_56px_-20px_rgba(180,83,9,0.45)]">
          <div className="relative rounded-[1.35rem] bg-card/98 px-5 py-6 text-left backdrop-blur-sm">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-brand/15 blur-2xl"
            />
            <div className="relative flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-orange-700 text-white shadow-lg shadow-brand/25">
                <Sparkles className="size-5" strokeWidth={2.2} />
              </div>
              <div className="min-w-0 pt-0.5">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-brand">
                  While you wait
                </p>
                <h3 className="font-heading text-lg font-extrabold leading-snug text-foreground md:text-xl">
                  {CONSULTATION_OFFER.title}
                </h3>
                <p className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                  <Video className="size-3.5 shrink-0 text-brand" />
                  Voice / video slot — book online
                </p>
              </div>
            </div>
            <ul className="relative mt-4 space-y-2.5 border-t border-border/50 pt-4">
              {CONSULTATION_OFFER.bullets.map((line) => (
                <li key={line} className="flex gap-2.5 text-[13px] leading-snug text-foreground">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand/12 text-[10px] font-bold text-brand">
                    ✓
                  </span>
                  <span className="text-muted-foreground">{line}</span>
                </li>
              ))}
            </ul>
            <div className="relative mt-5 flex flex-col gap-3 border-t border-border/50 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  From
                </p>
                <p className="font-heading text-2xl font-extrabold text-foreground">
                  {CONSULTATION_OFFER.price}
                  <span className="ml-1 text-sm font-semibold text-muted-foreground">
                    / session
                  </span>
                </p>
              </div>
              <Button
                size="lg"
                className="w-full shrink-0 bg-brand px-6 font-extrabold text-white shadow-md hover:bg-brand-hover sm:w-auto"
                render={<Link href={CONSULTATION_OFFER.href} />}
                onClick={() => track.consultationPageViewed("thank_you_kundli")}
              >
                Book consultation
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Back home */}
        <p className="mt-10 text-sm text-muted-foreground">
          <Link href="/" className="underline hover:text-foreground">
            Back to VedGuide
          </Link>
        </p>
      </div>
    </div>
  );
}
