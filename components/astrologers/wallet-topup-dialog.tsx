"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatInrFromPaise } from "@/lib/format-money";
import {
  MAX_WALLET_TOPUP_PAISE,
  MIN_WALLET_TOPUP_PAISE,
} from "@/lib/wallet/topup-rules";

type TopupInfo = {
  minPaise: number;
  maxPaise: number;
  minRupees: number;
  cashbackEnabled: boolean;
  cashbackPercent: number;
  cashbackMinEligiblePaise?: number;
  cashbackMinEligibleRupees?: number;
  useTestTopup?: boolean;
  razorpayKeyId?: string | null;
};

/** UI cap: quick amounts and input only up to ₹2,000. */
const MAX_RECHARGE_RUPEES_UI = 2000;

function buildSuggestionRupees(typedRupees: number, minR: number, maxR: number): number[] {
  const anchors = [49, 100, 200, 500, 1000, 2000].filter(
    (x) => x >= minR && x <= maxR
  );
  const t = Number.isFinite(typedRupees) ? typedRupees : minR;
  const clamped = Math.min(maxR, Math.max(minR, t));
  const dynamic = [
    minR,
    Math.ceil(clamped / 10) * 10,
    Math.ceil(clamped / 50) * 50,
    Math.ceil(clamped / 100) * 100,
  ].filter((x) => x >= minR && x <= maxR);

  const set = new Set<number>([...dynamic, ...anchors]);
  return [...set].sort((a, b) => a - b).slice(0, 8);
}

type WalletTopupDialogProps = {
  open: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  onSuccess: (balancePaise: number) => void;
  /** Called when the dialog opens (e.g. refetch wallet for nav + modal). */
  onOpen?: () => void;
};

export function WalletTopupDialog({
  open,
  onClose,
  isLoggedIn,
  onSuccess,
  onOpen,
}: WalletTopupDialogProps) {
  const minRupees = MIN_WALLET_TOPUP_PAISE / 100;
  const [customRupees, setCustomRupees] = useState(String(minRupees));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState<TopupInfo | null>(null);
  const [infoLoading, setInfoLoading] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [razorpayReady, setRazorpayReady] = useState(false);

  useLayoutEffect(() => {
    setPortalTarget(document.body);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    onOpen?.();
    let cancelled = false;
    setInfoLoading(true);
    void (async () => {
      try {
        const res = await fetch("/api/user/wallet/topup-info", { credentials: "include" });
        const data = (await res.json()) as TopupInfo & { error?: string };
        if (!cancelled && res.ok && typeof data.minPaise === "number") {
          setInfo(data);
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setInfoLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh once per open
  }, [open]);

  useEffect(() => {
    if (!open || !info || info.useTestTopup) {
      setRazorpayReady(false);
      return;
    }

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

    return () => {
      cancelled = true;
    };
  }, [open, info]);

  const minRupeesEffective = info?.minRupees ?? MIN_WALLET_TOPUP_PAISE / 100;
  const maxRupeesEffective = info?.maxPaise
    ? info.maxPaise / 100
    : MAX_WALLET_TOPUP_PAISE / 100;
  const maxRupeesUi = Math.min(maxRupeesEffective, MAX_RECHARGE_RUPEES_UI);
  const typedRupeesNum = Number(customRupees);
  const suggestionRupees = useMemo(
    () =>
      buildSuggestionRupees(
        Number.isFinite(typedRupeesNum) ? typedRupeesNum : minRupeesEffective,
        minRupeesEffective,
        maxRupeesUi
      ),
    [typedRupeesNum, minRupeesEffective, maxRupeesUi]
  );

  if (!open || !portalTarget) return null;

  const cashbackMinPaise = info?.cashbackMinEligiblePaise ?? 9_900; // > ₹99
  const cashbackMinRupees = info?.cashbackMinEligibleRupees ?? 99;
  const useTestTopup = info?.useTestTopup === true;

  function previewCashback(principalPaise: number): number {
    if (!info?.cashbackEnabled || !info.cashbackPercent) return 0;
    if (principalPaise <= cashbackMinPaise) return 0;
    return Math.floor((principalPaise * info.cashbackPercent) / 100);
  }

  async function testTopupRequest(amountPaise: number) {
    const res = await fetch("/api/user/wallet/test-topup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ amountPaise }),
    });
    let data: {
      error?: string;
      balancePaise?: number;
    };
    try {
      data = (await res.json()) as typeof data;
    } catch {
      setError("Unexpected response from server. Try again.");
      return;
    }
    if (!res.ok) {
      setError(data.error ?? "Top-up failed");
      return;
    }
    if (typeof data.balancePaise === "number") {
      onSuccess(data.balancePaise);
      onClose();
    } else {
      setError("Top-up succeeded but balance was not returned. Refresh the page.");
    }
  }

  async function razorpayTopup(amountPaise: number) {
    const key = info?.razorpayKeyId?.trim();
    if (!key || key.includes("your_razorpay")) {
      setError("Razorpay is not configured. Set RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET (same mode for order + checkout).");
      return;
    }
    if (!razorpayReady || !window.Razorpay) {
      setError("Payment form is still loading. Try again in a second.");
      return;
    }

    const res = await fetch("/api/user/wallet/create-recharge-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ amountPaise }),
    });
    let payload: {
      error?: string;
      intentId?: string;
      razorpayOrderId?: string;
      amountPaise?: number;
      keyId?: string;
      prefill?: { name?: string; email?: string; contact?: string };
    };
    try {
      payload = (await res.json()) as typeof payload;
    } catch {
      setError("Could not start payment. Try again.");
      return;
    }
    if (!res.ok) {
      setError(payload.error ?? "Could not start payment.");
      return;
    }
    const orderId = payload.razorpayOrderId;
    const intentId = payload.intentId;
    const payPaise = payload.amountPaise ?? amountPaise;
    if (!orderId || !intentId) {
      setError("Invalid payment session. Refresh and try again.");
      return;
    }

    const rzpKey = payload.keyId ?? key;

    const rzp = new window.Razorpay({
      key: rzpKey,
      amount: payPaise,
      currency: "INR",
      order_id: orderId,
      name: "VedGuide",
      description: "Wallet recharge",
      prefill: payload.prefill ?? {},
      theme: { color: "#059669" },
      modal: {
        ondismiss: () => {
          setLoading(false);
        },
      },
      handler: async (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        setLoading(true);
        try {
          const verifyRes = await fetch("/api/user/wallet/verify-recharge", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              intentId,
            }),
          });
          const v = (await verifyRes.json()) as {
            error?: string;
            success?: boolean;
            balancePaise?: number;
          };
          if (!verifyRes.ok || !v.success || typeof v.balancePaise !== "number") {
            setError(v.error ?? "Payment verification failed. If money was debited, contact support with your payment ID.");
            return;
          }
          onSuccess(v.balancePaise);
          onClose();
        } finally {
          setLoading(false);
        }
      },
    });

    setLoading(false);
    rzp.open();
  }

  async function topup(amountPaise: number) {
    setError("");
    setLoading(true);
    try {
      if (useTestTopup) {
        await testTopupRequest(amountPaise);
      } else {
        await razorpayTopup(amountPaise);
      }
    } finally {
      setLoading(false);
    }
  }

  const payConfigured =
    useTestTopup ||
    Boolean(info?.razorpayKeyId && !info.razorpayKeyId.includes("your_razorpay"));

  function rechargeFromInput() {
    const r = Number(customRupees);
    if (!Number.isFinite(r) || r < minRupeesEffective) {
      setError(`Enter at least ₹${minRupeesEffective}`);
      return;
    }
    if (r > maxRupeesUi) {
      setError(`Maximum ₹${maxRupeesUi.toLocaleString("en-IN")} per recharge`);
      return;
    }
    void topup(Math.floor(r * 100));
  }

  const modal = (
    <div
      className="fixed inset-0 z-[1000] flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallet-topup-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className="relative z-[1] w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 bg-white text-gray-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Big cashback offer hero */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 px-6 py-5 text-white">
          {/* Decorative circles */}
          <div className="pointer-events-none absolute -right-8 -top-8 size-36 rounded-full bg-white/10" aria-hidden />
          <div className="pointer-events-none absolute -bottom-6 right-12 size-20 rounded-full bg-white/8" aria-hidden />
          <div className="relative flex items-start gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-2xl backdrop-blur-sm">
              🎁
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="wallet-topup-title" className="text-[22px] font-black leading-tight tracking-tight">
                  100% Cashback!
                </h2>
                <span className="rounded-full bg-yellow-300 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-yellow-900">
                  Limited
                </span>
              </div>
              <p className="mt-0.5 text-[13px] font-medium text-white/90">
                {infoLoading
                  ? `On recharge above ₹${cashbackMinRupees}`
                  : info?.cashbackEnabled && info.cashbackPercent === 100
                    ? `Recharge above ₹${cashbackMinRupees} — we'll double it instantly! 🚀`
                    : info?.cashbackEnabled && (info.cashbackPercent ?? 0) > 0
                      ? `Get ${info.cashbackPercent}% extra on recharge above ₹${cashbackMinRupees}`
                      : `Get 100% extra balance on recharge above ₹${cashbackMinRupees}`}
              </p>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-white/60">
            Minimum ₹{minRupeesEffective}
            {useTestTopup ? " · Test mode (instant)" : " · Razorpay secure checkout"}
          </p>
        </div>

        <div className="space-y-4 px-6 py-5">
          {!isLoggedIn ? (
            <div className="space-y-3 text-sm">
              <p className="text-gray-500">Sign in to add balance to your wallet.</p>
              <Button
                className="w-full rounded-xl bg-amber-400 font-semibold text-gray-900 hover:bg-amber-500"
                nativeButton={false}
                render={<Link href="/login?redirect=/astrologers" />}
              >
                Sign in
              </Button>
            </div>
          ) : (
            <>
              {infoLoading && (
                <div className="h-1.5 w-24 animate-pulse rounded-full bg-gray-200" />
              )}
              {!infoLoading && !useTestTopup && !payConfigured && (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  Razorpay keys missing. Set <span className="font-mono">NEXT_PUBLIC_RAZORPAY_KEY_ID</span>,{" "}
                  <span className="font-mono">RAZORPAY_KEY_ID</span>, and{" "}
                  <span className="font-mono">RAZORPAY_KEY_SECRET</span> on the server.
                </p>
              )}
              {!infoLoading && !useTestTopup && payConfigured && !razorpayReady && (
                <p className="text-xs text-gray-500">Loading secure checkout…</p>
              )}
              {error && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}
              <div className="space-y-2">
                <label
                  htmlFor="custom-rupees"
                  className="text-xs font-semibold uppercase tracking-wide text-gray-400"
                >
                  Amount (₹)
                </label>
                {!infoLoading && suggestionRupees.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {suggestionRupees.map((rupees) => {
                      const paise = rupees * 100;
                      const bonus = previewCashback(paise);
                      const active =
                        Number.isFinite(typedRupeesNum) &&
                        Math.floor(typedRupeesNum * 100) === paise;
                      return (
                        <button
                          key={rupees}
                          type="button"
                          disabled={loading}
                          onClick={() => {
                            setError("");
                            setCustomRupees(String(rupees));
                          }}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                            active
                              ? "border-amber-500 bg-amber-100 text-amber-900"
                              : "border-gray-200 bg-white text-gray-800 hover:border-amber-300 hover:bg-amber-50"
                          }`}
                        >
                          ₹{rupees.toLocaleString("en-IN")}
                          {bonus > 0 && (
                            <span className="ml-1 text-[10px] font-bold text-emerald-700">
                              +{formatInrFromPaise(bonus)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
                <input
                  id="custom-rupees"
                  type="number"
                  min={minRupeesEffective}
                  max={maxRupeesUi}
                  step={1}
                  inputMode="decimal"
                  placeholder={`e.g. ${minRupeesEffective}`}
                  className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-base font-semibold text-gray-900 outline-none placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-amber-400/40"
                  value={customRupees}
                  onChange={(e) => {
                    setError("");
                    setCustomRupees(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      rechargeFromInput();
                    }
                  }}
                />
                {(() => {
                  const r = Number(customRupees);
                  if (!Number.isFinite(r) || r < minRupeesEffective) return null;
                  const paise = Math.floor(r * 100);
                  if (paise <= cashbackMinPaise) {
                    return (
                      <p className="text-[11px] text-gray-400">
                        Add ₹{cashbackMinRupees + 1}+ to unlock cashback bonus
                      </p>
                    );
                  }
                  const b = previewCashback(paise);
                  if (b <= 0) return null;
                  return (
                    <p className="text-[12px] font-bold text-emerald-700">
                      🎁 +{formatInrFromPaise(b)} cashback (₹{r} + ₹{b / 100} bonus)
                    </p>
                  );
                })()}
                <Button
                  type="button"
                  className="mt-1 w-full rounded-xl bg-amber-400 py-6 text-base font-bold text-gray-900 hover:bg-amber-500"
                  disabled={
                    loading ||
                    infoLoading ||
                    (!useTestTopup && (!razorpayReady || !payConfigured))
                  }
                  onClick={rechargeFromInput}
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-5 animate-spin" />
                      Processing…
                    </>
                  ) : useTestTopup ? (
                    "Add test balance"
                  ) : (
                    "Recharge with Razorpay"
                  )}
                </Button>
              </div>
            </>
          )}
          <Button
            type="button"
            variant="ghost"
            className="w-full text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, portalTarget);
}
