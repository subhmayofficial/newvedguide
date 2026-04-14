import Link from "next/link";

const QUICK_LINKS = [
  { label: "Free Kundli", href: "/free-kundli" },
  { label: "Tools", href: "/tools" },
  { label: "Kundli Report", href: "/kundli-report" },
  { label: "Privacy", href: "/privacy-policy" },
  { label: "Terms", href: "/terms" },
  { label: "Refund", href: "/refund-policy" },
  { label: "Contact", href: "/contact" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border/50 bg-surface">
      {/* ── Mobile: single compact block ── */}
      <div className="px-4 py-6 sm:hidden">
        <div className="flex items-center justify-between">
          <Link id="site-footer-mobile-logo-link" href="/" className="flex flex-col leading-none">
            <span className="font-heading text-xl font-bold text-foreground">Vedगuide</span>
            <span className="text-[10px] font-medium text-brand/70">by AstroGuru Ashutosh</span>
          </Link>
          <p className="text-[10px] font-semibold text-muted-foreground">
            © {new Date().getFullYear()} VedGuide
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
          {QUICK_LINKS.map((l) => (
            <Link
              key={l.href}
              id={`site-footer-mobile-${l.href === "/free-kundli" ? "free-kundli" : l.href === "/kundli-report" ? "kundli-report" : l.href === "/tools" ? "tools" : l.href === "/privacy-policy" ? "privacy" : l.href === "/terms" ? "terms" : l.href === "/refund-policy" ? "refund" : "contact"}-link`}
              href={l.href}
              className="text-[12px] font-medium text-muted-foreground hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </div>

      </div>

      {/* ── Desktop: full grid ── */}
      <div className="mx-auto hidden max-w-5xl px-6 py-10 sm:block">
        <div className="flex flex-wrap gap-x-12 gap-y-8">
          <div className="min-w-[160px]">
            <Link id="site-footer-logo-link" href="/" className="flex flex-col leading-none">
              <span className="font-heading text-2xl font-bold text-foreground">Vedगuide</span>
              <span className="mt-0.5 text-[11px] font-medium text-brand/70">by AstroGuru Ashutosh</span>
            </Link>
            <p className="mt-3 max-w-[200px] text-sm leading-relaxed text-muted-foreground">
              Vedic astrology rooted in tradition, guided by AstroGuru Ashutosh.
            </p>
          </div>

          {[
            {
              title: "Services",
              links: [
                { label: "Free Kundli", href: "/free-kundli" },
                { label: "Tools", href: "/tools" },
                { label: "Kundli Report", href: "/kundli-report" },
                { label: "Consultation", href: "/consultation" },
              ],
            },
            {
              title: "Legal",
              links: [
                { label: "Privacy Policy", href: "/privacy-policy" },
                { label: "Terms", href: "/terms" },
                { label: "Refund Policy", href: "/refund-policy" },
                { label: "Disclaimer", href: "/disclaimer" },
              ],
            },
            {
              title: "Support",
              links: [
                { label: "FAQ", href: "/faq" },
                { label: "Contact", href: "/contact" },
              ],
            },
          ].map(({ title, links }) => (
            <div key={title}>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {title}
              </p>
              <ul className="space-y-2">
                {links.map((l) => (
                  <li key={l.href}>
                    <Link
                      id={`site-footer-${l.href === "/free-kundli" ? "free-kundli" : l.href === "/kundli-report" ? "kundli-report" : l.href === "/consultation" ? "consultation" : l.href === "/tools" ? "tools" : l.href === "/privacy-policy" ? "privacy" : l.href === "/terms" ? "terms" : l.href === "/refund-policy" ? "refund" : l.href === "/disclaimer" ? "disclaimer" : l.href === "/faq" ? "faq" : "contact"}-link`}
                      href={l.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 border-t border-border/50 pt-5">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} VedGuide. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
