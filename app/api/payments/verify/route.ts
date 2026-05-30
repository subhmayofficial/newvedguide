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
  fbp?: string;
}

function clientIpFromRequest(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;
  return request.headers.get("x-real-ip")?.trim() ?? null;
}

export async function POST(request: Request) {
  try {
    const body: VerifyBody = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderDbId,
      fbp,
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

    const ok = await verifyRazorpayPayment({
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
      .select("id,status,provider_order_id,provider_payment_id")
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

    // Guard against cross-order replay: the verified Razorpay order id must
    // match the payment attempt attached to this DB order.
    if (!payment.provider_order_id || payment.provider_order_id !== razorpay_order_id) {
      return NextResponse.json(
        { success: false, error: "Razorpay order mismatch for this order" },
        { status: 400 }
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
      metaBrowser: {
        clientIpAddress: clientIpFromRequest(request),
        clientUserAgent: request.headers.get("user-agent"),
        fbp: fbp ?? null,
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
