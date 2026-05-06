"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatInrFromPaise } from "@/lib/format-money";
import { MIN_WALLET_TOPUP_PAISE } from "@/lib/wallet/topup-rules";

type TopupInfo = {
  minPaise: number;
  maxPaise: number;
  minRupees: number;
  cashbackEnabled: boolean;
  cashbackPercent: number;
  cashbackMinEligiblePaise?: number;
  cashbackMinEligibleRupees?: number;
};

const PRESETS_PAISE_BASE = [10_000, 50_000, 100_000, 500_000]; // ₹100 … ₹5000

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

  if (!open || !portalTarget) return null;

  const presets = (() => {
    const min = info?.minPaise ?? MIN_WALLET_TOPUP_PAISE;
    const list = PRESETS_PAISE_BASE.filter((p) => p >= min);
    if (!list.includes(min)) return [min, ...list].slice(0, 4);
    return list.slice(0, 4);
  })();

  const cashbackMinPaise = info?.cashbackMinEligiblePaise ?? 9_900; // > ₹99
  const cashbackMinRupees = info?.cashbackMinEligibleRupees ?? 99;

  function previewCashback(principalPaise: number): number {
    if (!info?.cashbackEnabled || !info.cashbackPercent) return 0;
    if (principalPaise <= cashbackMinPaise) return 0; // only on amounts > ₹99
    return Math.floor((principalPaise * info.cashbackPercent) / 100);
  }

  async function topup(amountPaise: number) {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/user/wallet/test-topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amountPaise }),
      });
      let data: {
        error?: string;
        balancePaise?: number;
        cashbackPaise?: number;
        principalPaise?: number;
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
    } finally {
      setLoading(false);
    }
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
          {/* Min recharge note */}
          <p className="mt-3 text-[11px] text-white/60">Minimum recharge ₹{minRupees} · Dev mode only</p>
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
              {error && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Quick add
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {presets.map((paise) => {
                    const bonus = previewCashback(paise);
                    return (
                      <Button
                        key={paise}
                        type="button"
                        variant="outline"
                        className="rounded-xl border-gray-200 bg-amber-50 text-xs font-semibold text-amber-800 hover:border-amber-300 hover:bg-amber-100"
                        disabled={loading}
                        onClick={() => topup(paise)}
                      >
                        <span className="flex flex-col items-center gap-0.5">
                          <span>+{formatInrFromPaise(paise)}</span>
                          {bonus > 0 && (
                            <span className="text-[10px] font-bold text-emerald-700">
                              +{formatInrFromPaise(bonus)} bonus
                            </span>
                          )}
                        </span>
                      </Button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label
                  htmlFor="custom-rupees"
                  className="text-xs font-semibold uppercase tracking-wide text-gray-400"
                >
                  Custom amount (₹)
                </label>
                <input
                  id="custom-rupees"
                  type="number"
                  min={minRupees}
                  max={500000}
                  step={1}
                  className="mt-1.5 h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-amber-400/40"
                  value={customRupees}
                  onChange={(e) => setCustomRupees(e.target.value)}
                />
                {(() => {
                  const r = Number(customRupees);
                  if (!Number.isFinite(r) || r < minRupees) return null;
                  const paise = Math.floor(r * 100);
                  if (paise <= cashbackMinPaise) {
                    return (
                      <p className="mt-1.5 text-[11px] text-gray-400">
                        Add ₹{cashbackMinRupees + 1}+ to unlock 100% cashback bonus
                      </p>
                    );
                  }
                  const b = previewCashback(paise);
                  if (b <= 0) return null;
                  return (
                    <p className="mt-1.5 text-[12px] font-bold text-emerald-700">
                      🎁 You&apos;ll get +{formatInrFromPaise(b)} cashback free! (₹{r} + ₹{b / 100} bonus)
                    </p>
                  );
                })()}
                <Button
                  type="button"
                  className="mt-3 w-full rounded-xl bg-amber-400 font-semibold text-gray-900 hover:bg-amber-500"
                  disabled={loading}
                  onClick={() => {
                    const r = Number(customRupees);
                    if (!Number.isFinite(r) || r < minRupees) {
                      setError(`Enter at least ₹${minRupees}`);
                      return;
                    }
                    topup(Math.floor(r * 100));
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Processing…
                    </>
                  ) : (
                    "⚡ Recharge Now"
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
