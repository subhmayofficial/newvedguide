import { NextResponse } from "next/server";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { createServiceClient } from "@/lib/supabase/server";

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

    // 1. Verify Razorpay signature
    const isValid = verifyRazorpaySignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // 2. Update order to paid
    const { data: order, error } = await supabase
      .from("orders")
      .update({
        razorpay_payment_id,
        razorpay_signature,
        payment_verified: true,
        payment_status: "paid",
        order_status: "pending",
      })
      .eq("id", orderDbId)
      .select()
      .single();

    if (error) throw error;

    // 3. If consultation, create consultation record
    if (
      order.product_type === "consultation_15" ||
      order.product_type === "consultation_full"
    ) {
      await supabase.from("consultations").insert({
        order_id: order.id,
        consultation_type:
          order.product_type === "consultation_15" ? "15min" : "full",
        problem_summary: order.problem_summary ?? null,
        preferred_slot_raw: order.preferred_slot_note ?? null,
        status: "pending_contact",
      });
    }

    return NextResponse.json({ success: true, orderId: order.id });
  } catch (err) {
    console.error("[verify-payment]", err);
    return NextResponse.json(
      { success: false, error: "Payment verification failed" },
      { status: 500 }
    );
  }
}
