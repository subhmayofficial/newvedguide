import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  isSupabaseTableMissingError,
  SCHEMA_NOT_READY_USER_MESSAGE,
} from "@/lib/supabase/schema-errors";

function testTopupAllowed(): boolean {
  if (process.env.ALLOW_TEST_WALLET_TOPUP === "true") return true;
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

  if (!Number.isFinite(amountPaise) || amountPaise < 100 || amountPaise > 50_000_000) {
    return NextResponse.json(
      { error: "amountPaise must be between 100 and 50000000 (paise)." },
      { status: 400 }
    );
  }

  const svc = createServiceClient();
  const { data: profile, error: readErr } = await svc
    .from("user_profiles")
    .select("wallet_balance_paise")
    .eq("id", user.id)
    .maybeSingle();

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
    return NextResponse.json(
      { error: "Profile not found. Complete sign-up or contact support." },
      { status: 404 }
    );
  }

  const nextBalance = profile.wallet_balance_paise + amountPaise;

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
    metadata: { source: "api_test_topup" },
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

  revalidatePath("/astrologers/wallet");
  revalidatePath("/astrologers");

  return NextResponse.json({ balancePaise: nextBalance });
}
