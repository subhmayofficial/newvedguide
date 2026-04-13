import Link from "next/link";

export default function AdminContentHubPage() {
  const links = [
    { href: "/admindeoghar/content/pages", label: "Pages" },
    { href: "/admindeoghar/content/faqs", label: "FAQs" },
    { href: "/admindeoghar/content/testimonials", label: "Testimonials" },
    { href: "/admindeoghar/content/banners", label: "Banners" },
  ];
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-3xl font-bold">Content</h1>
      <p className="text-sm text-muted-foreground">CMS-style modules for marketing surfaces.</p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="block rounded-xl border border-border/60 bg-card px-5 py-4 text-sm font-medium shadow-sm hover:border-brand/40"
            >
              {l.label} →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
