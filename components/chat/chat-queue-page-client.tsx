"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ConsultationWaitingRoom } from "@/components/chat/consultation-waiting-room";
import { formatInrFromPaise } from "@/lib/format-money";

type ChatQueuePageClientProps = {
  sessionId: string;
  astrologerName: string;
  orderCode: string | null;
  rateInrPerMin: number;
  viewerUserId: string;
  initialBalancePaise: number;
};

export function ChatQueuePageClient({
  sessionId,
  astrologerName,
  orderCode,
  rateInrPerMin,
  viewerUserId,
  initialBalancePaise,
}: ChatQueuePageClientProps) {
  const router = useRouter();
  const [balancePaise, setBalancePaise] = useState(initialBalancePaise);
  const [leaving, setLeaving] = useState(false);

  const goToChat = useCallback(() => {
    router.replace(`/astrologers/chats/${encodeURIComponent(sessionId)}`);
  }, [router, sessionId]);

  useEffect(() => {
    const supabase = createClient();
    const ch = supabase
      .channel(`queue-sess:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const row = payload.new as { status?: string };
          if (row.status === "open") goToChat();
        }
      )
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [sessionId, goToChat]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void (async () => {
        const supabase = createClient();
        const { data } = await supabase
          .from("chat_sessions")
          .select("status")
          .eq("id", sessionId)
          .maybeSingle();
        if (data?.status === "open") goToChat();
        if (data?.status === "closed") router.replace("/astrologers/chats");
      })();
    }, 2500);
    return () => window.clearInterval(id);
  }, [sessionId, goToChat, router]);

  useEffect(() => {
    const supabase = createClient();
    const ch = supabase
      .channel(`queue-wallet:${viewerUserId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_profiles",
          filter: `id=eq.${viewerUserId}`,
        },
        (payload) => {
          const row = payload.new as { wallet_balance_paise?: number };
          if (typeof row.wallet_balance_paise === "number") {
            setBalancePaise(row.wallet_balance_paise);
          }
        }
      )
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [viewerUserId]);

  async function leaveQueue() {
    if (leaving) return;
    setLeaving(true);
    try {
      const res = await fetch(
        `/api/user/chat-sessions/${encodeURIComponent(sessionId)}/close`,
        { method: "POST", credentials: "include" }
      );
      if (res.ok) router.replace("/astrologers");
    } finally {
      setLeaving(false);
    }
  }

  return (
    <div className="relative flex min-h-[calc(100vh-64px)] flex-col bg-background">
      {/* Top nav bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur-md">
        <Link
          href="/astrologers"
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Astrologers
        </Link>
        {/* Wallet chip */}
        <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs font-semibold text-foreground">
          <Wallet className="size-3.5 text-brand" />
          {formatInrFromPaise(balancePaise)}
        </div>
      </div>

      {/* Main content — centred */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          <ConsultationWaitingRoom
            astrologerName={astrologerName}
            rateInrPerMin={rateInrPerMin}
            orderCode={orderCode}
          />

          {/* Leave queue */}
          <div className="mt-6 text-center">
            <button
              type="button"
              disabled={leaving}
              onClick={() => void leaveQueue()}
              className="text-xs font-medium text-muted-foreground underline-offset-2 transition hover:text-destructive hover:underline disabled:opacity-50"
            >
              {leaving ? "Leaving…" : "Leave queue & go back"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
