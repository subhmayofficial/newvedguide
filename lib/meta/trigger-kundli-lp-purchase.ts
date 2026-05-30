import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  getMetaCapiConfig,
  isMetaCapiAdsPurchaseOrder,
  sendMetaPurchaseEvent,
} from "@/lib/meta/capi";
import {
  resolveMetaCapiCustomerFields,
} from "@/lib/meta/capi-customer-fields";
import { logMetaCapiDelivery } from "@/lib/meta/log-capi-delivery";
import { logEvent } from "@/lib/services/event";
import { EVENT_GROUP, PRODUCT_SLUGS } from "@/lib/constants/commerce";

export interface MetaBrowserContext {
  clientIpAddress?: string | null;
  clientUserAgent?: string | null;
  fbp?: string | null;
}

function siteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw && !raw.includes("localhost")) return raw.replace(/\/$/, "");
  return "https://vedguide.com";
}

export async function triggerMetaKundliLpPurchase(
  supabase: SupabaseClient<Database>,
  orderId: string,
  browser?: MetaBrowserContext
): Promise<void> {
  const config = getMetaCapiConfig();
  if (!config) return;

  const { data: order } = await supabase
    .from("orders")
    .select(
      `id,order_number,product_slug,total_amount,currency,source,entry_path,customer_id,lead_id,
      customers(full_name,phone,email),
      birth_details(full_name,gender,date_of_birth,birth_place,birth_city,birth_state,birth_country),
      physical_order_details(shipping_full_name,shipping_city,shipping_state,shipping_pincode,shipping_country)`
    )
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return;
  if (order.product_slug !== PRODUCT_SLUGS.PAID_KUNDLI) return;
  if (!isMetaCapiAdsPurchaseOrder(order.source, order.entry_path)) return;

  const customer = order.customers as {
    full_name?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;
  const birth = order.birth_details as {
    full_name?: string | null;
    gender?: string | null;
    date_of_birth?: string | null;
    birth_place?: string | null;
    birth_city?: string | null;
    birth_state?: string | null;
    birth_country?: string | null;
  } | null;
  const physical = order.physical_order_details as {
    shipping_full_name?: string | null;
    shipping_city?: string | null;
    shipping_state?: string | null;
    shipping_pincode?: string | null;
    shipping_country?: string | null;
  } | null;

  const customerFields = resolveMetaCapiCustomerFields({
    customerFullName: customer?.full_name,
    birthDetails: birth,
    physicalShipping: physical,
  });

  const sourcePath = order.source?.trim() || "/ads/kundli/new-checkout";

  const result = await sendMetaPurchaseEvent(config, {
    orderId: order.id,
    orderNumber: order.order_number,
    valuePaise: Number(order.total_amount),
    currency: order.currency ?? "INR",
    email: customer?.email ?? null,
    phone: customer?.phone ?? null,
    eventSourceUrl: `${siteOrigin()}${sourcePath.startsWith("/") ? sourcePath : `/${sourcePath}`}`,
    clientIpAddress: browser?.clientIpAddress ?? null,
    clientUserAgent: browser?.clientUserAgent ?? null,
    fbp: browser?.fbp ?? null,
    customer: customerFields,
  });

  await logMetaCapiDelivery(supabase, {
    orderId: order.id,
    customerId: order.customer_id,
    leadId: order.lead_id,
    triggerSource: "payment_success_auto",
    requestUrl: result.requestUrlSafe ?? "",
    requestBody: result.requestBody ?? {},
    responseStatus: result.responseStatus ?? 0,
    responseBody: result.responseBody ?? "",
    status: result.ok ? "success" : "failed",
    errorMessage: result.error ?? null,
  });

  await logEvent(supabase, {
    eventName: result.ok ? "meta_capi_purchase_sent" : "meta_capi_purchase_failed",
    eventGroup: EVENT_GROUP.COMMERCE,
    customerId: order.customer_id ?? null,
    leadId: order.lead_id ?? null,
    orderId: order.id,
    sourcePage: order.source,
    pagePath: sourcePath,
    entryPath: order.entry_path,
    metadataJson: {
      events_received: result.eventsReceived ?? null,
      test_event_code: config.testEventCode ?? null,
      response_status: result.responseStatus ?? null,
      error: result.error ?? null,
    },
  });

  if (!result.ok) {
    console.error("[meta-capi][ads]", orderId, result.error);
  }
}
