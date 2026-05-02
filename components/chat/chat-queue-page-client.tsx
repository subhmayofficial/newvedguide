"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Loader2, PhoneOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ConsultationWaitingRoom } from "@/components/chat/consultation-waiting-room";
import { Button } from "@/components/ui/button";
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
    return () => {
      void supabase.removeChannel(ch);
    };
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
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [viewerUserId]);

  async function leaveQueue() {
    if (leaving) return;
    setLeaving(true);
    try {
      const res = await fetch(
        `/api/user/chat-sessions/${encodeURIComponent(sessionId)}/close`,
        { method: "POST", credentials: "include" }
      );
      if (res.ok) router.replace("/astrologers/chats");
    } finally {
      setLeaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-3 py-6 sm:max-w-xl sm:px-4">
      <Link
        href="/astrologers"
        className="text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        ← Astrologers
      </Link>
      <div className="mt-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card/80 px-3 py-2 text-xs text-muted-foreground">
          <span>
            Balance {formatInrFromPaise(balancePaise)} · ₹{rateInrPerMin}/min after connect
          </span>
          <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            In queue
          </span>
        </div>

        <ConsultationWaitingRoom astrologerName={astrologerName} orderCode={orderCode} />

        <p className="text-center text-[13px] text-muted-foreground">
          When an astrologer joins, you’ll be moved into the chat automatically.
        </p>

        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            disabled={leaving}
            onClick={() => void leaveQueue()}
          >
            {leaving ? (
              <Loader2 className="mr-1 size-3.5 animate-spin" />
            ) : (
              <PhoneOff className="mr-1 size-3.5" />
            )}
            Leave queue
          </Button>
        </div>
      </div>
    </div>
  );
}
