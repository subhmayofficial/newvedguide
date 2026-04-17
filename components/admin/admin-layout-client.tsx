"use client";

import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminThemeProvider } from "@/components/admin/admin-theme-context";

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/admindeoghar/login" || pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <AdminThemeProvider>
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden bg-background">
        {/*
          key={pathname} causes React to remount this element on every navigation,
          which re-triggers the CSS entrance animation for each page change.
        */}
        <main
          key={pathname}
          className="flex-1 overflow-y-auto p-6 md:p-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
        >
          {children}
        </main>
      </div>
    </AdminThemeProvider>
  );
}
