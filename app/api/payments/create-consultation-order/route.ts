import { NextResponse } from "next/server";
import { createRazorpayOrder } from "@/lib/razorpay";
import { createServiceClient } from "@/lib/supabase/server";
import { upsertCustomer } from "@/lib/services/customer";
import { getOrCreateLeadForCheckout, linkLeadToOrder } from "@/lib/services/lead";
import { saveBirthDetails } from "@/lib/services/birth-details";
import {
  createOrderOnPaymentInitiation,
  createOrderItems,
} from "@/lib/services/order";
import {
  attachRazorpayOrderToPayment,
  createPaymentAttempt,
} from "@/lib/services/payment";
import { logEvent } from "@/lib/services/event";
import { EVENT_GROUP } from "@/lib/constants/commerce";
import type { Json } from "@/types/database";

const CONSULTATION_PACKAGES = {
  "15min": { paise: 149900, title: "15 Min Consultation", slug: "consultation-15min" },
  "45min": { paise: 499900, title: "45 Min Consultation", slug: "consultation-45min" },
} as const;

type PackageId = keyof typeof CONSULTATION_PACKAGES;
const CONSULTATION_TYPES = new Set(["chat", "call", "video_call"]);

interface CreateConsultationOrderBody {
  packageId: PackageId;
  amountPaise: number;
  customer: {
    fullName: string;
    phone: string;
    consultationType?: "chat" | "call" | "video_call";
    email?: string;
    dob?: string;
    tob?: string;
    pob?: string;
    sessionNote?: string;
  };
  attribution: {
    sourceFunnel?: string;
    sourcePage?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    referrer?: string;
    sessionId?: string;
  };
}

export async function POST(request: Request) {
  try {
    const body: CreateConsultationOrderBody = await request.json();
    const { packageId, amountPaise, customer, attribution } = body;

    if (!amountPaise || !customer?.phone || !customer?.fullName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!customer.consultationType || !CONSULTATION_TYPES.has(customer.consultationType)) {
      return NextResponse.json({ error: "Invalid consultation type" }, { status: 400 });
    }

    const pkg = CONSULTATION_PACKAGES[packageId];
    if (!pkg) {
      return NextResponse.json({ error: "Invalid package" }, { status: 400 });
    }
    if (pkg.paise !== amountPaise) {
      return NextResponse.json(
        { error: "Amount mismatch", expected: pkg.paise, got: amountPaise },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const utmJson: Json = {
      utm_source: attribution?.utmSource ?? null,
      utm_medium: attribution?.utmMedium ?? null,
      utm_campaign: attribution?.utmCampaign ?? null,
    };

    const cust = await upsertCustomer(supabase, {
      fullName: customer.fullName,
      phone: customer.phone,
      email: customer.email,
      source: attribution?.sourcePage ?? "consultation-checkout",
      utmSource: attribution?.utmSource,
      utmMedium: attribution?.utmMedium,
      utmCampaign: attribution?.utmCampaign,
    });

    const lead = await getOrCreateLeadForCheckout(supabase, {
      customerId: cust.id,
      entryPath: "direct_sales",
      sourcePage: attribution?.sourcePage ?? "/checkout/consultation",
      sessionId: attribution?.sessionId,
      referrer: attribution?.referrer,
      utmJson,
      productSlug: pkg.slug,
    });

    let birthDetailsId: string | null = null;
    if (customer.dob || customer.tob || customer.pob) {
      const birth = await saveBirthDetails(supabase, {
        customerId: cust.id,
        leadId: lead.id,
        fullName: customer.fullName,
        dateOfBirth: customer.dob ?? null,
        timeOfBirth: customer.tob ?? null,
        birthPlace: customer.pob ?? null,
      });
      birthDetailsId = birth.id;
    }

    const order = await createOrderOnPaymentInitiation(supabase, {
      customerId: cust.id,
      leadId: lead.id,
      birthDetailsId,
      productSlug: pkg.slug,
      consultationType: customer.consultationType,
      sessionNote: customer.sessionNote ?? null,
      entryPath: "direct_sales",
      source: attribution?.sourcePage ?? "/checkout/consultation",
      subtotalPaise: pkg.paise,
      addonPaise: 0,
    });

    await createOrderItems(supabase, order.id, [
      {
        itemType: "main",
        productSlug: pkg.slug,
        title: pkg.title,
        unitPricePaise: pkg.paise,
        metadataJson: {
          consultation_type: customer.consultationType,
          session_note: customer.sessionNote ?? null,
        },
      },
    ]);

    const payment = await createPaymentAttempt(supabase, {
      orderId: order.id,
      amountPaise,
    });

    const razorpayOrder = await createRazorpayOrder({
      amount: amountPaise,
      receipt: order.order_number.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 40),
      notes: {
        order_id: order.id,
        product: pkg.slug,
        phone: customer.phone,
        consultation_type: customer.consultationType ?? "",
      },
    });

    await attachRazorpayOrderToPayment(supabase, {
      paymentId: payment.id,
      providerOrderId: razorpayOrder.id,
      orderId: order.id,
    });

    await linkLeadToOrder(supabase, lead.id, order.id);

    await logEvent(supabase, {
      eventName: "payment_initiated",
      eventGroup: EVENT_GROUP.COMMERCE,
      customerId: cust.id,
      leadId: lead.id,
      orderId: order.id,
      sessionId: attribution?.sessionId ?? null,
      sourcePage: attribution?.sourcePage ?? null,
      pagePath: "/checkout/consultation",
      entryPath: "direct_sales",
      utmSource: attribution?.utmSource ?? null,
      utmMedium: attribution?.utmMedium ?? null,
      utmCampaign: attribution?.utmCampaign ?? null,
      referrer: attribution?.referrer ?? null,
      metadataJson: {
        product_slug: pkg.slug,
        package_id: packageId,
        amount_paise: amountPaise,
        razorpay_order_id: razorpayOrder.id,
        dob: customer.dob ?? null,
        tob: customer.tob ?? null,
        pob: customer.pob ?? null,
        consultation_type: customer.consultationType ?? null,
        session_note: customer.sessionNote ?? null,
      },
    });

    return NextResponse.json({
      razorpayOrderId: razorpayOrder.id,
      orderDbId: order.id,
      paymentId: payment.id,
      amountPaise,
      currency: "INR",
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create order";
    console.error("[create-consultation-order]", err);
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development"
            ? message
            : "Failed to create order",
      },
      { status: 500 }
    );
  }
}
