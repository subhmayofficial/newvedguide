import crypto from "crypto";
import { resolveRazorpayKeyId, resolveRazorpayKeySecret } from "@/lib/razorpay-config";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface RazorpayOrderPayload {
  amount: number;        // in paise
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  created_at: number;
}

export interface RazorpayOrderPayment {
  id: string;
  entity: "payment";
  status: string;
  amount: number;
  order_id: string;
  method?: string;
  email?: string;
  contact?: string;
  created_at?: number;
}

export interface RazorpayVerifyPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

function getRazorpayCredentials() {
  const keyId = resolveRazorpayKeyId();
  const keySecret = resolveRazorpayKeySecret();

  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay credentials missing. Set RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET, or RAZORPAY_USE_LIVE=true with RAZORPAY_LIVE_KEY_ID + RAZORPAY_LIVE_KEY_SECRET."
    );
  }

  return { keyId, keySecret };
}

// ─── Order Creation ───────────────────────────────────────────────────────────

export async function createRazorpayOrder(
  payload: RazorpayOrderPayload
): Promise<RazorpayOrder> {
  const { keyId, keySecret } = getRazorpayCredentials();

  const body = {
    amount: payload.amount,
    currency: payload.currency ?? "INR",
    receipt: payload.receipt ?? `vg_${Date.now()}`,
    notes: payload.notes ?? {},
  };

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `Razorpay order creation failed: ${JSON.stringify(error)}`
    );
  }

  return response.json();
}

export async function fetchRazorpayOrder(orderId: string): Promise<RazorpayOrder> {
  const { keyId, keySecret } = getRazorpayCredentials();
  const response = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
    method: "GET",
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Razorpay order fetch failed: ${JSON.stringify(error)}`);
  }

  return response.json();
}

export async function fetchRazorpayOrderPayments(
  orderId: string
): Promise<RazorpayOrderPayment[]> {
  const { keyId, keySecret } = getRazorpayCredentials();
  const response = await fetch(`https://api.razorpay.com/v1/orders/${orderId}/payments`, {
    method: "GET",
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Razorpay order payments fetch failed: ${JSON.stringify(error)}`);
  }

  const payload = (await response.json()) as { items?: RazorpayOrderPayment[] };
  return payload.items ?? [];
}

// ─── Signature Verification ──────────────────────────────────────────────────

export function verifyRazorpaySignature(
  payload: RazorpayVerifyPayload
): boolean {
  const { keySecret } = getRazorpayCredentials();
  const body = `${payload.razorpay_order_id}|${payload.razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(body)
    .digest("hex");

  return expectedSignature === payload.razorpay_signature;
}
