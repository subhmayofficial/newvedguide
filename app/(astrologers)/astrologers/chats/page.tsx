import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LIVE_CHAT_ASTROLOGERS } from "@/lib/data/live-chat-astrologers";
import { formatInrFromPaisePrecise } from "@/lib/format-money";
import { MessageCircle, Plus } from "lucide-react";
import { ChatAvatar } from "@/components/chat/chat-avatar";

export const metadata: Metadata = {
  title: "My Chats · VedGuide",
  description: "Your live astrologer conversations on VedGuide.",
};

function astrologerData(id: string) {
  const a = LIVE_CHAT_ASTROLOGERS.find((x) => x.id === id);
  return {
    name: a?.name ?? id,
    initials: a?.initials ?? id.slice(0, 2).toUpperCase(),
    gradient: a?.avatarGradient ?? "from-amber-600 to-amber-900",
    imageSrc: a?.imageSrc,
  };
}

function statusConfig(status: string) {
  if (status === "waiting_astrologer")
    return {
      label: "Waiting",
      dot: "bg-amber-400",
      text: "text-amber-700",
      bg: "bg-amber-50",
    };
  if (status === "open")
    return {
      label: "Live",
      dot: "bg-emerald-500 animate-pulse",
      text: "text-emerald-700",
      bg: "bg-emerald-50",
    };
  return {
    label: "Completed",
    dot: "bg-gray-300",
    text: "text-gray-500",
    bg: "bg-gray-100",
  };
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export default async function AstrologerChatsListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/astrologers/chats");

  const { data: sessions } = await supabase
    .from("chat_sessions")
    .select(
      "id, order_code, astrologer_id, status, updated_at, total_billed_paise"
    )
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(80);

  const active = sessions?.filter((s) => s.status !== "closed") ?? [];
  const past = sessions?.filter((s) => s.status === "closed") ?? [];

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-100 bg-white px-4 py-3.5">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <h1 className="text-[17px] font-semibold text-gray-900 leading-tight">
              My Chats
            </h1>
            <p className="text-[12px] text-gray-400">
              {sessions?.length ?? 0} conversation
              {sessions?.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link
            href="/astrologers"
            className="flex items-center gap-1.5 rounded-full bg-amber-400 px-3.5 py-2 text-[13px] font-semibold text-gray-900 shadow-sm hover:bg-amber-500 transition active:scale-95"
          >
            <Plus className="size-3.5" />
            New chat
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 py-4 pb-8">
        {/* Active sessions */}
        {active.length > 0 && (
          <div className="mb-5">
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-widest text-gray-400 px-1">
              Active
            </p>
            <div className="space-y-2">
              {active.map((s) => {
                const astro = astrologerData(s.astrologer_id);
                const st = statusConfig(s.status);
                const href =
                  s.status === "waiting_astrologer"
                    ? `/astrologers/chats/waiting/${s.id}`
                    : `/astrologers/chats/${s.id}`;
                return (
                  <Link
                    key={s.id}
                    href={href}
                    className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm transition hover:border-amber-200 hover:shadow-md active:scale-[0.99]"
                  >
                    <ChatAvatar
                      src={astro.imageSrc}
                      alt={astro.name}
                      initials={astro.initials}
                      gradientClass={astro.gradient}
                      size={48}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-gray-900">
                        {astro.name}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] text-gray-400">
                        {s.order_code ?? "Order pending"}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${st.bg} ${st.text}`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${st.dot}`}
                        />
                        {st.label}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {relativeTime(s.updated_at)}
                      </span>
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
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-widest text-gray-400 px-1">
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
                    className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3.5 transition hover:border-gray-200 active:scale-[0.99]"
                  >
                    <ChatAvatar
                      src={astro.imageSrc}
                      alt={astro.name}
                      initials={astro.initials}
                      gradientClass={astro.gradient}
                      size={48}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium text-gray-800">
                        {astro.name}
                      </p>
                      <p className="mt-0.5 text-[12px] text-gray-400">
                        {(s.total_billed_paise ?? 0) > 0
                          ? formatInrFromPaisePrecise(s.total_billed_paise ?? 0)
                          : "No charge"}
                        {" · "}
                        {relativeTime(s.updated_at)}
                      </p>
                    </div>
                    <span className={`text-[11px] font-medium ${st.text}`}>
                      {st.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {(!sessions || sessions.length === 0) && (
          <div className="flex flex-col items-center gap-5 py-28 text-center">
            <div className="flex size-20 items-center justify-center rounded-full bg-amber-50">
              <MessageCircle className="size-9 text-amber-400" />
            </div>
            <div>
              <p className="text-[17px] font-semibold text-gray-900">
                No chats yet
              </p>
              <p className="mt-1 text-[14px] text-gray-500">
                Start your first live session with an astrologer.
              </p>
            </div>
            <Link
              href="/astrologers"
              className="rounded-full bg-amber-400 px-6 py-2.5 text-[14px] font-semibold text-gray-900 shadow-sm hover:bg-amber-500 transition"
            >
              Browse astrologers
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
