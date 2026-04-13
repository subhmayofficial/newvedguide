import { NextResponse } from "next/server";
import { createRazorpayOrder } from "@/lib/razorpay";
import { createServiceClient } from "@/lib/supabase/server";
import { mapSourceToEntryPath, PRODUCT_SLUGS } from "@/lib/constants/commerce";
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
import { getProductBySlug } from "@/lib/services/product";
import { validateCouponForAmount } from "@/lib/services/coupon";
import type { Json } from "@/types/database";

interface CreateOrderBody {
  productSlug?: string;
  addOnSlugs?: string[];
  couponCode?: string;
  amountPaise: number;
  customer: {
    fullName: string;
    phone: string;
    email?: string;
    gender?: string;
    reportLanguage?: string;
    dob?: string;
    tob?: string;
    pob?: string;
  };
  attribution: {
    sourceFunnel?: string;
    sourcePage?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    referrer?: string;
    sessionId?: string;
    kundliSubmissionId?: string;
  };
}

export async function POST(request: Request) {
  try {
    const body: CreateOrderBody = await request.json();
    const { amountPaise, customer, attribution, addOnSlugs = [] } = body;

    const productSlug = body.productSlug ?? PRODUCT_SLUGS.PAID_KUNDLI;

    if (!amountPaise || !customer?.phone || !customer?.fullName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const genderNorm = customer.gender?.toLowerCase().trim();
    if (genderNorm !== "male" && genderNorm !== "female") {
      return NextResponse.json({ error: "Gender is required" }, { status: 400 });
    }

    const reportLangNorm = customer.reportLanguage?.toLowerCase().trim();
    if (reportLangNorm !== "hindi" && reportLangNorm !== "english") {
      return NextResponse.json(
        { error: "Report language must be Hindi or English" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    const mainProduct = await getProductBySlug(supabase, productSlug);
    if (!mainProduct) {
      return NextResponse.json({ error: "Unknown product" }, { status: 400 });
    }

    const subtotal = Number(mainProduct.price);
    const items: {
      itemType: "main" | "addon";
      productSlug: string;
      title: string;
      unitPricePaise: number;
    }[] = [
      {
        itemType: "main",
        productSlug: mainProduct.slug,
        title: mainProduct.name,
        unitPricePaise: subtotal,
      },
    ];

    let addonTotal = 0;
    for (const slug of addOnSlugs) {
      const addon = await getProductBySlug(supabase, slug);
      if (!addon || addon.type !== "addon") continue;
      addonTotal += Number(addon.price);
      items.push({
        itemType: "addon",
        productSlug: addon.slug,
        title: addon.name,
        unitPricePaise: Number(addon.price),
      });
    }

    const baseTotal = subtotal + addonTotal;
    const rawCouponCode = body.couponCode?.trim();
    let discountPaise = 0;
    let couponId: string | null = null;
    let couponCode: string | null = null;

    if (rawCouponCode) {
      try {
        const couponResult = await validateCouponForAmount(supabase, {
          code: rawCouponCode,
          orderAmountPaise: baseTotal,
          productSlug,
        });
        discountPaise = couponResult.discountPaise;
        couponId = couponResult.coupon.id;
        couponCode = couponResult.coupon.code;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Invalid coupon code.";
        return NextResponse.json({ error: message }, { status: 400 });
      }
    }

    const expectedTotal = baseTotal - discountPaise;
    if (expectedTotal !== amountPaise) {
      return NextResponse.json(
        { error: "Amount mismatch", expected: expectedTotal, got: amountPaise },
        { status: 400 }
      );
    }

    const entryPath = mapSourceToEntryPath(attribution.sourceFunnel);
    const utmJson: Json = {
      utm_source: attribution.utmSource ?? null,
      utm_medium: attribution.utmMedium ?? null,
      utm_campaign: attribution.utmCampaign ?? null,
    };

    const cust = await upsertCustomer(supabase, {
      fullName: customer.fullName,
      phone: customer.phone,
      email: customer.email,
      source: attribution.sourcePage ?? "checkout",
      utmSource: attribution.utmSource,
      utmMedium: attribution.utmMedium,
      utmCampaign: attribution.utmCampaign,
    });

    const lead = await getOrCreateLeadForCheckout(supabase, {
      customerId: cust.id,
      entryPath,
      sourcePage: attribution.sourcePage ?? "/checkout/kundli",
      sessionId: attribution.sessionId,
      referrer: attribution.referrer,
      utmJson,
      productSlug,
    });

    const birth = await saveBirthDetails(supabase, {
      customerId: cust.id,
      leadId: lead.id,
      fullName: customer.fullName,
      gender: genderNorm,
      reportLanguage: reportLangNorm,
      dateOfBirth: customer.dob ?? null,
      timeOfBirth: customer.tob ?? null,
      birthPlace: customer.pob ?? null,
    });

    const order = await createOrderOnPaymentInitiation(supabase, {
      customerId: cust.id,
      leadId: lead.id,
      birthDetailsId: birth.id,
      productSlug,
      entryPath,
      source: attribution.sourcePage ?? undefined,
      subtotalPaise: subtotal,
      addonPaise: addonTotal,
      discountPaise,
      couponId,
      couponCode,
      couponApplied: Boolean(couponId),
    });

    await createOrderItems(supabase, order.id, items);

    const payment = await createPaymentAttempt(supabase, {
      orderId: order.id,
      amountPaise,
    });

    const razorpayOrder = await createRazorpayOrder({
      amount: amountPaise,
      receipt: order.order_number.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 40),
      notes: {
        order_id: order.id,
        product: productSlug,
        phone: customer.phone,
        ...(couponCode ? { coupon_code: couponCode } : {}),
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
      sessionId: attribution.sessionId ?? null,
      sourcePage: attribution.sourcePage ?? null,
      pagePath: attribution.sourcePage ?? "/checkout/kundli",
      entryPath,
      utmSource: attribution.utmSource ?? null,
      utmMedium: attribution.utmMedium ?? null,
      utmCampaign: attribution.utmCampaign ?? null,
      referrer: attribution.referrer ?? null,
      metadataJson: {
        product_slug: productSlug,
        amount_paise: amountPaise,
        razorpay_order_id: razorpayOrder.id,
        discount_paise: discountPaise,
        coupon_code: couponCode,
      },
    });

    await logEvent(supabase, {
      eventName: "order_created",
      eventGroup: EVENT_GROUP.COMMERCE,
      customerId: cust.id,
      leadId: lead.id,
      orderId: order.id,
      sessionId: attribution.sessionId ?? null,
      entryPath,
      metadataJson: { order_number: order.order_number },
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
    console.error("[create-order]", err);
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
