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
        body: JSON.stringify({ amountPaise }),
      });
      const data = (await res.json()) as { error?: string; balancePaise?: number };
      if (!res.ok) {
        setError(data.error ?? "Top-up failed");
        return;
      }
      if (typeof data.balancePaise === "number") {
        onSuccess(data.balancePaise);
        onClose();
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
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="border-b border-border bg-gradient-to-br from-brand-light/40 to-gold-light/25 px-6 py-5">
          <h2 id="wallet-topup-title" className="font-heading text-xl font-semibold">
            Wallet (test top-up)
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            No real payment — for development only. Balance is stored in paise on
            the server.
          </p>
        </div>
        <div className="space-y-4 px-6 py-5">
          {!isLoggedIn ? (
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Sign in to add test balance to your wallet.
              </p>
              <Button
                className="w-full rounded-xl bg-brand font-semibold"
                nativeButton={false}
                render={<Link href="/login?redirect=/astrologers" />}
              >
                Sign in
              </Button>
            </div>
          ) : (
            <>
              {error && (
                <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Quick add
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {PRESETS_PAISE.map((paise) => (
                    <Button
                      key={paise}
                      type="button"
                      variant="outline"
                      className="rounded-xl text-xs"
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
                  className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Custom amount (₹)
                </label>
                <input
                  id="custom-rupees"
                  type="number"
                  min={1}
                  max={500000}
                  className="mt-1.5 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
                  value={customRupees}
                  onChange={(e) => setCustomRupees(e.target.value)}
                />
                <Button
                  type="button"
                  className="mt-3 w-full rounded-xl bg-brand font-semibold"
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
          <Button type="button" variant="ghost" className="w-full" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
