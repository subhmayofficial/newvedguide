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
  coerceWalletPaise,
  formatCountdownMmSs,
  MIN_CHAT_START_SECONDS,
  remainingSecondsFromMeterAccrual,
} from "@/lib/chat/billing";
import { formatInrFromPaise, formatInrFromPaisePrecise } from "@/lib/format-money";
import { ChatAvatar } from "@/components/chat/chat-avatar";
import { Button } from "@/components/ui/button";
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
  /** When set in admin mode, shows a back control (e.g. mobile inbox list). */
  onAdminNavigateBack?: () => void;
  /** Admin embedded in a flex parent: fill height instead of fixed 75dvh (keeps composer in view). */
  fillParent?: boolean;
};

function timeLabel(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
}

// ─── Message bubble ─────────────────────────────────────────────────────────

function MessageBubble({
  m, isOwn, isSystem, showAvatarLeft,
  astrologer, customerAvatarUrl, customerName, customerInitials, customerGradient,
  mode, animateIn,
}: {
  m: ChatMessage; isOwn: boolean; isSystem: boolean; showAvatarLeft: boolean;
  astrologer: AstrologerDisplay; customerAvatarUrl?: string | null;
  customerName: string; customerInitials: string; customerGradient: string;
  mode: "user" | "admin"; animateIn: boolean;
}) {
  if (isSystem) {
    return (
      <div className="flex justify-center py-2">
        <div className="max-w-[85%] rounded-full border border-gray-200 bg-white px-4 py-1.5 text-center text-[11px] text-gray-400 shadow-sm">
          {m.body}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-end gap-2 transition-all duration-250 ${isOwn ? "flex-row-reverse" : "flex-row"} ${
        animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      }`}
    >
      {showAvatarLeft ? (
        m.sender === "user" ? (
          <ChatAvatar src={customerAvatarUrl} alt={customerName} initials={customerInitials} gradientClass={customerGradient} size={28} />
        ) : (
          <ChatAvatar src={astrologer.imageSrc} alt={astrologer.name} initials={astrologer.initials} gradientClass={astrologer.avatarGradient} size={28} />
        )
      ) : (
        <div className="w-7 shrink-0" aria-hidden />
      )}
      <div
        className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 ${
          isOwn
            ? "rounded-br-sm bg-amber-400 text-gray-900 shadow-sm shadow-amber-200"
            : "rounded-bl-sm border border-gray-100 bg-white text-gray-900 shadow-sm"
        }`}
      >
        <p className="break-words whitespace-pre-wrap text-[13.5px] leading-snug">{m.body}</p>
        <p className={`mt-1 text-[10px] tabular-nums ${isOwn ? "text-amber-700/60" : "text-gray-400"}`}>
          {timeLabel(m.created_at)}
        </p>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function LiveChatPanel({
  mode, sessionId, astrologer,
  customerName, customerAvatarUrl, customerInitials,
  customerGradient = "from-sky-600 to-indigo-900",
  initialBalancePaise, meterAnchorIso,
  initialSessionStatus = "open", viewerUserId,
  onAdminNavigateBack,
  fillParent = false,
}: LiveChatPanelProps) {
  const router = useRouter();
  const adminPrevStatusRef = useRef(initialSessionStatus);
  const [messages, setMessages]           = useState<ChatMessage[]>([]);
  const [animatedIds, setAnimatedIds]     = useState<Set<string>>(new Set());
  const [loading, setLoading]             = useState(true);
  const [sending, setSending]             = useState(false);
  const [ending, setEnding]               = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showRechargePopup, setShowRechargePopup] = useState(false);
  const rechargePopupShownRef = useRef(false);
  const [closeSummary, setCloseSummary]   = useState<SessionCloseSummary | null>(null);
  const [endedByDepletion, setEndedByDepletion] = useState(false);
  const [adminJoinError, setAdminJoinError] = useState<string | null>(null);
  const [startingConsult, setStartingConsult] = useState(false);
  const [body, setBody]                   = useState("");
  const [balancePaise, setBalancePaise]   = useState(initialBalancePaise);
  const [rateInrPerMin, setRateInrPerMin] = useState(() => astrologer.rateInrPerMin);
  const [meterAnchor, setMeterAnchor]     = useState(() =>
    initialSessionStatus === "waiting_astrologer" ? "" : meterAnchorIso
  );
  const [sessionStatus, setSessionStatus] = useState(initialSessionStatus);
  const [secondsLeft, setSecondsLeft]     = useState(() =>
    initialSessionStatus === "waiting_astrologer" ? 0
    : remainingSecondsFromMeterAccrual(initialBalancePaise, astrologer.rateInrPerMin, meterAnchorIso)
  );
  const [liveStatus, setLiveStatus]       = useState<"connecting" | "live" | "polling">(
    () => (mode === "user" ? "connecting" : "polling")
  );

  const messagesScrollRef   = useRef<HTMLDivElement>(null);
  const messageCountRef     = useRef(0);
  const textareaRef         = useRef<HTMLTextAreaElement>(null);
  const autoDepletedCloseRef = useRef(false);

  // ── Sync props ─────────────────────────────────────────────────────────────
  useEffect(() => {
    adminPrevStatusRef.current = initialSessionStatus;
    setSessionStatus(initialSessionStatus);
    if (initialSessionStatus === "waiting_astrologer") { setMeterAnchor(""); setSecondsLeft(0); }
    else { setMeterAnchor(meterAnchorIso); setSecondsLeft(remainingSecondsFromMeterAccrual(initialBalancePaise, astrologer.rateInrPerMin, meterAnchorIso)); }
  }, [sessionId, meterAnchorIso, initialSessionStatus, initialBalancePaise, astrologer.rateInrPerMin]);
  useEffect(() => { setBalancePaise(initialBalancePaise); }, [sessionId, initialBalancePaise]);
  useEffect(() => { setRateInrPerMin(astrologer.rateInrPerMin); }, [sessionId, astrologer.rateInrPerMin]);

  // ── Billing countdown ──────────────────────────────────────────────────────
  useEffect(() => {
    if (sessionStatus === "waiting_astrologer" || sessionStatus === "closed" || !meterAnchor) {
      if (sessionStatus === "waiting_astrologer") setSecondsLeft(0);
      return;
    }
    const tick = () => setSecondsLeft(remainingSecondsFromMeterAccrual(balancePaise, rateInrPerMin, meterAnchor, Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [meterAnchor, balancePaise, rateInrPerMin, sessionStatus]);

  // ── Meter call ─────────────────────────────────────────────────────────────
  const runMeter = useCallback(async () => {
    const res = await fetch(`/api/user/chat-sessions/${encodeURIComponent(sessionId)}/meter`, { method: "POST", credentials: "include" });
    if (!res.ok) return;
    const j = (await res.json()) as {
      balancePaise?: number;
      last_billed_at?: string;
      remainingSeconds?: number;
      sessionClosed?: boolean;
      summary?: SessionCloseSummary;
    };
    if (j.sessionClosed && j.summary) {
      setSessionStatus("closed");
      setEndedByDepletion(true);
      setCloseSummary(j.summary);
      setSecondsLeft(0);
      if (typeof j.balancePaise === "number") setBalancePaise(j.balancePaise);
      return;
    }
    if (typeof j.balancePaise === "number") setBalancePaise(j.balancePaise);
    if (typeof j.last_billed_at === "string") setMeterAnchor(j.last_billed_at);
    if (typeof j.remainingSeconds === "number") setSecondsLeft(j.remainingSeconds);
  }, [sessionId]);

  useEffect(() => { if (mode === "user" && sessionStatus === "open") void runMeter(); }, [mode, sessionId, runMeter, sessionStatus]);
  useEffect(() => { if (mode === "user" && sessionStatus === "waiting_astrologer") router.replace(`/astrologers/chats/waiting/${encodeURIComponent(sessionId)}`); }, [mode, sessionStatus, sessionId, router]);

  // ── Balance refresh ────────────────────────────────────────────────────────
  const refreshBalanceUser = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase.from("user_profiles").select("wallet_balance_paise").eq("id", user.id).maybeSingle();
    const b = data?.wallet_balance_paise ?? 0;
    setBalancePaise(b);
    return b;
  }, []);

  // ── Admin bundle ───────────────────────────────────────────────────────────
  const refreshAdminBundle = useCallback(async () => {
    const res = await fetch(`/api/admin/live-consult/chat?sessionId=${encodeURIComponent(sessionId)}`, { credentials: "include" });
    if (!res.ok) return null;
    const json = (await res.json()) as { messages?: ChatMessage[]; session?: { status?: string; last_billed_at?: string | null; created_at?: string }; wallet?: { balancePaise?: number }; rateInrPerMin?: number };
    if (json.messages) setMessages((prev) => mergeMessagesById(prev, json.messages!));
    if (json.session?.status) {
      const next = json.session.status;
      if (mode === "admin" && next === "closed" && adminPrevStatusRef.current !== "closed") {
        router.refresh();
      }
      adminPrevStatusRef.current = next;
      setSessionStatus(next);
    }
    if (json.session?.status === "waiting_astrologer") { setMeterAnchor(""); setSecondsLeft(0); }
    else {
      const anchor = json.session?.last_billed_at?.trim() ? json.session.last_billed_at : json.session?.created_at;
      if (anchor) setMeterAnchor(anchor);
    }
    if (typeof json.rateInrPerMin === "number" && json.rateInrPerMin > 0) setRateInrPerMin(json.rateInrPerMin);
    setBalancePaise(coerceWalletPaise(json.wallet?.balancePaise));
  }, [sessionId, mode, router]);

  useEffect(() => { if (mode === "user") void refreshBalanceUser(); }, [mode, refreshBalanceUser]);

  // ── Initial message load ───────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    if (mode === "user") {
      void (async () => {
        const { data, error } = await createClient().from("chat_messages").select("*").eq("session_id", sessionId).order("created_at", { ascending: true });
        if (!cancelled) {
          if (!error && data) { setMessages(data); setAnimatedIds(new Set(data.map((m) => m.id))); }
          setLoading(false);
        }
      })();
    } else {
      void (async () => { await refreshAdminBundle(); if (!cancelled) setLoading(false); })();
    }
    return () => { cancelled = true; };
  }, [mode, sessionId, refreshAdminBundle]);

  // ── Realtime messages (user) ───────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    const supabase = createClient();
    const channel = supabase
      .channel(`${mode === "admin" ? "admin-lc" : "lc"}:${sessionId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `session_id=eq.${sessionId}` }, (payload) => {
        const row = payload.new as ChatMessage;
        setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
        setTimeout(() => setAnimatedIds((s) => new Set([...s, row.id])), 50);
      })
      .subscribe((status, err) => {
        if (!alive) return;
        if (mode === "user" && status === "SUBSCRIBED") setLiveStatus("live");
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          if (mode === "user") setLiveStatus("polling");
          console.warn("[live-chat] realtime:", status, err?.message ?? "");
        }
      });
    return () => {
      alive = false;
      void supabase.removeChannel(channel);
    };
  }, [mode, sessionId]);

  useEffect(() => { if (mode === "user") setLiveStatus("connecting"); }, [mode, sessionId]);

  // ── Realtime wallet ────────────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== "user" || !viewerUserId) return;
    const supabase = createClient();
    const ch = supabase.channel(`wallet:${viewerUserId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "user_profiles", filter: `id=eq.${viewerUserId}` }, (payload) => {
        const row = payload.new as { wallet_balance_paise?: number };
        if (typeof row.wallet_balance_paise === "number") {
          setBalancePaise(row.wallet_balance_paise);
          if (row.wallet_balance_paise <= 0) {
            void fetch(`/api/user/chat-sessions/${encodeURIComponent(sessionId)}/meter`, {
              method: "POST",
              credentials: "include",
            });
          }
        }
      }).subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [mode, viewerUserId, sessionId]);

  // ── Polling fallbacks ──────────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== "user") return;
    const id = window.setInterval(() => {
      void (async () => {
        const { data, error } = await createClient().from("chat_messages").select("*").eq("session_id", sessionId).order("created_at", { ascending: true });
        if (!error && data?.length) setMessages((prev) => mergeMessagesById(prev, data));
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
    const id = window.setInterval(() => { void refreshBalanceUser(); void runMeter(); }, 15000);
    return () => window.clearInterval(id);
  }, [mode, refreshBalanceUser, runMeter, sessionStatus]);

  // ── Reset on session change ────────────────────────────────────────────────
  useEffect(() => {
    messageCountRef.current = 0;
    autoDepletedCloseRef.current = false;
    rechargePopupShownRef.current = false;
    setEndedByDepletion(false);
    setAdminJoinError(null);
    setShowRechargePopup(false);
  }, [sessionId]);

  // ── Low-balance recharge popup trigger ────────────────────────────────────
  useEffect(() => {
    if (mode !== "user" || sessionStatus !== "open") return;
    if (secondsLeft > 0 && secondsLeft < MIN_CHAT_START_SECONDS && !rechargePopupShownRef.current) {
      rechargePopupShownRef.current = true;
      setShowRechargePopup(true);
    }
  }, [mode, sessionStatus, secondsLeft]);

  // ── Auto-end on wallet depletion ───────────────────────────────────────────
  useEffect(() => {
    if (mode !== "user" || sessionStatus !== "open" || autoDepletedCloseRef.current || ending) return;
    if (balancePaise <= 0 || secondsLeft <= 0) {
      autoDepletedCloseRef.current = true;
      void (async () => {
        setEnding(true);
        try {
          const res = await fetch(`/api/user/chat-sessions/${encodeURIComponent(sessionId)}/close`, { method: "POST", credentials: "include" });
          if (res.ok) {
            setSessionStatus("closed"); setEndedByDepletion(true);
            const j = (await res.json()) as { summary?: SessionCloseSummary };
            if (j.summary?.orderCode) setCloseSummary(j.summary);
            void refreshBalanceUser();
          } else { autoDepletedCloseRef.current = false; }
        } finally { setEnding(false); }
      })();
    }
  }, [mode, sessionStatus, balancePaise, secondsLeft, sessionId, ending, refreshBalanceUser]);

  // ── Auto-scroll ────────────────────────────────────────────────────────────
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

  // ── Auto-resize textarea ───────────────────────────────────────────────────
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [body]);

  // ── Send functions ─────────────────────────────────────────────────────────
  async function sendUser() {
    const text = body.trim();
    if (!text || !canSend) return;
    setSending(true);
    const { data: row, error } = await createClient().from("chat_messages")
      .insert({ session_id: sessionId, sender: "user", body: text }).select("*").single();
    if (row) { setMessages((prev) => prev.some((m) => m.id === row.id) ? prev : [...prev, row]); setTimeout(() => setAnimatedIds((s) => new Set([...s, row.id])), 50); }
    if (!error) { setBody(""); void runMeter(); }
    setSending(false);
  }

  async function sendAdmin() {
    const text = body.trim();
    if (!text || sending || sessionStatus === "waiting_astrologer") return;
    setSending(true);
    const res = await fetch("/api/admin/live-consult/chat", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ sessionId, body: text }) });
    if (res.ok) { setBody(""); await refreshAdminBundle(); }
    setSending(false);
  }

  async function endSession() {
    if (!sessionOpen || ending) return;
    setEndedByDepletion(false); setEnding(true);
    try {
      const res = await fetch(`/api/user/chat-sessions/${encodeURIComponent(sessionId)}/close`, { method: "POST", credentials: "include" });
      if (res.ok) { setSessionStatus("closed"); const j = (await res.json()) as { summary?: SessionCloseSummary }; if (j.summary?.orderCode) setCloseSummary(j.summary); void refreshBalanceUser(); }
    } finally { setEnding(false); setShowEndConfirm(false); }
  }

  async function startConsultFromAdmin() {
    if (!adminQueue || startingConsult) return;
    setAdminJoinError(null); setStartingConsult(true);
    try {
      const res = await fetch("/api/admin/live-consult/session/start", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ sessionId }) });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.ok) await refreshAdminBundle();
      else setAdminJoinError(j.error ?? "Failed to start");
    } finally { setStartingConsult(false); }
  }

  // ── Derived state ──────────────────────────────────────────────────────────
  const adminQueue   = mode === "admin" && sessionStatus === "waiting_astrologer";
  const sessionOpen  = sessionStatus === "open";
  const sessionEnded = sessionStatus === "closed";
  const canSend      = sessionOpen && body.trim().length > 0 && balancePaise > 0 && secondsLeft > 0 && !sending;
  const countdownLow = secondsLeft > 0 && secondsLeft < 120;
  const countdownBelowMinReserve = mode === "user" && sessionOpen && secondsLeft > 0 && secondsLeft < MIN_CHAT_START_SECONDS;
  const countdownEmpty = secondsLeft <= 0;
  const walletOnlySeconds = affordableChatSeconds(balancePaise, rateInrPerMin);

  const headerPeer = mode === "user"
    ? { name: astrologer.name, subtitle: `₹${rateInrPerMin}/min`, avatarUrl: astrologer.imageSrc, initials: astrologer.initials, gradient: astrologer.avatarGradient }
    : { name: customerName, subtitle: `₹${rateInrPerMin}/min · ${astrologer.name}`, avatarUrl: customerAvatarUrl, initials: customerInitials, gradient: customerGradient };

  /* User: subtract astrologers header (h-14) + bottom nav (60px) + home indicator. Admin: fixed height unless fillParent (inbox). */
  const shellHeightClass =
    mode === "user"
      ? "h-[calc(100dvh-3.5rem-60px-env(safe-area-inset-bottom,0px))] max-h-[calc(100dvh-3.5rem-60px-env(safe-area-inset-bottom,0px))]"
      : fillParent
        ? "h-full min-h-0 min-h-[240px] w-full flex-1"
        : "h-[min(75dvh,720px)] min-h-[320px] w-full sm:min-h-[400px]";

  return (
    <div
      className={`relative flex min-h-0 flex-col overflow-x-hidden overflow-y-hidden bg-[#f0f2f5] ${shellHeightClass}`}
    >

      {/* ── Low-balance recharge popup ── */}
      {showRechargePopup && (
        <div
          className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setShowRechargePopup(false)}
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header gradient */}
            <div className="relative overflow-hidden bg-gradient-to-br from-red-500 via-orange-500 to-amber-500 px-5 pt-5 pb-4 text-white">
              <div className="pointer-events-none absolute -right-6 -top-6 size-28 rounded-full bg-white/10" aria-hidden />
              <button
                type="button"
                onClick={() => setShowRechargePopup(false)}
                className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-full bg-white/20 text-white/80 hover:bg-white/30 transition"
                aria-label="Dismiss"
              >
                <X className="size-3.5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-2xl">
                  ⚡
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-white/70">Low balance</p>
                  <p className="text-[20px] font-black leading-tight">Recharge to keep chatting</p>
                </div>
              </div>
              {/* Countdown */}
              <div className="mt-3 flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-2.5">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-200 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-white" />
                </span>
                <span className="text-[15px] font-black tabular-nums">{formatCountdownMmSs(secondsLeft)} left</span>
                <span className="ml-auto text-[11px] text-white/70">Chat ends when 0:00</span>
              </div>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-3">
              <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3">
                <p className="text-[13px] font-bold text-amber-900">🎁 100% Cashback active right now!</p>
                <p className="text-[12px] text-amber-700/80 mt-0.5">Recharge now and get double your balance instantly.</p>
              </div>
              <Link
                href="/astrologers/wallet"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 py-3.5 text-[15px] font-black text-gray-900 shadow-sm shadow-amber-200 hover:from-amber-500 hover:to-orange-500 transition active:scale-[0.98]"
              >
                <Wallet className="size-4" />
                Recharge Wallet
              </Link>
              <button
                type="button"
                onClick={() => setShowRechargePopup(false)}
                className="w-full text-center text-[12px] font-medium text-gray-400 underline-offset-2 hover:text-gray-600 hover:underline transition"
              >
                Continue chatting (balance may run out)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Session-end summary sheet ── */}
      {mode === "user" && closeSummary && (
        <div className="absolute inset-0 z-40 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
            <div className="px-6 pt-6 pb-4 text-center border-b border-gray-100">
              <div className={`mx-auto mb-3 flex size-14 items-center justify-center rounded-full ${endedByDepletion ? "bg-red-50" : "bg-amber-50"}`}>
                <span className="text-2xl">{endedByDepletion ? "⏱️" : "✨"}</span>
              </div>
              <p className="text-[18px] font-bold text-gray-900">{endedByDepletion ? "Chat ended — wallet empty" : "Session complete"}</p>
              <p className="mt-0.5 text-[13px] text-gray-400">{astrologer.name} · {closeSummary.orderCode}</p>
            </div>
            <div className="px-6 py-4 space-y-2">
              <div className="flex justify-between rounded-xl bg-gray-50 px-4 py-3 text-[14px]">
                <span className="text-gray-500">Chat time</span>
                <span className="font-semibold text-gray-900 tabular-nums">{closeSummary.billedMinutes.toFixed(2)} min</span>
              </div>
              <div className="flex justify-between rounded-xl bg-gray-50 px-4 py-3 text-[14px]">
                <span className="text-gray-500">Charged</span>
                <span className="font-semibold text-red-600 tabular-nums">−{formatInrFromPaisePrecise(closeSummary.totalBilledPaise)}</span>
              </div>
            </div>
            <div className="px-6 pb-6 space-y-2">
              {endedByDepletion && (
                <button onClick={() => router.push("/astrologers/wallet")} className="w-full rounded-2xl bg-amber-400 py-3 text-[14px] font-bold text-gray-900 hover:bg-amber-500 transition">
                  Recharge wallet to chat
                </button>
              )}
              <button onClick={() => router.push("/astrologers")} className={`w-full rounded-2xl py-3 text-[14px] font-semibold transition ${endedByDepletion ? "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50" : "bg-amber-400 text-gray-900 hover:bg-amber-500"}`}>
                Back to astrologers
              </button>
              <button className="w-full text-center text-[12px] text-gray-400 underline-offset-2 hover:underline" onClick={() => setCloseSummary(null)}>
                Stay here
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── End-session confirm sheet ── */}
      {showEndConfirm && (
        <div className="absolute inset-0 z-40 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => setShowEndConfirm(false)}>
          <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white p-5 shadow-2xl animate-in slide-in-from-bottom-4 duration-250" onClick={(e) => e.stopPropagation()}>
            <p className="text-center text-[17px] font-bold text-gray-900">End this session?</p>
            <p className="mt-1 text-center text-[13px] text-gray-400">Billing will stop and the session will close.</p>
            <div className="mt-5 flex gap-2">
              <button type="button" className="flex-1 rounded-2xl border border-gray-200 bg-gray-50 py-3 text-[14px] font-medium text-gray-700 hover:bg-gray-100 transition" onClick={() => setShowEndConfirm(false)}>
                Keep chatting
              </button>
              <button type="button" disabled={ending} className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-red-500 py-3 text-[14px] font-semibold text-white hover:bg-red-600 disabled:opacity-60 transition" onClick={() => void endSession()}>
                {ending ? <Loader2 className="size-4 animate-spin" /> : null}
                End session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Chat header ── */}
      <header className="shrink-0 border-b border-gray-100 bg-white shadow-sm">
        <div className="flex items-center gap-3 px-3 py-2.5">
          {mode === "user" && (
            <Link href="/astrologers/chats" className="flex shrink-0 size-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition" aria-label="Back">
              <ArrowLeft className="size-5" />
            </Link>
          )}
          {mode === "admin" && onAdminNavigateBack && (
            <button
              type="button"
              onClick={onAdminNavigateBack}
              className="flex shrink-0 size-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200 lg:hidden"
              aria-label="Back to chat list"
            >
              <ArrowLeft className="size-5" />
            </button>
          )}
          <ChatAvatar src={headerPeer.avatarUrl} alt={headerPeer.name} initials={headerPeer.initials} gradientClass={headerPeer.gradient} size={42} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold text-gray-900 leading-tight">{headerPeer.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {mode === "user" && (
                <span className="flex items-center gap-0.5 text-[11px] font-medium text-gray-400">
                  <Radio className={`size-3 ${liveStatus === "live" ? "text-emerald-500" : liveStatus === "connecting" ? "animate-pulse text-amber-500" : "text-gray-400"}`} aria-hidden />
                  {liveStatus === "live" ? "Live" : liveStatus === "connecting" ? "Connecting…" : "Syncing"}
                  {" · "}
                </span>
              )}
              <span className="text-[11px] text-gray-400">{headerPeer.subtitle}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {/* Countdown chip */}
            {sessionOpen && (
              <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold tabular-nums ${
                countdownEmpty ? "border border-red-300 bg-red-50 text-red-600"
                : countdownBelowMinReserve ? "border-2 border-red-400 bg-red-50 text-red-700"
                : countdownLow ? "border border-amber-300 bg-amber-50 text-amber-800"
                : "border border-gray-200 bg-gray-50 text-gray-700"}`}>
                <Clock className="size-3" />
                {countdownEmpty ? "0:00" : formatCountdownMmSs(secondsLeft)}
              </div>
            )}
            {/* End button */}
            {mode === "user" && sessionOpen && (
              <button type="button" onClick={() => setShowEndConfirm(true)} className="flex size-9 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-500 transition">
                <PhoneOff className="size-4" />
              </button>
            )}
          </div>
        </div>

        {/* Admin join bar */}
        {adminQueue && (
          <div className="border-t border-amber-200 bg-amber-50 px-3 py-2.5">
            {adminJoinError && (
              <p className="mb-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-medium text-red-700">{adminJoinError}</p>
            )}
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-amber-800">New chat — user in queue</p>
                <p className="text-[11px] text-amber-700/80">User needs ≥5 min balance. Click Join to start billing.</p>
              </div>
              <Button size="sm" className="shrink-0 rounded-xl bg-amber-500 font-semibold text-white hover:bg-amber-600" disabled={startingConsult} onClick={() => void startConsultFromAdmin()}>
                {startingConsult && <Loader2 className="mr-1 size-3.5 animate-spin" />}
                Join chat
              </Button>
            </div>
          </div>
        )}

        {/* Status bar */}
        <div className={`border-t px-3 py-1.5 text-[11px] ${
          sessionEnded ? "border-gray-100 bg-gray-50 text-gray-400"
          : countdownEmpty && !adminQueue ? "border-red-200 bg-red-50 text-red-600"
          : countdownBelowMinReserve && !adminQueue ? "border-red-200 bg-red-50/80 text-red-700"
          : countdownLow && !adminQueue ? "border-amber-200 bg-amber-50 text-amber-800"
          : "border-gray-100 bg-gray-50/60 text-gray-400"}`}>
          {sessionEnded ? (
            <span className="font-medium text-gray-500">This session has ended.</span>
          ) : adminQueue ? (
            <span>
              <span className="inline-flex items-center gap-1 font-semibold text-gray-800">
                <Wallet className="size-3 text-amber-500" /> User wallet {formatInrFromPaise(balancePaise)}
              </span>
              <span className="ml-2 text-gray-500">· ₹{rateInrPerMin}/min after join</span>
            </span>
          ) : (
            <span className="flex flex-wrap items-center gap-1.5">
              <span className="font-semibold tabular-nums text-gray-700">{countdownEmpty ? "0:00" : formatCountdownMmSs(secondsLeft)}</span>
              <span>left · max {formatCountdownMmSs(walletOnlySeconds)} · {formatInrFromPaise(balancePaise)}</span>
              {countdownEmpty && mode === "user" && (
                <Link href="/astrologers/wallet" className="font-bold text-red-600 underline-offset-2 hover:underline">Recharge →</Link>
              )}
            </span>
          )}
        </div>
      </header>

      {/* ── Messages ── */}
      <div
        ref={messagesScrollRef}
        className="min-h-0 flex-1 space-y-2 overflow-y-auto overflow-x-hidden overscroll-contain px-3 py-4"
      >
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <div className="relative size-10">
              <div className="absolute inset-0 animate-spin rounded-full border-2 border-amber-200 border-t-amber-400" />
              <div className="absolute inset-2 animate-pulse rounded-full bg-amber-100" />
            </div>
            <p className="text-[12px] text-gray-400">Loading messages…</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <span className="text-3xl" aria-hidden>🔮</span>
            <p className="text-[14px] font-semibold text-gray-700">Session started</p>
            <p className="text-[12px] text-gray-400">Send your first message below.</p>
          </div>
        ) : (
          messages.map((m) => {
            const isUser   = m.sender === "user";
            const isSystem = m.sender === "system";
            const isOwn    = mode === "user" ? isUser : m.sender === "astrologer";
            return (
              <MessageBubble
                key={m.id} m={m} isOwn={isOwn} isSystem={isSystem}
                showAvatarLeft={!isOwn}
                astrologer={astrologer}
                customerAvatarUrl={customerAvatarUrl}
                customerName={customerName}
                customerInitials={customerInitials}
                customerGradient={customerGradient}
                mode={mode}
                animateIn={mode === "admin" || animatedIds.has(m.id)}
              />
            );
          })
        )}
      </div>

      {/* ── Input (text-base on small screens prevents iOS Safari zoom-on-focus) ── */}
      <div
        className="shrink-0 border-t border-gray-100 bg-white px-3 py-2.5"
        style={{ paddingBottom: "max(0.625rem, env(safe-area-inset-bottom, 0px))" }}
      >
        {sessionEnded ? (
          <div className="flex items-center justify-center gap-3 py-2">
            <p className="text-[12px] text-gray-400">Session ended.</p>
            <Link href="/astrologers" className="rounded-full bg-amber-400 px-4 py-1.5 text-[12px] font-semibold text-gray-900 hover:bg-amber-500 transition">
              Find an astrologer
            </Link>
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              enterKeyHint="send"
              inputMode="text"
              className="max-h-[120px] min-h-[44px] flex-1 resize-none rounded-2xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-base leading-snug text-gray-900 outline-none placeholder:text-gray-400 focus:border-amber-300 focus:bg-white focus:ring-2 focus:ring-amber-200/50 transition disabled:opacity-50 sm:text-[14px] sm:leading-snug"
              placeholder={
                mode === "user"
                  ? secondsLeft <= 0 || balancePaise <= 0 ? "Top up wallet to continue…" : "Message…"
                  : adminQueue ? "Join the chat above to reply…" : "Reply as astrologer…"
              }
              rows={1}
              value={body}
              disabled={(mode === "user" && (!sessionOpen || secondsLeft <= 0 || balancePaise <= 0)) || adminQueue}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (mode === "user") void sendUser(); else void sendAdmin();
                }
              }}
            />
            <button
              type="button"
              className={`flex size-11 shrink-0 items-center justify-center rounded-full shadow-sm transition-all duration-150 ${
                (mode === "user" ? canSend : !!(body.trim()) && !sending && !sessionEnded && !adminQueue)
                  ? "bg-amber-400 text-gray-900 hover:bg-amber-500 active:scale-95"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
              disabled={mode === "user" ? !canSend : !body.trim() || sending || sessionEnded || adminQueue}
              onClick={() => (mode === "user" ? void sendUser() : void sendAdmin())}
              aria-label="Send"
            >
              {sending ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-[18px]" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
