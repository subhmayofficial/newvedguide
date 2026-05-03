"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Clock,
  Loader2,
  PhoneOff,
  Radio,
  Send,
  Wallet,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { AstrologerDisplay } from "@/lib/chat/astrologer-display";
import {
  affordableChatSeconds,
  formatCountdownMmSs,
  MIN_CHAT_START_SECONDS,
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
  meterAnchorIso: string;
  initialSessionStatus?: string;
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

// ─── Message bubble with entry animation ─────────────────────────────────────

function MessageBubble({
  m,
  isOwn,
  isSystem,
  showAvatarLeft,
  astrologer,
  customerAvatarUrl,
  customerName,
  customerInitials,
  customerGradient,
  mode,
  animateIn,
}: {
  m: ChatMessage;
  isOwn: boolean;
  isSystem: boolean;
  showAvatarLeft: boolean;
  astrologer: AstrologerDisplay;
  customerAvatarUrl?: string | null;
  customerName: string;
  customerInitials: string;
  customerGradient: string;
  mode: "user" | "admin";
  animateIn: boolean;
}) {
  if (isSystem) {
    return (
      <div className="flex justify-center py-1">
        <div className="max-w-[90%] rounded-full border border-border/50 bg-muted/60 px-4 py-1.5 text-center text-[11px] text-muted-foreground">
          {m.body}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-end gap-2 transition-all duration-300 ${
        isOwn ? "flex-row-reverse" : "flex-row"
      } ${animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
    >
      {showAvatarLeft ? (
        m.sender === "user" ? (
          <ChatAvatar
            src={customerAvatarUrl}
            alt={customerName}
            initials={customerInitials}
            gradientClass={customerGradient}
            size={28}
          />
        ) : (
          <ChatAvatar
            src={astrologer.imageSrc}
            alt={astrologer.name}
            initials={astrologer.initials}
            gradientClass={astrologer.avatarGradient}
            size={28}
          />
        )
      ) : (
        <div className="w-7 shrink-0" aria-hidden />
      )}
      <div
        className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 shadow-sm ${
          isOwn
            ? "rounded-br-sm bg-brand text-white"
            : "rounded-bl-sm border border-border/60 bg-card text-foreground"
        }`}
      >
        <p className="whitespace-pre-wrap text-[13.5px] leading-snug">{m.body}</p>
        <p
          className={`mt-1 text-[10px] tabular-nums ${
            isOwn ? "text-white/60" : "text-muted-foreground"
          }`}
        >
          {timeLabel(m.created_at)}
        </p>
      </div>
    </div>
  );
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
  const [animatedIds, setAnimatedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [ending, setEnding] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [closeSummary, setCloseSummary] = useState<SessionCloseSummary | null>(null);
  const [endedByDepletion, setEndedByDepletion] = useState(false);
  const [adminJoinError, setAdminJoinError] = useState<string | null>(null);
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoDepletedCloseRef = useRef(false);
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
  }, [sessionId, meterAnchorIso, initialSessionStatus, initialBalancePaise, astrologer.rateInrPerMin]);

  useEffect(() => { setBalancePaise(initialBalancePaise); }, [sessionId, initialBalancePaise]);
  useEffect(() => { setRateInrPerMin(astrologer.rateInrPerMin); }, [sessionId, astrologer.rateInrPerMin]);

  useEffect(() => {
    if (sessionStatus === "waiting_astrologer" || sessionStatus === "closed" || !meterAnchor) {
      if (sessionStatus === "waiting_astrologer") setSecondsLeft(0);
      return;
    }
    const tick = () => {
      setSecondsLeft(remainingSecondsFromMeterAccrual(balancePaise, rateInrPerMin, meterAnchor, Date.now()));
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
    const { data: { user } } = await supabase.auth.getUser();
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
      session?: { status?: string; last_billed_at?: string | null; created_at?: string };
      wallet?: { balancePaise?: number };
      rateInrPerMin?: number;
    };
    if (json.messages) setMessages((prev) => mergeMessagesById(prev, json.messages!));
    if (json.session?.status) setSessionStatus(json.session.status);
    if (json.session?.status === "waiting_astrologer") {
      setMeterAnchor(""); setSecondsLeft(0);
    } else {
      const anchor =
        json.session?.last_billed_at?.trim()
          ? json.session.last_billed_at
          : json.session?.created_at;
      if (anchor) setMeterAnchor(anchor);
    }
    if (typeof json.rateInrPerMin === "number" && json.rateInrPerMin > 0) {
      setRateInrPerMin(json.rateInrPerMin);
    }
    setBalancePaise(json.wallet?.balancePaise ?? 0);
  }, [sessionId]);

  useEffect(() => {
    if (mode === "user") void refreshBalanceUser();
  }, [mode, refreshBalanceUser]);

  useEffect(() => {
    let cancelled = false;
    if (mode === "user") {
      void (async () => {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("chat_messages").select("*").eq("session_id", sessionId)
          .order("created_at", { ascending: true });
        if (!cancelled) {
          if (!error && data) {
            setMessages(data);
            setAnimatedIds(new Set(data.map((m) => m.id)));
          }
          setLoading(false);
        }
      })();
    } else {
      void (async () => {
        await refreshAdminBundle();
        if (!cancelled) setLoading(false);
      })();
    }
    return () => { cancelled = true; };
  }, [mode, sessionId, refreshAdminBundle]);

  useEffect(() => {
    if (mode !== "user") return;
    let alive = true;
    const supabase = createClient();
    const channel = supabase
      .channel(`lc:${sessionId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public",
        table: "chat_messages", filter: `session_id=eq.${sessionId}`,
      }, (payload) => {
        const row = payload.new as ChatMessage;
        setMessages((prev) => prev.some((m) => m.id === row.id) ? prev : [...prev, row]);
        setTimeout(() => setAnimatedIds((s) => new Set([...s, row.id])), 50);
      })
      .subscribe((status, err) => {
        if (!alive) return;
        if (status === "SUBSCRIBED") setLiveStatus("live");
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setLiveStatus("polling");
          console.warn("[live-chat] realtime:", status, err?.message ?? "");
        }
      });
    return () => { alive = false; void supabase.removeChannel(channel); };
  }, [mode, sessionId]);

  useEffect(() => {
    if (mode === "user") setLiveStatus("connecting");
  }, [mode, sessionId]);

  useEffect(() => {
    if (mode !== "user" || !viewerUserId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`wallet:${viewerUserId}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public",
        table: "user_profiles", filter: `id=eq.${viewerUserId}`,
      }, (payload) => {
        const row = payload.new as { wallet_balance_paise?: number };
        if (typeof row.wallet_balance_paise === "number") setBalancePaise(row.wallet_balance_paise);
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [mode, viewerUserId]);

  useEffect(() => {
    if (mode !== "user") return;
    const id = window.setInterval(() => {
      void (async () => {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("chat_messages").select("*").eq("session_id", sessionId)
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
    const id = window.setInterval(() => { void refreshAdminBundle(); }, 1200);
    return () => window.clearInterval(id);
  }, [mode, refreshAdminBundle]);

  useEffect(() => {
    if (mode !== "user" || sessionStatus !== "open") return;
    const id = window.setInterval(() => {
      void refreshBalanceUser();
      void runMeter();
    }, 15000);
    return () => window.clearInterval(id);
  }, [mode, refreshBalanceUser, runMeter, sessionStatus]);

  useEffect(() => {
    messageCountRef.current = 0;
    autoDepletedCloseRef.current = false;
    setEndedByDepletion(false);
    setAdminJoinError(null);
  }, [sessionId]);

  useEffect(() => {
    const open = sessionStatus === "open";
    if (mode !== "user" || !open || autoDepletedCloseRef.current || ending) return;
    if (balancePaise <= 0 || secondsLeft <= 0) {
      autoDepletedCloseRef.current = true;
      void (async () => {
        setEnding(true);
        try {
          const res = await fetch(
            `/api/user/chat-sessions/${encodeURIComponent(sessionId)}/close`,
            { method: "POST", credentials: "include" }
          );
          if (res.ok) {
            setSessionStatus("closed");
            setEndedByDepletion(true);
            const j = (await res.json()) as { summary?: SessionCloseSummary };
            if (j.summary?.orderCode) setCloseSummary(j.summary);
            void refreshBalanceUser();
          } else {
            autoDepletedCloseRef.current = false;
          }
        } finally {
          setEnding(false);
        }
      })();
    }
  }, [
    mode,
    sessionStatus,
    balancePaise,
    secondsLeft,
    sessionId,
    ending,
    refreshBalanceUser,
  ]);

  useEffect(() => {
    if (loading) return;
    const el = messagesScrollRef.current;
    if (!el) return;
    const n = messages.length;
    const grew = n > messageCountRef.current;
    messageCountRef.current = n;
    if (n === 0 || !grew) return;
    requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; });
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [body]);

  const adminQueue = mode === "admin" && sessionStatus === "waiting_astrologer";
  const sessionOpen = sessionStatus === "open";
  const sessionEnded = sessionStatus === "closed";
  const canSend =
    sessionOpen && body.trim().length > 0 && balancePaise > 0 && secondsLeft > 0 && !sending;

  const countdownLow = secondsLeft > 0 && secondsLeft < 120;
  const countdownBelowMinReserve =
    mode === "user" && sessionOpen && secondsLeft > 0 && secondsLeft < MIN_CHAT_START_SECONDS;
  const countdownEmpty = secondsLeft <= 0;
  const walletOnlySeconds = affordableChatSeconds(balancePaise, rateInrPerMin);

  async function startConsultFromAdmin() {
    if (!adminQueue || startingConsult) return;
    setAdminJoinError(null);
    setStartingConsult(true);
    try {
      const res = await fetch("/api/admin/live-consult/session/start", {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify({ sessionId }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.ok) {
        await refreshAdminBundle();
      } else if (res.status === 402 && j.error) {
        setAdminJoinError(j.error);
      } else if (j.error) {
        setAdminJoinError(j.error);
      }
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
      .insert({ session_id: sessionId, sender: "user", body: text })
      .select("*").single();
    if (row) {
      setMessages((prev) => prev.some((m) => m.id === row.id) ? prev : [...prev, row]);
      setTimeout(() => setAnimatedIds((s) => new Set([...s, row.id])), 50);
    }
    if (!error) { setBody(""); void runMeter(); }
    setSending(false);
  }

  async function sendAdmin() {
    const text = body.trim();
    if (!text || sending || sessionStatus === "waiting_astrologer") return;
    setSending(true);
    const res = await fetch("/api/admin/live-consult/chat", {
      method: "POST", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify({ sessionId, body: text }),
    });
    if (res.ok) { setBody(""); await refreshAdminBundle(); }
    setSending(false);
  }

  async function endSession() {
    if (!sessionOpen || ending) return;
    setEndedByDepletion(false);
    setEnding(true);
    try {
      const res = await fetch(
        `/api/user/chat-sessions/${encodeURIComponent(sessionId)}/close`,
        { method: "POST", credentials: "include" }
      );
      if (res.ok) {
        setSessionStatus("closed");
        const j = (await res.json()) as { summary?: SessionCloseSummary };
        if (j.summary?.orderCode) setCloseSummary(j.summary);
        void refreshBalanceUser();
      }
    } finally {
      setEnding(false);
      setShowEndConfirm(false);
    }
  }

  const headerPeer =
    mode === "user"
      ? { name: astrologer.name, subtitle: `₹${rateInrPerMin}/min`, avatarUrl: astrologer.imageSrc, initials: astrologer.initials, gradient: astrologer.avatarGradient }
      : { name: customerName, subtitle: `₹${rateInrPerMin}/min · ${astrologer.name}`, avatarUrl: customerAvatarUrl, initials: customerInitials, gradient: customerGradient };

  return (
    <div className="flex h-[calc(100dvh-56px)] flex-col bg-background">
      {countdownBelowMinReserve ? (
        <div
          className="shrink-0 z-30 border-b-2 border-red-500 bg-gradient-to-r from-red-50 to-amber-50 px-3 py-2.5 shadow-md dark:from-red-950/80 dark:to-red-900/40"
          role="status"
        >
          <div className="mx-auto flex max-w-lg flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-red-800 dark:text-red-200">Low balance</p>
              <p className="text-xs text-red-700/90 dark:text-red-100/85">
                Less than 5 minutes left — recharge now or the chat will end when time runs out.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span
                className="min-w-[3.5rem] text-center text-xl font-black tabular-nums tracking-tight text-red-600 dark:text-red-400"
                aria-live="polite"
              >
                {formatCountdownMmSs(secondsLeft)}
              </span>
              <Link
                href="/astrologers/wallet"
                className="rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-red-700"
              >
                Recharge now
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Session-end summary overlay ── */}
      {mode === "user" && closeSummary ? (
        <div
          className="absolute inset-0 z-40 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center"
          role="dialog" aria-modal="true"
        >
          <Card className="w-full max-w-md animate-in slide-in-from-bottom-4 duration-300 border-border shadow-2xl">
            <CardHeader className="text-center pb-3">
              <div
                className={`mx-auto mb-3 flex size-14 items-center justify-center rounded-full ${
                  endedByDepletion ? "bg-red-500/15" : "bg-emerald-500/10"
                }`}
              >
                <span className="text-2xl">{endedByDepletion ? "⏱️" : "✨"}</span>
              </div>
              <CardTitle className="text-xl">
                {endedByDepletion ? "Chat ended — wallet empty" : "Session complete"}
              </CardTitle>
              <CardDescription>
                {astrologer.name} · {closeSummary.orderCode}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <div className="flex justify-between rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5 text-sm">
                <span className="text-muted-foreground">Chat time</span>
                <span className="font-semibold tabular-nums">
                  {closeSummary.billedMinutes.toFixed(2)} min
                </span>
              </div>
              <div className="flex justify-between rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5 text-sm">
                <span className="text-muted-foreground">Charged</span>
                <span className="font-semibold tabular-nums text-destructive">
                  −{formatInrFromPaisePrecise(closeSummary.totalBilledPaise)}
                </span>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-2 border-t border-border/60 pt-4">
              {endedByDepletion ? (
                <Button
                  className="w-full rounded-xl bg-red-600 font-semibold text-white hover:bg-red-700"
                  onClick={() => router.push("/astrologers/wallet")}
                >
                  Recharge wallet to chat
                </Button>
              ) : null}
              <Button
                variant={endedByDepletion ? "outline" : "default"}
                className={
                  endedByDepletion
                    ? "w-full rounded-xl border-border"
                    : "w-full rounded-xl bg-brand font-semibold text-white hover:bg-brand-hover"
                }
                onClick={() => router.push("/astrologers")}
              >
                Back to astrologers
              </Button>
              <button
                className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                onClick={() => setCloseSummary(null)}
              >
                Stay here
              </button>
            </CardFooter>
          </Card>
        </div>
      ) : null}

      {/* ── End-session confirm sheet ── */}
      {showEndConfirm && (
        <div
          className="absolute inset-0 z-40 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => setShowEndConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-border bg-card p-5 shadow-2xl animate-in slide-in-from-bottom-4 duration-250"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-center font-heading text-lg font-semibold">End this session?</p>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              Billing will stop and the session will close.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-xl border border-border bg-muted/50 py-2.5 text-sm font-medium text-foreground"
                onClick={() => setShowEndConfirm(false)}
              >
                Keep chatting
              </button>
              <button
                type="button"
                disabled={ending}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-destructive py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                onClick={() => void endSession()}
              >
                {ending ? <Loader2 className="size-4 animate-spin" /> : null}
                End session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Chat header ── */}
      <header className="shrink-0 border-b border-border/60 bg-card">
        <div className="flex items-center gap-3 px-3 py-2.5">
          {mode === "user" && (
            <Link
              href="/astrologers/chats"
              className="flex shrink-0 items-center justify-center rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Back"
            >
              <ArrowLeft className="size-5" />
            </Link>
          )}
          <ChatAvatar
            src={headerPeer.avatarUrl}
            alt={headerPeer.name}
            initials={headerPeer.initials}
            gradientClass={headerPeer.gradient}
            size={40}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-heading text-base font-semibold leading-tight">
              {headerPeer.name}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {mode === "user" && (
                <span className="flex items-center gap-0.5 text-[11px] font-medium text-muted-foreground">
                  <Radio
                    className={`size-3 ${
                      liveStatus === "live" ? "text-emerald-500"
                      : liveStatus === "connecting" ? "animate-pulse text-amber-500"
                      : "text-muted-foreground"
                    }`}
                    aria-hidden
                  />
                  {liveStatus === "live" ? "Live" : liveStatus === "connecting" ? "Connecting…" : "Syncing"}
                </span>
              )}
              <span className="text-[11px] text-muted-foreground">{headerPeer.subtitle}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {/* Countdown chip */}
            {sessionOpen && (
              <div
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums ${
                  countdownEmpty ? "border border-destructive/40 bg-destructive/10 text-destructive"
                  : countdownBelowMinReserve
                    ? "border-2 border-red-500 bg-red-50 text-red-700 shadow-sm dark:bg-red-950/50 dark:text-red-200"
                    : countdownLow
                      ? "border border-amber-400/50 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
                      : "border border-border/60 bg-muted/50 text-foreground"
                }`}
              >
                <Clock className="size-3" />
                {countdownEmpty ? "0:00" : formatCountdownMmSs(secondsLeft)}
              </div>
            )}
            {/* End button — user only */}
            {mode === "user" && sessionOpen && (
              <button
                type="button"
                onClick={() => setShowEndConfirm(true)}
                className="flex items-center gap-1 rounded-xl border border-border bg-muted/50 px-2 py-1.5 text-[11px] font-medium text-muted-foreground hover:border-destructive/40 hover:text-destructive"
              >
                <PhoneOff className="size-3.5" />
                End
              </button>
            )}
          </div>
        </div>

        {/* Admin queue join bar */}
        {adminQueue && (
          <div className="border-t border-amber-500/40 bg-amber-50/80 px-3 py-2 dark:bg-amber-950/30">
            {adminJoinError ? (
              <p className="mb-2 rounded-lg border border-red-400/50 bg-red-50 px-2 py-1.5 text-xs font-medium text-red-800 dark:bg-red-950/40 dark:text-red-200">
                {adminJoinError}
              </p>
            ) : null}
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-amber-900 dark:text-amber-200">
                  New chat — user in queue
                </p>
                <p className="text-xs text-amber-800/80 dark:text-amber-100/80">
                  User needs ≥5 min wallet balance. Click Join to start billing.
                </p>
              </div>
              <Button
                size="sm"
                className="shrink-0 rounded-xl bg-amber-600 font-semibold text-white hover:bg-amber-700"
                disabled={startingConsult}
                onClick={() => void startConsultFromAdmin()}
              >
                {startingConsult && <Loader2 className="mr-1 size-3.5 animate-spin" />}
                Join chat
              </Button>
            </div>
          </div>
        )}

        {/* Status bar */}
        <div
          className={`border-t px-3 py-1.5 text-[11px] ${
            sessionEnded ? "border-border/40 bg-muted/30 text-muted-foreground"
            : countdownEmpty && !adminQueue ? "border-destructive/30 bg-destructive/8 text-destructive"
            : countdownBelowMinReserve && !adminQueue
              ? "border-red-400/50 bg-red-50/90 text-red-900 dark:bg-red-950/40 dark:text-red-100"
              : countdownLow && !adminQueue
                ? "border-amber-400/40 bg-amber-50/70 text-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
                : "border-border/30 bg-muted/20 text-muted-foreground"
          }`}
        >
          {sessionEnded ? (
            <span className="font-medium">This session has ended.</span>
          ) : adminQueue ? (
            <span>
              <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                <Wallet className="size-3 text-brand" />
                User wallet {formatInrFromPaise(balancePaise)}
              </span>
              <span className="ml-2 text-muted-foreground">· ₹{rateInrPerMin}/min after join</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold tabular-nums text-foreground">
                {countdownEmpty ? "0:00" : formatCountdownMmSs(secondsLeft)}
              </span>
              <span>left · max {formatCountdownMmSs(walletOnlySeconds)} · {formatInrFromPaise(balancePaise)}</span>
              {countdownEmpty && mode === "user" && (
                <Link
                  href="/astrologers/wallet"
                  className="font-bold text-red-600 underline-offset-2 hover:underline dark:text-red-400"
                >
                  Recharge wallet to chat →
                </Link>
              )}
            </span>
          )}
        </div>
      </header>

      {/* ── Messages ── */}
      <div
        ref={messagesScrollRef}
        className="flex-1 space-y-2 overflow-y-auto overscroll-contain px-3 py-4"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, oklch(0.85 0.02 0 / 0.06) 1px, transparent 0)",
          backgroundSize: "20px 20px",
        }}
      >
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <div className="relative size-12">
              <div className="absolute inset-0 rounded-full border-2 border-brand/20 border-t-brand animate-spin" />
              <div className="absolute inset-2 rounded-full bg-brand/10 animate-pulse" />
            </div>
            <p className="text-xs text-muted-foreground">Loading messages…</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <span className="text-3xl" aria-hidden>🔮</span>
            <p className="text-sm font-medium text-foreground">Session started</p>
            <p className="text-xs text-muted-foreground">Send your first message below.</p>
          </div>
        ) : (
          messages.map((m) => {
            const isUser = m.sender === "user";
            const isSystem = m.sender === "system";
            const isOwn = mode === "user" ? isUser : m.sender === "astrologer";
            const showAvatarLeft = !isOwn;
            return (
              <MessageBubble
                key={m.id}
                m={m}
                isOwn={isOwn}
                isSystem={isSystem}
                showAvatarLeft={showAvatarLeft}
                astrologer={astrologer}
                customerAvatarUrl={customerAvatarUrl}
                customerName={customerName}
                customerInitials={customerInitials}
                customerGradient={customerGradient}
                mode={mode}
                animateIn={animatedIds.has(m.id)}
              />
            );
          })
        )}
      </div>

      {/* ── Input area ── */}
      <div className="shrink-0 border-t border-border/60 bg-card/95 px-3 py-2.5 backdrop-blur-md">
        {sessionEnded ? (
          <div className="flex items-center justify-center gap-3 py-2">
            <p className="text-xs text-muted-foreground">Session ended.</p>
            <Link
              href="/astrologers"
              className="rounded-xl bg-brand px-3 py-1.5 text-xs font-semibold text-white"
            >
              Find another astrologer
            </Link>
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              className="max-h-[120px] min-h-[44px] flex-1 resize-none rounded-2xl border border-border bg-muted/40 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted-foreground focus:border-brand/40 focus:bg-background focus:ring-2 focus:ring-brand/15 disabled:opacity-50"
              placeholder={
                mode === "user"
                  ? secondsLeft <= 0 || balancePaise <= 0
                    ? "Top up wallet to continue…"
                    : "Message…"
                  : adminQueue
                    ? "Join the chat above to reply…"
                    : "Reply as astrologer…"
              }
              rows={1}
              value={body}
              disabled={
                (mode === "user" && (!sessionOpen || secondsLeft <= 0 || balancePaise <= 0)) ||
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
              className={`flex size-11 shrink-0 items-center justify-center rounded-full shadow-md transition-all duration-150 ${
                (mode === "user" ? canSend : !!(body.trim()) && !sending && !sessionEnded && !adminQueue)
                  ? "bg-brand text-white hover:bg-brand-hover active:scale-95"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
              disabled={
                mode === "user"
                  ? !canSend
                  : !body.trim() || sending || sessionEnded || adminQueue
              }
              onClick={() => (mode === "user" ? void sendUser() : void sendAdmin())}
              aria-label="Send"
            >
              {sending ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <Send className="size-4.5" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
