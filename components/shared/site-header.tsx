"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { label: "Free Kundli", href: "/free-kundli" },
  { label: "Tools", href: "/tools" },
  { label: "Kundli Report", href: "/kundli-report" },
  { label: "Consultation", href: "/consultation" },
  { label: "About", href: "/about" },
];

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex flex-col leading-none">
          <span className="font-heading text-2xl font-semibold tracking-wide text-foreground">
            Vedगuide
          </span>
          <span className="text-[10px] font-medium tracking-wide text-brand/70">
            by AstroGuru Ashutosh
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex">
          <Button
            size="sm"
            className="bg-brand hover:bg-brand-hover text-white"
            render={<Link href="/free-kundli" />}
          >
            Get Free Kundli
          </Button>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="flex md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="border-t border-border/60 bg-background px-4 pb-6 pt-4 md:hidden">
          <nav className="flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-base font-medium text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Button
              className="mt-2 w-full bg-brand hover:bg-brand-hover text-white"
              render={<Link href="/free-kundli" onClick={() => setMobileOpen(false)} />}
            >
              Get Free Kundli
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
