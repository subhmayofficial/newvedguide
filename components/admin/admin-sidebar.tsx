"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sun, Moon, LogOut, X } from "lucide-react";
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
      { label: "Reviews", href: "/admindeoghar/reviews" },
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
      { label: "Support", href: "/admindeoghar/support" },
      { label: "Automations", href: "/admindeoghar/automations" },
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

export function AdminSidebar({
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
      <button
        type="button"
        aria-label="Close navigation menu"
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-30 bg-black/45 transition-opacity md:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[270px] max-w-[88vw] shrink-0 flex-col bg-sidebar transition-transform duration-200 md:static md:z-auto md:w-[250px] md:max-w-none md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ borderRight: "1px solid var(--sidebar-border)" }}
      >
      {/* ── Logo ─────────────────────────────────────────────────────── */}
      <div
        className="flex h-[56px] shrink-0 items-center justify-between px-5"
        style={{ borderBottom: "1px solid var(--sidebar-border)" }}
      >
        <div className="flex items-center">
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
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[rgba(255,255,255,0.55)] hover:bg-[rgba(255,255,255,0.07)] md:hidden"
          aria-label="Close sidebar"
        >
          <X size={15} />
        </button>
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
            <ul className="space-y-1">
              {section.items.map((item) => {
                const isActive =
                  item.href === "/admindeoghar"
                    ? pathname === "/admindeoghar"
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "group flex h-[34px] items-center gap-2 rounded-lg px-2.5 text-[13px] font-medium transition-all duration-150",
                        isActive
                          ? "bg-[rgba(255,255,255,0.12)] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                          : "text-[rgba(255,255,255,0.52)] hover:bg-[rgba(255,255,255,0.055)] hover:text-[rgba(255,255,255,0.92)]"
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full transition-colors",
                          isActive ? "bg-white" : "bg-[rgba(255,255,255,0.25)] group-hover:bg-[rgba(255,255,255,0.65)]"
                        )}
                      />
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
    </>
  );
}
