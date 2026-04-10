import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export interface DateRange {
  from: string;
  to: string;
}

function startOfDayIso(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}

export function defaultRange(): DateRange {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from: startOfDayIso(from), to: to.toISOString() };
}

export async function countLeadsByStatus(
  supabase: SupabaseClient<Database>,
  range?: DateRange
) {
  let q = supabase.from("leads").select("status");
  if (range) {
    q = q.gte("created_at", range.from).lte("created_at", range.to);
  }
  const { data, error } = await q;
  if (error) throw error;
  const by: Record<string, number> = {};
  for (const row of data ?? []) {
    const s = row.status ?? "unknown";
    by[s] = (by[s] ?? 0) + 1;
  }
  return by;
}

export async function countOrdersKpis(
  supabase: SupabaseClient<Database>,
  range?: DateRange
) {
  let q = supabase.from("orders").select("status,payment_status,total_amount");
  if (range) {
    q = q.gte("created_at", range.from).lte("created_at", range.to);
  }
  const { data, error } = await q;
  if (error) throw error;
  let paid = 0;
  let revenue = 0;
  let pending = 0;
  for (const row of data ?? []) {
    if (row.payment_status === "paid") {
      paid += 1;
      revenue += Number(row.total_amount);
    }
    if (row.status === "pending_payment") pending += 1;
  }
  return { paid, revenue, pending, total: data?.length ?? 0 };
}

export async function eventCountsByName(
  supabase: SupabaseClient<Database>,
  names: string[],
  range?: DateRange
) {
  let q = supabase.from("events").select("event_name").in("event_name", names);
  if (range) {
    q = q.gte("created_at", range.from).lte("created_at", range.to);
  }
  const { data, error } = await q;
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const n of names) counts[n] = 0;
  for (const row of data ?? []) {
    const n = row.event_name;
    counts[n] = (counts[n] ?? 0) + 1;
  }
  return counts;
}

export async function eventsDaily(
  supabase: SupabaseClient<Database>,
  eventNames: string[],
  range: DateRange
) {
  const { data, error } = await supabase
    .from("events")
    .select("event_name,created_at")
    .in("event_name", eventNames)
    .gte("created_at", range.from)
    .lte("created_at", range.to);
  if (error) throw error;
  const byDay: Record<string, Record<string, number>> = {};
  for (const row of data ?? []) {
    const day = row.created_at.slice(0, 10);
    if (!byDay[day]) byDay[day] = {};
    const n = row.event_name;
    byDay[day][n] = (byDay[day][n] ?? 0) + 1;
  }
  return byDay;
}

export async function leadsDaily(
  supabase: SupabaseClient<Database>,
  range: DateRange
) {
  const { data, error } = await supabase
    .from("leads")
    .select("created_at")
    .gte("created_at", range.from)
    .lte("created_at", range.to);
  if (error) throw error;
  const byDay: Record<string, number> = {};
  for (const row of data ?? []) {
    const day = row.created_at.slice(0, 10);
    byDay[day] = (byDay[day] ?? 0) + 1;
  }
  return byDay;
}

export async function ordersDaily(
  supabase: SupabaseClient<Database>,
  range: DateRange
) {
  const { data, error } = await supabase
    .from("orders")
    .select("created_at,payment_status,total_amount")
    .gte("created_at", range.from)
    .lte("created_at", range.to);
  if (error) throw error;
  const byDay: Record<string, { count: number; revenue: number }> = {};
  for (const row of data ?? []) {
    const day = row.created_at.slice(0, 10);
    if (!byDay[day]) byDay[day] = { count: 0, revenue: 0 };
    byDay[day].count += 1;
    if (row.payment_status === "paid") {
      byDay[day].revenue += Number(row.total_amount);
    }
  }
  return byDay;
}

export async function sourceBreakdown(
  supabase: SupabaseClient<Database>,
  range?: DateRange
) {
  let q = supabase.from("events").select("entry_path,utm_source");
  if (range) {
    q = q.gte("created_at", range.from).lte("created_at", range.to);
  }
  const { data, error } = await q;
  if (error) throw error;
  const paths: Record<string, number> = {};
  const utm: Record<string, number> = {};
  for (const row of data ?? []) {
    const p = row.entry_path ?? "(none)";
    paths[p] = (paths[p] ?? 0) + 1;
    const u = row.utm_source ?? "(direct)";
    utm[u] = (utm[u] ?? 0) + 1;
  }
  return { entryPath: paths, utmSource: utm };
}
