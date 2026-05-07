"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { LiveChatPanel } from "@/components/chat/live-chat-panel";
import { ChatAvatar } from "@/components/chat/chat-avatar";
import { displayNameInitials } from "@/lib/chat/display-initials";
import {
  getAstrologerDisplay,
  resolveSessionRateInr,
} from "@/lib/chat/astrologer-display";
import { astrologerLabel } from "@/lib/admin/live-consult";
import { ASTRO_OPS_BASE } from "@/lib/admin/astro-ops-paths";
import { formatAdminDateTime } from "@/lib/admin/time";
import type { InboxDatePreset } from "@/lib/admin/time";
import { sessionUpdatedAtMatchesPreset } from "@/lib/admin/time";
import type { Database } from "@/types/database";
import { CalendarDays, ChevronRight, List } from "lucide-react";

type SessionRow = Pick<
  Database["public"]["Tables"]["chat_sessions"]["Row"],
  | "id"
  | "user_id"
  | "astrologer_id"
  | "status"
  | "order_code"
  | "total_billed_paise"
  | "updated_at"
  | "created_at"
  | "rate_inr_per_min"
  | "last_billed_at"
>;

type ProfileLite = Pick<
  Database["public"]["Tables"]["user_profiles"]["Row"],
  "display_name" | "avatar_url"
>;

/** Which slice of the inbox list is shown (URL: `bucket=`). */
type InboxBucket = "join" | "live" | "closed" | "all";

const PRESETS: { id: InboxDatePreset; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "all", label: "All dates" },
];

const BUCKET_TABS: {
  id: InboxBucket;
  label: string;
  short: string;
  tone: "amber" | "emerald" | "muted" | "brand";
}[] = [
  { id: "join", label: "Join queue", short: "Join", tone: "amber" },
  { id: "live", label: "Live", short: "Live", tone: "emerald" },
  { id: "closed", label: "Closed", short: "Closed", tone: "muted" },
  { id: "all", label: "All in range", short: "All", tone: "brand" },
];

function parsePreset(raw: string | null): InboxDatePreset {
  if (raw === "today" || raw === "yesterday" || raw === "7d" || raw === "30d" || raw === "all") {
    return raw;
  }
  return "all";
}

function parseBucketParam(raw: string | null): InboxBucket | null {
  if (raw === "join" || raw === "live" || raw === "closed" || raw === "all") return raw;
  return null;
}

function defaultBucket(waiting: number, live: number): InboxBucket {
  if (waiting > 0) return "join";
  if (live > 0) return "live";
  return "all";
}

function sortByUpdatedDesc(a: SessionRow, b: SessionRow) {
  return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
}

function statusRank(st: string) {
  if (st === "waiting_astrologer") return 0;
  if (st === "open") return 1;
  return 2;
}

function InboxSessionRow({
  s,
  active,
  profileByUserId,
  onSelect,
}: {
  s: SessionRow;
  active: boolean;
  profileByUserId: Record<string, ProfileLite>;
  onSelect: (id: string) => void;
}) {
  const p = profileByUserId[s.user_id];
  const name = p?.display_name?.trim() || `User ${s.user_id.slice(0, 8)}…`;
  const isWaiting = s.status === "waiting_astrologer";
  return (
    <button
      type="button"
      onClick={() => onSelect(s.id)}
      className={`flex w-full items-center gap-2.5 rounded-xl border px-2.5 py-2.5 text-left transition ${
        active
          ? "border-brand/50 bg-brand/10 shadow-sm"
          : "border-transparent bg-card/80 hover:border-border/80 hover:bg-muted/50"
      } ${
        isWaiting && !active
          ? "bg-gradient-to-r from-amber-500/12 to-transparent ring-1 ring-inset ring-amber-500/50"
          : ""
      }`}
    >
      <ChatAvatar
        src={p?.avatar_url}
        alt={name}
        initials={displayNameInitials(p?.display_name, s.user_id)}
        gradientClass="from-sky-600 to-indigo-900"
        size={44}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{name}</p>
        <p className="truncate text-xs text-muted-foreground">{astrologerLabel(s.astrologer_id)}</p>
        {s.order_code ? (
          <p className="truncate font-mono text-[10px] font-semibold text-amber-900/90 dark:text-amber-100/90">
            {s.order_code}
          </p>
        ) : null}
        <p className="text-[10px] text-muted-foreground">{formatAdminDateTime(s.updated_at)}</p>
      </div>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
          isWaiting
            ? "animate-pulse bg-amber-500 text-white shadow-sm shadow-amber-500/30"
            : s.status === "open"
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
              : "bg-muted text-muted-foreground"
        }`}
      >
        {isWaiting ? "Join" : s.status}
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground/50 lg:hidden" aria-hidden />
    </button>
  );
}

function bucketTabClasses(
  active: boolean,
  tone: (typeof BUCKET_TABS)[number]["tone"]
): string {
  if (!active) {
    return "border-border/70 bg-background text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground";
  }
  switch (tone) {
    case "amber":
      return "border-amber-500/60 bg-amber-500/15 text-amber-950 shadow-sm dark:text-amber-100";
    case "emerald":
      return "border-emerald-500/50 bg-emerald-500/15 text-emerald-950 shadow-sm dark:text-emerald-100";
    case "muted":
      return "border-border bg-muted text-foreground";
    case "brand":
      return "border-brand/50 bg-brand/15 text-foreground";
  }
}

export function LiveConsultInbox({
  sessions,
  profileByUserId,
  serverSelectedSessionId,
  initialWalletPaiseForSelected,
}: {
  sessions: SessionRow[];
  profileByUserId: Record<string, ProfileLite>;
  serverSelectedSessionId: string | null;
  initialWalletPaiseForSelected: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sid = searchParams.get("sid")?.trim() ?? "";
  const datePreset = parsePreset(searchParams.get("range"));

  const selected = useMemo(
    () => (sid ? sessions.find((s) => s.id === sid) : undefined),
    [sessions, sid]
  );

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => sessionUpdatedAtMatchesPreset(s.updated_at, datePreset));
  }, [sessions, datePreset]);

  const { waiting, live, closed } = useMemo(() => {
    const w = filteredSessions.filter((s) => s.status === "waiting_astrologer").sort(sortByUpdatedDesc);
    const o = filteredSessions.filter((s) => s.status === "open").sort(sortByUpdatedDesc);
    const c = filteredSessions.filter((s) => s.status === "closed").sort(sortByUpdatedDesc);
    return { waiting: w, live: o, closed: c };
  }, [filteredSessions]);

  const bucket: InboxBucket =
    parseBucketParam(searchParams.get("bucket")) ??
    defaultBucket(waiting.length, live.length);

  const visibleList = useMemo(() => {
    if (bucket === "join") return waiting;
    if (bucket === "live") return live;
    if (bucket === "closed") return closed;
    return [...filteredSessions].sort((a, b) => {
      const dr = statusRank(a.status) - statusRank(b.status);
      if (dr !== 0) return dr;
      return sortByUpdatedDesc(a, b);
    });
  }, [bucket, waiting, live, closed, filteredSessions]);

  const profile = selected ? profileByUserId[selected.user_id] : undefined;
  const customerName =
    profile?.display_name?.trim() ||
    (selected ? `User ${selected.user_id.slice(0, 8)}…` : "");

  function pushInboxParams(next: URLSearchParams) {
    const q = next.toString();
    router.push(q ? `${ASTRO_OPS_BASE}/inbox?${q}` : `${ASTRO_OPS_BASE}/inbox`);
  }

  function selectSession(id: string) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("sid", id);
    pushInboxParams(next);
  }

  function setDatePreset(preset: InboxDatePreset) {
    const next = new URLSearchParams(searchParams.toString());
    if (preset === "all") next.delete("range");
    else next.set("range", preset);
    const filtered = sessions.filter((s) => sessionUpdatedAtMatchesPreset(s.updated_at, preset));
    const inList = (id: string) => filtered.some((s) => s.id === id);
    if (sid && !inList(sid)) next.delete("sid");
    pushInboxParams(next);
  }

  function setBucket(nextBucket: InboxBucket) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("bucket", nextBucket);

    const idInView =
      nextBucket === "join"
        ? new Set(waiting.map((s) => s.id))
        : nextBucket === "live"
          ? new Set(live.map((s) => s.id))
          : nextBucket === "closed"
            ? new Set(closed.map((s) => s.id))
            : new Set(filteredSessions.map((s) => s.id));

    if (sid && !idInView.has(sid)) next.delete("sid");
    pushInboxParams(next);
  }

  function backToList() {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("sid");
    pushInboxParams(next);
  }

  const bucketCounts: Record<InboxBucket, number> = {
    join: waiting.length,
    live: live.length,
    closed: closed.length,
    all: filteredSessions.length,
  };

  const emptyCopy: Record<InboxBucket, string> = {
    join:
      datePreset === "all"
        ? "No one in the join queue."
        : "No queued chats for this date range.",
    live: "No live sessions for this date range.",
    closed: "No closed chats for this date range.",
    all: "No chats match this date range.",
  };

  return (
    <div className="flex h-[calc(100dvh-10rem)] max-h-[calc(100dvh-10rem)] min-h-[380px] flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm md:h-[calc(100dvh-7rem)] md:max-h-[calc(100dvh-7rem)] md:min-h-[480px]">
      {/* Top toolbar: scales horizontally — add more date presets or buckets here without sidebar bloat */}
      <div className="shrink-0 border-b border-border/60 bg-gradient-to-b from-muted/40 to-card/95">
        <div className="flex flex-col gap-3 p-3 sm:p-3.5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between xl:gap-6">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="size-3.5 shrink-0 text-brand" aria-hidden />
                <span className="text-[10px] font-bold uppercase tracking-wide">Activity date (IST)</span>
              </div>
              <div className="-mx-0.5 flex gap-1 overflow-x-auto px-0.5 pb-0.5 [scrollbar-width:thin]">
                {PRESETS.map((p) => {
                  const on = datePreset === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setDatePreset(p.id)}
                      className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
                        on
                          ? "bg-brand text-white shadow-sm"
                          : "border border-border/80 bg-background text-foreground hover:bg-muted/80"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="min-w-0 flex-1 space-y-2 xl:max-w-[min(100%,520px)]">
              <div className="flex items-center gap-2 text-muted-foreground">
                <List className="size-3.5 shrink-0 text-brand" aria-hidden />
                <span className="text-[10px] font-bold uppercase tracking-wide">Queue &amp; status</span>
              </div>
              <div className="-mx-0.5 flex gap-1 overflow-x-auto px-0.5 pb-0.5 [scrollbar-width:thin]">
                {BUCKET_TABS.map((tab) => {
                  const on = bucket === tab.id;
                  const n = bucketCounts[tab.id];
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setBucket(tab.id)}
                      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${bucketTabClasses(on, tab.tone)}`}
                    >
                      <span className="max-sm:hidden">{tab.label}</span>
                      <span className="sm:hidden">{tab.short}</span>
                      <span
                        className={`tabular-nums ${
                          on ? "opacity-90" : "opacity-70"
                        }`}
                      >
                        {n}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <p className="text-[11px] leading-snug text-muted-foreground">
            <span className="font-semibold text-foreground">{visibleList.length}</span> threads in view
            {bucket === "join" ? (
              <span className="text-amber-800/90 dark:text-amber-200/90">
                {" "}
                · Open a thread and use <strong>Join chat</strong> in the header to start billing.
              </span>
            ) : null}
          </p>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside
          className={`flex min-h-0 shrink-0 flex-col border-b border-border/60 bg-muted/15 lg:w-[min(100%,340px)] lg:border-b-0 lg:border-r ${
            sid ? "hidden h-full lg:flex" : "flex h-full min-h-0 flex-1 lg:max-w-[340px]"
          }`}
        >
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
            {visibleList.length === 0 ? (
              <p className="px-1 py-10 text-center text-sm text-muted-foreground">{emptyCopy[bucket]}</p>
            ) : (
              <ul className="space-y-1.5">
                {visibleList.map((s) => (
                  <li key={s.id}>
                    <InboxSessionRow
                      s={s}
                      active={s.id === sid}
                      profileByUserId={profileByUserId}
                      onSelect={selectSession}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        <section
          className={`flex min-h-0 flex-1 flex-col bg-background/40 max-lg:min-h-[min(72dvh,520px)] ${
            !sid ? "hidden lg:flex" : "flex"
          }`}
        >
          {!selected ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
              <p className="font-medium text-foreground">Select a chat</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Pick a thread from the list. The composer stays fixed at the bottom of the panel.
              </p>
              <Link href={`${ASTRO_OPS_BASE}/sessions`} className="text-sm font-medium text-brand hover:underline">
                Table view →
              </Link>
            </div>
          ) : (
            <LiveChatPanel
              key={selected.id}
              mode="admin"
              sessionId={selected.id}
              fillParent
              onAdminNavigateBack={backToList}
              astrologer={{
                ...getAstrologerDisplay(selected.astrologer_id),
                rateInrPerMin: resolveSessionRateInr(selected.rate_inr_per_min, selected.astrologer_id),
              }}
              customerName={customerName}
              customerAvatarUrl={profile?.avatar_url}
              customerInitials={displayNameInitials(profile?.display_name, selected.user_id)}
              initialBalancePaise={
                serverSelectedSessionId === selected.id ? initialWalletPaiseForSelected : 0
              }
              meterAnchorIso={selected.last_billed_at ?? selected.created_at}
              initialSessionStatus={selected.status}
            />
          )}
        </section>
      </div>
    </div>
  );
}
