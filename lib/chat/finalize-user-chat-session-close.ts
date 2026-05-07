import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { revalidateAstroOpsChat } from "@/lib/admin/revalidate-astro-ops";
import type { Database } from "@/types/database";
import { estimatedSecondsFromBilledPaise } from "@/lib/chat/billing";
import { aggregateLiveChatMeterForSession } from "@/lib/chat/ledger-aggregate";
import { sessionHasCloseSummaryLedger } from "@/lib/chat/legacy-meter-ledger";
import { isSupabaseUnknownColumnError } from "@/lib/supabase/schema-errors";

export type UserChatCloseSummary = {
  orderCode: string;
  billedMinutes: number;
  billedSeconds: number;
  totalBilledPaise: number;
  astrologerId: string;
  rateInrPerMin: number | null;
};

export type OwnedChatSessionForClose = {
  astrologer_id: string;
  rate_inr_per_min: number | null;
};

/**
 * Build the same summary shape as POST /close after metering has been applied.
 * Use when the session row is already `closed` (idempotent user "end chat").
 */
export async function buildUserChatCloseSummary(
  svc: SupabaseClient<Database>,
  sessionId: string,
  userId: string,
  owned: OwnedChatSessionForClose
): Promise<
  | { ok: true; summary: UserChatCloseSummary }
  | { ok: false; error: string; status: number }
> {
  const { data: ledgerRows, error: lErr } = await svc
    .from("wallet_ledger")
    .select("delta_paise, metadata")
    .eq("user_id", userId)
    .eq("reason", "live_chat_meter");

  if (lErr) {
    return { ok: false, error: lErr.message, status: 500 };
  }

  const legacyAgg = aggregateLiveChatMeterForSession(ledgerRows ?? [], sessionId);

  const { data: sessAfter, error: sessErr } = await svc
    .from("chat_sessions")
    .select("total_billed_paise, order_code")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (sessErr) {
    return { ok: false, error: sessErr.message, status: 500 };
  }

  const sessionAccum = sessAfter?.total_billed_paise ?? 0;
  const totalBilledPaise =
    legacyAgg.totalBilledPaise > 0 ? legacyAgg.totalBilledPaise : sessionAccum;

  const rate = owned.rate_inr_per_min ?? 0;
  const billedSeconds =
    legacyAgg.totalBilledPaise > 0
      ? legacyAgg.billedSeconds
      : estimatedSecondsFromBilledPaise(totalBilledPaise, rate);

  const minutesRounded = Math.round((billedSeconds / 60) * 100) / 100;

  const { data: fresh, error: freshErr } = await svc
    .from("chat_sessions")
    .select("order_code, total_billed_paise")
    .eq("id", sessionId)
    .maybeSingle();

  const freshColsMissing =
    !!freshErr &&
    (isSupabaseUnknownColumnError(freshErr.message, "order_code") ||
      isSupabaseUnknownColumnError(freshErr.message, "total_billed_paise"));

  if (freshErr && !freshColsMissing) {
    return { ok: false, error: freshErr.message, status: 500 };
  }

  const orderCode =
    !freshColsMissing && fresh?.order_code?.trim()
      ? fresh.order_code.trim()
      : `VG-CH-${sessionId.replace(/-/g, "").slice(0, 12).toUpperCase()}`;

  return {
    ok: true,
    summary: {
      orderCode,
      billedMinutes: minutesRounded,
      billedSeconds,
      totalBilledPaise: !freshColsMissing
        ? (fresh?.total_billed_paise ?? totalBilledPaise)
        : totalBilledPaise,
      astrologerId: owned.astrologer_id,
      rateInrPerMin: owned.rate_inr_per_min,
    },
  };
}

function revalidateChatAdminPaths(sessionId: string) {
  revalidateAstroOpsChat(sessionId);
  revalidatePath("/astrologers/wallet");
  revalidatePath("/astrologers/chats");
}

/**
 * Mark session closed and reconcile ledger (after wallet metering is up to date).
 */
export async function finalizeUserChatSessionClose(
  svc: SupabaseClient<Database>,
  sessionId: string,
  userId: string,
  owned: OwnedChatSessionForClose
): Promise<
  | { ok: true; summary: UserChatCloseSummary }
  | { ok: false; error: string; status: number }
> {
  const { data: ledgerRows, error: lErr } = await svc
    .from("wallet_ledger")
    .select("delta_paise, metadata")
    .eq("user_id", userId)
    .eq("reason", "live_chat_meter");

  if (lErr) {
    return { ok: false, error: lErr.message, status: 500 };
  }

  const legacyAgg = aggregateLiveChatMeterForSession(ledgerRows ?? [], sessionId);

  const { data: sessAfter, error: sessErr } = await svc
    .from("chat_sessions")
    .select("total_billed_paise")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (sessErr) {
    return { ok: false, error: sessErr.message, status: 500 };
  }

  const sessionAccum = sessAfter?.total_billed_paise ?? 0;
  const totalBilledPaise =
    legacyAgg.totalBilledPaise > 0 ? legacyAgg.totalBilledPaise : sessionAccum;

  const rate = owned.rate_inr_per_min ?? 0;
  const billedSeconds =
    legacyAgg.totalBilledPaise > 0
      ? legacyAgg.billedSeconds
      : estimatedSecondsFromBilledPaise(totalBilledPaise, rate);

  const minutesRounded = Math.round((billedSeconds / 60) * 100) / 100;
  const closedAt = new Date().toISOString();

  const updatePayload = {
    status: "closed" as const,
    updated_at: closedAt,
  };

  const extended = {
    ...updatePayload,
    closed_at: closedAt,
    total_billed_paise: totalBilledPaise,
  };

  let updatedRow: { id: string } | null = null;

  const extRes = await svc
    .from("chat_sessions")
    .update(extended)
    .eq("id", sessionId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  let uErr = extRes.error;
  updatedRow = extRes.data ?? null;

  if (
    uErr &&
    (isSupabaseUnknownColumnError(uErr.message, "closed_at") ||
      isSupabaseUnknownColumnError(uErr.message, "total_billed_paise"))
  ) {
    const fb = await svc
      .from("chat_sessions")
      .update(updatePayload)
      .eq("id", sessionId)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();
    uErr = fb.error;
    updatedRow = fb.data ?? null;
  }

  if (uErr) {
    return { ok: false, error: uErr.message, status: 500 };
  }
  if (!updatedRow) {
    return {
      ok: false,
      error: "Session could not be closed (not found or wrong user).",
      status: 409,
    };
  }

  const shouldAddSummaryLedger =
    totalBilledPaise > 0 &&
    legacyAgg.totalBilledPaise === 0 &&
    sessionAccum > 0;

  if (shouldAddSummaryLedger) {
    const already = await sessionHasCloseSummaryLedger(svc, userId, sessionId);
    if (!already) {
      const { error: sumErr } = await svc.from("wallet_ledger").insert({
        user_id: userId,
        delta_paise: -totalBilledPaise,
        reason: "live_chat_session",
        metadata: {
          session_id: sessionId,
          rate_inr_per_min: rate,
          billed_seconds: billedSeconds,
        },
      });
      if (sumErr) {
        console.error("[finalize-chat-close] summary ledger:", sumErr.message);
      }
    }
  }

  const { data: fresh, error: freshErr } = await svc
    .from("chat_sessions")
    .select("order_code, total_billed_paise")
    .eq("id", sessionId)
    .maybeSingle();

  const freshColsMissing =
    !!freshErr &&
    (isSupabaseUnknownColumnError(freshErr.message, "order_code") ||
      isSupabaseUnknownColumnError(freshErr.message, "total_billed_paise"));

  if (freshErr && !freshColsMissing) {
    return { ok: false, error: freshErr.message, status: 500 };
  }

  revalidateChatAdminPaths(sessionId);

  const orderCode =
    !freshColsMissing && fresh?.order_code?.trim()
      ? fresh.order_code.trim()
      : `VG-CH-${sessionId.replace(/-/g, "").slice(0, 12).toUpperCase()}`;

  return {
    ok: true,
    summary: {
      orderCode,
      billedMinutes: minutesRounded,
      billedSeconds,
      totalBilledPaise: !freshColsMissing
        ? (fresh?.total_billed_paise ?? totalBilledPaise)
        : totalBilledPaise,
      astrologerId: owned.astrologer_id,
      rateInrPerMin: owned.rate_inr_per_min,
    },
  };
}
