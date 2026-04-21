import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { sendInteraktWhatsApp } from "@/lib/services/integration-delivery";
import { getOrderDeliverySettings } from "@/lib/admin/order-delivery-settings";
import { isValidHttpUrl } from "@/lib/services/integration-config";
import {
  completePaidKundliDeliveryFromAdminSend,
} from "@/lib/services/order";

type OrderRow = {
  id: string;
  order_number: string;
  product_slug: string;
  payment_status: string;
  customer_id: string;
  lead_id: string | null;
  customers: { phone: string | null; full_name: string | null } | null;
};

type DueScheduleRow = {
  id: string;
  delivery_scheduled_at: string;
  delivery_schedule_customer_name: string | null;
  delivery_schedule_report_url: string | null;
};

export async function executePaidKundliInteraktDelivery(
  supabase: SupabaseClient<Database>,
  input: {
    orderId: string;
    customerName: string;
    reportUrl: string;
    createdBy: string | null;
    /** When set, Interakt trigger is attributed to this source instead of the admin button. */
    triggerSource?: string;
  }
): Promise<{ ok: boolean; message: string }> {
  const { orderId, customerName, reportUrl, createdBy, triggerSource } = input;
  const { data: row, error } = await supabase
    .from("orders")
    .select(
      "id,order_number,product_slug,payment_status,customer_id,lead_id,customers(phone,full_name)"
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error || !row) {
    return { ok: false, message: "Order not found" };
  }

  const order = row as unknown as OrderRow;

  if (order.product_slug !== "paid-kundli") {
    return { ok: false, message: "Delivery WhatsApp is only for paid Kundli orders" };
  }
  if (order.payment_status !== "paid") {
    return { ok: false, message: "Order must be paid before sending delivery WhatsApp" };
  }

  const phone = order.customers?.phone ?? null;
  const digits = phone?.replace(/\D/g, "") ?? "";
  if (!digits || digits.length < 10 || !phone) {
    return { ok: false, message: "Customer phone is missing or invalid" };
  }

  if (!isValidHttpUrl(reportUrl)) {
    return { ok: false, message: "Report URL must be a valid http(s) link" };
  }

  const settings = await getOrderDeliverySettings(supabase);
  const btnIdx = settings.interakt_button_index.trim() || "0";
  const buttonValues: Record<string, string[]> = { [btnIdx]: [reportUrl] };

  const result = await sendInteraktWhatsApp(supabase, {
    eventName: "order_report_delivery",
    triggerSource: triggerSource ?? "admin_order_deliver_button",
    orderId: order.id,
    leadId: order.lead_id,
    customerId: order.customer_id,
    fullName: customerName,
    phone,
    templateName: settings.interakt_template_name,
    languageCode: settings.interakt_template_language,
    bodyValues: [customerName],
    buttonValues,
    callbackData: order.order_number,
    metadata: {
      order_number: order.order_number,
      report_url: reportUrl,
    },
    createdBy,
  });

  return {
    ok: result.ok,
    message: result.message,
  };
}

/**
 * Sends Interakt for each paid-kundli order whose schedule time has passed.
 * Call from a secured cron route.
 */
export async function processDueScheduledPaidKundliDeliveries(
  supabase: SupabaseClient<Database>,
  opts: { createdBy: string | null }
): Promise<{ attempted: number; sent: number; failures: string[] }> {
  const nowIso = new Date().toISOString();
  const { data: due, error } = await supabase
    .from("orders")
    .select(
      "id,delivery_scheduled_at,delivery_schedule_customer_name,delivery_schedule_report_url"
    )
    .eq("product_slug", "paid-kundli")
    .eq("payment_status", "paid")
    .neq("fulfillment_status", "delivered")
    .not("delivery_scheduled_at", "is", null)
    .lte("delivery_scheduled_at", nowIso)
    .limit(30);

  if (error) {
    return { attempted: 0, sent: 0, failures: [error.message] };
  }

  const rows = (due ?? []) as DueScheduleRow[];
  const failures: string[] = [];
  let sent = 0;

  for (const r of rows) {
    const name = r.delivery_schedule_customer_name?.trim() ?? "";
    const url = r.delivery_schedule_report_url?.trim() ?? "";
    if (!name || !url) {
      failures.push(`${r.id}: missing scheduled name or report URL`);
      continue;
    }

    const result = await executePaidKundliInteraktDelivery(supabase, {
      orderId: r.id,
      customerName: name,
      reportUrl: url,
      createdBy: opts.createdBy,
      triggerSource: "scheduled_kundli_delivery_cron",
    });

    if (result.ok) {
      await completePaidKundliDeliveryFromAdminSend(supabase, r.id);
      sent += 1;
    } else {
      failures.push(`${r.id}: ${result.message}`);
    }
  }

  return { attempted: rows.length, sent, failures };
}
