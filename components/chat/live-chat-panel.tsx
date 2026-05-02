"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Clock, Loader2, PhoneOff, Radio, Send, Wallet, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { AstrologerDisplay } from "@/lib/chat/astrologer-display";
import {
  affordableChatSeconds,
  formatCountdownMmSs,
  remainingSecondsFromMeterAccrual,
} from "@/lib/chat/billing";
import { formatInrFromPaise, formatInrFromPaisePrecise } from "@/lib/format-money";
import { ChatAvatar } from "@/components/chat/chat-avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Database } from "@/types/database";

type ChatMessage = Database["public"]["Tables"]["chat_messages"]["Row"];

type SessionCloseSummary = {
  orderCode: string;
  billedMinutes: number;
  billedSeconds: number;
  totalBilledPaise: number;
  rateInrPerMin: number | null;
};

function mergeMessagesById(prev: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  if (incoming.length === 0) return prev;
  const map = new Map<string, ChatMessage>();
  for (const m of prev) map.set(m.id, m);
  for (const m of incoming) map.set(m.id, m);
  return [...map.values()].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

type LiveChatPanelProps = {
  mode: "user" | "admin";
  sessionId: string;
  astrologer: AstrologerDisplay;
  customerName: string;
  customerAvatarUrl?: string | null;
  customerInitials: string;
  customerGradient?: string;
  initialBalancePaise: number;
  /** `last_billed_at ?? created_at` — same anchor user & admin use for time-left. */
  meterAnchorIso: string;
  initialSessionStatus?: string;
  /** User mode: Supabase auth user id (wallet realtime). */
  viewerUserId?: string;
};

function timeLabel(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function LiveChatPanel({
  mode,
  sessionId,
  astrologer,
  customerName,
  customerAvatarUrl,
  customerInitials,
  customerGradient = "from-sky-600 to-indigo-900",
  initialBalancePaise,
  meterAnchorIso,
  initialSessionStatus = "open",
  viewerUserId,
}: LiveChatPanelProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [ending, setEnding] = useState(false);
  const [closeSummary, setCloseSummary] = useState<SessionCloseSummary | null>(null);
  const [startingConsult, setStartingConsult] = useState(false);
  const [body, setBody] = useState("");
  const [balancePaise, setBalancePaise] = useState(initialBalancePaise);
  const [rateInrPerMin, setRateInrPerMin] = useState(() => astrologer.rateInrPerMin);
  const [meterAnchor, setMeterAnchor] = useState(() =>
    initialSessionStatus === "waiting_astrologer" ? "" : meterAnchorIso
  );
  const [sessionStatus, setSessionStatus] = useState(initialSessionStatus);
  const [secondsLeft, setSecondsLeft] = useState(() =>
    initialSessionStatus === "waiting_astrologer"
      ? 0
      : remainingSecondsFromMeterAccrual(
          initialBalancePaise,
          astrologer.rateInrPerMin,
          meterAnchorIso
        )
  );

  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const messageCountRef = useRef(0);
  const [liveStatus, setLiveStatus] = useState<"connecting" | "live" | "polling">(
    () => (mode === "user" ? "connecting" : "polling")
  );

  useEffect(() => {
    setSessionStatus(initialSessionStatus);
    if (initialSessionStatus === "waiting_astrologer") {
      setMeterAnchor("");
      setSecondsLeft(0);
    } else {
      setMeterAnchor(meterAnchorIso);
      setSecondsLeft(
        remainingSecondsFromMeterAccrual(
          initialBalancePaise,
          astrologer.rateInrPerMin,
          meterAnchorIso
        )
      );
    }
  }, [
    sessionId,
    meterAnchorIso,
    initialSessionStatus,
    initialBalancePaise,
    astrologer.rateInrPerMin,
  ]);

  useEffect(() => {
    setBalancePaise(initialBalancePaise);
  }, [sessionId, initialBalancePaise]);

  useEffect(() => {
    setRateInrPerMin(astrologer.rateInrPerMin);
  }, [sessionId, astrologer.rateInrPerMin]);

  useEffect(() => {
    if (
      sessionStatus === "waiting_astrologer" ||
      sessionStatus === "closed" ||
      !meterAnchor
    ) {
      if (sessionStatus === "waiting_astrologer") setSecondsLeft(0);
      return;
    }
    const tick = () => {
      setSecondsLeft(
        remainingSecondsFromMeterAccrual(
          balancePaise,
          rateInrPerMin,
          meterAnchor,
          Date.now()
        )
      );
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [meterAnchor, balancePaise, rateInrPerMin, sessionStatus]);

  const runMeter = useCallback(async () => {
    const res = await fetch(
      `/api/user/chat-sessions/${encodeURIComponent(sessionId)}/meter`,
      { method: "POST", credentials: "include" }
    );
    if (!res.ok) return;
    const j = (await res.json()) as {
      balancePaise?: number;
      last_billed_at?: string;
      remainingSeconds?: number;
      error?: string;
    };
    if (typeof j.balancePaise === "number") setBalancePaise(j.balancePaise);
    if (typeof j.last_billed_at === "string") setMeterAnchor(j.last_billed_at);
    if (typeof j.remainingSeconds === "number") setSecondsLeft(j.remainingSeconds);
  }, [sessionId]);

  useEffect(() => {
    if (mode !== "user" || sessionStatus !== "open") return;
    void runMeter();
  }, [mode, sessionId, runMeter, sessionStatus]);

  useEffect(() => {
    if (mode !== "user" || sessionStatus !== "waiting_astrologer") return;
    router.replace(`/astrologers/chats/waiting/${encodeURIComponent(sessionId)}`);
  }, [mode, sessionStatus, sessionId, router]);

  const refreshBalanceUser = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase
      .from("user_profiles")
      .select("wallet_balance_paise")
      .eq("id", user.id)
      .maybeSingle();
    const b = data?.wallet_balance_paise ?? 0;
    setBalancePaise(b);
    return b;
  }, []);

  const refreshAdminBundle = useCallback(async () => {
    const res = await fetch(
      `/api/admin/live-consult/chat?sessionId=${encodeURIComponent(sessionId)}`,
      { credentials: "include" }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      messages?: ChatMessage[];
      session?: {
        status?: string;
        last_billed_at?: string | null;
        created_at?: string;
      };
      wallet?: { balancePaise?: number };
      rateInrPerMin?: number;
    };
    if (json.messages) {
      setMessages((prev) => mergeMessagesById(prev, json.messages!));
    }
    if (json.session?.status) setSessionStatus(json.session.status);
    if (json.session?.status === "waiting_astrologer") {
      setMeterAnchor("");
      setSecondsLeft(0);
    } else {
      const anchor =
        json.session?.last_billed_at && json.session.last_billed_at.trim() !== ""
          ? json.session.last_billed_at
          : json.session?.created_at;
      if (anchor) setMeterAnchor(anchor);
    }
    if (typeof json.rateInrPerMin === "number" && json.rateInrPerMin > 0) {
      setRateInrPerMin(json.rateInrPerMin);
    }
    const b = json.wallet?.balancePaise ?? 0;
    setBalancePaise(b);
    return b;
  }, [sessionId]);

  useEffect(() => {
    if (mode === "user") {
      void refreshBalanceUser();
    }
  }, [mode, refreshBalanceUser]);

  useEffect(() => {
    let cancelled = false;
    if (mode === "user") {
      void (async () => {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: true });
        if (!cancelled) {
          if (!error && data) setMessages(data);
          setLoading(false);
        }
      })();
    } else {
      void (async () => {
        await refreshAdminBundle();
        if (!cancelled) setLoading(false);
      })();
    }
    return () => {
      cancelled = true;
    };
  }, [mode, sessionId, refreshAdminBundle]);

  useEffect(() => {
    if (mode !== "user") return;
    let alive = true;
    const supabase = createClient();
    const channel = supabase
      .channel(`lc:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const row = payload.new as ChatMessage;
          setMessages((prev) =>
            prev.some((m) => m.id === row.id) ? prev : [...prev, row]
          );
        }
      )
      .subscribe((status, err) => {
        if (!alive) return;
        if (status === "SUBSCRIBED") setLiveStatus("live");
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setLiveStatus("polling");
          console.warn("[live-chat] realtime:", status, err?.message ?? "");
        }
      });

    return () => {
      alive = false;
      void supabase.removeChannel(channel);
    };
  }, [mode, sessionId]);

  useEffect(() => {
    if (mode === "user") setLiveStatus("connecting");
  }, [mode, sessionId]);

  useEffect(() => {
    if (mode !== "user" || !viewerUserId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`wallet:${viewerUserId}`)
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
      void supabase.removeChannel(channel);
    };
  }, [mode, viewerUserId]);

  useEffect(() => {
    if (mode !== "user") return;
    const id = window.setInterval(() => {
      void (async () => {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: true });
        if (!error && data?.length) {
          setMessages((prev) => mergeMessagesById(prev, data));
        }
      })();
    }, 3500);
    return () => window.clearInterval(id);
  }, [mode, sessionId]);

  useEffect(() => {
    if (mode !== "admin") return;
    const id = window.setInterval(() => {
      void refreshAdminBundle();
    }, 1200);
    return () => window.clearInterval(id);
  }, [mode, refreshAdminBundle]);

  useEffect(() => {
    if (mode !== "user" || sessionStatus !== "open") return;
    const id = window.setInterval(() => {
      void refreshBalanceUser();
      void runMeter();
    }, 12000);
    return () => window.clearInterval(id);
  }, [mode, refreshBalanceUser, runMeter, sessionStatus]);

  useEffect(() => {
    messageCountRef.current = 0;
  }, [sessionId]);

  useEffect(() => {
    if (loading) return;
    const el = messagesScrollRef.current;
    if (!el) return;
    const n = messages.length;
    const grew = n > messageCountRef.current;
    messageCountRef.current = n;
    if (n === 0) return;
    if (!grew && n > 0) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [messages, loading]);

  const adminQueue = mode === "admin" && sessionStatus === "waiting_astrologer";
  const sessionOpen = sessionStatus === "open";
  const sessionEnded = sessionStatus === "closed";
  const canSend =
    sessionOpen &&
    body.trim().length > 0 &&
    balancePaise > 0 &&
    secondsLeft > 0 &&
    !sending;

  async function startConsultFromAdmin() {
    if (!adminQueue || startingConsult) return;
    setStartingConsult(true);
    try {
      const res = await fetch("/api/admin/live-consult/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sessionId }),
      });
      if (res.ok) await refreshAdminBundle();
    } finally {
      setStartingConsult(false);
    }
  }

  async function sendUser() {
    const text = body.trim();
    if (!text || !canSend) return;
    setSending(true);
    const supabase = createClient();
    const { data: row, error } = await supabase
      .from("chat_messages")
      .insert({
        session_id: sessionId,
        sender: "user",
        body: text,
      })
      .select("*")
      .single();
    if (row) {
      setMessages((prev) =>
        prev.some((m) => m.id === row.id) ? prev : [...prev, row]
      );
    }
    if (!error) {
      setBody("");
      void runMeter();
    }
    setSending(false);
  }

  async function sendAdmin() {
    const text = body.trim();
    if (!text || sending || sessionStatus === "waiting_astrologer") return;
    setSending(true);
    const res = await fetch("/api/admin/live-consult/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ sessionId, body: text }),
    });
    if (res.ok) {
      setBody("");
      await refreshAdminBundle();
    }
    setSending(false);
  }

  async function endSession() {
    if (!sessionOpen || ending) return;
    setEnding(true);
    try {
      const res = await fetch(
        `/api/user/chat-sessions/${encodeURIComponent(sessionId)}/close`,
        { method: "POST", credentials: "include" }
      );
      if (res.ok) {
        setSessionStatus("closed");
        const j = (await res.json()) as { summary?: SessionCloseSummary };
        if (j.summary && typeof j.summary.orderCode === "string") {
          setCloseSummary(j.summary);
        }
        void refreshBalanceUser();
      }
    } finally {
      setEnding(false);
    }
  }

  const headerPeer =
    mode === "user"
      ? {
          name: astrologer.name,
          subtitle: `₹${rateInrPerMin}/min`,
          avatarUrl: astrologer.imageSrc,
          initials: astrologer.initials,
          gradient: astrologer.avatarGradient,
        }
      : {
          name: customerName,
          subtitle: `₹${rateInrPerMin}/min · ${astrologer.name}`,
          avatarUrl: customerAvatarUrl,
          initials: customerInitials,
          gradient: customerGradient,
        };

  const countdownLow = secondsLeft > 0 && secondsLeft < 120;
  const countdownEmpty = secondsLeft <= 0;
  const walletOnlySeconds = affordableChatSeconds(balancePaise, rateInrPerMin);

  return (
    <div className="relative flex h-[min(85vh,720px)] min-h-[420px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
      {mode === "user" && closeSummary ? (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="session-summary-title"
        >
          <Card className="relative w-full max-w-md border-border shadow-xl">
            <button
              type="button"
              className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Close"
              onClick={() => setCloseSummary(null)}
            >
              <X className="size-4" />
            </button>
            <CardHeader>
              <CardTitle id="session-summary-title">Session ended</CardTitle>
              <CardDescription>
                Order {closeSummary.orderCode} · {astrologer.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between gap-4 rounded-xl border border-border/60 bg-muted/30 px-3 py-2">
                <span className="text-muted-foreground">Chat time billed</span>
                <span className="font-semibold tabular-nums text-foreground">
                  {closeSummary.billedMinutes.toFixed(2)} min
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    ({closeSummary.billedSeconds}s)
                  </span>
                </span>
              </div>
              <div className="flex justify-between gap-4 rounded-xl border border-border/60 bg-muted/30 px-3 py-2">
                <span className="text-muted-foreground">Deducted from wallet</span>
                <span className="font-semibold tabular-nums text-destructive">
                  −{formatInrFromPaisePrecise(closeSummary.totalBilledPaise)}
                </span>
              </div>
              {closeSummary.rateInrPerMin != null && closeSummary.rateInrPerMin > 0 ? (
                <p className="text-xs text-muted-foreground">
                  Rate was ₹{closeSummary.rateInrPerMin}/min (meter rounds per minute).
                </p>
              ) : null}
            </CardContent>
            <CardFooter className="border-t border-border/60">
              <Button
                type="button"
                className="w-full rounded-xl bg-brand font-medium text-white hover:bg-brand-hover"
                onClick={() => setCloseSummary(null)}
              >
                Done
              </Button>
            </CardFooter>
          </Card>
        </div>
      ) : null}
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-gradient-to-r from-brand/12 via-card to-brand-light/30 px-3 py-3">
        <ChatAvatar
          src={headerPeer.avatarUrl}
          alt={headerPeer.name}
          initials={headerPeer.initials}
          gradientClass={headerPeer.gradient}
          size={44}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-lg font-semibold leading-tight text-foreground">
            {headerPeer.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">{headerPeer.subtitle}</p>
          {mode === "user" && (
            <p className="mt-0.5 flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
              <Radio
                className={`size-3 ${
                  liveStatus === "live"
                    ? "text-emerald-600"
                    : liveStatus === "connecting"
                      ? "animate-pulse text-amber-600"
                      : "text-muted-foreground"
                }`}
                aria-hidden
              />
              {liveStatus === "live"
                ? "Live"
                : liveStatus === "connecting"
                  ? "Connecting…"
                  : "Syncing"}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center">
          {mode === "user" && sessionOpen && (
            <button
              type="button"
              onClick={() => void endSession()}
              disabled={ending}
              className="flex items-center gap-1 rounded-lg border border-border bg-background/90 px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              {ending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <PhoneOff className="size-3.5" />
              )}
              End
            </button>
          )}
          <div className="hidden items-center gap-1.5 rounded-lg border border-border/80 bg-background/80 px-2 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm sm:flex">
            <Clock className="size-3.5 text-brand" />
            <span className="tabular-nums">
              {countdownEmpty ? "0:00" : formatCountdownMmSs(secondsLeft)}
            </span>
          </div>
        </div>
      </header>

      {adminQueue ? (
        <div className="shrink-0 border-b border-amber-500/50 bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-amber-500/15 px-3 py-2.5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-amber-900 dark:text-amber-200">
                New chat — user in queue
              </p>
              <p className="text-xs text-amber-950/90 dark:text-amber-50/90">
                Click Join to start the paid session and open messaging. The customer stays on their
                queue screen until you join.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              className="shrink-0 rounded-xl bg-amber-600 font-semibold text-white hover:bg-amber-700"
              disabled={startingConsult}
              onClick={() => void startConsultFromAdmin()}
            >
              {startingConsult ? (
                <Loader2 className="mr-1 size-3.5 animate-spin" />
              ) : null}
              Join chat
            </Button>
          </div>
        </div>
      ) : null}

      <div
        className={`shrink-0 border-b px-3 py-2 text-xs ${
          sessionEnded
            ? "border-border bg-muted/50 text-muted-foreground"
            : adminQueue
              ? "border-amber-400/40 bg-amber-50/80 text-amber-950 dark:border-amber-500/35 dark:bg-amber-950/30 dark:text-amber-50"
              : countdownEmpty
                ? "border-destructive/40 bg-destructive/10 text-destructive"
                : countdownLow
                  ? "border-amber-400/50 bg-amber-50 text-amber-950 dark:bg-amber-950/40 dark:text-amber-50"
                  : "border-border bg-muted/30 text-muted-foreground"
        }`}
      >
        {sessionEnded ? (
          <span className="font-medium">This session has ended.</span>
        ) : adminQueue ? (
          <span className="font-medium">
            <span className="inline-flex items-center gap-1 rounded-md border border-brand/30 bg-brand-light/25 px-2 py-0.5 font-semibold text-foreground">
              <Wallet className="size-3.5 text-brand" aria-hidden />
              User wallet {formatInrFromPaise(balancePaise)}
            </span>
            <span className="ml-2 text-muted-foreground">
              · ₹{rateInrPerMin}/min after you join
            </span>
          </span>
        ) : (
          <>
            <span className="font-semibold tabular-nums text-foreground">
              {countdownEmpty ? "0:00" : formatCountdownMmSs(secondsLeft)}
            </span>{" "}
            time left · max at full balance {formatCountdownMmSs(walletOnlySeconds)} · Balance{" "}
            {formatInrFromPaise(balancePaise)} · ₹{rateInrPerMin}/min
            {mode === "admin" && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-md border border-brand/30 bg-brand-light/25 px-2 py-0.5 font-semibold text-foreground">
                <Wallet className="size-3.5 text-brand" aria-hidden />
                User wallet {formatInrFromPaise(balancePaise)}
              </span>
            )}
            {countdownEmpty && (
              <span className="ml-2 font-medium">— Top up to continue chatting.</span>
            )}
          </>
        )}
      </div>

      <div
        ref={messagesScrollRef}
        className="flex-1 space-y-2 overflow-y-auto overscroll-contain px-3 py-3 bg-muted/25"
      >
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {messages.map((m) => {
            const isUser = m.sender === "user";
            const isSystem = m.sender === "system";

            if (isSystem) {
              return (
                <div key={m.id} className="flex justify-center py-1">
                  <div className="max-w-[90%] rounded-full border border-border/60 bg-muted/50 px-4 py-1.5 text-center text-[11px] text-muted-foreground">
                    {m.body}
                  </div>
                </div>
              );
            }

            const isOwn = mode === "user" ? isUser : m.sender === "astrologer";
            const showAvatarLeft = !isOwn;
            const bubbleAstro = astrologer;

            return (
              <div
                key={m.id}
                className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
              >
                {showAvatarLeft ? (
                  isUser ? (
                    <ChatAvatar
                      src={customerAvatarUrl}
                      alt={customerName}
                      initials={customerInitials}
                      gradientClass={customerGradient}
                      size={32}
                    />
                  ) : (
                    <ChatAvatar
                      src={bubbleAstro.imageSrc}
                      alt={bubbleAstro.name}
                      initials={bubbleAstro.initials}
                      gradientClass={bubbleAstro.avatarGradient}
                      size={32}
                    />
                  )
                ) : (
                  <div className="w-8 shrink-0" aria-hidden />
                )}
                <div
                  className={`max-w-[78%] rounded-2xl px-3 py-2 ${
                    isOwn
                      ? "rounded-tr-sm border border-brand/25 bg-brand-light/40 text-foreground"
                      : "rounded-tl-sm border border-border bg-card text-foreground shadow-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-[14px] leading-snug">{m.body}</p>
                  <p className="mt-1 text-[10px] tabular-nums text-muted-foreground">
                    {timeLabel(m.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
          </>
        )}
      </div>

      <div className="shrink-0 border-t border-border bg-card/90 p-2 backdrop-blur-sm">
        <div className="flex items-end gap-2">
          <textarea
            className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand/35 disabled:opacity-60"
            placeholder={
              mode === "user"
                ? !sessionOpen
                  ? "Session ended…"
                  : secondsLeft <= 0 || balancePaise <= 0
                    ? "Top up wallet to send messages…"
                    : "Message…"
                : adminQueue
                  ? "Join the chat above to reply…"
                  : "Reply as astrologer…"
            }
            rows={1}
            value={body}
            disabled={
              (mode === "user" &&
                (!sessionOpen || secondsLeft <= 0 || balancePaise <= 0)) ||
              adminQueue
            }
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (mode === "user") void sendUser();
                else void sendAdmin();
              }
            }}
          />
          <button
            type="button"
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand text-primary-foreground shadow-md transition hover:bg-brand-hover disabled:opacity-40"
            disabled={
              mode === "user"
                ? !canSend
                : !body.trim() || sending || sessionEnded || adminQueue
            }
            onClick={() =>
              mode === "user" ? void sendUser() : void sendAdmin()
            }
            aria-label="Send"
          >
            {sending ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Send className="size-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
