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
import {
  KADA_DESIGN_LABELS,
  KADA_PREPAID_DISCOUNT_PAISE,
  KADA_PRODUCT_SLUGS,
  KADA_SIZE_LABELS,
  KADA_VARIANTS,
  parseKadaDesign,
  parseKadaSize,
  parseKadaVariant,
  type KadaPaymentMethod,
} from "@/lib/products/kada";
import type { Database, Json } from "@/types/database";

type KadaOrderBody = {
  amountPaise: number;
  paymentMethod: KadaPaymentMethod;
  product: {
    variant?: string;
    design?: string;
    size?: string;
    siddha?: boolean;
  };
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

function requireValidBody(body: KadaOrderBody) {
  const customer = body.customer;
  const phone = cleanPhone(customer?.phone);
  const pincode = (customer?.pincode ?? "").replace(/\D/g, "");
  const design = body.product?.design;
  const size = body.product?.size;

  if (!customer || cleanText(customer.fullName, 120).length < 2) {
    return "Full name is required";
  }
  if (design !== "classic" && design !== "traditional" && design !== "ornate") {
    return "Please select a Kada design";
  }
  if (size !== "S" && size !== "M" && size !== "L" && size !== "XL") {
    return "Please select a Kada size";
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
    const body = (await request.json()) as KadaOrderBody;
    const validationError = requireValidBody(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const variant = parseKadaVariant(body.product?.variant);
    const design = parseKadaDesign(body.product?.design);
    const size = parseKadaSize(body.product?.size);
    const siddha = Boolean(body.product?.siddha);
    const paymentMethod = body.paymentMethod;
    const allowPaymentBypass = process.env.ALLOW_TEST_KADA_PAYMENT_BYPASS === "true";

    const supabase = createServiceClient();
    const variantConfig = KADA_VARIANTS[variant];
    const mainProduct = await getProductBySlug(supabase, variantConfig.productSlug);
    if (!mainProduct) {
      return NextResponse.json(
        { error: `Product ${variantConfig.productSlug} is not configured in DB` },
        { status: 400 }
      );
    }

    const addonProduct = siddha
      ? await getProductBySlug(supabase, KADA_PRODUCT_SLUGS.SIDDHA_ADDON)
      : null;
    if (siddha && !addonProduct) {
      return NextResponse.json(
        { error: `Product ${KADA_PRODUCT_SLUGS.SIDDHA_ADDON} is not configured in DB` },
        { status: 400 }
      );
    }

    const addonPaise = siddha && addonProduct ? Number(addonProduct.price) : 0;
    const discountPaise = paymentMethod === "prepaid" ? KADA_PREPAID_DISCOUNT_PAISE : 0;
    const expectedTotal = Number(mainProduct.price) + addonPaise - discountPaise;

    if (body.amountPaise !== expectedTotal) {
      return NextResponse.json(
        { error: "Amount mismatch", expected: expectedTotal, got: body.amountPaise },
        { status: 400 }
      );
    }

    const customer = body.customer;
    const fullName = cleanText(customer.fullName, 120);
    const phone = cleanPhone(customer.phone);
    const address = cleanText(customer.address, 500);
    const city = cleanText(customer.city, 80);
    const state = cleanText(customer.state, 80);
    const pincode = customer.pincode.replace(/\D/g, "");
    const sourcePage = body.attribution?.sourcePage ?? "/checkout/kada";
    const entryPath = "kada";
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
      productSlug: mainProduct.slug,
    });

    const order = await createOrderOnPaymentInitiation(supabase, {
      customerId: cust.id,
      leadId: lead.id,
      birthDetailsId: null,
      productSlug: mainProduct.slug,
      entryPath,
      source: sourcePage,
      subtotalPaise: Number(mainProduct.price),
      addonPaise,
      discountPaise,
    });

    const itemMetadata: Json = {
      product_family: "vedic_kada",
      variant,
      variant_label: variantConfig.label,
      design,
      design_label: KADA_DESIGN_LABELS[design],
      size_code: size,
      size_label: KADA_SIZE_LABELS[size],
      siddha_energisation: siddha,
    };

    await createOrderItems(supabase, order.id, [
      {
        itemType: "main",
        productSlug: mainProduct.slug,
        title: mainProduct.name,
        unitPricePaise: Number(mainProduct.price),
        metadataJson: itemMetadata,
      },
      ...(siddha && addonProduct
        ? [
            {
              itemType: "addon" as const,
              productSlug: addonProduct.slug,
              title: addonProduct.name,
              unitPricePaise: Number(addonProduct.price),
              metadataJson: itemMetadata,
            },
          ]
        : []),
    ]);

    const physicalRow: Database["public"]["Tables"]["physical_order_details"]["Insert"] = {
      order_id: order.id,
      variant,
      variant_label: variantConfig.label,
      design,
      design_label: KADA_DESIGN_LABELS[design],
      size_code: size,
      size_label: KADA_SIZE_LABELS[size],
      siddha_energisation: siddha,
      payment_method: paymentMethod,
      prepaid_discount_amount: discountPaise,
      shipping_full_name: fullName,
      shipping_phone: phone,
      shipping_address_line1: address,
      shipping_city: city,
      shipping_state: state,
      shipping_pincode: pincode,
      shipping_country: "India",
      estimated_delivery_days: "15-20",
    };
    const { error: physicalError } = await supabase
      .from("physical_order_details")
      .insert(physicalRow);
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
        eventName: "kada_cod_order_created",
        eventGroup: EVENT_GROUP.COMMERCE,
        customerId: cust.id,
        leadId: lead.id,
        orderId: order.id,
        sessionId: body.attribution?.sessionId ?? null,
        sourcePage,
        pagePath: sourcePage,
        entryPath,
        metadataJson: {
          product_slug: mainProduct.slug,
          amount_paise: expectedTotal,
          payment_method: paymentMethod,
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
          reason: "ALLOW_TEST_KADA_PAYMENT_BYPASS=true",
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
        eventName: "kada_test_payment_bypassed",
        eventGroup: EVENT_GROUP.COMMERCE,
        customerId: cust.id,
        leadId: lead.id,
        orderId: order.id,
        sessionId: body.attribution?.sessionId ?? null,
        sourcePage,
        pagePath: sourcePage,
        entryPath,
        metadataJson: {
          product_slug: mainProduct.slug,
          amount_paise: expectedTotal,
          payment_method: paymentMethod,
          discount_paise: discountPaise,
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
        product: mainProduct.slug,
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
        product_slug: mainProduct.slug,
        amount_paise: expectedTotal,
        razorpay_order_id: razorpayOrder.id,
        payment_method: paymentMethod,
        discount_paise: discountPaise,
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
    const message = err instanceof Error ? err.message : "Failed to create Kada order";
    console.error("[kada-order]", err);
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

