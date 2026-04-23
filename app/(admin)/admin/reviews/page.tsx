import { createServiceClient } from "@/lib/supabase/server";
import { formatAdminDateTime } from "@/lib/admin/time";

export const dynamic = "force-dynamic";

type ReviewRow = {
  id: string;
  customer_name: string;
  phone: string | null;
  rating_overall: number;
  favorite_part: string;
  created_at: string;
};

function ratingBadge(r: number) {
  if (r >= 4) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300";
  if (r === 3) return "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300";
  return "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300";
}

export default async function AdminReviewsPage() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("kundli_reviews")
    .select("id,customer_name,phone,rating_overall,favorite_part,created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as ReviewRow[];

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-400">
        {error.message}
      </div>
    );
  }

  const total = rows.length;
  const avgRating = total === 0 ? 0 : rows.reduce((sum, r) => sum + r.rating_overall, 0) / total;
  const fiveStars = rows.filter((r) => r.rating_overall === 5).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-foreground">Reviews</h1>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          Personalized Premium Kundli feedback submissions
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total reviews" value={String(total)} />
        <StatCard label="Avg star rating" value={total === 0 ? "—" : avgRating.toFixed(1) + " ★"} />
        <StatCard label="5-star reviews" value={String(fiveStars)} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border">
              {["Name / Phone", "Rating", "Feedback", "Submitted"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border/60 align-top last:border-b-0">
                <td className="px-4 py-3">
                  <p className="text-sm font-semibold text-foreground">{row.customer_name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{row.phone ?? "—"}</p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${ratingBadge(row.rating_overall)}`}
                  >
                    {"★".repeat(row.rating_overall)}{"☆".repeat(5 - row.rating_overall)}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  <p>{row.favorite_part}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                  {formatAdminDateTime(row.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {rows.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            No reviews submitted yet.
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-mono text-[26px] font-semibold leading-none tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );
}
