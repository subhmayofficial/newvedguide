"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Shield, Lock, CheckCircle2, Loader2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { track } from "@/lib/analytics/events";

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

const PRODUCT = {
  type: "kundli_report" as const,
  name: "Personalized Kundli Report",
  amountPaise: 39900,   // ₹399
  displayPrice: "₹399",
  includes: [
    "Complete birth chart analysis",
    "Career & financial dharma",
    "Marriage & relationship timing",
    "20-year Dasha roadmap",
    "Planetary remedies",
    "Health indicators",
    "15–20 page personalized PDF",
    "Delivered via WhatsApp & Email",
  ],
};

export function KundliCheckout() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Pre-fill from session (came from result page)
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
  const [orderDbId, setOrderDbId] = useState<string | null>(null);

  const sourceFunnel =
    searchParams.get("source") ?? "direct_kundli";
  const utmSource = searchParams.get("utm_source") ?? undefined;
  const utmMedium = searchParams.get("utm_medium") ?? undefined;
  const utmCampaign = searchParams.get("utm_campaign") ?? undefined;

  useEffect(() => {
    // Load Razorpay SDK
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.head.appendChild(script);

    // Pre-fill from result page session
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

    track.checkoutViewed(PRODUCT.type, sourceFunnel, !!stored);

    return () => {
      document.head.removeChild(script);
    };
  }, [sourceFunnel]);

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const errs: Partial<typeof form> = {};
    if (!form.fullName.trim()) errs.fullName = "Required";
    if (!/^[6-9]\d{9}$/.test(form.phone)) errs.phone = "Enter valid 10-digit number";
    if (!form.dob) errs.dob = "Required";
    if (!form.tob) errs.tob = "Required";
    if (!form.pob.trim()) errs.pob = "Required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handlePay() {
    if (!validate()) return;
    setLoading(true);

    try {
      track.paymentInitiated(PRODUCT.type, PRODUCT.amountPaise, sourceFunnel);

      // 1. Create Razorpay order + DB record
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productType: PRODUCT.type,
          productName: PRODUCT.name,
          amountPaise: PRODUCT.amountPaise,
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
            kundliSubmissionId: prefilled.submissionId,
          },
        }),
      });

      if (!res.ok) throw new Error("Order creation failed");
      const { razorpayOrderId, orderDbId: dbId } = await res.json();
      setOrderDbId(dbId);

      // 2. Open Razorpay modal
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: PRODUCT.amountPaise,
        currency: "INR",
        name: "VedGuide",
        description: PRODUCT.name,
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
            track.checkoutAbandoned(PRODUCT.type, sourceFunnel, "payment_modal");
          },
        },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          // 3. Verify payment server-side
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
            track.paymentSuccess(
              PRODUCT.type,
              PRODUCT.amountPaise,
              dbId,
              sourceFunnel
            );
            sessionStorage.setItem(
              "order_complete",
              JSON.stringify({ orderId: dbId, product: PRODUCT.type })
            );
            router.push("/thank-you/kundli");
          } else {
            track.paymentFailed(PRODUCT.type, PRODUCT.amountPaise, "verify_failed");
            setLoading(false);
            alert("Payment verification failed. Please contact support.");
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        track.paymentFailed(PRODUCT.type, PRODUCT.amountPaise);
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      console.error(err);
      setLoading(false);
      alert("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal header — no nav distractions */}
      <div className="border-b border-border/60 px-4 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link
            href="/free-kundli/result"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft size={16} />
            Back
          </Link>
          <span className="font-heading text-lg font-semibold text-foreground">
            Vedगuide
          </span>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock size={12} />
            Secure Checkout
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* ── Left: Form ──────────────────────────────────────────────── */}
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
              Complete Your Order
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Fill in your details to receive your personalized Kundli report
            </p>

            <div className="mt-6 space-y-5">
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="fullName">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fullName"
                  value={form.fullName}
                  onChange={(e) => set("fullName", e.target.value)}
                  placeholder="As per birth certificate"
                  className={errors.fullName ? "border-destructive" : ""}
                />
                {errors.fullName && (
                  <p className="text-xs text-destructive">{errors.fullName}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label htmlFor="phone">
                  WhatsApp Number <span className="text-destructive">*</span>
                </Label>
                <div className="flex">
                  <span className="inline-flex h-10 items-center rounded-l-lg border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                    +91
                  </span>
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={form.phone}
                    onChange={(e) =>
                      set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    placeholder="Report will be sent here"
                    className={cn("rounded-l-none", errors.phone ? "border-destructive" : "")}
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs text-destructive">{errors.phone}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email">
                  Email{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="For PDF delivery"
                />
              </div>

              <Separator />

              <p className="text-sm font-medium text-foreground">
                Birth Details
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  Used to generate your personalized report
                </span>
              </p>

              {/* DOB */}
              <div className="space-y-1.5">
                <Label htmlFor="dob">
                  Date of Birth <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="dob"
                  type="date"
                  value={form.dob}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => set("dob", e.target.value)}
                  className={errors.dob ? "border-destructive" : ""}
                />
                {errors.dob && (
                  <p className="text-xs text-destructive">{errors.dob}</p>
                )}
              </div>

              {/* TOB */}
              <div className="space-y-1.5">
                <Label htmlFor="tob">
                  Time of Birth <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="tob"
                  type="time"
                  value={form.tob}
                  onChange={(e) => set("tob", e.target.value)}
                  className={errors.tob ? "border-destructive" : ""}
                />
                <p className="text-xs text-muted-foreground">
                  Determines your Lagna. Use your best estimate if unsure.
                </p>
                {errors.tob && (
                  <p className="text-xs text-destructive">{errors.tob}</p>
                )}
              </div>

              {/* POB */}
              <div className="space-y-1.5">
                <Label htmlFor="pob">
                  Place of Birth <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="pob"
                  value={form.pob}
                  onChange={(e) => set("pob", e.target.value)}
                  placeholder="City, State"
                  className={errors.pob ? "border-destructive" : ""}
                />
                {errors.pob && (
                  <p className="text-xs text-destructive">{errors.pob}</p>
                )}
              </div>
            </div>

            {/* Pay button — desktop */}
            <div className="mt-8 hidden md:block">
              <PayButton loading={loading} onPay={handlePay} />
            </div>
          </div>

          {/* ── Right: Order summary ─────────────────────────────────────── */}
          <div>
            <div className="sticky top-6 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Order Summary
              </h2>

              <div className="mt-4 rounded-xl border border-border/50 bg-surface p-4">
                <p className="font-semibold text-foreground">{PRODUCT.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Personalized for your exact birth data
                </p>
                <div className="mt-3 space-y-1.5">
                  {PRODUCT.includes.map((item) => (
                    <div key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CheckCircle2
                        size={12}
                        className="mt-0.5 shrink-0 text-brand"
                      />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-4">
                <span className="text-sm font-medium text-muted-foreground">
                  Total
                </span>
                <span className="font-heading text-2xl font-bold text-foreground">
                  {PRODUCT.displayPrice}
                </span>
              </div>

              {/* Trust badges */}
              <div className="mt-4 space-y-2">
                {[
                  { icon: Shield, text: "Secured by Razorpay" },
                  { icon: Lock, text: "SSL encrypted payment" },
                  { icon: CheckCircle2, text: "Instant order confirmation" },
                ].map(({ icon: Icon, text }) => (
                  <div
                    key={text}
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <Icon size={12} className="text-brand" />
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Pay button — mobile */}
        <div className="mt-8 md:hidden">
          <PayButton loading={loading} onPay={handlePay} />
        </div>
      </div>
    </div>
  );
}

function PayButton({
  loading,
  onPay,
}: {
  loading: boolean;
  onPay: () => void;
}) {
  return (
    <div className="space-y-3">
      <Button
        size="lg"
        onClick={onPay}
        disabled={loading}
        className="w-full bg-brand hover:bg-brand-hover text-white text-base"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 size={18} className="animate-spin" />
            Processing...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Lock size={16} />
            Pay ₹399 Securely
          </span>
        )}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        By paying you agree to our{" "}
        <Link href="/terms" className="underline">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/refund-policy" className="underline">
          Refund Policy
        </Link>
      </p>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
