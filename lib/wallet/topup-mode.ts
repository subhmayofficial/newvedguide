import { resolveRazorpayKeyId, resolveRazorpayKeySecret } from "@/lib/razorpay-config";

/**
 * Single source of truth: when wallet UI/API uses Razorpay vs instant test credit.
 *
 * - Razorpay when all keys exist and ALLOW_TEST_WALLET_TOPUP is not "true".
 * - Test top-up only if explicitly ALLOW_TEST_WALLET_TOPUP=true, or (non-production
 *   and Razorpay keys missing) so local dev without keys still works.
 *
 * Key ID + secret come from lib/razorpay-config (supports RAZORPAY_USE_LIVE + _LIVE vars).
 */

export function razorpayKeysConfigured(): boolean {
  const keyId = resolveRazorpayKeyId() ?? "";
  const secret = resolveRazorpayKeySecret() ?? "";
  return Boolean(
    keyId &&
      secret &&
      !keyId.includes("your_razorpay") &&
      !keyId.toLowerCase().includes("placeholder")
  );
}

/** Instant /test-topup API — no payment. */
export function useTestWalletTopup(): boolean {
  if (process.env.ALLOW_TEST_WALLET_TOPUP === "true") return true;
  if (razorpayKeysConfigured()) return false;
  const prod =
    process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
  if (prod) return false;
  return true;
}

/** create-recharge-order + verify-recharge */
export function razorpayWalletRechargeEnabled(): boolean {
  return razorpayKeysConfigured() && process.env.ALLOW_TEST_WALLET_TOPUP !== "true";
}
