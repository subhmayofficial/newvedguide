import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import {
  EVENT_GROUP,
  JOURNEY_STAGE,
  mapSourceToEntryPath,
  PRODUCT_SLUGS,
} from "@/lib/constants/commerce";
import { upsertCustomer } from "@/lib/services/customer";
import { saveBirthDetails } from "@/lib/services/birth-details";
import { getOrCreateLeadForCheckout, linkLeadToOrder } from "@/lib/services/lead";
import {
  createOrderItems,
  createOrderOnPaymentInitiation,
} from "@/lib/services/order";
import {
  createPaymentAttempt,
  markPaymentSuccess,
} from "@/lib/services/payment";
import { logEvent } from "@/lib/services/event";
import { getProductBySlug } from "@/lib/services/product";

export const ADMIN_TEST_ORDER_NOTE =
  "[ADMIN TEST] No Razorpay payment — created from admin panel";

export function isAdminTestOrderNotes(notes: string | null | undefined): boolean {
  return (notes ?? "").includes("[ADMIN TEST]");
}

export function isAdminTestPaymentProvider(provider: string | null | undefined): boolean {
  return provider === "admin_test";
}

export interface CreateAdminTestKundliOrderInput {
  fullName: string;
  phone: string;
  email?: string | null;
  gender: "male" | "female";
  reportLanguage: "hindi" | "english";
  dob?: string | null;
  tob?: string | null;
  pob?: string | null;
  /** Defaults to /ads/kundli/new-checkout for Meta CAPI testing */
  sourcePage?: string;
  /** Defaults to ads_kundli */
  sourceFunnel?: string;
  amountPaise?: number;
  /** When true, runs Meta CAPI Purchase (ads funnel only). */
  fireMetaCapi?: boolean;
  createdBy?: string | null;
}

export interface CreateAdminTestKundliOrderResult {
  orderId: string;
  orderNumber: string;
  amountPaise: number;
}

export async function createAdminTestKundliOrder(
  supabase: SupabaseClient<Database>,
  input: CreateAdminTestKundliOrderInput
): Promise<CreateAdminTestKundliOrderResult> {
  const product = await getProductBySlug(supabase, PRODUCT_SLUGS.PAID_KUNDLI);
  if (!product) {
    throw new Error("paid-kundli product not found in catalog");
  }

  const subtotalPaise = Number(product.price);
  const amountPaise = input.amountPaise ?? subtotalPaise;
  if (!Number.isFinite(amountPaise) || amountPaise < 100) {
    throw new Error("Amount must be at least ₹1 (100 paise)");
  }

  const sourcePage = input.sourcePage?.trim() || "/ads/kundli/new-checkout";
  const sourceFunnel = input.sourceFunnel?.trim() || "ads_kundli";
  const entryPath = mapSourceToEntryPath(sourceFunnel);
  const sessionId = `admin_test_${Date.now()}`;

  const cust = await upsertCustomer(supabase, {
    fullName: input.fullName.trim(),
    phone: input.phone.trim(),
    email: input.email?.trim() || undefined,
    source: sourcePage,
    utmSource: "admin_test",
    utmMedium: "panel",
    utmCampaign: "test_order",
  });

  const lead = await getOrCreateLeadForCheckout(supabase, {
    customerId: cust.id,
    entryPath,
    sourcePage,
    sessionId,
    referrer: "admin_panel",
    utmJson: {
      utm_source: "admin_test",
      utm_medium: "panel",
      utm_campaign: "test_order",
    } as Json,
    productSlug: PRODUCT_SLUGS.PAID_KUNDLI,
  });

  const birth = await saveBirthDetails(supabase, {
    customerId: cust.id,
    leadId: lead.id,
    fullName: input.fullName.trim(),
    gender: input.gender,
    reportLanguage: input.reportLanguage,
    dateOfBirth: input.dob ?? null,
    timeOfBirth: input.tob ?? null,
    birthPlace: input.pob ?? null,
  });

  const order = await createOrderOnPaymentInitiation(supabase, {
    customerId: cust.id,
    leadId: lead.id,
    birthDetailsId: birth.id,
    productSlug: PRODUCT_SLUGS.PAID_KUNDLI,
    entryPath,
    source: sourcePage,
    subtotalPaise,
    addonPaise: 0,
    discountPaise: Math.max(0, subtotalPaise - amountPaise),
  });

  await supabase
    .from("orders")
    .update({ notes: ADMIN_TEST_ORDER_NOTE })
    .eq("id", order.id);

  await createOrderItems(supabase, order.id, [
    {
      itemType: "main",
      productSlug: product.slug,
      title: product.name,
      unitPricePaise: subtotalPaise,
    },
  ]);

  const payment = await createPaymentAttempt(supabase, {
    orderId: order.id,
    amountPaise,
  });

  await supabase
    .from("payments")
    .update({
      provider: "admin_test",
      provider_order_id: `admin_test_${order.order_number}`,
    })
    .eq("id", payment.id);

  await linkLeadToOrder(supabase, lead.id, order.id);

  await logEvent(supabase, {
    eventName: "payment_initiated",
    eventGroup: EVENT_GROUP.COMMERCE,
    customerId: cust.id,
    leadId: lead.id,
    orderId: order.id,
    sessionId,
    sourcePage,
    pagePath: sourcePage,
    entryPath,
    metadataJson: {
      product_slug: PRODUCT_SLUGS.PAID_KUNDLI,
      amount_paise: amountPaise,
      admin_test: true,
      created_by: input.createdBy ?? null,
    },
  });

  await logEvent(supabase, {
    eventName: "order_created",
    eventGroup: EVENT_GROUP.COMMERCE,
    customerId: cust.id,
    leadId: lead.id,
    orderId: order.id,
    sessionId,
    entryPath,
    metadataJson: {
      order_number: order.order_number,
      admin_test: true,
    },
  });

  await markPaymentSuccess(supabase, {
    orderId: order.id,
    paymentId: payment.id,
    providerPaymentId: `admin_test_pay_${order.id.slice(0, 8)}`,
    providerSignature: "admin_test_order",
    rawResponse: {
      admin_test: true,
      created_by: input.createdBy ?? null,
      source_page: sourcePage,
      source_funnel: sourceFunnel,
    },
    skipMetaCapi: !input.fireMetaCapi,
  });

  await supabase
    .from("leads")
    .update({
      conversion_reason: "admin_test_order",
    })
    .eq("id", lead.id);

  return {
    orderId: order.id,
    orderNumber: order.order_number,
    amountPaise,
  };
}
