import Link from "next/link";
import { Menu } from "lucide-react";

const NAV_LINKS = [
  { label: "Free Kundli", href: "/free-kundli" },
  { label: "Tools", href: "/tools" },
  { label: "Kundli Report", href: "/kundli-report" },
  { label: "Consultation", href: "/consultation" },
  { label: "About", href: "/about" },
];

export function SiteHeader() {
  return (
    <header className="site-header sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link id="site-header-logo-link" href="/" className="flex flex-col leading-none">
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
              id={`site-header-${link.href === "/free-kundli" ? "free-kundli" : link.href === "/kundli-report" ? "kundli-report" : link.href === "/consultation" ? "consultation" : link.href === "/tools" ? "tools" : "about"}-link`}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex">
          <Link
            id="site-header-free-kundli-cta"
            href="/free-kundli"
            className="inline-flex h-7 items-center justify-center rounded-[12px] bg-brand px-2.5 text-[0.8rem] font-medium text-white transition-colors hover:bg-brand-hover"
          >
            Get Free Kundli
          </Link>
        </div>

        {/* Mobile menu (no client JS state) */}
        <details className="relative md:hidden [&_summary::-webkit-details-marker]:hidden">
          <summary
            id="site-header-mobile-menu-toggle"
            className="flex cursor-pointer list-none items-center rounded-md p-1.5 text-foreground"
            aria-label="Toggle menu"
          >
            <Menu size={22} />
          </summary>
          <div className="absolute right-0 top-[calc(100%+0.45rem)] z-50 w-[min(92vw,22rem)] rounded-2xl border border-border/60 bg-background p-4 shadow-lg">
            <nav className="flex flex-col gap-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  id={`site-header-mobile-${link.href === "/free-kundli" ? "free-kundli" : link.href === "/kundli-report" ? "kundli-report" : link.href === "/consultation" ? "consultation" : link.href === "/tools" ? "tools" : "about"}-link`}
                  href={link.href}
                  className="text-base font-medium text-foreground"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                id="site-header-mobile-free-kundli-cta"
                href="/free-kundli"
                className="mt-1 inline-flex w-full items-center justify-center rounded-lg bg-brand px-3 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover"
              >
                Get Free Kundli
              </Link>
            </nav>
          </div>
        </details>
      </div>
    </header>
  );
}
