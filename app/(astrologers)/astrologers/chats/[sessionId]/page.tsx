import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getAstrologerDisplay,
  resolveSessionRateInr,
} from "@/lib/chat/astrologer-display";
import { displayNameInitials } from "@/lib/chat/display-initials";
import { LiveChatPanelSkeleton } from "@/components/chat/live-chat-panel-skeleton";

const LiveChatPanel = dynamic(
  () =>
    import("@/components/chat/live-chat-panel").then((m) => m.LiveChatPanel),
  { loading: () => <LiveChatPanelSkeleton /> }
);

type Props = { params: Promise<{ sessionId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sessionId } = await params;
  return {
    title: "Chat",
    description: `VedGuide chat ${sessionId.slice(0, 8)}…`,
  };
}

export default async function AstrologerChatSessionPage({ params }: Props) {
  const { sessionId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data: session }, { data: profile }] = await Promise.all([
    supabase
      .from("chat_sessions")
      .select(
        "id, astrologer_id, user_id, rate_inr_per_min, status, created_at, last_billed_at, countdown_started_at, countdown_budget_seconds"
      )
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("user_profiles")
      .select("display_name, avatar_url, wallet_balance_paise")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  if (!session) {
    notFound();
  }

  if (session.status === "waiting_astrologer") {
    redirect(`/astrologers/chats/waiting/${session.id}`);
  }

  const base = getAstrologerDisplay(session.astrologer_id);
  const astrologer = {
    ...base,
    rateInrPerMin: resolveSessionRateInr(
      session.rate_inr_per_min,
      session.astrologer_id
    ),
  };

  const customerName =
    profile?.display_name?.trim() ||
    user.email?.split("@")[0] ||
    "You";

  return (
    <LiveChatPanel
      mode="user"
      sessionId={session.id}
      astrologer={astrologer}
      customerName={customerName}
      customerAvatarUrl={profile?.avatar_url}
      customerInitials={displayNameInitials(
        profile?.display_name,
        user.id
      )}
      initialBalancePaise={profile?.wallet_balance_paise ?? 0}
      meterAnchorIso={session.last_billed_at ?? session.created_at}
      initialSessionStatus={session.status}
      viewerUserId={user.id}
    />
  );
}
