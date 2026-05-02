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
};

export function WalletTopupLauncher({
  userId,
  isLoggedIn,
  initialBalancePaise,
}: WalletTopupLauncherProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [balancePaise, setBalancePaise] = useState(initialBalancePaise);

  useEffect(() => {
    setBalancePaise(initialBalancePaise);
  }, [initialBalancePaise]);

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
        <p className="text-sm text-muted-foreground">
          Current balance{" "}
          <span className="font-semibold tabular-nums text-foreground">
            {formatInrFromPaise(balancePaise)}
          </span>
        </p>
        <Button
          type="button"
          size="sm"
          className="rounded-xl bg-brand font-medium text-white hover:bg-brand-hover"
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
