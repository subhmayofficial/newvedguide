import { createHmac, randomInt, timingSafeEqual } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getDeliveryIntegrationsConfig } from "@/lib/services/integration-config";
import { sendInteraktWhatsApp } from "@/lib/services/integration-delivery";
import {
  normalizeIndianMobileInput,
  syntheticEmailFromPhoneDigits10,
} from "@/lib/auth/phone-login-identity";

const OTP_TTL_MS = 10 * 60 * 1000;
const MIN_RESEND_SECONDS = 60;
const MAX_SENDS_PER_HOUR = 8;
const MAX_VERIFY_ATTEMPTS = 5;
const DERIVED_PW_BYTES = 32;

function debugOtp(msg: string, extra?: Record<string, unknown>) {
  if (process.env.DEBUG_PHONE_OTP === "true") {
    console.info("[phone-otp]", msg, extra ?? "");
  }
}

function isMissingSupabaseTableError(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false;
  if (err.code === "PGRST205") return true;
  const m = err.message ?? "";
  return m.includes("schema cache") || m.includes("Could not find the table");
}

const DB_OTP_MIGRATION_HINT =
  "Apply supabase/migrations/034_phone_otp_whatsapp.sql (phone_otp_send_log + phone_otp_challenges) and reload the API.";

export function requirePhoneOtpPepper(): string | null {
  const pepper = process.env.PHONE_OTP_PEPPER?.trim();
  return pepper || null;
}

function requirePhoneOtpSessionSecret(): string {
  const explicit = process.env.PHONE_OTP_SESSION_SECRET?.trim();
  if (explicit) return explicit;
  const pepper = requirePhoneOtpPepper();
  if (pepper) return `${pepper}:session`;
  throw new Error("PHONE_OTP_SESSION_SECRET or PHONE_OTP_PEPPER must be set for phone login.");
}

export function hashOtpCode(phoneE164: string, code: string, pepper: string): string {
  return createHmac("sha256", pepper)
    .update(`${phoneE164}:${code}`)
    .digest("hex");
}

export function deriveSupabasePasswordForPhone(phoneE164: string): string {
  const secret = requirePhoneOtpSessionSecret();
  const raw = createHmac("sha256", secret)
    .update(`vedguide_phone_otp_pw:${phoneE164}`)
    .digest();
  return raw.subarray(0, DERIVED_PW_BYTES).toString("base64url");
}

export function generateSixDigitOtp(): string {
  return String(randomInt(100_000, 1_000_000));
}

function codesEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export async function sendPhoneOtpWhatsApp(input: {
  supabase: SupabaseClient<Database>;
  rawPhone: string;
  consent: boolean;
}): Promise<
  | { ok: true }
  | {
      ok: false;
      status: number;
      error: string;
      hint?: string;
      retryAfterSeconds?: number;
    }
> {
  if (!input.consent) {
    return {
      ok: false,
      status: 400,
      error: "Please agree to receive the login code on WhatsApp.",
    };
  }

  const pepper = requirePhoneOtpPepper();
  if (!pepper) {
    return {
      ok: false,
      status: 503,
      error: "Phone login is not configured.",
      hint: "Set PHONE_OTP_PEPPER on the server.",
    };
  }

  const normalized = normalizeIndianMobileInput(input.rawPhone);
  if (!normalized.ok) {
    return { ok: false, status: 400, error: normalized.error };
  }

  const { e164: phoneE164, digits10 } = normalized;
  const cfg = getDeliveryIntegrationsConfig();
  if (!cfg.interakt.enabled || !cfg.interakt.apiKey) {
    return {
      ok: false,
      status: 503,
      error: "WhatsApp login is not available.",
      hint: "Enable Interakt (INTERAKT_API_KEY) for OTP delivery.",
    };
  }

  const admin = input.supabase;

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: recentSends, error: countErr } = await admin
    .from("phone_otp_send_log")
    .select("id", { count: "exact", head: true })
    .eq("phone_e164", phoneE164)
    .gte("created_at", hourAgo);

  if (countErr) {
    debugOtp("send_log count error", { countErr });
    return {
      ok: false,
      status: 500,
      error: isMissingSupabaseTableError(countErr)
        ? "Phone login database tables are missing."
        : "Could not verify send limits. Try again shortly.",
      hint: isMissingSupabaseTableError(countErr) ? DB_OTP_MIGRATION_HINT : undefined,
    };
  }

  if ((recentSends ?? 0) >= MAX_SENDS_PER_HOUR) {
    return {
      ok: false,
      status: 429,
      error: "Too many code requests. Try again in about an hour.",
      retryAfterSeconds: 3600,
    };
  }

  const { data: lastSendRows, error: lastErr } = await admin
    .from("phone_otp_send_log")
    .select("created_at")
    .eq("phone_e164", phoneE164)
    .order("created_at", { ascending: false })
    .limit(1);

  if (lastErr) {
    debugOtp("last send error", { lastErr });
    return {
      ok: false,
      status: 500,
      error: isMissingSupabaseTableError(lastErr)
        ? "Phone login database tables are missing."
        : "Could not check recent sends. Try again.",
      hint: isMissingSupabaseTableError(lastErr) ? DB_OTP_MIGRATION_HINT : undefined,
    };
  }

  const lastAt = lastSendRows?.[0]?.created_at
    ? new Date(lastSendRows[0].created_at).getTime()
    : 0;
  const waitMs = MIN_RESEND_SECONDS * 1000 - (Date.now() - lastAt);
  if (lastAt > 0 && waitMs > 0) {
    return {
      ok: false,
      status: 429,
      error: "Please wait before requesting another code.",
      retryAfterSeconds: Math.ceil(waitMs / 1000),
    };
  }

  const code = generateSixDigitOtp();
  const codeHash = hashOtpCode(phoneE164, code, pepper);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

  const templateName = cfg.interakt.otpLoginTemplateName;
  const languageCode = cfg.interakt.otpLoginLanguage;
  const bodyValues = cfg.interakt.otpLoginBodyValues?.length
    ? cfg.interakt.otpLoginBodyValues.map((slot) =>
        slot === "{{otp}}" ? code : slot === "{{brand}}" ? "VedGuide" : slot
      )
    : [code];

  // Meta Authentication templates: Interakt requires the *same OTP* in bodyValues and buttonValues
  // (copy-code / one-tap). A website URL in the button causes WhatsApp error 100.
  let buttonValues: Record<string, string[]> | undefined;
  if (!cfg.interakt.otpLoginNoButton) {
    const idx = cfg.interakt.otpLoginButtonIndex || "0";
    if (cfg.interakt.otpLoginUrlButton) {
      const btnUrl = cfg.interakt.otpLoginButtonLink?.trim();
      if (!btnUrl) {
        return {
          ok: false,
          status: 503,
          error: "WhatsApp login template is set to use a URL button but no URL is configured.",
          hint:
            "Set INTERAKT_OTP_LOGIN_BUTTON_LINK or NEXT_PUBLIC_SITE_URL, or turn off INTERAKT_OTP_LOGIN_URL_BUTTON for standard auth (OTP in button).",
        };
      }
      buttonValues = { [idx]: [btnUrl] };
    } else {
      buttonValues = { [idx]: [code] };
    }
  }

  const delivery = await sendInteraktWhatsApp(admin, {
    eventName: "phone_otp_login",
    triggerSource: "auth_phone_otp_send",
    phone: digits10,
    templateName,
    languageCode,
    bodyValues,
    buttonValues,
  });

  if (!delivery.ok) {
    debugOtp("interakt failed", {
      message: delivery.message,
      status: delivery.responseStatus,
    });
    return {
      ok: false,
      status: 502,
      error: "Could not send WhatsApp code.",
      hint: delivery.message,
    };
  }

  await admin.from("phone_otp_challenges").delete().eq("phone_e164", phoneE164);

  const { error: insertChallengeErr } = await admin.from("phone_otp_challenges").insert({
    phone_e164: phoneE164,
    code_hash: codeHash,
    expires_at: expiresAt,
    attempt_count: 0,
  });

  if (insertChallengeErr) {
    debugOtp("challenge insert error", { insertChallengeErr });
    return {
      ok: false,
      status: 500,
      error: isMissingSupabaseTableError(insertChallengeErr)
        ? "Phone login database tables are missing."
        : "Code was sent but could not be saved. Request a new code.",
      hint: isMissingSupabaseTableError(insertChallengeErr)
        ? DB_OTP_MIGRATION_HINT
        : undefined,
    };
  }

  const { error: logErr } = await admin.from("phone_otp_send_log").insert({
    phone_e164: phoneE164,
  });

  if (logErr) {
    debugOtp("send_log insert error", { logErr });
    if (isMissingSupabaseTableError(logErr)) {
      return {
        ok: false,
        status: 500,
        error: "Phone login database tables are missing.",
        hint: DB_OTP_MIGRATION_HINT,
      };
    }
  }

  return { ok: true };
}

export async function verifyPhoneOtpAndEnsureAuthUser(input: {
  supabaseAdmin: SupabaseClient<Database>;
  rawPhone: string;
  code: string;
  displayName?: string | null;
}): Promise<
  | {
      ok: true;
      email: string;
      phoneE164: string;
      userId: string;
      password: string;
    }
  | { ok: false; status: number; error: string }
> {
  const pepper = requirePhoneOtpPepper();
  if (!pepper) {
    return { ok: false, status: 503, error: "Phone login is not configured." };
  }

  const normalized = normalizeIndianMobileInput(input.rawPhone);
  if (!normalized.ok) {
    return { ok: false, status: 400, error: normalized.error };
  }

  const { e164: phoneE164, digits10 } = normalized;
  const email = syntheticEmailFromPhoneDigits10(digits10);
  const code = input.code.replace(/\D/g, "");
  if (code.length !== 6) {
    return { ok: false, status: 400, error: "Enter the 6-digit code." };
  }

  const admin = input.supabaseAdmin;

  const { data: row, error: fetchErr } = await admin
    .from("phone_otp_challenges")
    .select("id, code_hash, expires_at, attempt_count")
    .eq("phone_e164", phoneE164)
    .maybeSingle();

  if (fetchErr || !row) {
    return {
      ok: false,
      status: 400,
      error: "No active code for this number. Request a new code.",
    };
  }

  if (new Date(row.expires_at).getTime() < Date.now()) {
    await admin.from("phone_otp_challenges").delete().eq("phone_e164", phoneE164);
    return {
      ok: false,
      status: 400,
      error: "That code has expired. Request a new one.",
    };
  }

  if (row.attempt_count >= MAX_VERIFY_ATTEMPTS) {
    await admin.from("phone_otp_challenges").delete().eq("phone_e164", phoneE164);
    return {
      ok: false,
      status: 429,
      error: "Too many incorrect attempts. Request a new code.",
    };
  }

  const expectedHash = hashOtpCode(phoneE164, code, pepper);
  if (!codesEqual(expectedHash, row.code_hash)) {
    await admin
      .from("phone_otp_challenges")
      .update({ attempt_count: row.attempt_count + 1 })
      .eq("phone_e164", phoneE164);
    return { ok: false, status: 400, error: "Incorrect code. Try again." };
  }

  await admin.from("phone_otp_challenges").delete().eq("phone_e164", phoneE164);

  const password = deriveSupabasePasswordForPhone(phoneE164);
  const dn = input.displayName?.trim() || null;

  const { data: existingId, error: rpcErr } = await admin.rpc(
    "auth_user_id_for_phone_otp",
    { p_email: email, p_phone: phoneE164 }
  );

  if (rpcErr) {
    debugOtp("rpc auth_user_id_for_phone_otp error", { rpcErr });
    return {
      ok: false,
      status: 500,
      error: "Could not complete sign-in. Try again.",
    };
  }

  let userId = existingId as string | null;

  if (!userId) {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: dn ?? undefined,
        full_name: dn ?? undefined,
        auth_phone: phoneE164,
        phone_otp_user: true,
      },
    });

    if (createErr) {
      const msg = createErr.message?.toLowerCase?.() ?? "";
      if (
        msg.includes("already been registered") ||
        msg.includes("already exists") ||
        msg.includes("duplicate")
      ) {
        const { data: retryId, error: retryRpcErr } = await admin.rpc(
          "auth_user_id_for_phone_otp",
          { p_email: email, p_phone: phoneE164 }
        );
        if (retryRpcErr || !retryId) {
          return {
            ok: false,
            status: 500,
            error: "Could not sign you in. Try again.",
          };
        }
        userId = retryId as string;
      } else {
        debugOtp("createUser error", { createErr });
        return {
          ok: false,
          status: 500,
          error: "Could not create your account. Try again.",
        };
      }
    } else if (created?.user?.id) {
      userId = created.user.id;
    }
  }

  if (!userId) {
    return { ok: false, status: 500, error: "Could not sign you in. Try again." };
  }

  const meta: Record<string, unknown> = {
    auth_phone: phoneE164,
    phone_otp_user: true,
  };
  if (dn) {
    meta.display_name = dn;
    meta.full_name = dn;
  }

  const { error: updErr } = await admin.auth.admin.updateUserById(userId, {
    password,
    user_metadata: meta,
  });

  if (updErr) {
    debugOtp("updateUser error", { updErr });
    return {
      ok: false,
      status: 500,
      error: "Could not update your sign-in. Try again.",
    };
  }

  if (dn) {
    const now = new Date().toISOString();
    await admin.from("user_profiles").upsert(
      {
        id: userId,
        display_name: dn,
        updated_at: now,
      },
      { onConflict: "id" }
    );
  }

  return { ok: true, email, phoneE164, userId, password };
}
