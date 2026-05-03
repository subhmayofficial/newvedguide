"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, Menu, MoreVertical, Settings, User, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isPhoneOtpSyntheticEmail } from "@/lib/auth/phone-login-identity";
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
    const poll = window.setInterval(() => {
      void (async () => {
        const supabase = createClient();
        const { data } = await supabase
          .from("user_profiles")
          .select("wallet_balance_paise")
          .eq("id", user.id)
          .maybeSingle();
        if (data && typeof data.wallet_balance_paise === "number") {
          setBalancePaise(data.wallet_balance_paise);
        }
      })();
    }, 18000);
    return () => window.clearInterval(poll);
  }, [user?.id]);

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

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              className="inline-flex shrink-0 rounded-xl border-brand/25 bg-brand-light/20 px-2 text-brand sm:px-3 dark:bg-brand/15"
              nativeButton={false}
              render={
                <Link
                  href="/astrologers/wallet"
                  title="Wallet — add money or view activity"
                />
              }
            >
              <Wallet className="size-3.5 shrink-0" aria-hidden />
              <span className="sr-only">Wallet balance </span>
              <span className="max-w-[5.25rem] truncate tabular-nums text-xs font-semibold sm:max-w-[7rem] sm:text-sm">
                {formatInrFromPaise(balancePaise)}
              </span>
            </Button>

            {user ? (
              <>
                <Link
                  href="/user"
                  className="flex max-w-[10rem] cursor-pointer items-center gap-2 rounded-xl border border-border bg-card px-2.5 py-1.5 text-sm font-medium text-foreground transition hover:border-brand/35 hover:bg-muted/50"
                  title="Your profile"
                >
                  <User className="size-4 shrink-0 text-brand" aria-hidden />
                  <span className="hidden max-w-[7rem] truncate sm:inline">
                    {user.displayName ||
                      (isPhoneOtpSyntheticEmail(user.email)
                        ? "Profile"
                        : user.email.split("@")[0])}
                  </span>
                  <span className="sr-only">Open profile</span>
                </Link>

                <details className="relative [&_summary::-webkit-details-marker]:hidden">
                  <summary
                    className="flex cursor-pointer list-none items-center justify-center rounded-xl border border-border/80 bg-card p-2 text-muted-foreground transition hover:border-brand/30 hover:bg-muted/40 hover:text-foreground"
                    aria-label="More options"
                  >
                    <MoreVertical className="size-5" strokeWidth={2.25} />
                  </summary>
                  <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(calc(100vw-2rem),16rem)] overflow-hidden rounded-2xl border border-border/80 bg-popover py-1 shadow-xl ring-1 ring-black/5 dark:ring-white/10">
                    <div className="border-b border-border/60 px-3 py-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Signed in as
                      </p>
                      <p className="mt-0.5 truncate text-sm font-medium text-foreground">
                        {isPhoneOtpSyntheticEmail(user.email)
                          ? "Mobile number"
                          : user.email}
                      </p>
                    </div>
                    <Link
                      href="/users/settings"
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
                    >
                      <Settings className="size-4 shrink-0 text-muted-foreground" />
                      Settings
                    </Link>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-medium text-foreground transition hover:bg-muted"
                      onClick={signOut}
                    >
                      <LogOut className="size-4 shrink-0 text-muted-foreground" />
                      Sign out
                    </button>
                  </div>
                </details>
              </>
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
                className="flex cursor-pointer list-none items-center rounded-xl border border-transparent p-1.5 text-foreground transition hover:border-border hover:bg-muted/50"
                aria-label="Navigation menu"
              >
                <Menu className="size-[22px]" strokeWidth={2.25} />
              </summary>
              <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(92vw,19rem)] overflow-hidden rounded-2xl border border-border/80 bg-popover py-2 shadow-xl ring-1 ring-black/5 dark:ring-white/10">
                <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Navigate
                </p>
                {navLinks.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="mx-1 block rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
                  >
                    {l.label}
                  </Link>
                ))}
                <div className="mx-2 my-2 border-t border-border/60" />
                <Button
                  variant="outline"
                  className="mx-2 mb-1 w-[calc(100%-1rem)] justify-start rounded-xl border-brand/25 bg-brand-light/15 text-brand dark:bg-brand/10"
                  nativeButton={false}
                  render={<Link href="/astrologers/wallet" />}
                >
                  <Wallet className="size-4" />
                  Wallet · {formatInrFromPaise(balancePaise)}
                </Button>
              </div>
            </details>
          </div>
        </div>
      </header>

    </>
  );
}
