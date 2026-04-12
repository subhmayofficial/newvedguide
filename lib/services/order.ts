import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  FULFILLMENT_STATUS,
  ORDER_STATUS,
  PAYMENT_STATUS_ORDER,
} from "@/lib/constants/commerce";

export function generateOrderNumber(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `VG-${y}${m}${day}-${rand}`;
}

export interface CreateOrderOnPaymentInitiationInput {
  customerId: string;
  leadId: string | null;
  birthDetailsId: string | null;
  productSlug: string;
  consultationType?: "chat" | "call" | "video_call" | null;
  sessionNote?: string | null;
  entryPath?: string | null;
  source?: string | null;
  subtotalPaise: number;
  addonPaise: number;
  discountPaise?: number;
  couponId?: string | null;
  couponCode?: string | null;
  couponApplied?: boolean;
  currency?: string;
}

export async function createOrderOnPaymentInitiation(
  supabase: SupabaseClient<Database>,
  input: CreateOrderOnPaymentInitiationInput
): Promise<Database["public"]["Tables"]["orders"]["Row"]> {
  const discount = input.discountPaise ?? 0;
  const total = input.subtotalPaise + input.addonPaise - discount;
  const orderNumber = generateOrderNumber();
  const row: Database["public"]["Tables"]["orders"]["Insert"] = {
    order_number: orderNumber,
    customer_id: input.customerId,
    lead_id: input.leadId,
    birth_details_id: input.birthDetailsId,
    product_slug: input.productSlug,
    source: input.source ?? null,
    entry_path: input.entryPath ?? null,
    status: ORDER_STATUS.PENDING_PAYMENT,
    payment_status: PAYMENT_STATUS_ORDER.PENDING,
    fulfillment_status: FULFILLMENT_STATUS.UNFULFILLED,
    consultation_type: input.consultationType ?? null,
    session_note: input.sessionNote ?? null,
    subtotal_amount: input.subtotalPaise,
    addon_amount: input.addonPaise,
    discount_amount: discount,
    coupon_id: input.couponId ?? null,
    coupon_code: input.couponCode ?? null,
    coupon_applied: input.couponApplied ?? false,
    total_amount: total,
    currency: input.currency ?? "INR",
    payment_initiated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from("orders").insert(row).select().single();
  if (error) throw error;
  return data;
}

export interface OrderItemInput {
  itemType: "main" | "addon";
  productSlug: string;
  title: string;
  unitPricePaise: number;
  quantity?: number;
  metadataJson?: Database["public"]["Tables"]["order_items"]["Insert"]["metadata_json"];
}

export async function createOrderItems(
  supabase: SupabaseClient<Database>,
  orderId: string,
  items: OrderItemInput[]
): Promise<void> {
  const rows: Database["public"]["Tables"]["order_items"]["Insert"][] = items.map(
    (it) => {
      const qty = it.quantity ?? 1;
      const total = Number(it.unitPricePaise) * qty;
      return {
        order_id: orderId,
        item_type: it.itemType,
        product_slug: it.productSlug,
        title: it.title,
        unit_price: it.unitPricePaise,
        quantity: qty,
        total_price: total,
        metadata_json: it.metadataJson ?? null,
      };
    }
  );
  const { error } = await supabase.from("order_items").insert(rows);
  if (error) throw error;
}

export async function updateOrderStatus(
  supabase: SupabaseClient<Database>,
  orderId: string,
  patch: Partial<{
    status: string;
    payment_status: string;
    fulfillment_status: string;
    paid_at: string | null;
    razorpay_order_id: string | null;
  }>
): Promise<void> {
  await supabase.from("orders").update(patch).eq("id", orderId);
}

export async function updateOrderFulfillmentStatus(
  supabase: SupabaseClient<Database>,
  orderId: string,
  fulfillmentStatus: string
): Promise<void> {
  await supabase
    .from("orders")
    .update({ fulfillment_status: fulfillmentStatus })
    .eq("id", orderId);
}

export async function updateOrderFulfillmentAssignee(
  supabase: SupabaseClient<Database>,
  orderId: string,
  assignee: string | null
): Promise<void> {
  await supabase
    .from("orders")
    .update({ fulfillment_assignee: assignee })
    .eq("id", orderId);
}
