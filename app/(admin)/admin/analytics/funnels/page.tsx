import Link from "next/link";

export const dynamic = "force-dynamic";

export default function FunnelsIndexPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-3xl font-bold">Funnels</h1>
      <p className="text-sm text-muted-foreground">
        Named funnel analytics from internal events.
      </p>
      <Link
        href="/admin/analytics/funnels/kfp"
        className="inline-flex rounded-xl border border-border/60 bg-card px-5 py-4 text-sm font-medium shadow-sm hover:border-brand/40"
      >
        KFP funnel (Free Kundli path) →
      </Link>
    </div>
  );
}
