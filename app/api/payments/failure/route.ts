import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { fetchRazorpayOrder, fetchRazorpayOrderPayments } from "@/lib/razorpay";
import { markPaymentFailure, markPaymentSuccess } from "@/lib/services/payment";

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
      .select("id,status,provider_order_id,provider_payment_id")
      .eq("order_id", body.orderDbId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!payment?.id) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    if (payment.status === "paid" || payment.provider_payment_id) {
      return NextResponse.json({ ok: true, skipped: true, reason: "already_paid" });
    }

    if (payment.provider_order_id) {
      try {
        const [gatewayOrder, orderPayments] = await Promise.all([
          fetchRazorpayOrder(payment.provider_order_id),
          fetchRazorpayOrderPayments(payment.provider_order_id),
        ]);
        const successfulPayment = orderPayments.find((p) =>
          p.status === "captured" || p.status === "authorized"
        );
        const isGatewayPaid = gatewayOrder.status === "paid" || gatewayOrder.amount_paid > 0;

        if (successfulPayment || isGatewayPaid) {
          await markPaymentSuccess(supabase, {
            orderId: body.orderDbId,
            paymentId: payment.id,
            providerPaymentId: successfulPayment?.id ?? payment.provider_order_id,
            providerSignature: "reconciled_via_gateway_status",
            rawResponse: {
              source: "failure_route_reconcile",
              gateway_order_status: gatewayOrder.status,
              gateway_amount_paid: gatewayOrder.amount_paid,
              gateway_payment_id: successfulPayment?.id ?? null,
            },
          });
          return NextResponse.json({ ok: true, reconciled: true });
        }
      } catch (reconcileError) {
        console.error("[payment-failure][reconcile]", reconcileError);
      }
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
