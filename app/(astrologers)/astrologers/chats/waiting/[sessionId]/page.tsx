import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getAstrologerDisplay,
  resolveSessionRateInr,
} from "@/lib/chat/astrologer-display";
import { ChatQueuePageClient } from "@/components/chat/chat-queue-page-client";

type Props = { params: Promise<{ sessionId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sessionId } = await params;
  return {
    title: "In queue",
    description: `Waiting for astrologer · ${sessionId.slice(0, 8)}…`,
  };
}

export default async function ChatWaitingQueuePage({ params }: Props) {
  const { sessionId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: session } = await supabase
    .from("chat_sessions")
    .select(
      "id, user_id, astrologer_id, status, order_code, rate_inr_per_min"
    )
    .eq("id", sessionId)
    .maybeSingle();

  if (!session || session.user_id !== user.id) {
    notFound();
  }

  if (session.status === "open") {
    redirect(`/astrologers/chats/${session.id}`);
  }

  if (session.status === "closed") {
    redirect("/astrologers/chats");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("wallet_balance_paise")
    .eq("id", user.id)
    .maybeSingle();

  const base = getAstrologerDisplay(session.astrologer_id);
  const rateInrPerMin = resolveSessionRateInr(
    session.rate_inr_per_min,
    session.astrologer_id
  );

  return (
    <ChatQueuePageClient
      sessionId={session.id}
      astrologerName={base.name}
      orderCode={session.order_code}
      rateInrPerMin={rateInrPerMin}
      viewerUserId={user.id}
      initialBalancePaise={profile?.wallet_balance_paise ?? 0}
    />
  );
}
