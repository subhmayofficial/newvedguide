"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatInrFromPaise } from "@/lib/format-money";

export type AstrologersHeaderUser = {
  id: string;
  email: string;
  displayName: string | null;
};

type AstrologersSiteHeaderProps = {
  initialUser: AstrologersHeaderUser | null;
  initialBalancePaise: number;
};

export function AstrologersSiteHeader({
  initialUser,
  initialBalancePaise,
}: AstrologersSiteHeaderProps) {
  const router = useRouter();
  const [user, setUser] = useState<AstrologersHeaderUser | null>(initialUser);
  const [balancePaise, setBalancePaise] = useState(initialBalancePaise);

  // Sync when server re-renders
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setUser(initialUser);
    setBalancePaise(initialBalancePaise);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [initialUser, initialBalancePaise]);

  // Poll wallet every 18 s
  useEffect(() => {
    if (!user?.id) return;
    const id = window.setInterval(() => {
      void (async () => {
        const { data } = await createClient()
          .from("user_profiles")
          .select("wallet_balance_paise")
          .eq("id", user.id)
          .maybeSingle();
        if (typeof data?.wallet_balance_paise === "number")
          setBalancePaise(data.wallet_balance_paise);
      })();
    }, 18_000);
    return () => window.clearInterval(id);
  }, [user?.id]);

  // Real-time wallet via Supabase channel
  useEffect(() => {
    if (!user?.id) return;
    const supabase = createClient();
    const ch = supabase
      .channel(`hdr-wallet:${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "user_profiles", filter: `id=eq.${user.id}` },
        (payload) => {
          const row = payload.new as { wallet_balance_paise?: number };
          if (typeof row.wallet_balance_paise === "number")
            setBalancePaise(row.wallet_balance_paise);
        }
      )
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [user?.id]);

  // Sync auth state
  useEffect(() => {
    const { data: { subscription } } = createClient().auth.onAuthStateChange((_e, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email ?? "",
          displayName: (session.user.user_metadata?.display_name as string | undefined) ?? null,
        });
        router.refresh();
      } else {
        setUser(null);
        setBalancePaise(0);
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
        {/* Logo */}
        <Link href="/astrologers" className="flex flex-col leading-none">
          <span className="font-heading text-[20px] font-bold tracking-wide text-gray-900">
            Vedगuide
          </span>
          <span className="text-[9px] font-semibold uppercase tracking-widest text-amber-500">
            Live · Astrology
          </span>
        </Link>

        {/* Wallet pill — always visible, links to wallet page */}
        {user && (
          <Link
            href="/astrologers/wallet"
            className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 transition hover:bg-amber-100 active:scale-95"
          >
            <Wallet className="size-3.5 text-amber-600" />
            <span className="text-[13px] font-bold tabular-nums text-amber-700">
              {formatInrFromPaise(balancePaise)}
            </span>
          </Link>
        )}

        {/* Not logged in */}
        {!user && (
          <Link
            href="/login?redirect=/astrologers"
            className="rounded-full bg-amber-400 px-4 py-1.5 text-[13px] font-semibold text-gray-900 shadow-sm hover:bg-amber-500 transition"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
