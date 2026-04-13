"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Lock,
  CheckCircle2,
  Loader2,
  Zap,
  Clock,
  MapPin,
  Calendar,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
  gender?: string;
  dob?: string;
  tob?: string;
  pob?: string;
}

const BASE_PRICE = 39900; // ₹399 in paise
const BUMP_PRICE = 9900;  // ₹99 in paise

type CheckoutFormState = {
  fullName: string;
  phone: string;
  email: string;
  gender: "" | "male" | "female";
  reportLanguage: "" | "hindi" | "english";
  dob: string;
  tob: string;
  pob: string;
};

type CheckoutFormErrors = Partial<Record<keyof CheckoutFormState, string>>;

type AppliedCoupon = {
  code: string;
  discountPaise: number;
  finalAmountPaise: number;
};

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/** Light checkout: white fields, dark orange focus */
const fieldClass = (err?: boolean) =>
  cn(
    "h-11 border text-[14px] bg-white shadow-sm transition-[border-color,box-shadow]",
    "border-stone-200 text-stone-900 placeholder:text-stone-400",
    "focus-visible:border-amber-700 focus-visible:ring-2 focus-visible:ring-amber-600/25 focus-visible:outline-none",
    err && "border-red-500 focus-visible:ring-red-200"
  );

const labelClass = "text-[13px] font-semibold text-stone-800";

/** Same asset as free kundli result upsell (premium_kundli.png) */
const PREMIUM_KUNDLI_IMAGE =
  "https://primedit-cdn.b-cdn.net/shubhmay-lp-kundli/premium_kundli.png";

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
        id="checkout-kundli-fasttrack-toggle"
        onClick={() => onChange(!checked)}
        className={cn(
          "vg-ft-card relative cursor-pointer overflow-hidden rounded-2xl border-2 transition-all duration-200 bg-white",
          checked
            ? "vg-ft-card-checked border-amber-600 bg-gradient-to-br from-amber-50 via-orange-50/90 to-amber-50 shadow-[0_0_0_3px_rgba(194,65,12,0.12),0_10px_32px_-8px_rgba(194,65,12,0.2)]"
            : "border-amber-200 hover:border-amber-400 shadow-sm shadow-amber-900/5"
        )}
      >
        {/* Top badge strip */}
        <div className="flex items-center justify-between bg-gradient-to-r from-amber-800 to-orange-800 px-4 py-1.5">
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
              checked ? "border-amber-700 bg-amber-600" : "border-amber-300 bg-white"
            )}
          >
            {checked && <CheckCircle2 className="size-3.5 text-white" strokeWidth={3} />}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-black leading-tight tracking-tight text-amber-950" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
              ⚡ FastTrack Delivery —{" "}
              <span className="text-orange-700">12 Ghante</span>
            </p>
            <p className="mt-1 text-[12px] leading-snug text-stone-600">
              Aapki report <span className="font-bold text-amber-800">12 ghante</span> mein ready hogi —{" "}
              normal 24-48h ke bajaye.
            </p>

            {/* Visual comparison */}
            <div className="mt-2.5 flex items-center gap-3">
              <div className="flex items-center gap-1.5 rounded-lg bg-stone-100 px-2.5 py-1.5">
                <Clock size={12} className="text-stone-400" />
                <span className="text-[11px] font-medium text-stone-500 line-through">24–48h</span>
              </div>
              <span className="text-[12px] font-bold text-amber-700">→</span>
              <div className="flex items-center gap-1.5 rounded-lg bg-amber-100 px-2.5 py-1.5 ring-1 ring-amber-300/80">
                <Zap size={12} className="text-amber-700" />
                <span className="font-heading text-[13px] font-black text-amber-900">
                  <span className="text-[15px]">12</span> ghante
                </span>
              </div>
            </div>

            <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-orange-800">
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
        id="checkout-kundli-pay-btn"
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
      <div className="rounded-xl border border-amber-200/90 bg-amber-50/30 px-4 py-3">
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
          {[
            { icon: "✍️", text: "Manual analysis — automated nahi" },
            { icon: "⏰", text: "24-48 ghante delivery (FastTrack: 12h)" },
            { icon: "🔒", text: "Secure payment via Razorpay" },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-1.5 text-[11px] font-medium text-stone-600">
              <span>{icon}</span>
              {text}
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-[11px] text-stone-500">
        Aaj ke liye limited processing slots available.{" "}
        <Link id="checkout-kundli-terms-link" href="/terms" className="font-medium text-amber-800 underline underline-offset-2 hover:text-amber-950">
          Terms
        </Link>
        {" & "}
        <Link id="checkout-kundli-refund-link" href="/refund-policy" className="font-medium text-amber-800 underline underline-offset-2 hover:text-amber-950">
          Refund Policy
        </Link>
      </p>
    </div>
  );
}

// ─── Sticky bottom bar (mobile) ───────────────────────────────────────────────

function StickyPayBar({
  loading,
  paymentReady,
  onPay,
  totalPaise,
  formComplete,
}: {
  loading: boolean;
  paymentReady: boolean;
  onPay: () => void;
  totalPaise: number;
  formComplete: boolean;
}) {
  const busy = loading || !paymentReady;
  const totalLabel = `₹${totalPaise / 100}`;
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 md:hidden border-t-2 border-amber-200/90 bg-white/95 shadow-[0_-8px_32px_-8px_rgba(194,65,12,0.12)] backdrop-blur-md">
      <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3 pb-[max(0.85rem,env(safe-area-inset-bottom))]">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-amber-800/80">
            Total
          </p>
          <p className="font-heading text-[1.35rem] font-black leading-tight text-amber-950">
            {totalLabel}
          </p>
          {!formComplete && !busy ? (
            <p className="mt-0.5 text-[10px] font-medium leading-snug text-orange-800">
              Saari zaroori details bharein — tabhi payment khulega
            </p>
          ) : null}
        </div>
        <button
          id="checkout-kundli-sticky-pay-btn"
          type="button"
          onClick={onPay}
          disabled={busy}
          className="relative shrink-0 overflow-hidden rounded-2xl bg-brand px-5 py-3.5 text-[14px] font-extrabold text-white shadow-[0_6px_20px_-6px_rgba(180,83,9,0.55)] transition-all hover:bg-brand-hover active:scale-[0.98] disabled:opacity-70"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 size={17} className="animate-spin" />
              Wait…
            </span>
          ) : !paymentReady ? (
            <span className="flex items-center gap-2">
              <Loader2 size={17} className="animate-spin" />
              Loading…
            </span>
          ) : (
            <span className="flex items-center gap-2 whitespace-nowrap">
              <Lock size={14} strokeWidth={2.5} />
              Pay now
            </span>
          )}
        </button>
      </div>
      <p className="border-t border-amber-100 bg-amber-50/40 px-4 py-1.5 text-center text-[9px] text-stone-500">
        <Link id="checkout-kundli-sticky-terms-link" href="/terms" className="font-medium text-amber-800 underline underline-offset-2">
          Terms
        </Link>
        {" · "}
        <Link id="checkout-kundli-sticky-refund-link" href="/refund-policy" className="font-medium text-amber-800 underline underline-offset-2">
          Refund
        </Link>
        {" · "}
        <span className="text-stone-500">Razorpay secure</span>
      </p>
    </div>
  );
}

// ─── Main checkout ────────────────────────────────────────────────────────────

export function KundliCheckout() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [prefilled, setPrefilled] = useState<KundliSessionData>({});
  const [form, setForm] = useState<CheckoutFormState>({
    fullName: "",
    phone: "",
    email: "",
    gender: "",
    reportLanguage: "",
    dob: "",
    tob: "",
    pob: "",
  });
  const [errors, setErrors] = useState<CheckoutFormErrors>({});
  const [loading, setLoading] = useState(false);
  const [razorpayReady, setRazorpayReady] = useState(false);
  const [fastTrack, setFastTrack] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const baseTotalPaise = BASE_PRICE + (fastTrack ? BUMP_PRICE : 0);
  const totalPaise = appliedCoupon?.finalAmountPaise ?? baseTotalPaise;

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
        setForm((f) => {
          const g = parsed.gender?.toLowerCase();
          const preGender = g === "male" || g === "female" ? g : f.gender;
          return {
            ...f,
            fullName: parsed.name ?? "",
            gender: preGender,
            dob: parsed.dob ?? "",
            tob: parsed.tob ?? "",
            pob: parsed.pob ?? "",
          };
        });
      } catch { /* silent */ }
    }

    getOrCreateSessionId();
    track.checkoutViewed("paid-kundli", sourceFunnel, !!stored);
    return () => {
      cancelled = true;
    };
  }, [sourceFunnel]);

  function set<K extends keyof CheckoutFormState>(key: K, value: CheckoutFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const errs: CheckoutFormErrors = {};
    if (!form.fullName.trim()) errs.fullName = "Name daalna zaroori hai";
    if (!/^[6-9]\d{9}$/.test(form.phone)) errs.phone = "Valid 10-digit WhatsApp number daalo";
    if (form.gender !== "male" && form.gender !== "female") {
      errs.gender = "Gender select karein";
    }
    if (form.reportLanguage !== "hindi" && form.reportLanguage !== "english") {
      errs.reportLanguage = "Report language chunein — Hindi ya English";
    }
    if (!form.dob) errs.dob = "Date of birth required";
    if (!form.tob) errs.tob = "Time of birth required";
    if (!form.pob.trim()) errs.pob = "Place of birth required";
    setErrors(errs);
    const ok = Object.keys(errs).length === 0;
    if (!ok) {
      const order: (keyof CheckoutFormState)[] = [
        "fullName",
        "phone",
        "gender",
        "dob",
        "tob",
        "pob",
        "reportLanguage",
      ];
      for (const key of order) {
        if (errs[key]) {
          const scrollId =
            key === "gender"
              ? "checkout-gender"
              : key === "reportLanguage"
                ? "checkout-report-language"
                : key;
          requestAnimationFrame(() => {
            document.getElementById(scrollId)?.scrollIntoView({ behavior: "smooth", block: "center" });
          });
          break;
        }
      }
    }
    return ok;
  }

  const applyCoupon = useCallback(async (code: string, silent = false) => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) {
      setAppliedCoupon(null);
      setCouponError(silent ? "" : "Enter a coupon code first.");
      return;
    }

    setCouponLoading(true);
    if (!silent) setCouponError("");

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: normalized,
          amountPaise: baseTotalPaise,
          productSlug: "paid-kundli",
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(
          typeof json.error === "string" ? json.error : "Coupon could not be applied."
        );
      }

      setCouponCode(normalized);
      setAppliedCoupon({
        code: json.code,
        discountPaise: json.discountPaise,
        finalAmountPaise: json.finalAmountPaise,
      });
      setCouponError("");
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(
        err instanceof Error ? err.message : "Coupon could not be applied."
      );
    } finally {
      setCouponLoading(false);
    }
  }, [baseTotalPaise]);

  useEffect(() => {
    if (!appliedCoupon) return;
    void applyCoupon(couponCode || appliedCoupon.code, true);
  }, [appliedCoupon, applyCoupon, couponCode, fastTrack]);

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
            couponCode: appliedCoupon?.code,
            customer: {
            fullName: form.fullName,
            phone: form.phone,
            email: form.email || undefined,
            gender: form.gender,
            reportLanguage: form.reportLanguage,
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
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({
              event: "Kundli_purchase",
              ecommerce: {
                transaction_id: dbId,
                value: totalPaise / 100,
                currency: "INR",
                coupon: appliedCoupon?.code ?? undefined,
                items: [
                  {
                    item_id: "paid-kundli",
                    item_name: "Personalized Kundli Report",
                    price: 399,
                    quantity: 1,
                  },
                  ...(fastTrack
                    ? [
                        {
                          item_id: "fasttrack",
                          item_name: "FastTrack Delivery",
                          price: 99,
                          quantity: 1,
                        },
                      ]
                    : []),
                ],
              },
            });
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
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "Kundli_begin_checkout",
        ecommerce: {
          currency: "INR",
          value: totalPaise / 100,
          coupon: appliedCoupon?.code ?? undefined,
          items: [
            {
              item_id: "paid-kundli",
              item_name: "Personalized Kundli Report",
              price: 399,
              quantity: 1,
            },
            ...(fastTrack
              ? [
                  {
                    item_id: "fasttrack",
                    item_name: "FastTrack Delivery",
                    price: 99,
                    quantity: 1,
                  },
                ]
              : []),
          ],
        },
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

  const formComplete =
    !!form.fullName.trim() &&
    /^[6-9]\d{9}$/.test(form.phone) &&
    (form.gender === "male" || form.gender === "female") &&
    (form.reportLanguage === "hindi" || form.reportLanguage === "english") &&
    !!form.dob &&
    !!form.tob &&
    !!form.pob.trim();

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-white via-amber-50/35 to-orange-50/45 pb-[7.25rem] text-stone-900 md:pb-0">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_100%_70%_at_50%_-20%,rgba(194,65,12,0.07),transparent_55%)]"
      />

      <div className="relative mx-auto max-w-4xl px-4 py-8 sm:py-10">
        {/* Heading */}
        <div className="mb-8">
          <Link
            id="checkout-kundli-back-to-result-link"
            href="/free-kundli/result"
            className="mb-3 inline-block text-[12px] font-medium text-amber-800/80 transition-colors hover:text-amber-950"
          >
            ← Back to kundli result
          </Link>
          <h1 className="font-heading text-[1.5rem] font-black leading-tight text-amber-950 sm:text-[1.9rem]">
            {fn ? `${fn}, complete your order` : "Complete your order"}
          </h1>
          <p className="mt-2 text-[13px] text-stone-600">
            Neeche form highlight kiya gaya hai — saari zaroori details bharen, phir report language chunein.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* ── Left: Form (highlighted white card + dark orange trim) ─ */}
          <div
            className={cn(
              "space-y-4 rounded-2xl border-2 border-amber-200/90 bg-white p-5 sm:p-6",
              "shadow-[0_4px_48px_-12px_rgba(194,65,12,0.14),0_0_0_1px_rgba(255,237,213,0.6)]"
            )}
          >

            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="checkout-kundli-full-name-input" className={labelClass}>
                Full name <span className="text-red-400">*</span>
              </Label>
              <Input
                id="checkout-kundli-full-name-input"
                value={form.fullName}
                onChange={(e) => set("fullName", e.target.value)}
                placeholder="Your full name"
                className={fieldClass(!!errors.fullName)}
              />
              {errors.fullName && (
                <p className="text-xs text-red-400">{errors.fullName}</p>
              )}
            </div>

            {/* Phone — single seamless container */}
            <div className="space-y-1.5">
              <Label htmlFor="checkout-kundli-phone-input" className={labelClass}>
                WhatsApp number <span className="text-red-400">*</span>
              </Label>
              <div
                className={cn(
                  "flex h-11 overflow-hidden rounded-lg border bg-white shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-amber-600/25 focus-within:ring-offset-0",
                  errors.phone ? "border-red-500" : "border-stone-200"
                )}
              >
                <span className="flex shrink-0 items-center border-r border-amber-200/90 bg-amber-50 px-3.5 text-[14px] font-bold text-amber-950">
                  +91
                </span>
                <input
                  id="checkout-kundli-phone-input"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={form.phone}
                  onChange={(e) =>
                    set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  placeholder="10-digit number"
                  className="min-w-0 flex-1 bg-white px-3 text-[14px] text-stone-900 placeholder:text-stone-400 focus:outline-none"
                />
              </div>
              {errors.phone && (
                <p className="text-xs text-red-400">{errors.phone}</p>
              )}
            </div>

            {/* Email — optional */}
            <div className="space-y-1.5">
              <Label htmlFor="checkout-kundli-email-input" className={labelClass}>
                Email{" "}
                <span className="text-[11px] font-normal text-stone-500">(optional)</span>
              </Label>
              <Input
                id="checkout-kundli-email-input"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="For PDF delivery"
                className={fieldClass()}
              />
            </div>

            {/* Gender */}
            <div
              id="checkout-gender"
              className={cn(
                "scroll-mt-28 space-y-1.5",
                errors.gender && "rounded-xl ring-2 ring-red-500/35"
              )}
            >
              <Label className={labelClass}>
                Gender <span className="text-red-400">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {(["male", "female"] as const).map((g) => (
                  <button
                    id={`checkout-kundli-gender-${g}-btn`}
                    key={g}
                    type="button"
                    onClick={() => set("gender", g)}
                    className={cn(
                      "flex h-12 flex-col items-center justify-center gap-0.5 rounded-xl border-2 text-[13px] font-semibold transition-all",
                      form.gender === g
                        ? "border-amber-700 bg-amber-50 text-amber-950 shadow-sm shadow-amber-900/10"
                        : "border-stone-200 bg-white text-stone-600 hover:border-amber-300 hover:text-stone-800"
                    )}
                  >
                    <span className="text-lg">{g === "male" ? "👨" : "👩"}</span>
                    <span>{g === "male" ? "Male" : "Female"}</span>
                  </button>
                ))}
              </div>
              {errors.gender && <p className="text-xs text-red-400">{errors.gender}</p>}
            </div>

            {/* Divider for birth details */}
            <div className="flex items-center gap-3 pt-2">
              <div className="h-px flex-1 bg-amber-200/90" />
              <span className="flex items-center gap-1.5 text-[12px] font-extrabold uppercase tracking-wide text-amber-900">
                <Calendar size={12} className="text-amber-700" />
                Birth Details
              </span>
              <div className="h-px flex-1 bg-amber-200/90" />
            </div>

            {/* DOB + TOB side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="checkout-kundli-dob-input" className={labelClass}>
                  Date of birth <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="checkout-kundli-dob-input"
                  type="date"
                  value={form.dob}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => set("dob", e.target.value)}
                  className={fieldClass(!!errors.dob)}
                />
                {errors.dob && <p className="text-xs text-red-400">{errors.dob}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="checkout-kundli-tob-input" className={labelClass}>
                  Time of birth <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="checkout-kundli-tob-input"
                  type="time"
                  value={form.tob}
                  onChange={(e) => set("tob", e.target.value)}
                  className={fieldClass(!!errors.tob)}
                />
                {errors.tob && <p className="text-xs text-red-400">{errors.tob}</p>}
              </div>
            </div>

            {/* POB */}
            <div className="space-y-1.5">
              <Label htmlFor="checkout-kundli-pob-input" className={cn(labelClass, "flex items-center gap-1.5")}>
                <MapPin size={12} className="text-amber-700" />
                Place of birth <span className="text-red-400">*</span>
              </Label>
              <Input
                id="checkout-kundli-pob-input"
                value={form.pob}
                onChange={(e) => set("pob", e.target.value)}
                placeholder="City, State (e.g. Jaipur, Rajasthan)"
                className={fieldClass(!!errors.pob)}
              />
              {errors.pob && <p className="text-xs text-red-400">{errors.pob}</p>}
            </div>

            {/* Report language — last step before add-on & pay */}
            <div className="flex items-center gap-3 pt-3">
              <div className="h-px flex-1 bg-amber-200/90" />
              <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-amber-900">
                Last step
              </span>
              <div className="h-px flex-1 bg-amber-200/90" />
            </div>
            <div
              id="checkout-report-language"
              className={cn(
                "scroll-mt-28 space-y-1.5",
                errors.reportLanguage && "rounded-xl ring-2 ring-red-500/35"
              )}
            >
              <Label className={labelClass}>
                Report language <span className="text-red-400">*</span>
              </Label>
              <p className="text-[11px] text-stone-600">PDF kis language mein chahiye</p>
              <div className="grid grid-cols-2 gap-2">
                {(["hindi", "english"] as const).map((lang) => (
                  <button
                    id={`checkout-kundli-language-${lang}-btn`}
                    key={lang}
                    type="button"
                    onClick={() => set("reportLanguage", lang)}
                    className={cn(
                      "flex h-11 items-center justify-center rounded-xl border-2 text-[13px] font-bold transition-all",
                      form.reportLanguage === lang
                        ? "border-amber-700 bg-amber-50 text-amber-950 shadow-sm shadow-amber-900/10"
                        : "border-stone-200 bg-white text-stone-600 hover:border-amber-300 hover:text-stone-800"
                    )}
                  >
                    {lang === "hindi" ? "हिंदी" : "English"}
                  </button>
                ))}
              </div>
              {errors.reportLanguage && (
                <p className="text-xs text-red-400">{errors.reportLanguage}</p>
              )}
            </div>

            <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50/70 px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                    Coupon
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Private code hai to yahan apply karein.
                  </p>
                </div>
                {appliedCoupon && (
                  <button
                    type="button"
                    className="text-[11px] font-semibold text-stone-500 hover:text-stone-800"
                    onClick={() => {
                      setAppliedCoupon(null);
                      setCouponCode("");
                      setCouponError("");
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="mt-2 flex gap-2">
                <Input
                  id="checkout-kundli-coupon-input"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase());
                    setCouponError("");
                  }}
                  placeholder="Coupon code"
                  className="h-10 text-[12px] uppercase tracking-wide"
                />
                <Button
                  id="checkout-kundli-apply-coupon-btn"
                  type="button"
                  variant="outline"
                  className="h-10 shrink-0 text-[12px] font-bold"
                  onClick={() => applyCoupon(couponCode)}
                  disabled={couponLoading}
                >
                  {couponLoading ? "Applying..." : appliedCoupon ? "Applied" : "Apply"}
                </Button>
              </div>
              {couponError && <p className="mt-2 text-[11px] text-red-500">{couponError}</p>}
              {appliedCoupon && (
                <p className="mt-2 text-[11px] font-medium text-emerald-700">
                  {appliedCoupon.code} applied. You save Rs{" "}
                  {(appliedCoupon.discountPaise / 100).toFixed(0)}.
                </p>
              )}
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
            <div className="sticky top-6 overflow-hidden rounded-2xl border-2 border-amber-200/90 bg-white shadow-[0_8px_40px_-12px_rgba(194,65,12,0.18)]">
              <div className="border-b border-amber-900/20 bg-gradient-to-r from-amber-900 via-orange-900 to-amber-950 px-5 py-4 text-white">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-100/90">
                  Your order
                </p>
                <h2 className="font-heading mt-0.5 text-lg font-extrabold text-white">
                  Aapko kya milega
                </h2>
                <p className="mt-1 text-[12px] leading-snug text-amber-100/85">
                  Yeh report sirf aapke birth details ke basis par manually prepare ki jayegi.
                </p>
              </div>

              <div className="border-b border-amber-100/90 bg-gradient-to-b from-amber-50/50 to-white px-5 py-4">
                <div className="flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={PREMIUM_KUNDLI_IMAGE}
                    alt="Personalized Kundli report preview"
                    width={160}
                    height={192}
                    className="h-[min(168px,42vw)] w-auto max-h-[190px] drop-shadow-xl sm:h-[185px] sm:max-h-[200px]"
                  />
                </div>
              </div>

              <div className="px-5 py-4">
                <ul className="space-y-2.5">
                  {WHAT_YOU_GET.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-amber-700" />
                      <span className="text-[13px] font-medium text-stone-800">{item}</span>
                    </li>
                  ))}
                </ul>

                {fastTrack && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5">
                    <Clock className="size-4 shrink-0 text-amber-800" />
                    <p className="text-[12px] font-semibold text-amber-950">
                      FastTrack — 12 ghante delivery
                    </p>
                  </div>
                )}
              </div>

              {/* Pricing */}
              <div className="border-t border-amber-100 px-5 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-stone-600">Personalized Kundli Report</span>
                  <span className="font-semibold text-amber-950">₹399</span>
                </div>
                {fastTrack && (
                  <div className="mt-2 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[13px] text-stone-600">
                      <Zap className="size-3 text-amber-600" />
                      FastTrack Delivery
                    </span>
                    <span className="font-semibold text-amber-950">₹99</span>
                  </div>
                )}
                {appliedCoupon && (
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[13px] text-emerald-700">
                      Coupon ({appliedCoupon.code})
                    </span>
                    <span className="hidden">
                      -â‚¹{(appliedCoupon.discountPaise / 100).toFixed(0)}
                    </span>
                    <span className="font-semibold text-emerald-700">
                      -Rs {(appliedCoupon.discountPaise / 100).toFixed(0)}
                    </span>
                  </div>
                )}
                <div className="mt-3 flex items-center justify-between border-t border-amber-100 pt-3">
                  <span className="text-sm font-bold text-amber-950">Total</span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-heading text-2xl font-extrabold text-amber-950">
                      ₹{totalPaise / 100}
                    </span>
                    {!fastTrack && !appliedCoupon && (
                      <span className="text-xs text-stone-400 line-through">₹999</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Trust badges */}
              <div className="border-t border-amber-100 bg-amber-50/40 px-5 py-3">
                {[
                  { icon: Shield, text: "Secured by Razorpay" },
                  { icon: Lock, text: "SSL encrypted payment" },
                  { icon: CheckCircle2, text: "Instant order confirmation" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2 py-0.5 text-[11px] text-stone-600">
                    <Icon size={11} className="text-amber-700" />
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile: sticky Pay now bar (same handlePay + validation as desktop) */}
        <StickyPayBar
          loading={loading}
          paymentReady={razorpayReady}
          onPay={handlePay}
          totalPaise={totalPaise}
          formComplete={formComplete}
        />
      </div>
    </div>
  );
}
