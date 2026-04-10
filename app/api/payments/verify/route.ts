import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  markPaymentSuccess,
  verifyRazorpayPayment,
} from "@/lib/services/payment";

interface VerifyBody {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  orderDbId: string;
}

export async function POST(request: Request) {
  try {
    const body: VerifyBody = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderDbId,
    } = body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !orderDbId
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const ok = verifyRazorpayPayment({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderDbId,
    });

    if (!ok) {
      return NextResponse.json(
        { success: false, error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    const { data: payment } = await supabase
      .from("payments")
      .select("id,status,provider_payment_id")
      .eq("order_id", orderDbId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!payment?.id) {
      return NextResponse.json(
        { success: false, error: "Payment record not found" },
        { status: 404 }
      );
    }

    if (
      payment.status === "paid" &&
      payment.provider_payment_id === razorpay_payment_id
    ) {
      return NextResponse.json({ success: true, orderId: orderDbId, idempotent: true });
    }

    await markPaymentSuccess(supabase, {
      orderId: orderDbId,
      paymentId: payment.id,
      providerPaymentId: razorpay_payment_id,
      providerSignature: razorpay_signature,
      rawResponse: {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      },
    });

    return NextResponse.json({ success: true, orderId: orderDbId });
  } catch (err) {
    console.error("[verify-payment]", err);
    return NextResponse.json(
      { success: false, error: "Payment verification failed" },
      { status: 500 }
    );
  }
}
