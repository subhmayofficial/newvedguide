"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Lock, Loader2, Shield, Check, ChevronDown, ArrowLeft, MessageCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { track } from "@/lib/analytics/events";
import { getOrCreateSessionId } from "@/lib/analytics/session";
import { getWhatsAppHref } from "@/lib/constants/contact";

const PKG = {
  id: "15min" as const,
  duration: "15 Min",
  price: "₹499",
  paise: 49900,
};

type FormState = {
  fullName: string;
  phone: string;
  consultationType: "" | "chat" | "call";
  email: string;
  dob: string;
  tob: string;
  pob: string;
  sessionNote: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

function cn(...c: (string | boolean | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

const inputCls = (err?: boolean) =>
  cn(
    "h-11 w-full rounded-lg border bg-white px-3 text-[14px] text-gray-900 placeholder:text-gray-400 shadow-sm",
    "transition-[border-color,box-shadow]",
    "focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-400/20",
    err ? "border-red-400" : "border-gray-300"
  );

const labelCls = "block text-[13px] font-semibold text-gray-700 mb-1";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ctLabel(t: FormState["consultationType"]): string {
  return t === "chat" ? "Chat" : t === "call" ? "Call" : "—";
}

// ─── Pay button ───────────────────────────────────────────────────────────────

function PayButton({ loading, paymentReady, canPay, helperText, onPay, total }: {
  loading: boolean; paymentReady: boolean; canPay: boolean;
  helperText?: string; onPay: () => void; total: number;
}) {
  const busy = loading || !paymentReady;
  return (
    <div className="space-y-2.5">
      <style>{`
        @keyframes rco-sh{0%{transform:translateX(-140%) skewX(-18deg)}100%{transform:translateX(260%) skewX(-18deg)}}
        .rco-pay::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent 20%,rgba(255,255,255,0.2) 50%,transparent 80%);animation:rco-sh 2.4s ease-in-out infinite;pointer-events:none;border-radius:inherit;}
      `}</style>
      <button
        type="button"
        onClick={onPay}
        disabled={busy}
        className="rco-pay relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-rose-500 to-fuchsia-500 py-3.5 text-[15px] font-bold text-white shadow-[0_6px_20px_-6px_rgba(225,29,72,0.5)] transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2"><Loader2 size={17} className="animate-spin" />Processing…</span>
        ) : !paymentReady ? (
          <span className="flex items-center justify-center gap-2"><Loader2 size={17} className="animate-spin" />Loading…</span>
        ) : !canPay ? (
          <span className="flex items-center justify-center gap-2"><Lock size={14} />Details fill karein</span>
        ) : (
          <span className="flex items-center justify-center gap-2"><Lock size={14} />Pay ₹{total / 100} &amp; Confirm</span>
        )}
      </button>

      {helperText && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-center text-[11px] text-amber-800">
          {helperText}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-gray-500">
        <span className="flex items-center gap-1"><Shield className="size-3" /> Razorpay secure</span>
        <span className="flex items-center gap-1">📅 Slot 24h mein</span>
        <span className="flex items-center gap-1">🔐 Confidential</span>
      </div>

      <p className="text-center text-[11px] text-gray-400">
        By proceeding you agree to our{" "}
        <Link href="/terms" className="underline">Terms</Link>
        {" & "}
        <Link href="/refund-policy" className="underline">Refund Policy</Link>
      </p>
    </div>
  );
}

// ─── Sticky mobile bar ────────────────────────────────────────────────────────

function StickyPayBar({ loading, paymentReady, canPay, onPay, totalPaise }: {
  loading: boolean; paymentReady: boolean; canPay: boolean; onPay: () => void; totalPaise: number;
}) {
  const busy = loading || !paymentReady;
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 md:hidden border-t border-gray-200 bg-white/97 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-sm pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Total</p>
          <p className="text-xl font-black text-gray-900">₹{totalPaise / 100}</p>
        </div>
        <button
          type="button"
          onClick={onPay}
          disabled={busy}
          className="shrink-0 rounded-xl bg-gradient-to-r from-rose-500 to-fuchsia-500 px-6 py-3 text-[14px] font-bold text-white shadow-lg transition-all active:scale-[0.97] disabled:opacity-60"
        >
          {loading ? <span className="flex items-center gap-1.5"><Loader2 size={15} className="animate-spin" />Wait…</span>
            : !paymentReady ? <span className="flex items-center gap-1.5"><Loader2 size={15} className="animate-spin" />Loading…</span>
            : !canPay ? <span className="flex items-center gap-1"><Lock size={13} />Fill details</span>
            : <span className="flex items-center gap-1"><Lock size={13} />Pay &amp; confirm</span>}
        </button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ConsultationRelationshipCheckout() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [form, setForm] = useState<FormState>({
    fullName: "", phone: "", consultationType: "", email: "",
    dob: "", tob: "", pob: "", sessionNote: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [razorpayReady, setRazorpayReady] = useState(false);

  const totalPaise = PKG.paise;
  const trimmedEmail = form.email.trim();
  const hasInvalidEmail = Boolean(trimmedEmail) && !EMAIL_RE.test(trimmedEmail);

  const missingFields: string[] = [];
  if (!form.fullName.trim()) missingFields.push("naam");
  if (!/^[6-9]\d{9}$/.test(form.phone)) missingFields.push("WhatsApp number");
  if (!form.consultationType) missingFields.push("session mode");
  if (!form.dob) missingFields.push("date of birth");
  const canPay = missingFields.length === 0 && !hasInvalidEmail;
  const helperText = hasInvalidEmail
    ? "Valid email daalo ya blank chhodo."
    : missingFields.length > 0 ? `Zaroori: ${missingFields.join(", ")}.` : undefined;

  const whatsappHref = getWhatsAppHref("Hi, mujhe relationship consultation ke baare mein puchhna tha.");
  const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const utmSource = searchParams.get("utm_source") ?? undefined;
  const utmMedium = searchParams.get("utm_medium") ?? undefined;
  const utmCampaign = searchParams.get("utm_campaign") ?? undefined;

  useEffect(() => {
    let cancelled = false;
    function markReady() {
      if (!cancelled && typeof window !== "undefined" && window.Razorpay) setRazorpayReady(true);
    }
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      if (window.Razorpay) markReady();
      else existing.addEventListener("load", markReady, { once: true });
    } else {
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.async = true;
      s.addEventListener("load", markReady, { once: true });
      document.head.appendChild(s);
    }
    getOrCreateSessionId();
    track.checkoutViewed(PKG.id, "consultation", false);
    track.consultationProductSelected(PKG.id);
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.fullName.trim()) errs.fullName = "Naam required";
    if (!/^[6-9]\d{9}$/.test(form.phone)) errs.phone = "Valid 10-digit number daalo";
    if (!form.consultationType) errs.consultationType = "Select karein";
    if (trimmedEmail && !EMAIL_RE.test(trimmedEmail)) errs.email = "Valid email ya blank";
    if (!form.dob) errs.dob = "Required";
    setErrors(errs);
    const ok = Object.keys(errs).length === 0;
    if (!ok) {
      const order: (keyof FormState)[] = ["fullName", "phone", "consultationType", "email", "dob"];
      for (const key of order) {
        if (errs[key]) {
          requestAnimationFrame(() => document.getElementById(key)?.scrollIntoView({ behavior: "smooth", block: "center" }));
          break;
        }
      }
    }
    return ok;
  }

  async function handlePay() {
    if (!validate()) return;
    if (!razorpayKeyId || razorpayKeyId.includes("your_razorpay")) {
      alert("Payment key not set. Add NEXT_PUBLIC_RAZORPAY_KEY_ID to .env.local.");
      return;
    }
    if (!razorpayReady || !window.Razorpay) {
      alert("Payment still loading. Please wait a moment.");
      return;
    }
    setLoading(true);
    try {
      track.checkoutDetailsFilled(PKG.id);
      track.consultationCheckoutStarted(PKG.id, totalPaise);
      track.paymentInitiated(PKG.id, totalPaise, "consultation");

      const sessionId = getOrCreateSessionId();
      const res = await fetch("/api/payments/create-consultation-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: PKG.id,
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
            sourceFunnel: "consultation_relationship",
            sourcePage: "/consultation/relationship/checkout",
            utmSource, utmMedium, utmCampaign,
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
        description: `15 Min Relationship Consultation — ${ctLabel(form.consultationType)}`,
        prefill: { name: form.fullName, contact: form.phone, email: trimmedEmail || undefined },
        theme: { color: "#e11d48" },
        modal: {
          ondismiss: () => {
            setLoading(false);
            track.checkoutAbandoned(PKG.id, "consultation", "payment_modal");
            void fetch("/api/payments/failure", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderDbId: data.orderDbId, reason: "modal_dismissed" }),
            });
          },
        },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
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
            track.paymentFailed(PKG.id, totalPaise, "verify_failed");
            setLoading(false);
            alert("Payment verification failed. Contact support on WhatsApp.");
            return;
          }
          track.paymentSuccess(PKG.id, totalPaise, data.orderDbId, "consultation");
          sessionStorage.setItem("consultation_complete", JSON.stringify({
            orderId: data.orderDbId, packageId: PKG.id,
            consultationType: form.consultationType || null,
            razorpayOrderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
          }));
          router.push("/thank-you/consultation");
        },
      });
      rzp.on("payment.failed", async (failure: { error?: { code?: string } }) => {
        track.paymentFailed(PKG.id, totalPaise, failure?.error?.code);
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
    <div className="min-h-screen bg-gray-50 pb-28 md:pb-12 text-gray-900">
      <div className="mx-auto max-w-lg px-4 py-6">

        {/* Top bar */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/consultation/relationship"
            className="inline-flex items-center gap-1 text-[13px] font-medium text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="size-3.5" /> Back
          </Link>
          <Link href="/" className="font-heading text-base font-bold text-gray-800">Vedगuide</Link>
          <a
            href={whatsappHref}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[13px] font-medium text-gray-500 hover:text-gray-800 transition-colors"
          >
            <MessageCircle className="size-3.5" /> Help
          </a>
        </div>

        {/* Order pill */}
        <div className="mb-5 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Relationship Consultation</p>
            <p className="text-base font-bold text-gray-900">15 Min Session</p>
          </div>
          <p className="font-heading text-2xl font-black text-rose-600">₹499</p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">

          {/* What's included — compact */}
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {["Kundli reading", "1 question answered", "Remedy guidance"].map((f) => (
                <span key={f} className="flex items-center gap-1 text-[12px] text-gray-500">
                  <Check className="size-3 text-rose-500" strokeWidth={3} /> {f}
                </span>
              ))}
            </div>
          </div>

          <div className="px-5 py-5 space-y-4">

            {/* Name */}
            <div>
              <label htmlFor="fullName" className={labelCls}>Naam *</label>
              <Input
                id="fullName"
                placeholder="Aapka poora naam"
                value={form.fullName}
                onChange={(e) => set("fullName", e.target.value)}
                className={inputCls(!!errors.fullName)}
              />
              {errors.fullName && <p className="mt-1 text-[11px] text-red-500">{errors.fullName}</p>}
            </div>

            {/* WhatsApp */}
            <div>
              <label htmlFor="phone" className={labelCls}>WhatsApp *</label>
              <Input
                id="phone"
                type="tel"
                inputMode="numeric"
                placeholder="10-digit number"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                className={inputCls(!!errors.phone)}
              />
              {errors.phone && <p className="mt-1 text-[11px] text-red-500">{errors.phone}</p>}
            </div>

            {/* Session mode */}
            <div>
              <label htmlFor="consultationType" className={labelCls}>Session Mode *</label>
              <div className="relative">
                <select
                  id="consultationType"
                  value={form.consultationType}
                  onChange={(e) => set("consultationType", e.target.value as FormState["consultationType"])}
                  className={cn(inputCls(!!errors.consultationType), "appearance-none pr-9 font-medium")}
                >
                  <option value="">Chat ya call?</option>
                  <option value="chat">Chat (WhatsApp text)</option>
                  <option value="call">Call (voice)</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              </div>
              {errors.consultationType && <p className="mt-1 text-[11px] text-red-500">{errors.consultationType}</p>}
            </div>

            {/* DOB */}
            <div>
              <label htmlFor="dob" className={labelCls}>Date of Birth *</label>
              <Input
                id="dob"
                type="date"
                value={form.dob}
                onChange={(e) => set("dob", e.target.value)}
                className={inputCls(!!errors.dob)}
                max={new Date().toISOString().split("T")[0]}
              />
              {errors.dob && <p className="mt-1 text-[11px] text-red-500">{errors.dob}</p>}
            </div>

            {/* TOB + POB */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="tob" className={labelCls}>Birth Time <span className="font-normal text-gray-400">(optional)</span></label>
                <Input
                  id="tob"
                  type="time"
                  value={form.tob}
                  onChange={(e) => set("tob", e.target.value)}
                  className={inputCls()}
                />
              </div>
              <div>
                <label htmlFor="pob" className={labelCls}>Birth Place <span className="font-normal text-gray-400">(optional)</span></label>
                <Input
                  id="pob"
                  placeholder="City"
                  value={form.pob}
                  onChange={(e) => set("pob", e.target.value)}
                  className={inputCls()}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className={labelCls}>Email <span className="font-normal text-gray-400">(optional — receipt ke liye)</span></label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                className={inputCls(!!errors.email)}
              />
              {errors.email && <p className="mt-1 text-[11px] text-red-500">{errors.email}</p>}
            </div>

            {/* Session note */}
            <div>
              <label htmlFor="sessionNote" className={labelCls}>Kya discuss karna hai? <span className="font-normal text-gray-400">(optional)</span></label>
              <textarea
                id="sessionNote"
                rows={3}
                placeholder="e.g. compatibility check, shaadi ki timing, ya koi sawal..."
                value={form.sessionNote}
                onChange={(e) => set("sessionNote", e.target.value)}
                className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-[14px] text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-400/20 focus:outline-none"
              />
            </div>
          </div>

          {/* Pay section (desktop) */}
          <div className="hidden border-t border-gray-100 px-5 pb-5 pt-4 md:block">
            <div className="mb-4 flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 text-sm">
              <span className="text-gray-600">15 Min · {ctLabel(form.consultationType) !== "—" ? ctLabel(form.consultationType) : "mode select karein"}</span>
              <span className="text-lg font-black text-gray-900">₹499</span>
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
        </div>

        {/* Mobile pay section */}
        <div className="mt-4 rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm md:hidden">
          <div className="mb-4 flex items-center justify-between text-sm">
            <span className="text-gray-600">15 Min session</span>
            <span className="text-lg font-black text-gray-900">₹499</span>
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

        {/* Footer note */}
        <p className="mt-5 text-center text-[11px] text-gray-400">
          Payment ke baad slot 24h mein WhatsApp pe confirm hoga. Help?{" "}
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="font-medium text-gray-600 underline">
            WhatsApp karein
          </a>
        </p>

      </div>

      {/* Sticky mobile pay bar */}
      <StickyPayBar
        loading={loading}
        paymentReady={razorpayReady}
        canPay={canPay}
        onPay={handlePay}
        totalPaise={totalPaise}
      />
    </div>
  );
}
