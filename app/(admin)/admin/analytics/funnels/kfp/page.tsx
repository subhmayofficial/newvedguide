import { createServiceClient } from "@/lib/supabase/server";
import { defaultRange, eventCountsByName } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

const STEPS = [
  "home_page_view",
  "free_kundli_start",
  "free_kundli_submit",
  "free_kundli_result_view",
  "sales_page_view",
  "checkout_page_view",
  "payment_initiated",
  "payment_success",
  "thank_you_view",
] as const;

export default async function KfpFunnelPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const range = sp.from && sp.to ? { from: sp.from, to: sp.to } : defaultRange();
  const supabase = createServiceClient();
  const counts = await eventCountsByName(supabase, [...STEPS], range);

  const first = counts[STEPS[0]] ?? 1;

  const maxDrop = STEPS.reduce(
    (acc, step, i) => {
      const c = counts[step] ?? 0;
      const prev = i === 0 ? c : counts[STEPS[i - 1]] ?? 0;
      const dropPct = i === 0 || !prev ? 0 : Math.round((1 - c / prev) * 1000) / 10;
      if (i > 0 && dropPct > acc.pct) return { step, pct: dropPct };
      return acc;
    },
    { step: STEPS[1], pct: 0 } as { step: (typeof STEPS)[number]; pct: number }
  );

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-heading text-3xl font-bold">KFP funnel</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Free Kundli acquisition path · internal events
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/30 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Step</th>
              <th className="px-4 py-3">Count</th>
              <th className="px-4 py-3">Conv. prev</th>
              <th className="px-4 py-3">Drop-off</th>
              <th className="px-4 py-3">Drop %</th>
              <th className="px-4 py-3">From first</th>
            </tr>
          </thead>
          <tbody>
            {STEPS.map((step, i) => {
              const c = counts[step] ?? 0;
              const prev = i === 0 ? c : counts[STEPS[i - 1]] ?? 0;
              const convPrev = i === 0 ? 100 : prev ? Math.round((c / prev) * 1000) / 10 : 0;
              const drop = i === 0 ? 0 : prev - c;
              const dropPct = i === 0 || !prev ? 0 : Math.round((1 - c / prev) * 1000) / 10;
              const fromFirst = Math.round((c / first) * 1000) / 10;
              return (
                <tr key={step} className="border-b border-border/40">
                  <td className="px-4 py-3 font-medium">{step}</td>
                  <td className="px-4 py-3 tabular-nums">{c}</td>
                  <td className="px-4 py-3 tabular-nums">{i === 0 ? "—" : `${convPrev}%`}</td>
                  <td className="px-4 py-3 tabular-nums">{i === 0 ? "—" : drop}</td>
                  <td className="px-4 py-3 tabular-nums">{i === 0 ? "—" : `${dropPct}%`}</td>
                  <td className="px-4 py-3 tabular-nums">{fromFirst}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-4 text-sm dark:bg-amber-950/30">
        Largest drop-off after first step:{" "}
        <span className="font-semibold">{maxDrop.step}</span> ({maxDrop.pct}% vs previous)
      </div>
    </div>
  );
}
