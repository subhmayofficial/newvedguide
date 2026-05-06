"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, User, Wallet } from "lucide-react";

const TABS = [
  {
    href: "/astrologers",
    icon: Home,
    label: "Home",
    match: (p: string) => p === "/astrologers",
  },
  {
    href: "/astrologers/chats",
    icon: MessageCircle,
    label: "Chats",
    match: (p: string) => p.startsWith("/astrologers/chats"),
  },
  {
    href: "/astrologers/wallet",
    icon: Wallet,
    label: "Wallet",
    match: (p: string) => p.startsWith("/astrologers/wallet"),
  },
  {
    href: "/profile",
    icon: User,
    label: "Profile",
    match: (p: string) =>
      p === "/profile" ||
      p.startsWith("/users/") ||
      p === "/orders" ||
      p === "/support-chat" ||
      p === "/free-services" ||
      p === "/pooja" ||
      p === "/following" ||
      p === "/assistant" ||
      p === "/gift-card" ||
      p === "/remedy",
  },
] as const;

export function AppBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex h-[60px] max-w-lg items-center justify-around px-1">
        {TABS.map(({ href, icon: Icon, label, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-opacity active:opacity-70"
            >
              <div
                className={`flex size-8 items-center justify-center rounded-xl transition-colors ${
                  active ? "bg-amber-50" : ""
                }`}
              >
                <Icon
                  className={`size-[22px] transition-colors ${
                    active
                      ? "text-amber-500 stroke-[2.5]"
                      : "text-gray-400 stroke-2"
                  }`}
                />
              </div>
              <span
                className={`text-[10px] font-semibold tracking-wide transition-colors ${
                  active ? "text-amber-500" : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
