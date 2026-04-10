"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Lock,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  Zap,
  Clock,
  MapPin,
  Calendar,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { track } from "@/lib/analytics/events";
import { getOrCreateSessionId } from "@/lib/analytics/session";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

interface KundliSessionData {
  submissionId?: string;
  name?: string;
  dob?: string;
  tob?: string;
  pob?: string;
}

const BASE_PRICE = 39900; // ₹399 in paise
const BUMP_PRICE = 9900;  // ₹99 in paise

const WHAT_YOU_GET = [
  "Aapki poori birth chart ka manual analysis",
  "Career aur financial direction — exact",
  "Rishte aur shaadi ki planetary timing",
  "20 saal ka Dasha roadmap",
  "Dosha / Yog — asli impact aur remedy",
  "Health ke kaunse areas dhyan dein",
  "40–45 page personalized PDF",
  "WhatsApp + Email pe deliver hogi",
];

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// ─── Section divider with label ───────────────────────────────────────────────

// ─── FastTrack bump offer ─────────────────────────────────────────────────────

function BumpOffer({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <>
      <style>{`
        @keyframes vg-ft-zoom {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.018); }
        }
        @keyframes vg-ft-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.0), 0 6px 28px -8px rgba(245,158,11,0.45); }
          50%       { box-shadow: 0 0 0 6px rgba(245,158,11,0.18), 0 8px 32px -6px rgba(245,158,11,0.55); }
        }
        .vg-ft-card {
          animation: vg-ft-zoom 2.6s ease-in-out infinite, vg-ft-glow 2.6s ease-in-out infinite;
        }
        .vg-ft-card-checked {
          animation: none;
        }
      `}</style>
      <div
        onClick={() => onChange(!checked)}
        className={cn(
          "vg-ft-card relative cursor-pointer overflow-hidden rounded-2xl border-2 transition-all duration-200",
          checked
            ? "vg-ft-card-checked border-amber-500 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100/60 shadow-[0_0_0_4px_rgba(245,158,11,0.22),0_8px_28px_-6px_rgba(217,119,6,0.5)]"
            : "border-amber-400/60 bg-gradient-to-br from-amber-50/80 to-orange-50/40 hover:border-amber-500/80"
        )}
      >
        {/* Top badge strip */}
        <div className="flex items-center justify-between bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-1.5">
          <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-white">
            <Zap size={11} strokeWidth={3} />
            Add-on offer
          </span>
          <span className="rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-extrabold text-white">
            Only ₹99
          </span>
        </div>

        <div className="flex items-start gap-3 px-4 py-3.5">
          {/* Checkbox */}
          <div
            className={cn(
              "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
              checked ? "border-amber-500 bg-amber-500" : "border-amber-400 bg-white"
            )}
          >
            {checked && <CheckCircle2 className="size-3.5 text-white" strokeWidth={3} />}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-black leading-tight tracking-tight text-foreground" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
              ⚡ FastTrack Delivery —{" "}
              <span className="text-amber-600">12 Ghante</span>
            </p>
            <p className="mt-1 text-[12px] leading-snug text-muted-foreground">
              Aapki report <span className="font-bold text-amber-700">12 ghante</span> mein ready hogi —{" "}
              normal 24-48h ke bajaye.
            </p>

            {/* Visual comparison */}
            <div className="mt-2.5 flex items-center gap-3">
              <div className="flex items-center gap-1.5 rounded-lg bg-muted/60 px-2.5 py-1.5">
                <Clock size={12} className="text-muted-foreground" />
                <span className="text-[11px] font-medium text-muted-foreground line-through">24–48h</span>
              </div>
              <span className="text-[12px] font-bold text-amber-600">→</span>
              <div className="flex items-center gap-1.5 rounded-lg bg-amber-500/15 px-2.5 py-1.5">
                <Zap size={12} className="text-amber-600" />
                <span className="font-heading text-[13px] font-black text-amber-700">
                  <span className="text-[15px]">12</span> ghante
                </span>
              </div>
            </div>

            <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-amber-700">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-amber-500" />
              </span>
              Limited priority slots — aaj ke liye
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Pay button ───────────────────────────────────────────────────────────────

function PayButton({
  loading,
  paymentReady,
  onPay,
  total,
}: {
  loading: boolean;
  paymentReady: boolean;
  onPay: () => void;
  total: number;
}) {
  const displayTotal = `₹${total / 100}`;
  const busy = loading || !paymentReady;
  return (
    <div className="space-y-3">
      <style>{`
        @keyframes vg-pay-shimmer {
          0%   { transform: translateX(-140%) skewX(-18deg); }
          100% { transform: translateX(260%) skewX(-18deg); }
        }
        .vg-pay-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent 20%, rgba(255,255,255,0.22) 50%, transparent 80%);
          animation: vg-pay-shimmer 2.4s ease-in-out infinite;
          pointer-events: none;
          border-radius: inherit;
        }
      `}</style>
      <button
        type="button"
        onClick={onPay}
        disabled={busy}
        className="vg-pay-btn relative w-full overflow-hidden rounded-2xl bg-brand py-4 text-[16px] font-extrabold text-white shadow-[0_6px_24px_-6px_rgba(180,83,9,0.55)] transition-all hover:bg-brand-hover active:scale-[0.98] disabled:opacity-70"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={18} className="animate-spin" />
            Processing...
          </span>
        ) : !paymentReady ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={18} className="animate-spin" />
            Loading secure payment…
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Lock size={15} strokeWidth={2.5} />
            Pay {displayTotal} &amp; Get My Report
          </span>
        )}
      </button>

      {/* Trust block */}
      <div className="rounded-xl border border-border/40 bg-muted/20 px-4 py-3">
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
          {[
            { icon: "✍️", text: "Manual analysis — automated nahi" },
            { icon: "⏰", text: "24-48 ghante delivery (FastTrack: 12h)" },
            { icon: "🔒", text: "Secure payment via Razorpay" },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <span>{icon}</span>
              {text}
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-[11px] text-muted-foreground">
        Aaj ke liye limited processing slots available.{" "}
        <Link href="/terms" className="underline">Terms</Link>
        {" & "}
        <Link href="/refund-policy" className="underline">Refund Policy</Link>
      </p>
    </div>
  );
}

// ─── Main checkout ────────────────────────────────────────────────────────────

export function KundliCheckout() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [prefilled, setPrefilled] = useState<KundliSessionData>({});
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    dob: "",
    tob: "",
    pob: "",
  });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [loading, setLoading] = useState(false);
  const [razorpayReady, setRazorpayReady] = useState(false);
  const [fastTrack, setFastTrack] = useState(false);
  const totalPaise = BASE_PRICE + (fastTrack ? BUMP_PRICE : 0);

  const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

  const sourceFunnel = searchParams.get("source") ?? "direct_kundli";
  const utmSource = searchParams.get("utm_source") ?? undefined;
  const utmMedium = searchParams.get("utm_medium") ?? undefined;
  const utmCampaign = searchParams.get("utm_campaign") ?? undefined;

  useEffect(() => {
    let cancelled = false;

    function markReady() {
      if (!cancelled && typeof window !== "undefined" && window.Razorpay) {
        setRazorpayReady(true);
      }
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existing) {
      if (window.Razorpay) markReady();
      else existing.addEventListener("load", markReady, { once: true });
    } else {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.addEventListener("load", markReady, { once: true });
      document.head.appendChild(script);
    }

    const stored = sessionStorage.getItem("kundli_result");
    if (stored) {
      try {
        const parsed: KundliSessionData = JSON.parse(stored);
        setPrefilled(parsed);
        setForm((f) => ({
          ...f,
          fullName: parsed.name ?? "",
          dob: parsed.dob ?? "",
          tob: parsed.tob ?? "",
          pob: parsed.pob ?? "",
        }));
      } catch { /* silent */ }
    }

    getOrCreateSessionId();
    track.checkoutViewed("paid-kundli", sourceFunnel, !!stored);
    return () => {
      cancelled = true;
    };
  }, [sourceFunnel]);

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const errs: Partial<typeof form> = {};
    if (!form.fullName.trim()) errs.fullName = "Name daalna zaroori hai";
    if (!/^[6-9]\d{9}$/.test(form.phone)) errs.phone = "Valid 10-digit WhatsApp number daalo";
    if (!form.dob) errs.dob = "Date of birth required";
    if (!form.tob) errs.tob = "Time of birth required";
    if (!form.pob.trim()) errs.pob = "Place of birth required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handlePay() {
    if (!validate()) return;

    if (!razorpayKeyId || razorpayKeyId.includes("your_razorpay")) {
      alert(
        "Payment key is not set. Add NEXT_PUBLIC_RAZORPAY_KEY_ID to .env.local (same value as RAZORPAY_KEY_ID) and restart the dev server."
      );
      return;
    }

    if (!razorpayReady || !window.Razorpay) {
      alert("Payment window is still loading. Please wait a second and try again.");
      return;
    }

    setLoading(true);

    try {
      track.paymentInitiated("paid-kundli", totalPaise, sourceFunnel);

      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSlug: "paid-kundli",
          addOnSlugs: fastTrack ? ["fast-track-addon"] : [],
          amountPaise: totalPaise,
          customer: {
            fullName: form.fullName,
            phone: form.phone,
            email: form.email || undefined,
            dob: form.dob,
            tob: form.tob,
            pob: form.pob,
          },
          attribution: {
            sourceFunnel,
            sourcePage: "/checkout/kundli",
            utmSource,
            utmMedium,
            utmCampaign,
            referrer: document.referrer || undefined,
            sessionId: getOrCreateSessionId(),
            kundliSubmissionId: prefilled.submissionId,
          },
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof payload.error === "string"
            ? payload.error
            : payload.error && typeof payload.error === "object"
              ? JSON.stringify(payload.error)
              : `Order could not be created (${res.status})`;
        throw new Error(msg);
      }

      const { razorpayOrderId, orderDbId: dbId } = payload as {
        razorpayOrderId?: string;
        orderDbId?: string;
      };
      if (!razorpayOrderId || !dbId) {
        throw new Error("Invalid response from server. Please try again.");
      }

      const options = {
        key: razorpayKeyId,
        amount: totalPaise,
        currency: "INR",
        name: "VedGuide",
        description: fastTrack
          ? "Personalized Kundli Report + FastTrack 12h"
          : "Personalized Kundli Report",
        order_id: razorpayOrderId,
        prefill: {
          name: form.fullName,
          contact: `+91${form.phone}`,
          email: form.email || undefined,
        },
        theme: { color: "#B45309" },
        modal: {
          ondismiss: () => {
            setLoading(false);
            track.checkoutAbandoned("paid-kundli", sourceFunnel, "payment_modal");
            void fetch("/api/payments/failure", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderDbId: dbId, reason: "modal_dismissed" }),
            });
          },
        },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          const verifyRes = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderDbId: dbId,
            }),
          });
          const verifyJson = await verifyRes.json();
          if (verifyJson.success) {
            track.paymentSuccess("paid-kundli", totalPaise, dbId, sourceFunnel);
            sessionStorage.setItem(
              "order_complete",
              JSON.stringify({ orderId: dbId, product: "kundli_report", fastTrack })
            );
            router.push("/thank-you/kundli");
          } else {
            track.paymentFailed("paid-kundli", totalPaise, "verify_failed");
            setLoading(false);
            alert("Payment verification failed. Please contact support.");
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", async () => {
        track.paymentFailed("paid-kundli", totalPaise);
        if (dbId) {
          await fetch("/api/payments/failure", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderDbId: dbId, reason: "razorpay_failed" }),
          });
        }
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      console.error(err);
      setLoading(false);
      const message =
        err instanceof Error && err.message
          ? err.message
          : "Something went wrong. Please try again.";
      alert(message);
    }
  }

  const fn = form.fullName ? firstName(form.fullName) : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/60 px-4 py-3.5">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link
            href="/free-kundli/result"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft size={16} />
            Back
          </Link>
          <span className="font-heading text-lg font-bold text-foreground">Vedगuide</span>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock size={12} />
            Secure
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
        {/* Heading */}
        <div className="mb-6">
          <h1 className="font-heading text-[1.5rem] font-black leading-tight text-foreground sm:text-[1.85rem]">
            {fn ? `${fn}, complete your order` : "Complete your order"}
          </h1>
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            We will prepare your kundli based on these details.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* ── Left: Form ────────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-[13px] font-semibold text-foreground">
                Full name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fullName"
                value={form.fullName}
                onChange={(e) => set("fullName", e.target.value)}
                placeholder="Your full name"
                className={cn("h-11 text-[14px]", errors.fullName ? "border-destructive" : "")}
              />
              {errors.fullName && (
                <p className="text-xs text-destructive">{errors.fullName}</p>
              )}
            </div>

            {/* Phone — single seamless container */}
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-[13px] font-semibold text-foreground">
                WhatsApp number <span className="text-destructive">*</span>
              </Label>
              <div
                className={cn(
                  "flex h-11 overflow-hidden rounded-lg border bg-background transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0",
                  errors.phone ? "border-destructive" : "border-input"
                )}
              >
                <span className="flex shrink-0 items-center border-r border-input bg-muted px-3.5 text-[14px] font-semibold text-muted-foreground">
                  +91
                </span>
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={form.phone}
                  onChange={(e) =>
                    set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  placeholder="10-digit number"
                  className="min-w-0 flex-1 bg-transparent px-3 text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
              {errors.phone && (
                <p className="text-xs text-destructive">{errors.phone}</p>
              )}
            </div>

            {/* Email — optional */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[13px] font-semibold text-foreground">
                Email{" "}
                <span className="text-[11px] font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="For PDF delivery"
                className="h-11 text-[14px]"
              />
            </div>

            {/* Divider for birth details */}
            <div className="flex items-center gap-3 pt-2">
              <div className="h-px flex-1 bg-border/60" />
              <span className="flex items-center gap-1.5 text-[12px] font-extrabold uppercase tracking-wide text-foreground">
                <Calendar size={12} className="text-brand" />
                Birth Details
              </span>
              <div className="h-px flex-1 bg-border/60" />
            </div>

            {/* DOB + TOB side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="dob" className="text-[13px] font-semibold text-foreground">
                  Date of birth <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="dob"
                  type="date"
                  value={form.dob}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => set("dob", e.target.value)}
                  className={cn("h-11 text-[14px]", errors.dob ? "border-destructive" : "")}
                />
                {errors.dob && <p className="text-xs text-destructive">{errors.dob}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tob" className="text-[13px] font-semibold text-foreground">
                  Time of birth <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="tob"
                  type="time"
                  value={form.tob}
                  onChange={(e) => set("tob", e.target.value)}
                  className={cn("h-11 text-[14px]", errors.tob ? "border-destructive" : "")}
                />
                {errors.tob && <p className="text-xs text-destructive">{errors.tob}</p>}
              </div>
            </div>
            <p className="rounded-xl border border-amber-200/60 bg-amber-50/70 px-3 py-2 text-[11px] font-medium text-amber-800">
              ⏰ Sahi janam samay se Lagna sahi banega — report zyada accurate hogi
            </p>

            {/* POB */}
            <div className="space-y-1.5">
              <Label htmlFor="pob" className="flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
                <MapPin size={12} className="text-brand" />
                Place of birth <span className="text-destructive">*</span>
              </Label>
              <Input
                id="pob"
                value={form.pob}
                onChange={(e) => set("pob", e.target.value)}
                placeholder="City, State (e.g. Jaipur, Rajasthan)"
                className={cn("h-11 text-[14px]", errors.pob ? "border-destructive" : "")}
              />
              {errors.pob && <p className="text-xs text-destructive">{errors.pob}</p>}
            </div>

            {/* Bump offer */}
            <BumpOffer checked={fastTrack} onChange={setFastTrack} />

            {/* Pay button — desktop */}
            <div className="hidden md:block">
              <PayButton
                loading={loading}
                paymentReady={razorpayReady}
                onPay={handlePay}
                total={totalPaise}
              />
            </div>
          </div>

          {/* ── Right: Order summary ──────────────────────────────────── */}
          <div>
            <div className="sticky top-6 overflow-hidden rounded-2xl border border-border/50 bg-card shadow-md">
              <div className="border-b border-border/40 bg-gradient-to-r from-gold-light/70 to-brand-light/30 px-5 py-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">
                  Your order
                </p>
                <h2 className="font-heading mt-0.5 text-lg font-extrabold text-foreground">
                  Aapko kya milega
                </h2>
                <p className="mt-1 text-[12px] leading-snug text-muted-foreground">
                  Yeh report sirf aapke birth details ke basis par manually prepare ki jayegi.
                </p>
              </div>

              <div className="px-5 py-4">
                <ul className="space-y-2.5">
                  {WHAT_YOU_GET.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-brand" />
                      <span className="text-[13px] font-medium text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>

                {fastTrack && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2.5">
                    <Clock className="size-4 shrink-0 text-amber-600" />
                    <p className="text-[12px] font-semibold text-amber-900">
                      FastTrack — 12 ghante delivery
                    </p>
                  </div>
                )}
              </div>

              {/* Pricing */}
              <div className="border-t border-border/40 px-5 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-muted-foreground">Personalized Kundli Report</span>
                  <span className="font-semibold text-foreground">₹399</span>
                </div>
                {fastTrack && (
                  <div className="mt-2 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[13px] text-muted-foreground">
                      <Zap className="size-3 text-amber-500" />
                      FastTrack Delivery
                    </span>
                    <span className="font-semibold text-foreground">₹99</span>
                  </div>
                )}
                <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-3">
                  <span className="text-sm font-bold text-foreground">Total</span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-heading text-2xl font-extrabold text-foreground">
                      ₹{totalPaise / 100}
                    </span>
                    {!fastTrack && (
                      <span className="text-xs text-muted-foreground line-through">₹999</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Trust badges */}
              <div className="border-t border-border/40 bg-muted/15 px-5 py-3">
                {[
                  { icon: Shield, text: "Secured by Razorpay" },
                  { icon: Lock, text: "SSL encrypted payment" },
                  { icon: CheckCircle2, text: "Instant order confirmation" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2 py-0.5 text-[11px] text-muted-foreground">
                    <Icon size={11} className="text-brand" />
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Pay button — mobile */}
        <div className="mt-6 md:hidden">
          <PayButton
            loading={loading}
            paymentReady={razorpayReady}
            onPay={handlePay}
            total={totalPaise}
          />
        </div>
      </div>
    </div>
  );
}
