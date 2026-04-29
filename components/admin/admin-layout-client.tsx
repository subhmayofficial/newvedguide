"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminThemeProvider } from "@/components/admin/admin-theme-context";
import { Menu } from "lucide-react";

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (pathname === "/admindeoghar/login" || pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <AdminThemeProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-background">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border/70 bg-background/95 px-4 backdrop-blur md:hidden">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground"
              aria-label="Open navigation menu"
            >
              <Menu size={18} />
            </button>
            <p className="text-sm font-semibold text-foreground">VedGuide Admin</p>
          </header>
          {/*
            key={pathname} causes React to remount this element on every navigation,
            which re-triggers the CSS entrance animation for each page change.
          */}
          <main
            key={pathname}
            className="flex-1 overflow-y-auto p-4 md:p-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
          >
            {children}
          </main>
        </div>
      </div>
    </AdminThemeProvider>
  );
}
