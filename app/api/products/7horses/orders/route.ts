import { NextResponse } from "next/server";
import { createRazorpayOrder } from "@/lib/razorpay";
import { createServiceClient } from "@/lib/supabase/server";
import {
  EVENT_GROUP,
  FULFILLMENT_STATUS,
  JOURNEY_STAGE,
  LEAD_STATUS,
  ORDER_STATUS,
  PAYMENT_ROW_STATUS,
  PAYMENT_STATUS_ORDER,
} from "@/lib/constants/commerce";
import { upsertCustomer } from "@/lib/services/customer";
import { getOrCreateLeadForCheckout, linkLeadToOrder } from "@/lib/services/lead";
import { createOrderItems, createOrderOnPaymentInitiation } from "@/lib/services/order";
import {
  attachRazorpayOrderToPayment,
  createPaymentAttempt,
} from "@/lib/services/payment";
import { logEvent } from "@/lib/services/event";
import { getProductBySlug } from "@/lib/services/product";
import type { Json } from "@/types/database";

const SEVEN_HORSES_SLUG_STANDARD = "seven-horses-pyrite-frame";
const SEVEN_HORSES_SLUG_SIDDH = "seven-horses-pyrite-frame-siddh";
const SEVEN_HORSES_COD_PRICE_PAISE = 99_900;       // ₹999
const SEVEN_HORSES_PREPAID_DISCOUNT_PAISE = 10_000; // ₹100 off → prepaid ₹899
const SEVEN_HORSES_SIDDH_EXTRA_PAISE = 25_100;      // +₹251

type OrderBody = {
  amountPaise: number;
  paymentMethod: "cod" | "prepaid";
  product: { siddh: boolean };
  customer: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  attribution?: {
    sourcePage?: string;
    referrer?: string;
    sessionId?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  };
};

function cleanText(value: string | undefined, max = 180): string {
  return (value ?? "").trim().replace(/\s+/g, " ").slice(0, max);
}

function cleanPhone(value: string | undefined): string {
  return (value ?? "").replace(/\D/g, "").slice(-10);
}

function requireValidBody(body: OrderBody): string | null {
  const customer = body.customer;
  const phone = cleanPhone(customer?.phone);
  const pincode = (customer?.pincode ?? "").replace(/\D/g, "");

  if (!customer || cleanText(customer.fullName, 120).length < 2) {
    return "Full name is required";
  }
  if (phone.length !== 10) return "Valid 10-digit WhatsApp number is required";
  if (cleanText(customer.address, 400).length < 5) return "Full address is required";
  if (cleanText(customer.city, 80).length < 2) return "City is required";
  if (cleanText(customer.state, 80).length < 2) return "State is required";
  if (pincode.length !== 6) return "Valid 6-digit pincode is required";
  if (body.paymentMethod !== "cod" && body.paymentMethod !== "prepaid") {
    return "Payment method must be COD or prepaid";
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as OrderBody;
    const validationError = requireValidBody(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const siddh = Boolean(body.product?.siddh);
    const paymentMethod = body.paymentMethod;
    const allowPaymentBypass = process.env.ALLOW_TEST_7HORSES_PAYMENT_BYPASS === "true";

    const supabase = createServiceClient();

    // Try to find product in DB; fall back gracefully if not configured
    const primarySlug = siddh ? SEVEN_HORSES_SLUG_SIDDH : SEVEN_HORSES_SLUG_STANDARD;
    const fallbackSlug = siddh ? SEVEN_HORSES_SLUG_STANDARD : null;

    let mainProduct = await getProductBySlug(supabase, primarySlug);
    if (!mainProduct && fallbackSlug) {
      mainProduct = await getProductBySlug(supabase, fallbackSlug);
    }

    const discountPaise = paymentMethod === "prepaid" ? SEVEN_HORSES_PREPAID_DISCOUNT_PAISE : 0;
    const siddhExtraPaise = siddh ? SEVEN_HORSES_SIDDH_EXTRA_PAISE : 0;

    // If product not in DB, validate against known prices
    let expectedTotal: number;
    let productSlugForOrder: string;
    let productNameForOrder: string;
    let productPricePaise: number;

    if (mainProduct) {
      productSlugForOrder = mainProduct.slug;
      productNameForOrder = mainProduct.name;
      productPricePaise = Number(mainProduct.price);
      expectedTotal = productPricePaise + siddhExtraPaise - discountPaise;

      if (body.amountPaise !== expectedTotal) {
        return NextResponse.json(
          { error: "Amount mismatch", expected: expectedTotal, got: body.amountPaise },
          { status: 400 }
        );
      }
    } else {
      // Product not yet in DB — validate against hardcoded known prices
      const knownCodTotal = SEVEN_HORSES_COD_PRICE_PAISE + siddhExtraPaise;
      const knownPrepaidTotal = knownCodTotal - SEVEN_HORSES_PREPAID_DISCOUNT_PAISE;
      const knownTotal = paymentMethod === "prepaid" ? knownPrepaidTotal : knownCodTotal;
      if (body.amountPaise !== knownTotal) {
        return NextResponse.json(
          { error: "Amount mismatch", expected: knownTotal, got: body.amountPaise },
          { status: 400 }
        );
      }
      productSlugForOrder = primarySlug;
      productNameForOrder = siddh
        ? "7 Horses on Frame (Siddh Energised)"
        : "7 Horses on Frame";
      productPricePaise = SEVEN_HORSES_COD_PRICE_PAISE + siddhExtraPaise;
      expectedTotal = knownTotal;
    }

    const customer = body.customer;
    const fullName = cleanText(customer.fullName, 120);
    const phone = cleanPhone(customer.phone);
    const address = cleanText(customer.address, 500);
    const city = cleanText(customer.city, 80);
    const state = cleanText(customer.state, 80);
    const pincode = customer.pincode.replace(/\D/g, "");
    const sourcePage = body.attribution?.sourcePage ?? "/checkout/7horses";
    const entryPath = "7horses";
    const utmJson: Json = {
      utm_source: body.attribution?.utmSource ?? null,
      utm_medium: body.attribution?.utmMedium ?? null,
      utm_campaign: body.attribution?.utmCampaign ?? null,
    };

    const cust = await upsertCustomer(supabase, {
      fullName,
      phone,
      whatsappNumber: phone,
      source: sourcePage,
      utmSource: body.attribution?.utmSource,
      utmMedium: body.attribution?.utmMedium,
      utmCampaign: body.attribution?.utmCampaign,
    });

    const lead = await getOrCreateLeadForCheckout(supabase, {
      customerId: cust.id,
      entryPath,
      sourcePage,
      sessionId: body.attribution?.sessionId,
      referrer: body.attribution?.referrer,
      utmJson,
      productSlug: productSlugForOrder,
    });

    const order = await createOrderOnPaymentInitiation(supabase, {
      customerId: cust.id,
      leadId: lead.id,
      birthDetailsId: null,
      productSlug: productSlugForOrder,
      entryPath,
      source: sourcePage,
      subtotalPaise: productPricePaise,
      addonPaise: 0,
      discountPaise,
    });

    const itemMetadata: Json = {
      product_family: "seven_horses_pyrite_frame",
      siddh_energisation: siddh,
      product_slug: productSlugForOrder,
    };

    await createOrderItems(supabase, order.id, [
      {
        itemType: "main",
        productSlug: productSlugForOrder,
        title: productNameForOrder,
        unitPricePaise: productPricePaise,
        metadataJson: itemMetadata,
      },
    ]);

    // physical_order_details requires variant/design/size — use neutral placeholders
    const { error: physicalError } = await supabase.from("physical_order_details").insert({
      order_id: order.id,
      product_family: "seven_horses_pyrite_frame",
      variant: siddh ? "silver" : "plated",
      variant_label: siddh ? "Siddh Energised" : "Standard",
      design: "classic",
      design_label: "7 Horses on Frame",
      size_code: "M",
      size_label: "One Size",
      siddha_energisation: siddh,
      payment_method: paymentMethod,
      prepaid_discount_amount: discountPaise,
      shipping_full_name: fullName,
      shipping_phone: phone,
      shipping_address_line1: address,
      shipping_city: city,
      shipping_state: state,
      shipping_pincode: pincode,
      shipping_country: "India",
      estimated_delivery_days: "7-10",
    });
    if (physicalError) throw physicalError;

    await linkLeadToOrder(supabase, lead.id, order.id);

    if (paymentMethod === "cod") {
      const { error: paymentError } = await supabase.from("payments").insert({
        order_id: order.id,
        provider: "cod",
        amount: expectedTotal,
        currency: "INR",
        status: PAYMENT_ROW_STATUS.PENDING,
        payment_method: "cod",
        raw_response_json: { mode: "cash_on_delivery" },
      });
      if (paymentError) throw paymentError;

      const { error: orderPatchError } = await supabase
        .from("orders")
        .update({
          status: ORDER_STATUS.PROCESSING,
          payment_status: PAYMENT_STATUS_ORDER.PENDING,
          fulfillment_status: FULFILLMENT_STATUS.QUEUED,
        })
        .eq("id", order.id);
      if (orderPatchError) throw orderPatchError;

      await logEvent(supabase, {
        eventName: "seven_horses_cod_order_created",
        eventGroup: EVENT_GROUP.COMMERCE,
        customerId: cust.id,
        leadId: lead.id,
        orderId: order.id,
        sessionId: body.attribution?.sessionId ?? null,
        sourcePage,
        pagePath: sourcePage,
        entryPath,
        metadataJson: {
          product_slug: productSlugForOrder,
          amount_paise: expectedTotal,
          payment_method: paymentMethod,
          siddh,
          ...itemMetadata,
        },
      });

      return NextResponse.json({
        success: true,
        paymentMethod,
        orderDbId: order.id,
        orderNumber: order.order_number,
        amountPaise: expectedTotal,
        currency: "INR",
      });
    }

    if (allowPaymentBypass) {
      const paidAt = new Date().toISOString();
      const { error: paymentError } = await supabase.from("payments").insert({
        order_id: order.id,
        provider: "test_bypass",
        provider_order_id: `test_${order.order_number}`,
        provider_payment_id: `test_pay_${order.id.slice(0, 8)}`,
        amount: expectedTotal,
        currency: "INR",
        status: PAYMENT_ROW_STATUS.PAID,
        payment_method: "test_bypass",
        paid_at: paidAt,
        raw_response_json: {
          bypass: true,
          reason: "ALLOW_TEST_7HORSES_PAYMENT_BYPASS=true",
        },
      });
      if (paymentError) throw paymentError;

      const { error: orderPatchError } = await supabase
        .from("orders")
        .update({
          status: ORDER_STATUS.PAID,
          payment_status: PAYMENT_STATUS_ORDER.PAID,
          fulfillment_status: FULFILLMENT_STATUS.QUEUED,
          paid_at: paidAt,
        })
        .eq("id", order.id);
      if (orderPatchError) throw orderPatchError;

      await supabase
        .from("leads")
        .update({
          status: LEAD_STATUS.CONVERTED,
          journey_stage: JOURNEY_STAGE.PAYMENT_SUCCESS,
          conversion_reason: "test_payment_bypass",
        })
        .eq("id", lead.id);

      await logEvent(supabase, {
        eventName: "seven_horses_test_payment_bypassed",
        eventGroup: EVENT_GROUP.COMMERCE,
        customerId: cust.id,
        leadId: lead.id,
        orderId: order.id,
        sessionId: body.attribution?.sessionId ?? null,
        sourcePage,
        pagePath: sourcePage,
        entryPath,
        metadataJson: {
          product_slug: productSlugForOrder,
          amount_paise: expectedTotal,
          payment_method: paymentMethod,
          discount_paise: discountPaise,
          siddh,
          ...itemMetadata,
        },
      });

      return NextResponse.json({
        success: true,
        paymentBypassed: true,
        paymentMethod,
        orderDbId: order.id,
        orderNumber: order.order_number,
        amountPaise: expectedTotal,
        currency: "INR",
      });
    }

    const payment = await createPaymentAttempt(supabase, {
      orderId: order.id,
      amountPaise: expectedTotal,
    });

    const razorpayOrder = await createRazorpayOrder({
      amount: expectedTotal,
      receipt: order.order_number.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 40),
      notes: {
        order_id: order.id,
        product: productSlugForOrder,
        phone,
        payment_method: "prepaid",
      },
    });

    await attachRazorpayOrderToPayment(supabase, {
      paymentId: payment.id,
      providerOrderId: razorpayOrder.id,
      orderId: order.id,
    });

    await logEvent(supabase, {
      eventName: "payment_initiated",
      eventGroup: EVENT_GROUP.COMMERCE,
      customerId: cust.id,
      leadId: lead.id,
      orderId: order.id,
      sessionId: body.attribution?.sessionId ?? null,
      sourcePage,
      pagePath: sourcePage,
      entryPath,
      metadataJson: {
        product_slug: productSlugForOrder,
        amount_paise: expectedTotal,
        razorpay_order_id: razorpayOrder.id,
        payment_method: paymentMethod,
        discount_paise: discountPaise,
        siddh,
        ...itemMetadata,
      },
    });

    return NextResponse.json({
      success: true,
      paymentMethod,
      razorpayOrderId: razorpayOrder.id,
      orderDbId: order.id,
      orderNumber: order.order_number,
      paymentId: payment.id,
      amountPaise: expectedTotal,
      currency: "INR",
    });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: unknown }).message)
          : JSON.stringify(err);
    console.error("[7horses-order] ERROR:", message, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
