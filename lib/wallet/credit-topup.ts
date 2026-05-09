import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  computeTopupCashbackPaise,
  getWalletCashbackSettings,
} from "@/lib/admin/wallet-cashback-settings";
import {
  isSupabaseTableMissingError,
  SCHEMA_NOT_READY_USER_MESSAGE,
} from "@/lib/supabase/schema-errors";
import { MAX_WALLET_TOPUP_PAISE, MIN_WALLET_TOPUP_PAISE } from "@/lib/wallet/topup-rules";

type Svc = SupabaseClient<Database>;

export type WalletTopupLedgerReason = "test_topup" | "wallet_recharge";

export type CreditWalletTopupResult = {
  balancePaise: number;
  principalPaise: number;
  cashbackPaise: number;
  cashbackPercentApplied: number;
};

function validatePrincipal(amountPaise: number): string | null {
  if (
    !Number.isFinite(amountPaise) ||
    amountPaise < MIN_WALLET_TOPUP_PAISE ||
    amountPaise > MAX_WALLET_TOPUP_PAISE
  ) {
    return `Amount must be between ₹${MIN_WALLET_TOPUP_PAISE / 100} and ₹${MAX_WALLET_TOPUP_PAISE / 100}.`;
  }
  return null;
}

/**
 * Credits wallet balance + ledger (principal + optional cashback). Used by test top-up and Razorpay verify.
 */
export async function creditWalletTopup(
  svc: Svc,
  userId: string,
  principalPaise: number,
  reason: WalletTopupLedgerReason,
  principalMetadata: Record<string, unknown>
): Promise<
  | { ok: true; data: CreditWalletTopupResult }
  | { ok: false; status: number; code?: "SCHEMA_NOT_READY"; error: string }
> {
  const v = validatePrincipal(principalPaise);
  if (v) return { ok: false, status: 400, error: v };

  const cashbackSettings = await getWalletCashbackSettings(svc);
  const cashbackPaise = computeTopupCashbackPaise(principalPaise, cashbackSettings);
  const totalCreditPaise = principalPaise + cashbackPaise;

  const { data: profileRow, error: readErr } = await svc
    .from("user_profiles")
    .select("wallet_balance_paise")
    .eq("id", userId)
    .maybeSingle();
  let profile = profileRow;

  if (readErr) {
    const msg = readErr.message ?? "";
    if (isSupabaseTableMissingError(msg)) {
      return {
        ok: false,
        status: 503,
        code: "SCHEMA_NOT_READY",
        error: SCHEMA_NOT_READY_USER_MESSAGE,
      };
    }
    return { ok: false, status: 500, error: msg };
  }

  if (!profile) {
    return {
      ok: false,
      status: 400,
      error: "User profile missing. Sign in again or contact support.",
    };
  }

  const nextBalance = (profile.wallet_balance_paise ?? 0) + totalCreditPaise;

  const { error: updErr } = await svc
    .from("user_profiles")
    .update({
      wallet_balance_paise: nextBalance,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (updErr) {
    const msg = updErr.message ?? "";
    if (isSupabaseTableMissingError(msg)) {
      return {
        ok: false,
        status: 503,
        code: "SCHEMA_NOT_READY",
        error: SCHEMA_NOT_READY_USER_MESSAGE,
      };
    }
    return { ok: false, status: 500, error: msg };
  }

  const { error: ledErr } = await svc.from("wallet_ledger").insert({
    user_id: userId,
    delta_paise: principalPaise,
    reason,
    metadata: {
      ...principalMetadata,
      principal_paise: principalPaise,
      cashback_paise: cashbackPaise,
      cashback_percent_applied: cashbackSettings.cashback_enabled
        ? cashbackSettings.cashback_percent
        : 0,
    },
  });

  if (ledErr) {
    const msg = ledErr.message ?? "";
    if (isSupabaseTableMissingError(msg)) {
      return {
        ok: false,
        status: 503,
        code: "SCHEMA_NOT_READY",
        error: SCHEMA_NOT_READY_USER_MESSAGE,
      };
    }
    return { ok: false, status: 500, error: msg };
  }

  if (cashbackPaise > 0) {
    const { error: cbErr } = await svc.from("wallet_ledger").insert({
      user_id: userId,
      delta_paise: cashbackPaise,
      reason: "wallet_cashback",
      metadata: {
        source:
          reason === "wallet_recharge"
            ? "wallet_topup_cashback_razorpay"
            : "wallet_topup_cashback",
        base_topup_paise: principalPaise,
        cashback_percent: cashbackSettings.cashback_percent,
      },
    });
    if (cbErr) {
      console.error("[creditWalletTopup] cashback ledger insert:", cbErr.message);
    }
  }

  revalidatePath("/astrologers/wallet");
  revalidatePath("/astrologers");

  return {
    ok: true,
    data: {
      balancePaise: nextBalance,
      principalPaise,
      cashbackPaise,
      cashbackPercentApplied: cashbackSettings.cashback_enabled
        ? cashbackSettings.cashback_percent
        : 0,
    },
  };
}
