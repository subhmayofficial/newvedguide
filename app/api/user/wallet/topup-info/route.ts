import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getWalletCashbackSettings, CASHBACK_MIN_ELIGIBLE_PAISE } from "@/lib/admin/wallet-cashback-settings";
import {
  MAX_WALLET_TOPUP_PAISE,
  MIN_WALLET_TOPUP_PAISE,
} from "@/lib/wallet/topup-rules";
import { resolveRazorpayKeyId } from "@/lib/razorpay-config";
import { razorpayKeysConfigured, useTestWalletTopup } from "@/lib/wallet/topup-mode";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const svc = createServiceClient();
  const settings = await getWalletCashbackSettings(svc);

  const useTestTopup = useTestWalletTopup();
  const keyId = razorpayKeysConfigured() ? (resolveRazorpayKeyId() ?? null) : null;

  return NextResponse.json({
    minPaise: MIN_WALLET_TOPUP_PAISE,
    maxPaise: MAX_WALLET_TOPUP_PAISE,
    minRupees: MIN_WALLET_TOPUP_PAISE / 100,
    cashbackEnabled: settings.cashback_enabled,
    cashbackPercent: settings.cashback_percent,
    cashbackMinEligiblePaise: CASHBACK_MIN_ELIGIBLE_PAISE,
    cashbackMinEligibleRupees: CASHBACK_MIN_ELIGIBLE_PAISE / 100,
    useTestTopup,
    razorpayKeyId: keyId,
  });
}
