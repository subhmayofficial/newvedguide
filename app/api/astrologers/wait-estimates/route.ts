import { NextResponse } from "next/server";
import { LIVE_CHAT_ASTROLOGERS } from "@/lib/data/live-chat-astrologers";
import { waitEstimateMinutesFromQueueDepth } from "@/lib/astrologers/wait-estimate-from-queue";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Public: live wait hints from `chat_sessions` rows in `waiting_astrologer` (per catalog id).
 * No auth — counts only; no PII returned.
 */
export async function GET() {
  const zeros = Object.fromEntries(LIVE_CHAT_ASTROLOGERS.map((a) => [a.id, 0])) as Record<string, number>;

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ estimates: zeros });
  }

  const svc = createServiceClient();
  const { data, error } = await svc
    .from("chat_sessions")
    .select("astrologer_id")
    .eq("status", "waiting_astrologer");

  if (error || !data) {
    return NextResponse.json({ estimates: zeros });
  }

  const counts = new Map<string, number>();
  for (const row of data) {
    const id = row.astrologer_id;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  const estimates: Record<string, number> = { ...zeros };
  for (const a of LIVE_CHAT_ASTROLOGERS) {
    const q = counts.get(a.id) ?? 0;
    estimates[a.id] = waitEstimateMinutesFromQueueDepth(q);
  }

  return NextResponse.json({ estimates });
}
