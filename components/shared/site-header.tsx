"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "Free Kundli", href: "/free-kundli" },
  { label: "Tools", href: "/tools" },
  { label: "Kundli Report", href: "/kundli-report" },
  { label: "Consultation", href: "/consultation" },
  { label: "About", href: "/about" },
];

function linkId(href: string, prefix: string): string {
  const slug =
    href === "/free-kundli"
      ? "free-kundli"
      : href === "/kundli-report"
        ? "kundli-report"
        : href === "/consultation"
          ? "consultation"
          : href === "/tools"
            ? "tools"
            : "about";
  return `${prefix}-${slug}-link`;
}

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || toggleRef.current?.contains(t)) return;
      setMobileOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <header className="site-header sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link id="site-header-logo-link" href="/" className="flex flex-col leading-none">
          <span className="font-heading text-2xl font-semibold tracking-wide text-foreground">
            Vedगuide
          </span>
          <span className="text-[10px] font-medium tracking-wide text-brand/70">
            by AstroGuru Ashutosh
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              id={linkId(link.href, "site-header")}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex">
          <Link
            id="site-header-free-kundli-cta"
            href="/free-kundli"
            className="inline-flex h-7 items-center justify-center rounded-[12px] bg-brand px-2.5 text-[0.8rem] font-medium text-white transition-colors hover:bg-brand-hover"
          >
            Get Free Kundli
          </Link>
        </div>

        <div className="relative md:hidden">
          <button
            ref={toggleRef}
            id="site-header-mobile-menu-toggle"
            type="button"
            className="flex cursor-pointer list-none items-center rounded-md p-1.5 text-foreground hover:bg-muted/80"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="site-header-mobile-panel"
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {mobileOpen ? (
            <div
              ref={panelRef}
              id="site-header-mobile-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Main navigation"
              className="absolute right-0 top-[calc(100%+0.45rem)] z-50 w-[min(92vw,22rem)] rounded-2xl border border-border/60 bg-background p-4 shadow-lg"
            >
              <nav className="flex flex-col gap-4">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    id={linkId(link.href, "site-header-mobile")}
                    href={link.href}
                    className="text-base font-medium text-foreground"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  id="site-header-mobile-free-kundli-cta"
                  href="/free-kundli"
                  className="mt-1 inline-flex w-full items-center justify-center rounded-lg bg-brand px-3 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover"
                  onClick={() => setMobileOpen(false)}
                >
                  Get Free Kundli
                </Link>
              </nav>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
