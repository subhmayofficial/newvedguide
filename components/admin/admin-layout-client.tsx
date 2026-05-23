"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminThemeProvider } from "@/components/admin/admin-theme-context";
import { AdminToastProvider } from "@/components/admin/admin-toast-provider";
import { isAdminPanelLoginPath } from "@/lib/admin/admin-paths";
import { Menu } from "lucide-react";

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (pathname && isAdminPanelLoginPath(pathname)) {
    return <>{children}</>;
  }

  return (
    <AdminThemeProvider>
      <AdminToastProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-hidden bg-background">
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
            <main
              className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8"
            >
              {children}
            </main>
          </div>
        </div>
      </AdminToastProvider>
    </AdminThemeProvider>
  );
}
