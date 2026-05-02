import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { formatInrFromPaise } from "@/lib/format-money";

export const metadata: Metadata = {
  title: "Your account",
  description: "VedGuide account, wallet, and chats.",
};

export default async function UserDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("display_name, wallet_balance_paise")
    .eq("id", user.id)
    .maybeSingle();

  const { count: chatCount } = await supabase
    .from("chat_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const name =
    profile?.display_name ?? user.email?.split("@")[0] ?? "there";

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="font-heading text-3xl font-semibold">Hi, {name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>

      <div className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Wallet balance
            </p>
            <p className="font-heading text-2xl font-semibold tabular-nums">
              {formatInrFromPaise(profile?.wallet_balance_paise ?? 0)}
            </p>
          </div>
          <Button nativeButton={false} render={<Link href="/astrologers" />} variant="outline" className="rounded-xl">
            Add via astrologers page
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Open the live astrologer experience to use the wallet button in the top
          bar (test top-up only).
        </p>
      </div>

      <ul className="mt-6 space-y-2">
        <li>
          <Link
            href="/astrologers/chats"
            className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium transition hover:border-brand/30"
          >
            My chats
            <span className="text-muted-foreground">
              {chatCount ?? 0} conversations
            </span>
          </Link>
        </li>
        <li>
          <Link
            href="/users/settings"
            className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium transition hover:border-brand/30"
          >
            Settings
            <span className="text-muted-foreground">→</span>
          </Link>
        </li>
        <li>
          <Link
            href="/astrologers"
            className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium transition hover:border-brand/30"
          >
            Talk to astrologers
            <span className="text-muted-foreground">→</span>
          </Link>
        </li>
      </ul>
    </div>
  );
}
