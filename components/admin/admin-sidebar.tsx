"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sun, Moon, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useAdminTheme } from "@/components/admin/admin-theme-context";

// ─── Navigation structure ──────────────────────────────────────────────────

const NAV_SECTIONS = [
  {
    label: "Workspace",
    items: [
      { label: "Dashboard", href: "/admindeoghar" },
    ],
  },
  {
    label: "Commerce",
    items: [
      { label: "Leads", href: "/admindeoghar/leads" },
      { label: "Orders", href: "/admindeoghar/orders" },
      { label: "Analytics", href: "/admindeoghar/analytics" },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "Products", href: "/admindeoghar/products" },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Payments", href: "/admindeoghar/payments" },
      { label: "Coupons", href: "/admindeoghar/coupons" },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Pages", href: "/admindeoghar/content/pages" },
      { label: "FAQs", href: "/admindeoghar/content/faqs" },
      { label: "Testimonials", href: "/admindeoghar/content/testimonials" },
      { label: "Banners", href: "/admindeoghar/content/banners" },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Consultations", href: "/admindeoghar/consultations" },
      { label: "Integrations", href: "/admindeoghar/integrations" },
      { label: "Tools", href: "/admindeoghar/tools" },
      { label: "Logs", href: "/admindeoghar/logs" },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Team", href: "/admindeoghar/team" },
      { label: "Settings", href: "/admindeoghar/settings" },
    ],
  },
] as const;

// ─── Sidebar ───────────────────────────────────────────────────────────────

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { theme, toggle } = useAdminTheme();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/admindeoghar/login");
  }

  return (
    <aside
      className="flex w-[220px] shrink-0 flex-col bg-sidebar"
      style={{ borderRight: "1px solid var(--sidebar-border)" }}
    >
      {/* ── Logo ─────────────────────────────────────────────────────── */}
      <div
        className="flex h-[52px] shrink-0 items-center px-5"
        style={{ borderBottom: "1px solid var(--sidebar-border)" }}
      >
        <span
          className="text-[15px] font-semibold tracking-[-0.01em]"
          style={{ color: "var(--sidebar-foreground)" }}
        >
          Vedगuide
        </span>
        <span
          className="ml-2 rounded-[3px] px-[5px] py-[2px] text-[9px] font-bold uppercase tracking-[0.1em]"
          style={{
            background: "rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.35)",
          }}
        >
          Admin
        </span>
      </div>

      {/* ── Navigation ───────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_SECTIONS.map((section, sectionIdx) => (
          <div key={section.label} className={cn("mb-1", sectionIdx > 0 && "mt-5")}>
            {/* Section label */}
            <p
              className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.09em]"
              style={{ color: "rgba(255,255,255,0.25)" }}
            >
              {section.label}
            </p>

            {/* Nav items */}
            <ul className="space-y-px">
              {section.items.map((item) => {
                const isActive =
                  item.href === "/admindeoghar"
                    ? pathname === "/admindeoghar"
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex h-[30px] items-center rounded-md px-2.5 text-[13px] font-medium transition-colors duration-100",
                        isActive
                          ? "bg-[rgba(255,255,255,0.09)] text-white"
                          : "text-[rgba(255,255,255,0.45)] hover:bg-[rgba(255,255,255,0.055)] hover:text-[rgba(255,255,255,0.80)]"
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <div
        className="shrink-0 px-3 py-3"
        style={{ borderTop: "1px solid var(--sidebar-border)" }}
      >
        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggle}
          className="flex h-[30px] w-full items-center gap-2 rounded-md px-2.5 text-[12px] font-medium transition-colors duration-100 hover:bg-[rgba(255,255,255,0.055)]"
          style={{ color: "rgba(255,255,255,0.35)" }}
        >
          {theme === "dark"
            ? <Sun size={12} strokeWidth={2} />
            : <Moon size={12} strokeWidth={2} />
          }
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>

        {/* Sign out */}
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-px flex h-[30px] w-full items-center gap-2 rounded-md px-2.5 text-[12px] font-medium transition-colors duration-100 hover:bg-[rgba(255,255,255,0.055)]"
          style={{ color: "rgba(255,255,255,0.35)" }}
        >
          <LogOut size={12} strokeWidth={2} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
