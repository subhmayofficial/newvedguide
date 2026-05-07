import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/admin/admin-auth";
import { resolveSessionRateInr } from "@/lib/chat/astrologer-display";
import {
  affordableChatSeconds,
  coerceWalletPaise,
  hasMinWalletForChatStart,
  remainingSecondsFromMeterAccrual,
} from "@/lib/chat/billing";
import { healChatSessionByIdIfDepleted } from "@/lib/chat/sync-open-chat-for-wallet";
import type { Database } from "@/types/database";

type ChatMessage = Database["public"]["Tables"]["chat_messages"]["Row"];

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminUser(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sessionIdParam = searchParams.get("sessionId")?.trim() ?? "";
  const orderCodeParam = searchParams.get("orderCode")?.trim() ?? "";

  const svc = createServiceClient();

  let resolvedSessionId = sessionIdParam;
  if (!resolvedSessionId && orderCodeParam) {
    let foundId: string | null = null;
    const { data: byOrder } = await svc
      .from("chat_sessions")
      .select("id")
      .ilike("order_code", orderCodeParam)
      .maybeSingle();
    if (byOrder?.id) foundId = byOrder.id;
    if (!foundId) {
      const raw = orderCodeParam.replace(/^VG-CH-/i, "").replace(/[^0-9a-f]/gi, "");
      if (raw.length >= 12) {
        const idPrefix = `${raw.slice(0, 8)}-${raw.slice(8, 12)}`;
        const { data: byUuidPrefix } = await svc
          .from("chat_sessions")
          .select("id")
          .ilike("id", `${idPrefix}%`)
          .maybeSingle();
        if (byUuidPrefix?.id) foundId = byUuidPrefix.id;
      }
    }
    if (!foundId) {
      return NextResponse.json(
        { error: "Session not found for this order code" },
        { status: 404 }
      );
    }
    resolvedSessionId = foundId;
  }

  if (!resolvedSessionId) {
    return NextResponse.json(
      { error: "sessionId or orderCode query parameter required" },
      { status: 400 }
    );
  }

  const sessionId = resolvedSessionId;

  const { data: session, error: sErr } = await svc
    .from("chat_sessions")
    .select(
      "id, user_id, astrologer_id, status, rate_inr_per_min, countdown_started_at, countdown_budget_seconds, last_billed_at, created_at"
    )
    .eq("id", sessionId)
    .maybeSingle();

  if (sErr || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const { data: messages, error: mErr } = await svc
    .from("chat_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (mErr) {
    return NextResponse.json({ error: mErr.message }, { status: 500 });
  }

  const { data: profile } = await svc
    .from("user_profiles")
    .select("wallet_balance_paise, display_name, avatar_url")
    .eq("id", session.user_id)
    .maybeSingle();

  const rateInrPerMin = resolveSessionRateInr(
    session.rate_inr_per_min,
    session.astrologer_id
  );

  let sessionOut = session;
  let balancePaise = coerceWalletPaise(profile?.wallet_balance_paise);
  let displayName = profile?.display_name;
  let avatarUrl = profile?.avatar_url;
  const meterAnchor = session.last_billed_at ?? session.created_at;
  let remainingSeconds =
    session.status === "waiting_astrologer"
      ? affordableChatSeconds(balancePaise, rateInrPerMin)
      : remainingSecondsFromMeterAccrual(balancePaise, rateInrPerMin, meterAnchor);

  /**
   * Sync close when wallet is empty or only dust (₹0 in UI), or meter shows no time left —
   * user app may not POST /meter. Also close **waiting** queue rows when user can’t meet
   * minimum wallet to start (e.g. drained to ₹0 while waiting).
   */
  const afford = affordableChatSeconds(balancePaise, rateInrPerMin);
  const shouldHealOpen =
    session.status === "open" &&
    (balancePaise <= 0 || afford <= 0 || remainingSeconds <= 0);
  const shouldHealWaiting =
    session.status === "waiting_astrologer" &&
    !hasMinWalletForChatStart(balancePaise, rateInrPerMin);

  if (shouldHealOpen || shouldHealWaiting) {
    await healChatSessionByIdIfDepleted(svc, sessionId);
    const [{ data: sessFresh }, { data: profFresh }] = await Promise.all([
      svc
        .from("chat_sessions")
        .select(
          "id, user_id, astrologer_id, status, rate_inr_per_min, countdown_started_at, countdown_budget_seconds, last_billed_at, created_at"
        )
        .eq("id", sessionId)
        .maybeSingle(),
      svc
        .from("user_profiles")
        .select("wallet_balance_paise, display_name, avatar_url")
        .eq("id", session.user_id)
        .maybeSingle(),
    ]);
    if (sessFresh) sessionOut = sessFresh;
    if (profFresh) {
      balancePaise = coerceWalletPaise(profFresh.wallet_balance_paise);
      displayName = profFresh.display_name ?? displayName;
      avatarUrl = profFresh.avatar_url ?? avatarUrl;
    }
    const anchor = sessionOut.last_billed_at ?? sessionOut.created_at;
    remainingSeconds =
      sessionOut.status === "waiting_astrologer"
        ? affordableChatSeconds(balancePaise, rateInrPerMin)
        : remainingSecondsFromMeterAccrual(balancePaise, rateInrPerMin, anchor);
  }

  return NextResponse.json({
    session: sessionOut,
    messages: messages as ChatMessage[],
    wallet: {
      balancePaise,
      displayName,
      avatarUrl,
    },
    rateInrPerMin,
    remainingSeconds,
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminUser(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sessionId =
    typeof body === "object" &&
    body !== null &&
    "sessionId" in body &&
    typeof (body as { sessionId: unknown }).sessionId === "string"
      ? (body as { sessionId: string }).sessionId.trim()
      : "";

  const text =
    typeof body === "object" &&
    body !== null &&
    "body" in body &&
    typeof (body as { body: unknown }).body === "string"
      ? (body as { body: string }).body.trim()
      : "";

  if (!sessionId || !text) {
    return NextResponse.json({ error: "sessionId and body required" }, { status: 400 });
  }

  const svc = createServiceClient();

  const { data: sessRow } = await svc
    .from("chat_sessions")
    .select("status")
    .eq("id", sessionId)
    .maybeSingle();

  if (sessRow?.status === "waiting_astrologer") {
    return NextResponse.json(
      {
        error:
          "Join the chat first (Join button in admin) — the user is still in the queue.",
      },
      { status: 409 }
    );
  }

  const { error } = await svc.from("chat_messages").insert({
    session_id: sessionId,
    sender: "astrologer",
    body: text,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
