"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { addEntityNote } from "@/lib/services/notes";
import { updateLeadStatus } from "@/lib/services/lead";
import {
  updateOrderFulfillmentAssignee,
  updateOrderFulfillmentStatus,
  updateOrderStatus,
} from "@/lib/services/order";
import { createCoupon } from "@/lib/services/coupon";
import {
  ENTITY_NOTE_TYPE,
  FULFILLMENT_STATUS,
  LEAD_STATUS,
  ORDER_FULFILLMENT_ASSIGNEES,
  ORDER_STATUS,
} from "@/lib/constants/commerce";

export async function addLeadNote(leadId: string, note: string) {
  const supabase = createServiceClient();
  await addEntityNote(supabase, {
    entityType: ENTITY_NOTE_TYPE.LEAD,
    entityId: leadId,
    note,
  });
  revalidatePath(`/admindeoghar/leads/${leadId}`);
  revalidatePath("/admindeoghar/leads");
}

export async function submitLeadNoteForm(formData: FormData) {
  const leadId = String(formData.get("leadId") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!leadId || !note) return;
  await addLeadNote(leadId, note);
}

export async function submitLeadLostForm(formData: FormData) {
  const leadId = String(formData.get("leadId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!leadId || !reason) return;
  await markLeadLost(leadId, reason);
}

async function markLeadLost(leadId: string, reason: string) {
  const supabase = createServiceClient();
  await updateLeadStatus(supabase, {
    leadId,
    status: LEAD_STATUS.LOST,
    lostReason: reason,
  });
  revalidatePath(`/admindeoghar/leads/${leadId}`);
  revalidatePath("/admindeoghar/leads");
}

export async function addOrderNote(orderId: string, note: string) {
  const supabase = createServiceClient();
  await addEntityNote(supabase, {
    entityType: ENTITY_NOTE_TYPE.ORDER,
    entityId: orderId,
    note,
  });
  revalidatePath(`/admindeoghar/orders/${orderId}`);
  revalidatePath("/admindeoghar/orders");
}

export async function submitOrderNoteForm(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!orderId || !note) return;
  await addOrderNote(orderId, note);
}

export async function setOrderFulfillment(
  orderId: string,
  fulfillmentStatus: string
) {
  const supabase = createServiceClient();
  await updateOrderFulfillmentStatus(supabase, orderId, fulfillmentStatus);
  if (fulfillmentStatus === FULFILLMENT_STATUS.DELIVERED) {
    await updateOrderStatus(supabase, orderId, {
      status: ORDER_STATUS.FULFILLED,
    });
  } else if (fulfillmentStatus === FULFILLMENT_STATUS.IN_PROGRESS) {
    await updateOrderStatus(supabase, orderId, {
      status: ORDER_STATUS.PROCESSING,
    });
  }
  revalidatePath(`/admindeoghar/orders/${orderId}`);
  revalidatePath("/admindeoghar/orders");
}

export async function setOrderProcessing(orderId: string) {
  const supabase = createServiceClient();
  await updateOrderStatus(supabase, orderId, {
    status: ORDER_STATUS.PROCESSING,
  });
  revalidatePath(`/admindeoghar/orders/${orderId}`);
  revalidatePath("/admindeoghar/orders");
}

export async function submitOrderProcessingForm(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");
  if (!orderId) return;
  await setOrderProcessing(orderId);
}

export async function submitOrderFulfillmentForm(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");
  const status = String(formData.get("fulfillment") ?? "");
  if (!orderId || !status) return;
  await setOrderFulfillment(orderId, status);
}

export async function submitCouponCreateForm(formData: FormData) {
  const supabase = createServiceClient();
  const code = String(formData.get("code") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const discountType = String(formData.get("discountType") ?? "fixed");
  const discountValue = Number(formData.get("discountValue") ?? 0);
  const minOrderAmount = Number(formData.get("minOrderAmount") ?? 0);
  const maxDiscountAmountRaw = String(formData.get("maxDiscountAmount") ?? "").trim();
  const usageLimitRaw = String(formData.get("usageLimit") ?? "").trim();
  const appliesToProductSlug = String(formData.get("appliesToProductSlug") ?? "").trim();
  const validFrom = String(formData.get("validFrom") ?? "").trim();
  const validUntil = String(formData.get("validUntil") ?? "").trim();
  const isActive = String(formData.get("isActive") ?? "off") === "on";

  if (!code || !discountValue || discountValue <= 0) return;
  if (discountType !== "fixed" && discountType !== "percentage") return;

  await createCoupon(supabase, {
    code,
    description: description || null,
    discountType,
    discountValue,
    minOrderAmount,
    maxDiscountAmount: maxDiscountAmountRaw ? Number(maxDiscountAmountRaw) : null,
    usageLimit: usageLimitRaw ? Number(usageLimitRaw) : null,
    appliesToProductSlug: appliesToProductSlug || null,
    validFrom: validFrom || null,
    validUntil: validUntil || null,
    isActive,
  });

  revalidatePath("/admindeoghar/coupons");
}

const ALLOWED_FULFILLMENT = new Set<string>(Object.values(FULFILLMENT_STATUS));
const ALLOWED_ASSIGNEES = new Set<string>(ORDER_FULFILLMENT_ASSIGNEES);

export async function updateOrderFulfillmentFromList(
  orderId: string,
  fulfillmentStatus: string
) {
  if (!orderId || !ALLOWED_FULFILLMENT.has(fulfillmentStatus)) return;
  await setOrderFulfillment(orderId, fulfillmentStatus);
}

export async function updateOrderAssigneeFromList(orderId: string, assignee: string) {
  if (!orderId) return;
  const trimmed = assignee.trim();
  const value =
    trimmed === "" ? null : ALLOWED_ASSIGNEES.has(trimmed) ? trimmed : null;
  if (trimmed !== "" && value === null) return;
  const supabase = createServiceClient();
  await updateOrderFulfillmentAssignee(supabase, orderId, value);
  revalidatePath("/admindeoghar/orders");
  revalidatePath(`/admindeoghar/orders/${orderId}`);
}
