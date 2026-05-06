"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { formatInrFromPaise } from "@/lib/format-money";
import { WalletTopupDialog } from "@/components/astrologers/wallet-topup-dialog";

type WalletTopupLauncherProps = {
  userId: string;
  isLoggedIn: boolean;
  initialBalancePaise: number;
  /** Use on purple/dark balance card: light text + high-contrast CTA (avoids white “ghost” buttons). */
  onDarkSurface?: boolean;
};

export function WalletTopupLauncher({
  userId,
  isLoggedIn,
  initialBalancePaise,
  onDarkSurface = false,
}: WalletTopupLauncherProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [balancePaise, setBalancePaise] = useState(initialBalancePaise);

  useEffect(() => {
    setBalancePaise(initialBalancePaise);
  }, [initialBalancePaise]);

  useEffect(() => {
    if (!isLoggedIn || !userId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`wallet-topup:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_profiles",
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as { wallet_balance_paise?: number };
          if (typeof row.wallet_balance_paise === "number") {
            setBalancePaise(row.wallet_balance_paise);
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isLoggedIn, userId]);

  const onOpen = useCallback(async () => {
    if (!isLoggedIn) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("user_profiles")
      .select("wallet_balance_paise")
      .eq("id", userId)
      .maybeSingle();
    if (data && typeof data.wallet_balance_paise === "number") {
      setBalancePaise(data.wallet_balance_paise);
    }
  }, [isLoggedIn, userId]);

  if (!isLoggedIn) return null;

  return (
    <>
      <div className="flex flex-col gap-2.5">
        {/* 100% cashback offer strip */}
        <div
          className={`flex items-center gap-2 rounded-xl px-3 py-2 ${
            onDarkSurface
              ? "bg-amber-400/20 border border-amber-300/30"
              : "bg-emerald-50 border border-emerald-200"
          }`}
        >
          <span className="text-base">🎁</span>
          <div className="flex-1 min-w-0">
            <p className={`text-[12px] font-black uppercase tracking-wide ${onDarkSurface ? "text-amber-200" : "text-emerald-800"}`}>
              100% Cashback Offer
            </p>
            <p className={`text-[10px] leading-tight ${onDarkSurface ? "text-amber-300/80" : "text-emerald-700/80"}`}>
              Recharge now &amp; get double the balance free!
            </p>
          </div>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${onDarkSurface ? "bg-amber-300 text-amber-950" : "bg-emerald-500 text-white"}`}>
            LIMITED
          </span>
        </div>

        {/* Balance + CTA row */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className={onDarkSurface ? "text-sm text-amber-100/80" : "text-sm text-gray-500"}>
            Balance{" "}
            <span className={onDarkSurface ? "font-bold tabular-nums text-white" : "font-bold tabular-nums text-gray-900"}>
              {formatInrFromPaise(balancePaise)}
            </span>
          </p>
          <Button
            type="button"
            size="sm"
            className={
              onDarkSurface
                ? "rounded-xl border-0 bg-amber-300 font-bold text-amber-950 shadow-md hover:bg-amber-200"
                : "rounded-xl bg-amber-400 font-bold text-gray-900 hover:bg-amber-500"
            }
            onClick={() => setOpen(true)}
          >
            <Zap className="size-3.5" />
            Recharge Wallet
          </Button>
        </div>
      </div>
      <WalletTopupDialog
        open={open}
        onClose={() => setOpen(false)}
        isLoggedIn={isLoggedIn}
        onOpen={onOpen}
        onSuccess={(next) => {
          setBalancePaise(next);
          router.refresh();
        }}
      />
    </>
  );
}
