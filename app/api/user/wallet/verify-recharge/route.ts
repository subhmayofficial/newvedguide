import { NextResponse } from "next/server";
import { fetchRazorpayOrder, verifyRazorpaySignature } from "@/lib/razorpay";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  isSupabaseTableMissingError,
  SCHEMA_NOT_READY_USER_MESSAGE,
} from "@/lib/supabase/schema-errors";
import { creditWalletTopup } from "@/lib/wallet/credit-topup";
import { razorpayWalletRechargeEnabled } from "@/lib/wallet/topup-mode";

export async function POST(request: Request) {
  if (!razorpayWalletRechargeEnabled()) {
    return NextResponse.json({ error: "Wallet recharge verify not enabled." }, { status: 403 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const b = body as {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    intentId?: string;
  };

  const razorpay_order_id = b.razorpay_order_id?.trim();
  const razorpay_payment_id = b.razorpay_payment_id?.trim();
  const razorpay_signature = b.razorpay_signature?.trim();
  const intentId = b.intentId?.trim();

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing payment verification fields." }, { status: 400 });
  }

  if (
    !verifyRazorpaySignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    })
  ) {
    return NextResponse.json({ error: "Invalid payment signature." }, { status: 400 });
  }

  const svc = createServiceClient();

  let intentQuery = svc
    .from("wallet_recharge_intents")
    .select("id, user_id, principal_paise, status, razorpay_payment_id")
    .eq("razorpay_order_id", razorpay_order_id)
    .eq("user_id", userId);

  if (intentId) {
    intentQuery = intentQuery.eq("id", intentId);
  }

  const { data: intent, error: intentErr } = await intentQuery.maybeSingle();

  if (intentErr) {
    const msg = intentErr.message ?? "";
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
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  if (!intent) {
    return NextResponse.json({ error: "Recharge session not found." }, { status: 404 });
  }

  if (intent.status === "credited") {
    const { data: prof } = await svc
      .from("user_profiles")
      .select("wallet_balance_paise")
      .eq("id", userId)
      .maybeSingle();
    return NextResponse.json({
      success: true,
      idempotent: true,
      balancePaise: prof?.wallet_balance_paise ?? 0,
    });
  }

  if (intent.status === "failed") {
    return NextResponse.json(
      { error: "This recharge failed earlier. Start a new payment from the wallet page." },
      { status: 409 }
    );
  }

  let rzOrder;
  try {
    rzOrder = await fetchRazorpayOrder(razorpay_order_id);
  } catch (e) {
    console.error("[verify-recharge] fetch order", e);
    return NextResponse.json({ error: "Could not confirm payment with Razorpay." }, { status: 502 });
  }

  if (rzOrder.amount !== intent.principal_paise) {
    return NextResponse.json({ error: "Payment amount mismatch." }, { status: 400 });
  }

  async function readBalance() {
    const { data: prof } = await svc
      .from("user_profiles")
      .select("wallet_balance_paise")
      .eq("id", userId)
      .maybeSingle();
    return prof?.wallet_balance_paise ?? 0;
  }

  const { data: existingLedger } = await svc
    .from("wallet_ledger")
    .select("id")
    .eq("user_id", userId)
    .eq("reason", "wallet_recharge")
    .filter("metadata->>razorpay_payment_id", "eq", razorpay_payment_id)
    .maybeSingle();

  if (existingLedger) {
    await svc
      .from("wallet_recharge_intents")
      .update({
        status: "credited",
        razorpay_payment_id,
        credited_at: new Date().toISOString(),
      })
      .eq("id", intent.id);
    return NextResponse.json({
      success: true,
      idempotent: true,
      balancePaise: await readBalance(),
    });
  }

  if (intent.status === "settling") {
    if (intent.razorpay_payment_id && intent.razorpay_payment_id !== razorpay_payment_id) {
      return NextResponse.json({ error: "Payment does not match this recharge." }, { status: 409 });
    }
  } else if (intent.status === "created") {
    const { data: claimed, error: claimErr } = await svc
      .from("wallet_recharge_intents")
      .update({
        status: "settling",
        razorpay_payment_id,
      })
      .eq("id", intent.id)
      .eq("user_id", userId)
      .eq("status", "created")
      .select("id")
      .maybeSingle();

    if (claimErr) {
      return NextResponse.json({ error: claimErr.message ?? "Claim failed" }, { status: 500 });
    }

    if (!claimed) {
      const { data: again } = await svc
        .from("wallet_recharge_intents")
        .select("status, razorpay_payment_id")
        .eq("id", intent.id)
        .single();

      if (again?.status === "credited") {
        return NextResponse.json({
          success: true,
          idempotent: true,
          balancePaise: await readBalance(),
        });
      }

      if (
        again?.status === "settling" &&
        again.razorpay_payment_id === razorpay_payment_id
      ) {
        // Another request claimed; continue to credit below
      } else {
        return NextResponse.json({ error: "Could not lock recharge; try again." }, { status: 409 });
      }
    }
  } else {
    return NextResponse.json({ error: "Invalid recharge state." }, { status: 409 });
  }

  const credited = await creditWalletTopup(
    svc,
    userId,
    intent.principal_paise,
    "wallet_recharge",
    {
      source: "razorpay_wallet_recharge",
      razorpay_order_id,
      razorpay_payment_id,
      intent_id: intent.id,
    }
  );

  if (!credited.ok) {
    await svc
      .from("wallet_recharge_intents")
      .update({
        status: "failed",
        last_error: credited.error,
      })
      .eq("id", intent.id);
    if (credited.code === "SCHEMA_NOT_READY") {
      return NextResponse.json(
        { code: credited.code, error: credited.error },
        { status: credited.status }
      );
    }
    return NextResponse.json({ error: credited.error }, { status: credited.status });
  }

  await svc
    .from("wallet_recharge_intents")
    .update({
      status: "credited",
      credited_at: new Date().toISOString(),
    })
    .eq("id", intent.id);

  return NextResponse.json({
    success: true,
    balancePaise: credited.data.balancePaise,
    principalPaise: credited.data.principalPaise,
    cashbackPaise: credited.data.cashbackPaise,
    cashbackPercentApplied: credited.data.cashbackPercentApplied,
  });
}
