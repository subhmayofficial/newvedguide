import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import {
  EVENT_GROUP,
  JOURNEY_STAGE,
  LEAD_STATUS,
  ORDER_STATUS,
  PAYMENT_ROW_STATUS,
  PAYMENT_STATUS_ORDER,
} from "@/lib/constants/commerce";
import { logEvent } from "@/lib/services/event";
import { updateOrderStatus } from "@/lib/services/order";

export interface CreatePaymentAttemptInput {
  orderId: string;
  amountPaise: number;
  currency?: string;
}

export async function createPaymentAttempt(
  supabase: SupabaseClient<Database>,
  input: CreatePaymentAttemptInput
): Promise<Database["public"]["Tables"]["payments"]["Row"]> {
  const row: Database["public"]["Tables"]["payments"]["Insert"] = {
    order_id: input.orderId,
    amount: input.amountPaise,
    currency: input.currency ?? "INR",
    status: PAYMENT_ROW_STATUS.CREATED,
    provider: "razorpay",
  };
  const { data, error } = await supabase.from("payments").insert(row).select().single();
  if (error) throw error;
  return data;
}

export async function attachRazorpayOrderToPayment(
  supabase: SupabaseClient<Database>,
  input: {
    paymentId: string;
    providerOrderId: string;
    orderId: string;
  }
): Promise<void> {
  await supabase
    .from("payments")
    .update({
      provider_order_id: input.providerOrderId,
      status: PAYMENT_ROW_STATUS.PENDING,
    })
    .eq("id", input.paymentId);

  await supabase
    .from("orders")
    .update({ razorpay_order_id: input.providerOrderId })
    .eq("id", input.orderId);
}

export interface VerifyRazorpayPaymentInput {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  orderDbId: string;
}

export async function verifyRazorpayPayment(
  input: VerifyRazorpayPaymentInput
): Promise<boolean> {
  return verifyRazorpaySignature({
    razorpay_order_id: input.razorpay_order_id,
    razorpay_payment_id: input.razorpay_payment_id,
    razorpay_signature: input.razorpay_signature,
  });
}

export async function markPaymentSuccess(
  supabase: SupabaseClient<Database>,
  input: {
    orderId: string;
    paymentId: string;
    providerPaymentId: string;
    providerSignature: string;
    rawResponse?: Json;
  }
): Promise<void> {
  const paidAt = new Date().toISOString();

  const { data: pay } = await supabase
    .from("payments")
    .select("id,status,provider_payment_id")
    .eq("id", input.paymentId)
    .single();

  if (pay?.status === PAYMENT_ROW_STATUS.PAID && pay.provider_payment_id) {
    return;
  }

  await supabase
    .from("payments")
    .update({
      status: PAYMENT_ROW_STATUS.PAID,
      provider_payment_id: input.providerPaymentId,
      provider_signature: input.providerSignature,
      paid_at: paidAt,
      raw_response_json: input.rawResponse ?? null,
    })
    .eq("id", input.paymentId);

  await supabase
    .from("orders")
    .update({
      status: ORDER_STATUS.PAID,
      payment_status: PAYMENT_STATUS_ORDER.PAID,
      paid_at: paidAt,
    })
    .eq("id", input.orderId);

  const { data: order } = await supabase
    .from("orders")
    .select("lead_id,customer_id")
    .eq("id", input.orderId)
    .single();

  if (order?.lead_id) {
    await supabase
      .from("leads")
      .update({
        status: LEAD_STATUS.CONVERTED,
        journey_stage: JOURNEY_STAGE.PAYMENT_SUCCESS,
        conversion_reason: "successful_payment",
      })
      .eq("id", order.lead_id);
  }

  await logEvent(supabase, {
    eventName: "payment_success",
    eventGroup: EVENT_GROUP.COMMERCE,
    customerId: order?.customer_id ?? null,
    leadId: order?.lead_id ?? null,
    orderId: input.orderId,
    metadataJson: { provider_payment_id: input.providerPaymentId },
  });
}

export async function markPaymentFailure(
  supabase: SupabaseClient<Database>,
  input: {
    orderId: string;
    paymentId: string;
    failureReason?: string | null;
    rawResponse?: Json;
  }
): Promise<void> {
  await supabase
    .from("payments")
    .update({
      status: PAYMENT_ROW_STATUS.FAILED,
      failure_reason: input.failureReason ?? null,
      raw_response_json: input.rawResponse ?? null,
    })
    .eq("id", input.paymentId);

  await updateOrderStatus(supabase, input.orderId, {
    status: ORDER_STATUS.PENDING_PAYMENT,
    payment_status: PAYMENT_STATUS_ORDER.FAILED,
  });

  const { data: order } = await supabase
    .from("orders")
    .select("customer_id,lead_id")
    .eq("id", input.orderId)
    .single();

  await logEvent(supabase, {
    eventName: "payment_failed",
    eventGroup: EVENT_GROUP.COMMERCE,
    customerId: order?.customer_id ?? null,
    leadId: order?.lead_id ?? null,
    orderId: input.orderId,
    metadataJson: { reason: input.failureReason ?? null },
  });
}
