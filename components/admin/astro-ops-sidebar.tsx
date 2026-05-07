"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sun, Moon, LogOut, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useAdminTheme } from "@/components/admin/admin-theme-context";
import { ASTRO_OPS_BASE } from "@/lib/admin/astro-ops-paths";

const NAV = [
  { label: "Dashboard", href: ASTRO_OPS_BASE, match: (p: string) => p === ASTRO_OPS_BASE },
  { label: "Astrologers", href: `${ASTRO_OPS_BASE}/astrologers`, match: (p: string) => p.startsWith(`${ASTRO_OPS_BASE}/astrologers`) },
  { label: "Chat inbox", href: `${ASTRO_OPS_BASE}/inbox`, match: (p: string) => p.startsWith(`${ASTRO_OPS_BASE}/inbox`) },
  { label: "Sessions", href: `${ASTRO_OPS_BASE}/sessions`, match: (p: string) => p.startsWith(`${ASTRO_OPS_BASE}/sessions`) },
  { label: "Users", href: `${ASTRO_OPS_BASE}/users`, match: (p: string) => p.startsWith(`${ASTRO_OPS_BASE}/users`) },
  { label: "Wallet ledger", href: `${ASTRO_OPS_BASE}/wallet-ledger`, match: (p: string) => p === `${ASTRO_OPS_BASE}/wallet-ledger` },
  { label: "Wallet cashback", href: `${ASTRO_OPS_BASE}/settings`, match: (p: string) => p.startsWith(`${ASTRO_OPS_BASE}/settings`) },
] as const;

export function AstroOpsSidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { theme, toggle } = useAdminTheme();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/admindeoghar/login");
  }

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity md:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden={!isOpen}
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-[min(100%,280px)] flex-col border-r border-border/70 bg-card shadow-xl transition-transform duration-200 md:static md:z-0 md:translate-x-0 md:shadow-none",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-border/60 px-4">
          <div>
            <p className="font-heading text-sm font-bold text-foreground">Live Astrology</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Ops console</p>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted md:hidden"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {NAV.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onClose()}
                className={cn(
                  "block rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                  active
                    ? "bg-brand/15 text-brand"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border/60 p-3 space-y-2">
          <Link
            href="/admindeoghar"
            className="block rounded-xl border border-border/80 bg-muted/30 px-3 py-2 text-center text-xs font-semibold text-foreground hover:bg-muted/50"
          >
            Main admin (commerce)
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggle}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-background py-2 text-xs font-medium"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              {theme === "dark" ? "Light" : "Dark"}
            </button>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-background py-2 text-xs font-medium text-destructive"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
