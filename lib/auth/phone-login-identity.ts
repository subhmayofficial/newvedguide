/** Synthetic Supabase Auth email for phone OTP users (no Supabase SMS provider). */
export const PHONE_OTP_EMAIL_DOMAIN = "otp.vedguide.local";

const INDIAN_MOBILE = /^[6-9]\d{9}$/;

export type NormalizedIndianMobile =
  | { ok: true; digits10: string; e164: string }
  | { ok: false; error: string };

/**
 * Accepts 10-digit Indian mobile or +91 / 91 prefix; returns E.164 without + in digits for storage we use +91...
 */
export function normalizeIndianMobileInput(raw: string): NormalizedIndianMobile {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) {
    return { ok: false, error: "Enter your mobile number." };
  }
  const digits = trimmed.replace(/\D/g, "");
  let ten: string;
  if (digits.length === 10) {
    ten = digits;
  } else if (digits.length === 12 && digits.startsWith("91")) {
    ten = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    ten = digits.slice(1);
  } else {
    return {
      ok: false,
      error: "Use a valid 10-digit Indian mobile number.",
    };
  }
  if (!INDIAN_MOBILE.test(ten)) {
    return {
      ok: false,
      error: "Use a valid 10-digit Indian mobile number.",
    };
  }
  return { ok: true, digits10: ten, e164: `+91${ten}` };
}

export function syntheticEmailFromPhoneDigits10(digits10: string): string {
  return `m${digits10}@${PHONE_OTP_EMAIL_DOMAIN}`;
}

/** True when this is the internal Supabase email bridge for phone OTP users. */
export function isPhoneOtpSyntheticEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase().endsWith(`@${PHONE_OTP_EMAIL_DOMAIN}`);
}
