import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  isSupabaseTableMissingError,
  SCHEMA_NOT_READY_USER_MESSAGE,
} from "@/lib/supabase/schema-errors";
import {
  MAX_WALLET_TOPUP_PAISE,
  MIN_WALLET_TOPUP_PAISE,
} from "@/lib/wallet/topup-rules";
import { creditWalletTopup } from "@/lib/wallet/credit-topup";
import { useTestWalletTopup } from "@/lib/wallet/topup-mode";

export async function POST(request: Request) {
  if (!useTestWalletTopup()) {
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

  const credited = await creditWalletTopup(svc, user.id, amountPaise, "test_topup", {
    source: "api_test_topup",
  });

  if (!credited.ok) {
    if (credited.code === "SCHEMA_NOT_READY") {
      return NextResponse.json(
        { code: credited.code, error: credited.error },
        { status: credited.status }
      );
    }
    return NextResponse.json({ error: credited.error }, { status: credited.status });
  }

  return NextResponse.json({
    balancePaise: credited.data.balancePaise,
    principalPaise: credited.data.principalPaise,
    cashbackPaise: credited.data.cashbackPaise,
    cashbackPercentApplied: credited.data.cashbackPercentApplied,
  });
}
