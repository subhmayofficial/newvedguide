"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Package,
  CreditCard,
  FileStack,
  Wrench,
  CalendarClock,
  Settings,
  LogOut,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type NavLeaf = { label: string; href: string };
type NavGroup = { label: string; icon: LucideIcon; items: NavLeaf[] };

const OVERVIEW: NavLeaf[] = [{ label: "Dashboard", href: "/admindeoghar" }];

const CORE: NavLeaf[] = [
  { label: "Leads", href: "/admindeoghar/leads" },
  { label: "Orders", href: "/admindeoghar/orders" },
  { label: "Analytics", href: "/admindeoghar/analytics" },
];

const CATALOG: NavLeaf[] = [{ label: "Products", href: "/admindeoghar/products" }];

const FINANCE: NavLeaf[] = [
  { label: "Payments", href: "/admindeoghar/payments" },
  { label: "Coupons", href: "/admindeoghar/coupons" },
];

const CONTENT: NavLeaf[] = [
  { label: "Pages", href: "/admindeoghar/content/pages" },
  { label: "FAQs", href: "/admindeoghar/content/faqs" },
  { label: "Testimonials", href: "/admindeoghar/content/testimonials" },
  { label: "Banners", href: "/admindeoghar/content/banners" },
];

const TOOLS_NAV: NavLeaf[] = [{ label: "Tools", href: "/admindeoghar/tools" }];

const OPS: NavLeaf[] = [
  { label: "Consultations", href: "/admindeoghar/consultations" },
  { label: "Logs", href: "/admindeoghar/logs" },
];

const SYSTEM: NavLeaf[] = [
  { label: "Team", href: "/admindeoghar/team" },
  { label: "Settings", href: "/admindeoghar/settings" },
];

const GROUPS: NavGroup[] = [
  { label: "Overview", icon: LayoutDashboard, items: OVERVIEW },
  { label: "Core", icon: Users, items: CORE },
  { label: "Catalog", icon: Package, items: CATALOG },
  { label: "Finance", icon: CreditCard, items: FINANCE },
  { label: "Content", icon: FileStack, items: CONTENT },
  { label: "Tools", icon: Wrench, items: TOOLS_NAV },
  { label: "Operations", icon: CalendarClock, items: OPS },
  { label: "System", icon: Settings, items: SYSTEM },
];

function NavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
          : "text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      {label}
    </Link>
  );
}

function NavSection({
  group,
  pathname,
}: {
  group: NavGroup;
  pathname: string;
}) {
  const [open, setOpen] = useState(true);
  const Icon = group.icon;

  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50"
      >
        <span className="flex items-center gap-2">
          <Icon className="size-3.5 opacity-70" />
          {group.label}
        </span>
        <ChevronDown
          className={cn("size-3.5 transition-transform", open ? "rotate-0" : "-rotate-90")}
        />
      </button>
      {open && (
        <ul className="mt-0.5 space-y-0.5 border-l border-sidebar-border/60 pl-2 ml-2">
          {group.items.map((item) => {
            const isActive =
              item.href === "/admindeoghar"
                ? pathname === "/admindeoghar"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <NavLink href={item.href} label={item.label} active={isActive} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/admindeoghar/login");
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-[oklch(0.18_0.02_50)] text-sidebar-foreground">
      <div className="flex h-14 items-center border-b border-white/10 px-5">
        <span className="font-heading text-lg font-semibold tracking-tight text-white">
          Vedगuide
        </span>
        <span className="ml-2 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/80">
          Ops
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {GROUPS.map((g) => (
          <NavSection key={g.label} group={g} pathname={pathname} />
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
