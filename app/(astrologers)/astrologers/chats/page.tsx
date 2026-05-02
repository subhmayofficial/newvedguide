import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LIVE_CHAT_ASTROLOGERS } from "@/lib/data/live-chat-astrologers";
import { formatInrFromPaisePrecise } from "@/lib/format-money";

export const metadata: Metadata = {
  title: "My chats",
  description: "Your live astrologer conversations on VedGuide.",
};

function astrologerName(id: string): string {
  return LIVE_CHAT_ASTROLOGERS.find((a) => a.id === id)?.name ?? id;
}

function sessionStatusLabel(status: string): string {
  if (status === "waiting_astrologer") return "Waiting for astrologer";
  if (status === "open") return "Live";
  if (status === "closed") return "Closed";
  return status;
}

export default async function AstrologerChatsListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: sessions } = await supabase
    .from("chat_sessions")
    .select("id, order_code, astrologer_id, status, updated_at, total_billed_paise")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-heading text-3xl font-semibold">My chats</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Each chat is a wallet order with a code and total. Continue or start from the{" "}
        <Link href="/astrologers" className="font-medium text-brand underline-offset-2 hover:underline">
          astrologer directory
        </Link>
        .{" "}
        <Link href="/astrologers/wallet" className="font-medium text-brand underline-offset-2 hover:underline">
          Wallet & history →
        </Link>
      </p>

      <ul className="mt-8 space-y-3">
        {sessions?.length ? (
          sessions.map((s) => (
            <li key={s.id}>
              <Link
                href={
                  s.status === "waiting_astrologer"
                    ? `/astrologers/chats/waiting/${s.id}`
                    : `/astrologers/chats/${s.id}`
                }
                className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-4 transition hover:border-brand/30 hover:shadow-sm"
              >
                <div>
                  <p className="font-medium">{astrologerName(s.astrologer_id)}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {s.order_code ?? "Order pending"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {sessionStatusLabel(s.status)}
                    {s.status === "closed" || (s.total_billed_paise ?? 0) > 0
                      ? ` · ${formatInrFromPaisePrecise(s.total_billed_paise ?? 0)}`
                      : ""}{" "}
                    · {new Date(s.updated_at).toLocaleString("en-IN")}
                  </p>
                </div>
                <span className="text-sm font-medium text-brand">View →</span>
              </Link>
            </li>
          ))
        ) : (
          <li className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center text-sm text-muted-foreground">
            No chats yet. Pick an astrologer to start.
          </li>
        )}
      </ul>
    </div>
  );
}
