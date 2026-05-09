import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getWalletCashbackSettings, CASHBACK_MIN_ELIGIBLE_PAISE } from "@/lib/admin/wallet-cashback-settings";
import {
  MAX_WALLET_TOPUP_PAISE,
  MIN_WALLET_TOPUP_PAISE,
} from "@/lib/wallet/topup-rules";

function testTopupAllowed(): boolean {
  if (process.env.ALLOW_TEST_WALLET_TOPUP === "true") return true;
  if (process.env.VERCEL_ENV === "preview") return true;
  if (process.env.NODE_ENV !== "production") return true;
  return false;
}

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

  const useTestTopup = testTopupAllowed();
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim() ?? null;

  return NextResponse.json({
    minPaise: MIN_WALLET_TOPUP_PAISE,
    maxPaise: MAX_WALLET_TOPUP_PAISE,
    minRupees: MIN_WALLET_TOPUP_PAISE / 100,
    cashbackEnabled: settings.cashback_enabled,
    cashbackPercent: settings.cashback_percent,
    cashbackMinEligiblePaise: CASHBACK_MIN_ELIGIBLE_PAISE,
    cashbackMinEligibleRupees: CASHBACK_MIN_ELIGIBLE_PAISE / 100,
    useTestTopup,
    razorpayKeyId: useTestTopup ? null : keyId,
  });
}
