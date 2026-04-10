"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, MessageCircle, Clock, FileText, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics/events";

const CONSULTATION_OFFER = {
  title: "Want deeper guidance?",
  description:
    "Book a 15-minute focused consultation with our astrologer to discuss your Kundli, specific life questions, or current challenges.",
  price: "₹1,499",
  href: "/consultation",
};

export default function KundliThankYouPage() {
  const router = useRouter();
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("order_complete");
    if (!stored) {
      router.replace("/");
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      queueMicrotask(() => {
        setOrderId(parsed.orderId);
      });
      track.thankYouView(parsed.orderId);
      // Clear session after reading
      sessionStorage.removeItem("order_complete");
      sessionStorage.removeItem("kundli_result");
    } catch {
      router.replace("/");
    }
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
          personalized report. You&apos;ll receive it within 24 hours.
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
                  "Our astrologer reviews your birth data and prepares your 15–20 page personalized report",
              },
              {
                icon: Clock,
                title: "Delivery within 24 hours",
                description:
                  "You'll receive your report on WhatsApp. Check for a message from VedGuide.",
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

        {/* Soft upsell: Consultation */}
        <div className="mx-auto mt-10 max-w-md rounded-2xl border border-border/60 bg-surface p-6 text-left">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            While you wait
          </p>
          <h3 className="font-heading text-lg font-semibold text-foreground">
            {CONSULTATION_OFFER.title}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {CONSULTATION_OFFER.description}
          </p>
          <div className="mt-4 flex items-center justify-between">
            <span className="font-heading text-xl font-bold text-foreground">
              {CONSULTATION_OFFER.price}
            </span>
            <Button
              variant="outline"
              className="border-brand text-brand hover:bg-brand hover:text-white"
              render={<Link href={CONSULTATION_OFFER.href} />}
              onClick={() =>
                track.consultationPageViewed("thank_you_kundli")
              }
            >
              Learn more
              <ChevronRight size={14} />
            </Button>
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
