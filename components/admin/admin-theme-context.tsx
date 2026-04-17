"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
type Ctx = { theme: Theme; toggle: () => void };

export const AdminThemeContext = createContext<Ctx>({
  theme: "light",
  toggle: () => {},
});

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = localStorage.getItem("admin-theme");
    if (stored === "dark") setTheme("dark");
  }, []);

  function toggle() {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("admin-theme", next);
      return next;
    });
  }

  // admin-shell scopes the zinc/neutral palette to the admin layout only.
  // .dark on top activates .admin-shell.dark vars (deep zinc dark mode).
  const cls = theme === "dark" ? "admin-shell dark" : "admin-shell";

  return (
    <AdminThemeContext.Provider value={{ theme, toggle }}>
      <div className={`${cls} flex h-screen overflow-hidden`} suppressHydrationWarning>
        {children}
      </div>
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme() {
  return useContext(AdminThemeContext);
}
