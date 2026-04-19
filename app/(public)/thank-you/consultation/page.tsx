"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, MessageCircle, Calendar, Clock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getWhatsAppHref } from "@/lib/constants/contact";
import { track } from "@/lib/analytics/events";

let cachedOrderId: string | null = null;

export default function ConsultationThankYouPage() {
  const router = useRouter();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [packageId, setPackageId] = useState<string>("45min");

  useEffect(() => {
    const raw = sessionStorage.getItem("consultation_complete");
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { orderId?: string; packageId?: string };
        if (parsed.orderId) {
          cachedOrderId = parsed.orderId;
          const oid = parsed.orderId;
          const pkg = parsed.packageId ?? "45min";
          track.thankYouView(oid);
          sessionStorage.removeItem("consultation_complete");
          const raf = requestAnimationFrame(() => {
            setOrderId(oid);
            setPackageId(pkg);
          });
          return () => cancelAnimationFrame(raf);
        }
      } catch { /* fall through */ }
    }
    if (cachedOrderId) {
      const cid = cachedOrderId;
      const raf = requestAnimationFrame(() => setOrderId(cid));
      return () => cancelAnimationFrame(raf);
    }
    router.replace("/consultation");
  }, [router]);

  if (!orderId) return null;

  const is15min = packageId === "15min";
  const waHref = getWhatsAppHref(
    is15min
      ? "Hi VedGuide! Maine 15 min consultation book ki hai. Slot kab milega?"
      : "Hi VedGuide! Maine 45 min consultation book ki hai. Slot schedule karna hai."
  );

  return (
    <div className="min-h-screen spiritual-pattern">
      <div className="mx-auto max-w-xl px-4 py-16 text-center">

        {/* Success icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50 ring-8 ring-green-50/50">
          <CheckCircle2 size={40} className="text-green-600" />
        </div>

        <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-brand">
          Booking Confirmed 🎉
        </p>
        <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
          Aapka Slot<br />
          <span className="text-brand">Book Ho Gaya</span>
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-base text-muted-foreground">
          {is15min
            ? "15 minute ki focused session — hum aapko WhatsApp pe slot schedule karenge."
            : "45 minute ki complete session — AstroGuru ki team aapko WhatsApp pe contact karegi."}
        </p>

        {/* What happens next */}
        <div className="mx-auto mt-10 max-w-md rounded-2xl border border-border/60 bg-card p-6 text-left shadow-sm">
          <h2 className="font-heading mb-5 text-lg font-bold text-foreground">Aage kya hoga?</h2>
          <div className="space-y-4">
            {[
              {
                icon: MessageCircle,
                title: "WhatsApp confirmation",
                desc: "Aapko 24 ghante ke andar WhatsApp message aayega slot ke liye.",
              },
              {
                icon: Calendar,
                title: "Slot select karein",
                desc: "Apni convenience ke mutabik time choose karein — flexible scheduling.",
              },
              {
                icon: Clock,
                title: "Session ka din",
                desc: "Video ya phone call — AstroGuru Ashutosh ke saath direct baat.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-light">
                  <Icon size={15} className="text-brand" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* WhatsApp CTA */}
        <div className="mt-6">
          <Button
            size="lg"
            className="w-full max-w-xs bg-[#25D366] hover:bg-[#1DAE52] px-8 text-white font-bold"
            render={<a href={waHref} target="_blank" rel="noopener noreferrer" />}
          >
            <MessageCircle size={18} />
            WhatsApp pe Message Karein
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            Fastest response — usually within a few hours
          </p>
        </div>

        {/* Stars / review nudge */}
        <div className="mt-10 rounded-2xl border border-border/60 bg-surface p-5">
          <div className="mb-2 flex justify-center gap-1">
            {[1,2,3,4,5].map((i) => <Star key={i} size={18} className="fill-gold text-gold" />)}
          </div>
          <p className="text-sm text-muted-foreground">
            Session ke baad apna experience zaroor share karein — aapki feedback se dusron ko madad milti hai.
          </p>
        </div>

        <p className="mt-10 text-sm text-muted-foreground">
          <Link href="/" className="underline hover:text-foreground">
            Back to VedGuide
          </Link>
        </p>
      </div>
    </div>
  );
}
