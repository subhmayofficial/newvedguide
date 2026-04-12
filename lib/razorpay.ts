import crypto from "crypto";

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

export interface RazorpayVerifyPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay credentials missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local and restart dev server."
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
