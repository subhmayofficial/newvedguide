import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { estimatedSecondsFromBilledPaise } from "@/lib/chat/billing";
import { aggregateLiveChatMeterForSession } from "@/lib/chat/ledger-aggregate";
import { sessionHasCloseSummaryLedger } from "@/lib/chat/legacy-meter-ledger";
import { runChatMeter } from "@/lib/chat/run-chat-meter";
import { isSupabaseUnknownColumnError } from "@/lib/supabase/schema-errors";

type Params = { params: Promise<{ sessionId: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { sessionId } = await params;
  const trimmed = sessionId?.trim();
  if (!trimmed) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: owned, error: oErr } = await supabase
    .from("chat_sessions")
    .select("id, status, astrologer_id, rate_inr_per_min")
    .eq("id", trimmed)
    .eq("user_id", user.id)
    .maybeSingle();

  if (oErr || !owned) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const svc = createServiceClient();

  if (owned.status === "open") {
    const metered = await runChatMeter(svc, trimmed, user.id);
    if (!metered.ok) {
      return NextResponse.json({ error: metered.error }, { status: metered.status });
    }
  }

  const { data: ledgerRows, error: lErr } = await svc
    .from("wallet_ledger")
    .select("delta_paise, metadata")
    .eq("user_id", user.id)
    .eq("reason", "live_chat_meter");

  if (lErr) {
    return NextResponse.json({ error: lErr.message }, { status: 500 });
  }

  const legacyAgg = aggregateLiveChatMeterForSession(ledgerRows ?? [], trimmed);

  const { data: sessAfter, error: sessErr } = await svc
    .from("chat_sessions")
    .select("total_billed_paise")
    .eq("id", trimmed)
    .eq("user_id", user.id)
    .maybeSingle();

  if (sessErr) {
    return NextResponse.json({ error: sessErr.message }, { status: 500 });
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

  let { error: uErr } = await svc
    .from("chat_sessions")
    .update(extended)
    .eq("id", trimmed)
    .eq("user_id", user.id);

  if (
    uErr &&
    (isSupabaseUnknownColumnError(uErr.message, "closed_at") ||
      isSupabaseUnknownColumnError(uErr.message, "total_billed_paise"))
  ) {
    uErr = (
      await svc
        .from("chat_sessions")
        .update(updatePayload)
        .eq("id", trimmed)
        .eq("user_id", user.id)
    ).error;
  }

  if (uErr) {
    return NextResponse.json({ error: uErr.message }, { status: 500 });
  }

  const shouldAddSummaryLedger =
    totalBilledPaise > 0 &&
    legacyAgg.totalBilledPaise === 0 &&
    sessionAccum > 0;

  if (shouldAddSummaryLedger) {
    const already = await sessionHasCloseSummaryLedger(svc, user.id, trimmed);
    if (!already) {
      const { error: sumErr } = await svc.from("wallet_ledger").insert({
        user_id: user.id,
        delta_paise: -totalBilledPaise,
        reason: "live_chat_session",
        metadata: {
          session_id: trimmed,
          rate_inr_per_min: rate,
          billed_seconds: billedSeconds,
        },
      });
      if (sumErr) {
        console.error("[chat-session/close] summary ledger:", sumErr.message);
      }
    }
  }

  const { data: fresh, error: freshErr } = await svc
    .from("chat_sessions")
    .select("order_code, total_billed_paise")
    .eq("id", trimmed)
    .maybeSingle();

  const freshColsMissing =
    !!freshErr &&
    (isSupabaseUnknownColumnError(freshErr.message, "order_code") ||
      isSupabaseUnknownColumnError(freshErr.message, "total_billed_paise"));

  if (freshErr && !freshColsMissing) {
    return NextResponse.json({ error: freshErr.message }, { status: 500 });
  }

  revalidatePath("/admindeoghar/live-consult/inbox");
  revalidatePath("/admindeoghar/live-consult/sessions");
  revalidatePath(`/admindeoghar/live-consult/sessions/${trimmed}`);
  revalidatePath("/admindeoghar/live-consult");
  revalidatePath("/astrologers/wallet");
  revalidatePath("/astrologers/chats");

  const orderCode =
    !freshColsMissing && fresh?.order_code?.trim()
      ? fresh.order_code.trim()
      : `VG-CH-${trimmed.replace(/-/g, "").slice(0, 12).toUpperCase()}`;

  return NextResponse.json({
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
  });
}
