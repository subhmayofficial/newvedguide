/**
 * Razorpay Key ID + secret resolution.
 *
 * Test vs live is determined by the key prefix (rzp_test_ vs rzp_live_). Checkout
 * must use the **same** Key ID as the server used to create the order.
 *
 * Options:
 * 1) Put live keys in RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET (and same ID in
 *    NEXT_PUBLIC_RAZORPAY_KEY_ID for kundli/consultation client bundles).
 * 2) Keep test keys in the main vars and set RAZORPAY_USE_LIVE=true with
 *    RAZORPAY_LIVE_KEY_ID + RAZORPAY_LIVE_KEY_SECRET (live Key ID + secret).
 */

export function razorpayUseLiveAccount(): boolean {
  const v = process.env.RAZORPAY_USE_LIVE?.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

/** Key ID used for API + checkout (publishable). */
export function resolveRazorpayKeyId(): string | undefined {
  if (razorpayUseLiveAccount()) {
    const live = process.env.RAZORPAY_LIVE_KEY_ID?.trim();
    if (live) return live;
  }
  return process.env.RAZORPAY_KEY_ID?.trim();
}

export function resolveRazorpayKeySecret(): string | undefined {
  if (razorpayUseLiveAccount()) {
    const live = process.env.RAZORPAY_LIVE_KEY_SECRET?.trim();
    if (live) return live;
  }
  return process.env.RAZORPAY_KEY_SECRET?.trim();
}
