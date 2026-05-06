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

  // Realtime: session status change
  useEffect(() => {
    const supabase = createClient();
    const ch = supabase
      .channel(`queue-sess:${sessionId}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public",
        table: "chat_sessions", filter: `id=eq.${sessionId}`,
      }, (payload) => {
        const row = payload.new as { status?: string };
        if (row.status === "open") goToChat();
      })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [sessionId, goToChat]);

  // Polling fallback every 2.5s
  useEffect(() => {
    const id = window.setInterval(() => {
      void (async () => {
        const { data } = await createClient()
          .from("chat_sessions").select("status").eq("id", sessionId).maybeSingle();
        if (data?.status === "open")   goToChat();
        if (data?.status === "closed") router.replace("/astrologers/chats");
      })();
    }, 2500);
    return () => window.clearInterval(id);
  }, [sessionId, goToChat, router]);

  // Realtime: wallet balance
  useEffect(() => {
    const supabase = createClient();
    const ch = supabase
      .channel(`queue-wallet:${viewerUserId}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public",
        table: "user_profiles", filter: `id=eq.${viewerUserId}`,
      }, (payload) => {
        const row = payload.new as { wallet_balance_paise?: number };
        if (typeof row.wallet_balance_paise === "number") setBalancePaise(row.wallet_balance_paise);
      })
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
    <div className="flex min-h-[calc(100dvh-56px)] flex-col bg-[#f5f5f5]">
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3">
        <Link
          href="/astrologers"
          className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-[13px] font-medium text-gray-600 hover:bg-gray-200 transition"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>
        {/* Wallet chip */}
        <Link
          href="/astrologers/wallet"
          className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 transition hover:bg-amber-100"
        >
          <Wallet className="size-3.5 text-amber-600" />
          <span className="text-[13px] font-bold tabular-nums text-amber-700">
            {formatInrFromPaise(balancePaise)}
          </span>
        </Link>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <ConsultationWaitingRoom
            astrologerName={astrologerName}
            rateInrPerMin={rateInrPerMin}
            orderCode={orderCode}
          />
          {/* Leave queue */}
          <div className="border-t border-gray-50 px-6 py-4 text-center">
            <button
              type="button"
              disabled={leaving}
              onClick={() => void leaveQueue()}
              className="text-[12px] font-medium text-gray-400 underline-offset-2 transition hover:text-red-500 hover:underline disabled:opacity-50"
            >
              {leaving ? "Leaving…" : "Leave queue & go back"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
