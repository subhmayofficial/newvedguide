import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LIVE_CHAT_ASTROLOGERS } from "@/lib/data/live-chat-astrologers";
import { formatInrFromPaisePrecise } from "@/lib/format-money";
import { ArrowLeft, MessageCircle, Plus } from "lucide-react";
import { ChatAvatar } from "@/components/chat/chat-avatar";

export const metadata: Metadata = {
  title: "My chats",
  description: "Your live astrologer conversations on VedGuide.",
};

function astrologerData(id: string) {
  const a = LIVE_CHAT_ASTROLOGERS.find((x) => x.id === id);
  return {
    name: a?.name ?? id,
    initials: a?.initials ?? id.slice(0, 2).toUpperCase(),
    gradient: a?.avatarGradient ?? "from-brand to-indigo-700",
    imageSrc: a?.imageSrc,
  };
}

function statusConfig(status: string) {
  if (status === "waiting_astrologer") return { label: "Waiting", dot: "bg-amber-400", text: "text-amber-700 dark:text-amber-300", bg: "bg-amber-400/10" };
  if (status === "open") return { label: "Live", dot: "bg-emerald-500 animate-pulse", text: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-500/10" };
  return { label: "Completed", dot: "bg-muted-foreground/40", text: "text-muted-foreground", bg: "bg-muted/50" };
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default async function AstrologerChatsListPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: sessions } = await supabase
    .from("chat_sessions")
    .select("id, order_code, astrologer_id, status, updated_at, total_billed_paise")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(80);

  const active = sessions?.filter((s) => s.status !== "closed") ?? [];
  const past = sessions?.filter((s) => s.status === "closed") ?? [];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            href="/astrologers"
            className="flex items-center justify-center rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <h1 className="font-heading text-lg font-bold leading-tight">My Chats</h1>
            <p className="text-[11px] text-muted-foreground">
              {sessions?.length ?? 0} conversation{sessions?.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="ml-auto">
            <Link
              href="/astrologers"
              className="flex items-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-hover"
            >
              <Plus className="size-3.5" />
              New chat
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-4">
        {/* Active sessions */}
        {active.length > 0 && (
          <div className="mb-6">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Active
            </p>
            <div className="space-y-2">
              {active.map((s) => {
                const astro = astrologerData(s.astrologer_id);
                const st = statusConfig(s.status);
                const href = s.status === "waiting_astrologer"
                  ? `/astrologers/chats/waiting/${s.id}`
                  : `/astrologers/chats/${s.id}`;
                return (
                  <Link
                    key={s.id}
                    href={href}
                    className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3.5 shadow-sm transition hover:border-brand/30 hover:shadow-md active:scale-[0.99]"
                  >
                    {/* Avatar */}
                    <ChatAvatar
                      src={astro.imageSrc}
                      alt={astro.name}
                      initials={astro.initials}
                      gradientClass={astro.gradient}
                      size={48}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground">{astro.name}</p>
                      <p className="mt-0.5 font-mono text-[10px] text-muted-foreground/70">
                        {s.order_code ?? "Order pending"}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${st.bg} ${st.text}`}>
                        <span className={`size-1.5 rounded-full ${st.dot}`} />
                        {st.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{relativeTime(s.updated_at)}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Past sessions */}
        {past.length > 0 && (
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Past
            </p>
            <div className="space-y-2">
              {past.map((s) => {
                const astro = astrologerData(s.astrologer_id);
                const st = statusConfig(s.status);
                return (
                  <Link
                    key={s.id}
                    href={`/astrologers/chats/${s.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card/60 p-3.5 transition hover:border-border hover:bg-card active:scale-[0.99]"
                  >
                    <ChatAvatar
                      src={astro.imageSrc}
                      alt={astro.name}
                      initials={astro.initials}
                      gradientClass={astro.gradient}
                      size={48}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground/80">{astro.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {(s.total_billed_paise ?? 0) > 0
                          ? formatInrFromPaisePrecise(s.total_billed_paise ?? 0)
                          : "No charge"}
                        {" · "}{relativeTime(s.updated_at)}
                      </p>
                    </div>
                    <span className={`text-[10px] font-medium ${st.text}`}>{st.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {(!sessions || sessions.length === 0) && (
          <div className="flex flex-col items-center gap-5 py-24 text-center">
            <div className="flex size-20 items-center justify-center rounded-full bg-brand/8">
              <MessageCircle className="size-9 text-brand/50" />
            </div>
            <div>
              <p className="font-heading text-lg font-semibold text-foreground">No chats yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Start your first live session with an astrologer.
              </p>
            </div>
            <Link
              href="/astrologers"
              className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-hover"
            >
              Browse astrologers
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
