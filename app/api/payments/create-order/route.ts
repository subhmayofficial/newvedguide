import { NextResponse } from "next/server";
import { createRazorpayOrder } from "@/lib/razorpay";
import { createServiceClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type ProductType =
  Database["public"]["Tables"]["orders"]["Row"]["product_type"];

interface CreateOrderBody {
  productType: ProductType;
  productName: string;
  amountPaise: number;
  customer: {
    fullName: string;
    phone: string;
    email?: string;
    dob?: string;
    tob?: string;
    pob?: string;
    problemSummary?: string;
    preferredSlotNote?: string;
  };
  attribution: {
    sourceFunnel?: string;
    sourcePage?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    referrer?: string;
    leadId?: string;
    kundliSubmissionId?: string;
  };
}

export async function POST(request: Request) {
  try {
    const body: CreateOrderBody = await request.json();
    const { productType, productName, amountPaise, customer, attribution } =
      body;

    if (!productType || !amountPaise || !customer?.phone || !customer?.fullName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 1. Create Razorpay order
    const razorpayOrder = await createRazorpayOrder({
      amount: amountPaise,
      receipt: `vg_${Date.now()}`,
      notes: {
        product: productType,
        phone: customer.phone,
      },
    });

    // 2. Create order record in DB
    const supabase = createServiceClient();
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        product_type: productType,
        product_name: productName,
        amount_paise: amountPaise,
        full_name: customer.fullName,
        phone: customer.phone,
        email: customer.email ?? null,
        dob: customer.dob ?? null,
        tob: customer.tob ?? null,
        pob: customer.pob ?? null,
        problem_summary: customer.problemSummary ?? null,
        preferred_slot_note: customer.preferredSlotNote ?? null,
        razorpay_order_id: razorpayOrder.id,
        payment_status: "initiated",
        order_status: "pending",
        lead_id: attribution.leadId ?? null,
        kundli_submission_id: attribution.kundliSubmissionId ?? null,
        source_funnel: attribution.sourceFunnel ?? null,
        source_page: attribution.sourcePage ?? null,
        utm_source: attribution.utmSource ?? null,
        utm_medium: attribution.utmMedium ?? null,
        utm_campaign: attribution.utmCampaign ?? null,
        referrer: attribution.referrer ?? null,
      })
      .select()
      .single();

    if (error) throw error;

    // 3. Capture abandoned checkout entry
    await supabase.from("abandoned_checkouts").insert({
      order_id: order.id,
      product_type: productType,
      full_name: customer.fullName,
      phone: customer.phone,
      email: customer.email ?? null,
      source_funnel: attribution.sourceFunnel ?? null,
      source_page: attribution.sourcePage ?? null,
      utm_source: attribution.utmSource ?? null,
      utm_medium: attribution.utmMedium ?? null,
      utm_campaign: attribution.utmCampaign ?? null,
    });

    return NextResponse.json({
      razorpayOrderId: razorpayOrder.id,
      orderDbId: order.id,
      amountPaise,
      currency: "INR",
    });
  } catch (err) {
    console.error("[create-order]", err);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
