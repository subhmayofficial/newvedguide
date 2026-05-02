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
import { formatAdminDateTime } from "@/lib/admin/time";
import type { Database } from "@/types/database";

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

  const selected = useMemo(
    () => (sid ? sessions.find((s) => s.id === sid) : undefined),
    [sessions, sid]
  );

  const sortedSessions = useMemo(() => {
    const rank = (st: string) =>
      st === "waiting_astrologer" ? 0 : st === "open" ? 1 : 2;
    return [...sessions].sort((a, b) => {
      const dr = rank(a.status) - rank(b.status);
      if (dr !== 0) return dr;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  }, [sessions]);

  const waitingCount = useMemo(
    () => sessions.filter((s) => s.status === "waiting_astrologer").length,
    [sessions]
  );

  const profile = selected ? profileByUserId[selected.user_id] : undefined;
  const customerName =
    profile?.display_name?.trim() ||
    (selected ? `User ${selected.user_id.slice(0, 8)}…` : "");

  function selectSession(id: string) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("sid", id);
    router.push(`/admindeoghar/live-consult/inbox?${next.toString()}`);
  }

  return (
    <div className="flex min-h-[min(85vh,calc(100vh-10rem))] flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm lg:flex-row">
      <aside className="flex max-h-[min(42vh,360px)] flex-col border-b border-border/60 lg:max-h-none lg:w-[min(100%,320px)] lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="border-b border-border/60 bg-muted/30 px-3 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Chats
          </p>
          <p className="text-xs text-muted-foreground">
            {(sessions ?? []).length} sessions
            {waitingCount > 0 ? (
              <span className="ml-1 font-semibold text-amber-700 dark:text-amber-400">
                · {waitingCount} waiting for you
              </span>
            ) : (
              " · newest first"
            )}
          </p>
        </div>
        <ul className="flex-1 overflow-y-auto">
          {(sortedSessions ?? []).length === 0 ? (
            <li className="px-3 py-8 text-center text-sm text-muted-foreground">
              No chat sessions yet.
            </li>
          ) : (
            sortedSessions.map((s) => {
              const p = profileByUserId[s.user_id];
              const name =
                p?.display_name?.trim() || `User ${s.user_id.slice(0, 8)}…`;
              const active = s.id === sid;
              const isWaiting = s.status === "waiting_astrologer";
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => selectSession(s.id)}
                    className={`flex w-full items-center gap-2 border-b border-border/40 px-2 py-2.5 text-left transition hover:bg-muted/40 ${
                      active ? "bg-brand/10" : ""
                    } ${
                      isWaiting
                        ? "relative bg-gradient-to-r from-amber-500/20 via-amber-400/12 to-transparent ring-2 ring-inset ring-amber-500/70 dark:from-amber-500/15 dark:ring-amber-400/60"
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
                      <p className="truncate text-sm font-medium">{name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {astrologerLabel(s.astrologer_id)}
                      </p>
                      {s.order_code ? (
                        <p className="truncate font-mono text-[10px] font-semibold text-amber-950 dark:text-amber-100">
                          {s.order_code}
                        </p>
                      ) : null}
                      <p className="text-[10px] text-muted-foreground">
                        {formatAdminDateTime(s.updated_at)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        isWaiting
                          ? "animate-pulse bg-amber-500 text-white shadow-sm shadow-amber-500/40"
                          : s.status === "open"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isWaiting ? "JOIN" : s.status}
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </aside>

      <section className="flex min-h-[420px] flex-1 flex-col bg-background/50 p-3 lg:min-h-0">
        {!selected ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
            <p className="font-medium text-foreground">Select a chat</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Pick a conversation on the left to reply in real time. Wallet time
              updates for both you and the user.
            </p>
            <Link
              href="/admindeoghar/live-consult/sessions"
              className="text-sm font-medium text-brand hover:underline"
            >
              Table view →
            </Link>
          </div>
        ) : (
          <LiveChatPanel
            key={selected.id}
            mode="admin"
            sessionId={selected.id}
            astrologer={{
              ...getAstrologerDisplay(selected.astrologer_id),
              rateInrPerMin: resolveSessionRateInr(
                selected.rate_inr_per_min,
                selected.astrologer_id
              ),
            }}
            customerName={customerName}
            customerAvatarUrl={profile?.avatar_url}
            customerInitials={displayNameInitials(
              profile?.display_name,
              selected.user_id
            )}
            initialBalancePaise={
              serverSelectedSessionId === selected.id
                ? initialWalletPaiseForSelected
                : 0
            }
            meterAnchorIso={selected.last_billed_at ?? selected.created_at}
            initialSessionStatus={selected.status}
          />
        )}
      </section>
    </div>
  );
}
