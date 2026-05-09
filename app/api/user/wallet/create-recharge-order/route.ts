import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createRazorpayOrder } from "@/lib/razorpay";
import { createClient, createServiceClient } from "@/lib/supabase/server";
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

/** Production / real recharge: Razorpay when test top-up is not the active path. */
function razorpayWalletRechargeEnabled(): boolean {
  if (testTopupAllowed()) return false;
  const pub = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim();
  return Boolean(pub && !pub.includes("your_razorpay"));
}

export async function POST(request: Request) {
  if (!razorpayWalletRechargeEnabled()) {
    return NextResponse.json(
      {
        error:
          "Razorpay wallet recharge is not enabled. Use test top-up in dev, or deploy without ALLOW_TEST_WALLET_TOPUP and set Razorpay keys.",
      },
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
        error: `Amount must be between ₹${MIN_WALLET_TOPUP_PAISE / 100} and ₹${MAX_WALLET_TOPUP_PAISE / 100}.`,
        minPaise: MIN_WALLET_TOPUP_PAISE,
      },
      { status: 400 }
    );
  }

  const svc = createServiceClient();

  const { data: profileRow, error: readErr } = await svc
    .from("user_profiles")
    .select("id, display_name, wallet_balance_paise")
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

  if (!profileRow) {
    const meta = user.user_metadata as { display_name?: string } | undefined;
    const displayName =
      (typeof meta?.display_name === "string" && meta.display_name.trim()) ||
      (user.email?.split("@")[0] ?? "User");
    const { error: insErr } = await svc.from("user_profiles").insert({
      id: user.id,
      display_name: displayName,
      wallet_balance_paise: 0,
    });
    if (insErr) {
      const msg = insErr.message ?? "";
      if (isSupabaseTableMissingError(msg)) {
        return NextResponse.json(
          { code: "SCHEMA_NOT_READY" as const, error: SCHEMA_NOT_READY_USER_MESSAGE },
          { status: 503 }
        );
      }
      return NextResponse.json({ error: msg || "Could not create profile." }, { status: 500 });
    }
  }

  const intentId = randomUUID();
  let razorpayOrder;
  try {
    razorpayOrder = await createRazorpayOrder({
      amount: amountPaise,
      currency: "INR",
      receipt: `wt_${intentId.replace(/-/g, "").slice(0, 12)}`,
      notes: {
        type: "wallet_recharge",
        intent_id: intentId,
        user_id: user.id,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Razorpay order failed";
    console.error("[create-recharge-order]", e);
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const { error: insIntentErr } = await svc.from("wallet_recharge_intents").insert({
    id: intentId,
    user_id: user.id,
    principal_paise: amountPaise,
    razorpay_order_id: razorpayOrder.id,
    status: "created",
  });

  if (insIntentErr) {
    const msg = insIntentErr.message ?? "";
    if (isSupabaseTableMissingError(msg) || msg.includes("wallet_recharge_intents")) {
      return NextResponse.json(
        {
          code: "SCHEMA_NOT_READY" as const,
          error:
            "Wallet recharge table missing. Apply migration 042_wallet_recharge_intents.sql in Supabase.",
        },
        { status: 503 }
      );
    }
    console.error("[create-recharge-order] intent insert:", insIntentErr);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const phone =
    typeof user.phone === "string" && user.phone.replace(/\D/g, "").length >= 10
      ? user.phone.startsWith("+")
        ? user.phone
        : `+91${user.phone.replace(/\D/g, "").slice(-10)}`
      : undefined;

  const displayName =
    profileRow?.display_name ||
    (user.user_metadata as { display_name?: string } | undefined)?.display_name ||
    user.email?.split("@")[0] ||
    "User";

  return NextResponse.json({
    intentId,
    razorpayOrderId: razorpayOrder.id,
    amountPaise,
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    prefill: {
      name: displayName,
      email: user.email ?? undefined,
      contact: phone,
    },
  });
}
