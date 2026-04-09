import Link from "next/link";

const FOOTER_LINKS = {
  Explore: [
    { label: "Free Kundli", href: "/free-kundli" },
    { label: "Kundli Report", href: "/kundli-report" },
    { label: "Consultation", href: "/consultation" },
    { label: "About VedGuide", href: "/about" },
  ],
  Tools: [
    { label: "Kundal Dhatu Check", href: "/freedhatucheck" },
    { label: "Moon Sign Finder", href: "/tools/moon-sign" },
    { label: "Nakshatra Finder", href: "/tools/nakshatra-finder" },
  ],
  Support: [
    { label: "FAQ", href: "/faq" },
    { label: "Contact", href: "/contact" },
    { label: "Support", href: "/support" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Refund Policy", href: "/refund-policy" },
    { label: "Disclaimer", href: "/disclaimer" },
  ],
};

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link
              href="/"
              className="font-heading text-2xl font-semibold text-foreground"
            >
              Vedगuide
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Vedic astrology rooted in tradition, delivered with modern
              clarity.
            </p>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {category}
              </h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-6 text-center sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} VedGuide. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Astrology for guidance only. Not a substitute for professional
            advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
