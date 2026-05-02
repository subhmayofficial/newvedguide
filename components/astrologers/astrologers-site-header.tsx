"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, Menu, User, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
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
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- sync layout props after refresh */
    setUser(initialUser);
    setBalancePaise(initialBalancePaise);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [initialUser, initialBalancePaise]);

  useEffect(() => {
    if (!user?.id) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`header-wallet:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_profiles",
          filter: `id=eq.${user.id}`,
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
  }, [user?.id]);

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email ?? "",
          displayName:
            (session.user.user_metadata?.display_name as string | undefined) ??
            null,
        });
        router.refresh();
      } else {
        setUser(null);
        setBalancePaise(0);
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setBalancePaise(0);
    router.push("/astrologers");
    router.refresh();
  }

  const navLinks = [
    { href: "/astrologers", label: "Astrologers" },
    { href: "/astrologers/chats", label: "My chats" },
    { href: "/astrologers/wallet", label: "Wallet" },
    { href: "/user", label: "Account" },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <Link href="/astrologers" className="flex min-w-0 flex-col leading-none">
            <span className="font-heading text-xl font-semibold tracking-wide text-foreground md:text-2xl">
              Vedगuide
            </span>
            <span className="truncate text-[10px] font-medium tracking-wide text-brand/70">
              Live chat
            </span>
          </Link>

          <nav className="hidden items-center gap-5 md:flex">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="hidden rounded-xl border-brand/25 bg-brand-light/20 text-brand sm:inline-flex dark:bg-brand/15"
              nativeButton={false}
              render={<Link href="/astrologers/wallet" />}
            >
              <Wallet className="size-3.5" />
              <span className="max-w-[7rem] truncate tabular-nums">
                {formatInrFromPaise(balancePaise)}
              </span>
            </Button>

            {user ? (
              <details className="relative [&_summary::-webkit-details-marker]:hidden">
                <summary
                  className="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-border bg-card px-2.5 py-1.5 text-sm font-medium"
                  aria-label="Account menu"
                >
                  <User className="size-4 text-muted-foreground" />
                  <span className="hidden max-w-[8rem] truncate sm:inline">
                    {user.displayName || user.email.split("@")[0]}
                  </span>
                </summary>
                <div className="absolute right-0 top-[calc(100%+0.35rem)] z-50 w-52 rounded-xl border border-border bg-card py-1 shadow-lg">
                  <p className="border-b border-border px-3 py-2 text-xs text-muted-foreground">
                    {user.email}
                  </p>
                  <Link
                    href="/users/settings"
                    className="block px-3 py-2 text-sm hover:bg-muted"
                  >
                    Settings
                  </Link>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={signOut}
                  >
                    <LogOut className="size-3.5" />
                    Sign out
                  </button>
                </div>
              </details>
            ) : (
              <Button
                size="sm"
                className="rounded-xl bg-brand font-medium text-white hover:bg-brand-hover"
                nativeButton={false}
                render={<Link href="/login?redirect=/astrologers" />}
              >
                Sign in
              </Button>
            )}

            <details className="relative md:hidden [&_summary::-webkit-details-marker]:hidden">
              <summary
                className="flex cursor-pointer list-none items-center rounded-md p-1.5 text-foreground"
                aria-label="Menu"
              >
                <Menu size={22} />
              </summary>
              <div className="absolute right-0 top-[calc(100%+0.35rem)] z-50 w-[min(92vw,18rem)] rounded-2xl border border-border bg-background p-3 shadow-lg">
                <Button
                  variant="outline"
                  className="mb-2 w-full justify-start rounded-xl"
                  nativeButton={false}
                  render={<Link href="/astrologers/wallet" />}
                >
                  <Wallet className="size-4" />
                  Wallet · {formatInrFromPaise(balancePaise)}
                </Button>
                {navLinks.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="block rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </details>
          </div>
        </div>
      </header>

    </>
  );
}
