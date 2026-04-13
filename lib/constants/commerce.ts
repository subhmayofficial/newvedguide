/** Business enums — align with DB text columns */

export const LEAD_TYPE = {
  FREE_KUNDLI: "free_kundli",
  PAYMENT_INITIATED: "payment_initiated",
  MANUAL: "manual",
} as const;

export const LEAD_STATUS = {
  NEW: "new",
  QUALIFIED: "qualified",
  CONVERTED: "converted",
  LOST: "lost",
} as const;

export const JOURNEY_STAGE = {
  LANDING_VIEWED: "landing_viewed",
  FREE_KUNDLI_STARTED: "free_kundli_started",
  FREE_KUNDLI_SUBMITTED: "free_kundli_submitted",
  FREE_KUNDLI_RESULT_VIEWED: "free_kundli_result_viewed",
  SALES_PAGE_VIEWED: "sales_page_viewed",
  CHECKOUT_VIEWED: "checkout_viewed",
  PAYMENT_INITIATED: "payment_initiated",
  PAYMENT_SUCCESS: "payment_success",
  THANK_YOU_VIEWED: "thank_you_viewed",
} as const;

export const ENTRY_PATH = {
  KFP: "kfp",
  DIRECT_SALES: "direct_sales",
  MANUAL: "manual",
} as const;

export const ORDER_STATUS = {
  PENDING_PAYMENT: "pending_payment",
  PAID: "paid",
  PROCESSING: "processing",
  FULFILLED: "fulfilled",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
} as const;

export const PAYMENT_STATUS_ORDER = {
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
  REFUNDED: "refunded",
  PARTIAL_REFUND: "partial_refund",
} as const;

export const FULFILLMENT_STATUS = {
  UNFULFILLED: "unfulfilled",
  QUEUED: "queued",
  IN_PROGRESS: "in_progress",
  DELIVERED: "delivered",
} as const;

/** Admin order list — who fulfils (stored in orders.fulfillment_assignee) */
export const ORDER_FULFILLMENT_ASSIGNEES = ["Ashu", "Roshan"] as const;
export type OrderFulfillmentAssignee = (typeof ORDER_FULFILLMENT_ASSIGNEES)[number];

export const PAYMENT_ROW_STATUS = {
  CREATED: "created",
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
  REFUNDED: "refunded",
} as const;

export const EVENT_GROUP = {
  PAGE: "page",
  FUNNEL: "funnel",
  COMMERCE: "commerce",
  SYSTEM: "system",
} as const;

export const ENTITY_NOTE_TYPE = {
  LEAD: "lead",
  ORDER: "order",
  CUSTOMER: "customer",
} as const;

export const PRODUCT_SLUGS = {
  PAID_KUNDLI: "paid-kundli",
  FAST_TRACK_ADDON: "fast-track-addon",
  CONSULTATION_15MIN: "consultation-15min",
  CONSULTATION_45MIN: "consultation-45min",
} as const;

/** Map checkout ?source= and page sources to analytics entry_path */
export function mapSourceToEntryPath(source: string | null | undefined): string {
  if (!source) return ENTRY_PATH.KFP;
  const s = source.toLowerCase();
  if (s === "kfp" || s.includes("kfp")) return ENTRY_PATH.KFP;
  if (s === "free_kundli_page" || s.includes("free_kundli")) return ENTRY_PATH.KFP;
  if (s === "direct_sales" || s === "direct_kundli") return ENTRY_PATH.DIRECT_SALES;
  return s;
}
