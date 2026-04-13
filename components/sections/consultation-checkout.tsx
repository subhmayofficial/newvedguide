"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  Loader2,
  Shield,
  Check,
  Calendar,
  Clock,
  MapPin,
  MessageSquare,
  ChevronDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { track } from "@/lib/analytics/events";
import { getOrCreateSessionId } from "@/lib/analytics/session";
import { getWhatsAppHref } from "@/lib/constants/contact";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

// ─── Packages ─────────────────────────────────────────────────────────────────

const PACKAGES = {
  "15": {
    id: "15min" as const,
    urlKey: "15",
    label: "Quick focus",
    duration: "15 Min",
    price: "₹1,499",
    paise: 149900,
    blurb: "Ek sawal, ek focused remedy — seedha point pe.",
    features: ["Personalized kundli reading", "One specific question", "Focused remedy guidance"],
  },
  "45": {
    id: "45min" as const,
    urlKey: "45",
    label: "Complete session",
    duration: "45 Min",
    price: "₹4,999",
    paise: 499900,
    blurb: "Poori life reading — career, rishte, future timing.",
    features: [
      "Full kundli analysis",
      "All life areas covered",
      "Future direction + muhurta",
      "Detailed remedies",
      "Session recording",
    ],
    highlighted: true,
  },
} as const;

type PkgKey = keyof typeof PACKAGES;

// ─── Form state ───────────────────────────────────────────────────────────────

type FormState = {
  fullName: string;
  phone: string;
  consultationType: "" | "chat" | "call" | "video_call";
  email: string;
  dob: string;
  tob: string;
  pob: string;
  sessionNote: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cn(...c: (string | boolean | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

const fieldCls = (err?: boolean) =>
  cn(
    "h-11 border text-[14px] bg-white shadow-sm transition-[border-color,box-shadow]",
    "border-stone-200 text-stone-900 placeholder:text-stone-400",
    "focus-visible:border-amber-700 focus-visible:ring-2 focus-visible:ring-amber-600/25 focus-visible:outline-none",
    err && "border-red-500 focus-visible:ring-red-200"
  );

const labelCls = "text-[13px] font-semibold text-stone-800";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONSULTATION_TYPE_OPTIONS = [
  { value: "chat", label: "Chat" },
  { value: "call", label: "Call" },
  { value: "video_call", label: "Video Call" },
] as const;

function consultationTypeLabel(type: FormState["consultationType"]): string {
  if (type === "chat") return "Chat";
  if (type === "call") return "Call";
  if (type === "video_call") return "Video Call";
  return "Consultation";
}

// ─── Package selector ─────────────────────────────────────────────────────────

function PackageSelector({
  selected,
  onChange,
}: {
  selected: PkgKey;
  onChange: (k: PkgKey) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {(["15", "45"] as PkgKey[]).map((key) => {
        const pkg = PACKAGES[key];
        const active = selected === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={cn(
              "relative flex flex-col rounded-2xl border-2 p-4 text-left transition-all",
              active
                ? "border-brand bg-gradient-to-br from-brand-light/60 to-gold-light/30 shadow-md"
                : "border-border bg-card hover:border-brand/40"
            )}
          >
            {"highlighted" in pkg && pkg.highlighted && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                Popular
              </span>
            )}
            <div className="mb-1 flex items-center gap-2">
              {active && <Check className="size-3.5 text-brand" strokeWidth={3} />}
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                {pkg.label}
              </span>
            </div>
            <p className="font-heading text-2xl font-bold text-foreground">{pkg.duration}</p>
            <p className="text-lg font-bold text-brand">{pkg.price}</p>
            <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">{pkg.blurb}</p>
          </button>
        );
      })}
    </div>
  );
}

// ─── Pay button ───────────────────────────────────────────────────────────────

function PayButton({
  loading,
  paymentReady,
  canPay,
  helperText,
  onPay,
  total,
}: {
  loading: boolean;
  paymentReady: boolean;
  canPay: boolean;
  helperText?: string;
  onPay: () => void;
  total: number;
}) {
  const busy = loading || !paymentReady;
  return (
    <div className="space-y-3">
      <style>{`
        @keyframes vg-con-shimmer {
          0%   { transform: translateX(-140%) skewX(-18deg); }
          100% { transform: translateX(260%) skewX(-18deg); }
        }
        .vg-con-pay::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent 20%, rgba(255,255,255,0.22) 50%, transparent 80%);
          animation: vg-con-shimmer 2.4s ease-in-out infinite;
          pointer-events: none;
          border-radius: inherit;
        }
      `}</style>
      <button
        type="button"
        onClick={onPay}
        disabled={busy}
        className="vg-con-pay relative w-full overflow-hidden rounded-2xl bg-brand py-4 text-[16px] font-extrabold text-white shadow-[0_6px_24px_-6px_rgba(180,83,9,0.55)] transition-all hover:bg-brand-hover active:scale-[0.98] disabled:opacity-70"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={18} className="animate-spin" /> Processing...
          </span>
        ) : !paymentReady ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={18} className="animate-spin" /> Loading secure payment…
          </span>
        ) : !canPay ? (
          <span className="flex items-center justify-center gap-2">
            <Lock size={15} strokeWidth={2.5} />
            Step 2 Complete Karein To Continue
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Lock size={15} strokeWidth={2.5} />
            Securely Pay ₹{total / 100} &amp; Confirm Slot
          </span>
        )}
      </button>

      {helperText && (
        <p className="rounded-xl border border-amber-200/90 bg-amber-50/30 px-4 py-2 text-center text-[11px] font-medium text-amber-900">
          {helperText}
        </p>
      )}

      <div className="rounded-xl border border-amber-200/90 bg-amber-50/30 px-4 py-3">
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
          {[
            { icon: "🔒", text: "Secure payment via Razorpay" },
            { icon: "📅", text: "Slot confirmed after payment" },
            { icon: "🔐", text: "100% confidential session" },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-1.5 text-[11px] font-medium text-stone-600">
              <span>{icon}</span> {text}
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-[11px] text-stone-500">
        By proceeding you agree to our{" "}
        <Link href="/terms" className="font-medium text-amber-800 underline underline-offset-2">
          Terms
        </Link>{" & "}
        <Link href="/refund-policy" className="font-medium text-amber-800 underline underline-offset-2">
          Refund Policy
        </Link>
      </p>
    </div>
  );
}

// ─── Sticky bottom bar ────────────────────────────────────────────────────────

function StickyPayBar({
  loading,
  paymentReady,
  canPay,
  helperText,
  onPay,
  totalPaise,
}: {
  loading: boolean;
  paymentReady: boolean;
  canPay: boolean;
  helperText?: string;
  onPay: () => void;
  totalPaise: number;
}) {
  const busy = loading || !paymentReady;
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 md:hidden border-t-2 border-amber-200/90 bg-white/95 shadow-[0_-8px_32px_-8px_rgba(194,65,12,0.12)] backdrop-blur-md">
      <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3 pb-[max(0.85rem,env(safe-area-inset-bottom))]">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-amber-800/80">Total</p>
          <p className="font-heading text-[1.35rem] font-black leading-tight text-amber-950">
            ₹{totalPaise / 100}
          </p>
          {helperText && <p className="mt-0.5 text-[10px] leading-tight text-amber-800">{helperText}</p>}
        </div>
        <button
          type="button"
          onClick={onPay}
          disabled={busy}
          className="relative shrink-0 overflow-hidden rounded-2xl bg-brand px-5 py-3.5 text-[14px] font-extrabold text-white shadow-[0_6px_20px_-6px_rgba(180,83,9,0.55)] transition-all hover:bg-brand-hover active:scale-[0.98] disabled:opacity-70"
        >
          {loading ? (
            <span className="flex items-center gap-2"><Loader2 size={17} className="animate-spin" />Wait…</span>
          ) : !paymentReady ? (
            <span className="flex items-center gap-2"><Loader2 size={17} className="animate-spin" />Loading…</span>
          ) : !canPay ? (
            <span className="flex items-center gap-2 whitespace-nowrap"><Lock size={14} strokeWidth={2.5} />Fill details</span>
          ) : (
            <span className="flex items-center gap-2 whitespace-nowrap"><Lock size={14} strokeWidth={2.5} />Pay &amp; confirm</span>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Main checkout ────────────────────────────────────────────────────────────

export function ConsultationCheckout() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const pkgParam = searchParams.get("pkg");
  const initialPkg: PkgKey = pkgParam === "15" || pkgParam === "45" ? pkgParam : "15";

  const [selectedPkg, setSelectedPkg] = useState<PkgKey>(initialPkg);
  const [form, setForm] = useState<FormState>({
    fullName: "",
    phone: "",
    consultationType: "",
    email: "",
    dob: "",
    tob: "",
    pob: "",
    sessionNote: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [razorpayReady, setRazorpayReady] = useState(false);

  const pkg = PACKAGES[selectedPkg];
  const totalPaise = pkg.paise;
  const selectedConsultationTypeLabel = consultationTypeLabel(form.consultationType);
  const missingFields: string[] = [];
  if (!form.fullName.trim()) missingFields.push("name");
  if (!/^[6-9]\d{9}$/.test(form.phone)) missingFields.push("valid WhatsApp number");
  if (!form.consultationType) missingFields.push("consultation type");
  if (!form.dob) missingFields.push("date of birth");
  const trimmedEmail = form.email.trim();
  const hasInvalidEmail = Boolean(trimmedEmail) && !EMAIL_RE.test(trimmedEmail);
  const canPay = missingFields.length === 0 && !hasInvalidEmail;
  const helperText = hasInvalidEmail
    ? "Email optional hai, lekin dal rahe ho to valid email format chahiye."
    : missingFields.length > 0
      ? `Continue karne ke liye ${missingFields.join(", ")} add karein.`
      : undefined;
  const whatsappHelpHref = getWhatsAppHref(
    "Hi VedGuide team, mujhe consultation checkout complete karne mein help chahiye."
  );

  const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

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

    getOrCreateSessionId();
    track.checkoutViewed(pkg.id, "consultation", false);
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    track.consultationProductSelected(pkg.id);
  }, [pkg.id]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.fullName.trim()) errs.fullName = "Naam daalna zaroori hai";
    if (!/^[6-9]\d{9}$/.test(form.phone)) errs.phone = "Valid 10-digit WhatsApp number daalo";
    if (!form.consultationType) {
      errs.consultationType = "Consultation type select karein";
    }
    if (trimmedEmail && !EMAIL_RE.test(trimmedEmail)) {
      errs.email = "Valid email daalo ya blank chhodo";
    }
    if (!form.dob) errs.dob = "Date of birth required";
    setErrors(errs);
    const ok = Object.keys(errs).length === 0;
    if (!ok) {
      const order: (keyof FormState)[] = ["fullName", "phone", "consultationType", "email", "dob"];
      for (const key of order) {
        if (errs[key]) {
          requestAnimationFrame(() => {
            document.getElementById(key)?.scrollIntoView({ behavior: "smooth", block: "center" });
          });
          break;
        }
      }
    }
    return ok;
  }

  async function handlePay() {
    if (!validate()) return;

    if (!razorpayKeyId || razorpayKeyId.includes("your_razorpay")) {
      alert("Payment key is not set. Add NEXT_PUBLIC_RAZORPAY_KEY_ID to .env.local and restart.");
      return;
    }
    if (!razorpayReady || !window.Razorpay) {
      alert("Payment window is still loading. Please wait a second and try again.");
      return;
    }

    setLoading(true);
    try {
      track.checkoutDetailsFilled(pkg.id);
      track.consultationCheckoutStarted(pkg.id, totalPaise);
      track.paymentInitiated(pkg.id, totalPaise, "consultation");

      const sessionId = getOrCreateSessionId();
      const res = await fetch("/api/payments/create-consultation-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: pkg.id,
          amountPaise: totalPaise,
          customer: {
            fullName: form.fullName,
            phone: form.phone,
            consultationType: form.consultationType || undefined,
            email: trimmedEmail || undefined,
            dob: form.dob || undefined,
            tob: form.tob || undefined,
            pob: form.pob || undefined,
            sessionNote: form.sessionNote || undefined,
          },
          attribution: {
            sourceFunnel: "consultation",
            sourcePage: "/checkout/consultation",
            utmSource,
            utmMedium,
            utmCampaign,
            referrer: typeof document !== "undefined" ? document.referrer : undefined,
            sessionId,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Order creation failed");

      const rzp = new window.Razorpay({
        key: razorpayKeyId,
        amount: data.amountPaise,
        currency: "INR",
        order_id: data.razorpayOrderId,
        name: "VedGuide",
        description: `${pkg.id === "15min" ? "15 Min Consultation" : "45 Min Consultation"} - ${consultationTypeLabel(form.consultationType)}`,
        prefill: {
          name: form.fullName,
          contact: form.phone,
          email: trimmedEmail || undefined,
        },
        theme: { color: "#b45309" },
        modal: {
          ondismiss: () => {
            setLoading(false);
            track.checkoutAbandoned(pkg.id, "consultation", "payment_modal");
            void fetch("/api/payments/failure", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderDbId: data.orderDbId, reason: "modal_dismissed" }),
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
              orderDbId: data.orderDbId,
            }),
          });
          const verifyJson = await verifyRes.json().catch(() => ({}));
          if (!verifyRes.ok || !verifyJson.success) {
            track.paymentFailed(pkg.id, totalPaise, "verify_failed");
            setLoading(false);
            alert("Payment verification failed. Please contact support on WhatsApp.");
            return;
          }

          track.paymentSuccess(pkg.id, totalPaise, data.orderDbId, "consultation");
          sessionStorage.setItem(
            "consultation_complete",
            JSON.stringify({
              orderId: data.orderDbId,
              packageId: pkg.id,
              consultationType: form.consultationType || null,
              razorpayOrderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
            })
          );
          router.push("/thank-you/consultation");
        },
      });
      rzp.on("payment.failed", async (failure: { error?: { code?: string } }) => {
        track.paymentFailed(pkg.id, totalPaise, failure?.error?.code);
        await fetch("/api/payments/failure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderDbId: data.orderDbId, reason: "razorpay_failed" }),
        });
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again or contact us on WhatsApp.");
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-white via-amber-50/35 to-orange-50/45 pb-24 md:pb-0 text-stone-900">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_100%_70%_at_50%_-20%,rgba(194,65,12,0.07),transparent_55%)]"
      />
      <div className="relative mx-auto max-w-4xl px-4 py-8 sm:py-10">

        {/* Header */}
        <div className="mb-8">
          <Link
            href="/consultation"
            className="mb-3 inline-block text-[12px] font-medium text-amber-800/80 transition-colors hover:text-amber-950"
          >
            ← Back to consultation
          </Link>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-brand">
            Consultation Checkout
          </p>
          <h1 className="font-heading text-[1.6rem] font-black leading-tight text-amber-950 sm:text-[2rem]">
            Complete Your Booking
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            3 simple steps: plan choose karein, details fill karein, secure payment karein.
          </p>
          <p className="mt-1 text-[12px] text-amber-800">
            Slot confirmation aur scheduling 24h ke andar WhatsApp pe milegi.
          </p>
        </div>

        {/* Package selector */}
        <section className="mb-6 rounded-2xl border-2 border-amber-200/90 bg-white p-5 shadow-[0_4px_36px_-12px_rgba(194,65,12,0.16)]">
          <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Step 1 · Session Select Karein
          </p>
          <PackageSelector selected={selectedPkg} onChange={setSelectedPkg} />
          {/* Feature list for selected package */}
          <ul className="mt-4 space-y-1.5 border-t border-border/60 pt-4">
            {pkg.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                <Check className="size-3.5 shrink-0 text-brand" strokeWidth={3} />
                {f}
              </li>
            ))}
          </ul>
        </section>

        {/* Form */}
        <section className="rounded-2xl border-2 border-amber-200/90 bg-white p-5 shadow-[0_4px_36px_-12px_rgba(194,65,12,0.16)]">
          <p className="mb-5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Step 2 · Aapki Details
          </p>
          <div className="space-y-4">

            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className={labelCls}>Full Name *</Label>
              <Input
                id="fullName"
                placeholder="Aapka poora naam"
                value={form.fullName}
                onChange={(e) => set("fullName", e.target.value)}
                className={fieldCls(!!errors.fullName)}
              />
              {errors.fullName && <p className="text-xs text-red-600">{errors.fullName}</p>}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="phone" className={labelCls}>WhatsApp Number *</Label>
              <Input
                id="phone"
                type="tel"
                inputMode="numeric"
                placeholder="10-digit number (slot confirm hoga yahan)"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                className={fieldCls(!!errors.phone)}
              />
              {errors.phone && <p className="text-xs text-red-600">{errors.phone}</p>}
            </div>

            {/* Consultation type */}
            <div className="space-y-1.5">
              <Label htmlFor="consultationType" className={labelCls}>Consultation Type *</Label>
              <p className="text-[11px] text-stone-600">
                AstroGuru se kaise consult karna chahte hain
              </p>
              <div
                className={cn(
                  "relative rounded-xl border-2 p-2.5 transition-all",
                  errors.consultationType
                    ? "border-red-400 bg-red-50/50"
                    : "border-amber-200/90 bg-gradient-to-br from-amber-50/70 to-orange-50/60 shadow-sm"
                )}
              >
                <select
                  id="consultationType"
                  value={form.consultationType}
                  onChange={(e) =>
                    set(
                      "consultationType",
                      e.target.value as FormState["consultationType"]
                    )
                  }
                  className={cn(
                    fieldCls(!!errors.consultationType),
                    "h-12 w-full appearance-none rounded-lg border-amber-300/70 bg-white pr-10 text-[14px] font-semibold"
                  )}
                >
                  <option value="">Select option</option>
                  {CONSULTATION_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-stone-500"
                  strokeWidth={2.2}
                />
              </div>
              {errors.consultationType && (
                <p className="text-xs text-red-600">{errors.consultationType}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className={labelCls}>
                Email <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Receipt yahan aayegi (optional)"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                className={fieldCls(!!errors.email)}
              />
              {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
            </div>

            {/* DOB */}
            <div className="space-y-1.5">
              <Label htmlFor="dob" className={labelCls}>
                <Calendar className="inline size-3.5 mr-1" />
                Date of Birth *
              </Label>
              <Input
                id="dob"
                type="date"
                value={form.dob}
                onChange={(e) => set("dob", e.target.value)}
                className={fieldCls(!!errors.dob)}
                max={new Date().toISOString().split("T")[0]}
              />
              {errors.dob && <p className="text-xs text-red-600">{errors.dob}</p>}
            </div>

            {/* TOB + POB row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="tob" className={labelCls}>
                  <Clock className="inline size-3.5 mr-1" />
                  Birth Time <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="tob"
                  type="time"
                  value={form.tob}
                  onChange={(e) => set("tob", e.target.value)}
                  className={fieldCls()}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pob" className={labelCls}>
                  <MapPin className="inline size-3.5 mr-1" />
                  Birth Place <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="pob"
                  placeholder="City, State"
                  value={form.pob}
                  onChange={(e) => set("pob", e.target.value)}
                  className={fieldCls()}
                />
              </div>
            </div>

            {/* Session note */}
            <div className="space-y-1.5">
              <Label htmlFor="sessionNote" className={labelCls}>
                <MessageSquare className="inline size-3.5 mr-1" />
                Session Focus <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <textarea
                id="sessionNote"
                rows={3}
                placeholder="Kya discuss karna chahte hain? Career, rishte, koi specific sawal..."
                value={form.sessionNote}
                onChange={(e) => set("sessionNote", e.target.value)}
                className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-[14px] text-stone-900 placeholder:text-stone-400 shadow-sm transition-[border-color,box-shadow] focus:border-amber-700 focus:ring-2 focus:ring-amber-600/25 focus:outline-none resize-none"
              />
            </div>
          </div>
        </section>

        {/* Pay button (desktop) */}
        <div className="mt-6 hidden rounded-2xl border-2 border-amber-200/90 bg-white p-5 shadow-[0_4px_36px_-12px_rgba(194,65,12,0.16)] md:block">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Step 3 · Secure Payment
          </p>
          <div className="mb-4 grid gap-2 rounded-xl border border-amber-200/80 bg-amber-50/40 p-3 text-xs text-stone-700 sm:grid-cols-3">
            <p>
              <span className="font-semibold text-stone-900">Plan:</span> {pkg.duration}
            </p>
            <p>
              <span className="font-semibold text-stone-900">Mode:</span> {selectedConsultationTypeLabel}
            </p>
            <p>
              <span className="font-semibold text-stone-900">Total:</span> ₹{totalPaise / 100}
            </p>
          </div>
          <PayButton
            loading={loading}
            paymentReady={razorpayReady}
            canPay={canPay}
            helperText={helperText}
            onPay={handlePay}
            total={totalPaise}
          />
        </div>

        <div className="mt-4 text-center text-xs text-stone-600">
          Need help before paying?{" "}
          <a
            href={whatsappHelpHref}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-amber-800 underline underline-offset-2"
          >
            Chat on WhatsApp
          </a>
        </div>

        {/* Trust signals */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-stone-600">
          <span className="flex items-center gap-1.5"><Shield size={13} className="text-brand" /> Private &amp; Confidential</span>
          <span className="flex items-center gap-1.5">🔒 Razorpay Secure</span>
          <span className="flex items-center gap-1.5">📅 Slot via WhatsApp</span>
        </div>
      </div>

      {/* Sticky mobile pay bar */}
      <div className="md:hidden">
        <StickyPayBar
          loading={loading}
          paymentReady={razorpayReady}
          canPay={canPay}
          helperText={helperText}
          onPay={handlePay}
          totalPaise={totalPaise}
        />
      </div>
    </div>
  );
}
