"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatInrFromPaise } from "@/lib/format-money";

const PRESETS_PAISE = [10_000, 50_000, 100_000, 500_000]; // ₹100, ₹500, ₹1000, ₹5000

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
  const [customRupees, setCustomRupees] = useState("500");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    onOpen?.();
    // Only re-run when dialog opens, not when parent recreates onOpen.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: refresh once per open
  }, [open]);

  if (!open) return null;

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
      let data: { error?: string; balancePaise?: number; code?: string };
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

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center p-4 sm:items-center"
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
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 bg-white text-gray-900 shadow-2xl">
        <div className="border-b border-gray-100 bg-gradient-to-br from-amber-50 via-orange-50/60 to-white px-6 py-5">
          <h2 id="wallet-topup-title" className="font-heading text-xl font-semibold text-gray-900">
            Add Balance
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            No real payment — for development only. Balance is stored in paise on
            the server.
          </p>
        </div>
        <div className="space-y-4 px-6 py-5">
          {!isLoggedIn ? (
            <div className="space-y-3 text-sm">
              <p className="text-gray-500">
                Sign in to add balance to your wallet.
              </p>
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
                  {PRESETS_PAISE.map((paise) => (
                    <Button
                      key={paise}
                      type="button"
                      variant="outline"
                      className="rounded-xl border-gray-200 bg-amber-50 text-xs font-semibold text-amber-800 hover:bg-amber-100 hover:border-amber-300"
                      disabled={loading}
                      onClick={() => topup(paise)}
                    >
                      +{formatInrFromPaise(paise)}
                    </Button>
                  ))}
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
                  min={1}
                  max={500000}
                  className="mt-1.5 h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-amber-400/40"
                  value={customRupees}
                  onChange={(e) => setCustomRupees(e.target.value)}
                />
                <Button
                  type="button"
                  className="mt-3 w-full rounded-xl bg-amber-400 font-semibold text-gray-900 hover:bg-amber-500"
                  disabled={loading}
                  onClick={() => {
                    const r = Number(customRupees);
                    if (!Number.isFinite(r) || r < 1) {
                      setError("Enter at least ₹1");
                      return;
                    }
                    topup(Math.floor(r * 100));
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Adding…
                    </>
                  ) : (
                    "Add to wallet"
                  )}
                </Button>
              </div>
            </>
          )}
          <Button type="button" variant="ghost" className="w-full text-gray-500 hover:text-gray-700" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
