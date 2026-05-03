"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
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
      <div className="flex flex-wrap items-center gap-3">
        <p
          className={
            onDarkSurface
              ? "text-sm text-white/80"
              : "text-sm text-muted-foreground"
          }
        >
          Current balance{" "}
          <span
            className={
              onDarkSurface
                ? "font-semibold tabular-nums text-white"
                : "font-semibold tabular-nums text-foreground"
            }
          >
            {formatInrFromPaise(balancePaise)}
          </span>
        </p>
        <Button
          type="button"
          size="sm"
          className={
            onDarkSurface
              ? "rounded-xl border-0 bg-white font-semibold text-violet-950 shadow-md hover:bg-white/90"
              : "rounded-xl bg-brand font-medium text-white hover:bg-brand-hover"
          }
          onClick={() => {
            void onOpen();
            setOpen(true);
          }}
        >
          <Plus className="size-3.5" />
          Add test funds
        </Button>
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
