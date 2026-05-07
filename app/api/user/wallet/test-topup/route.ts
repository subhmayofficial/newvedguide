import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  computeTopupCashbackPaise,
  getWalletCashbackSettings,
} from "@/lib/admin/wallet-cashback-settings";
import {
  isSupabaseTableMissingError,
  SCHEMA_NOT_READY_USER_MESSAGE,
} from "@/lib/supabase/schema-errors";
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

export async function POST(request: Request) {
  if (!testTopupAllowed()) {
    return NextResponse.json(
      { error: "Test wallet top-up is disabled in this environment." },
      { status: 403 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const amountPaise =
    typeof body === "object" &&
    body !== null &&
    "amountPaise" in body &&
    typeof (body as { amountPaise: unknown }).amountPaise === "number"
      ? Math.floor((body as { amountPaise: number }).amountPaise)
      : NaN;

  if (
    !Number.isFinite(amountPaise) ||
    amountPaise < MIN_WALLET_TOPUP_PAISE ||
    amountPaise > MAX_WALLET_TOPUP_PAISE
  ) {
    return NextResponse.json(
      {
        error: `Amount must be between ₹${MIN_WALLET_TOPUP_PAISE / 100} and ₹${MAX_WALLET_TOPUP_PAISE / 100} (whole rupees as paise).`,
        minPaise: MIN_WALLET_TOPUP_PAISE,
      },
      { status: 400 }
    );
  }

  const svc = createServiceClient();
  const cashbackSettings = await getWalletCashbackSettings(svc);
  const cashbackPaise = computeTopupCashbackPaise(amountPaise, cashbackSettings);
  const totalCreditPaise = amountPaise + cashbackPaise;

  const { data: profileRow, error: readErr } = await svc
    .from("user_profiles")
    .select("wallet_balance_paise")
    .eq("id", user.id)
    .maybeSingle();
  let profile = profileRow;

  if (readErr) {
    const msg = readErr.message ?? "";
    if (isSupabaseTableMissingError(msg)) {
      return NextResponse.json(
        { code: "SCHEMA_NOT_READY" as const, error: SCHEMA_NOT_READY_USER_MESSAGE },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  if (!profile) {
    const meta = user.user_metadata as { display_name?: string } | undefined;
    const displayName =
      (typeof meta?.display_name === "string" && meta.display_name.trim()) ||
      (user.email?.split("@")[0] ?? null);
    const { data: created, error: insErr } = await svc
      .from("user_profiles")
      .insert({
        id: user.id,
        display_name: displayName,
        wallet_balance_paise: 0,
      })
      .select("wallet_balance_paise")
      .single();

    if (insErr) {
      const msg = insErr.message ?? "";
      if (isSupabaseTableMissingError(msg)) {
        return NextResponse.json(
          { code: "SCHEMA_NOT_READY" as const, error: SCHEMA_NOT_READY_USER_MESSAGE },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: msg || "Could not create profile for wallet." },
        { status: 500 }
      );
    }
    profile = created;
  }

  const nextBalance = (profile.wallet_balance_paise ?? 0) + totalCreditPaise;

  const { error: updErr } = await svc
    .from("user_profiles")
    .update({
      wallet_balance_paise: nextBalance,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (updErr) {
    const msg = updErr.message ?? "";
    if (isSupabaseTableMissingError(msg)) {
      return NextResponse.json(
        { code: "SCHEMA_NOT_READY" as const, error: SCHEMA_NOT_READY_USER_MESSAGE },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const { error: ledErr } = await svc.from("wallet_ledger").insert({
    user_id: user.id,
    delta_paise: amountPaise,
    reason: "test_topup",
    metadata: {
      source: "api_test_topup",
      principal_paise: amountPaise,
      cashback_paise: cashbackPaise,
      cashback_percent_applied: cashbackSettings.cashback_enabled
        ? cashbackSettings.cashback_percent
        : 0,
    },
  });

  if (ledErr) {
    const msg = ledErr.message ?? "";
    if (isSupabaseTableMissingError(msg)) {
      return NextResponse.json(
        { code: "SCHEMA_NOT_READY" as const, error: SCHEMA_NOT_READY_USER_MESSAGE },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  if (cashbackPaise > 0) {
    const { error: cbErr } = await svc.from("wallet_ledger").insert({
      user_id: user.id,
      delta_paise: cashbackPaise,
      reason: "wallet_cashback",
      metadata: {
        source: "wallet_topup_cashback",
        base_topup_paise: amountPaise,
        cashback_percent: cashbackSettings.cashback_percent,
      },
    });
    if (cbErr) {
      console.error("[test-topup] cashback ledger insert:", cbErr.message);
    }
  }

  revalidatePath("/astrologers/wallet");
  revalidatePath("/astrologers");

  return NextResponse.json({
    balancePaise: nextBalance,
    principalPaise: amountPaise,
    cashbackPaise,
    cashbackPercentApplied: cashbackSettings.cashback_enabled
      ? cashbackSettings.cashback_percent
      : 0,
  });
}
