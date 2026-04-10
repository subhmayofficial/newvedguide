import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { markPaymentFailure } from "@/lib/services/payment";

interface Body {
  orderDbId: string;
  reason?: string;
}

export async function POST(request: Request) {
  try {
    const body: Body = await request.json();
    if (!body.orderDbId) {
      return NextResponse.json({ error: "orderDbId required" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data: payment } = await supabase
      .from("payments")
      .select("id")
      .eq("order_id", body.orderDbId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!payment?.id) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    await markPaymentFailure(supabase, {
      orderId: body.orderDbId,
      paymentId: payment.id,
      failureReason: body.reason ?? "user_cancelled_or_failed",
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[payment-failure]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
