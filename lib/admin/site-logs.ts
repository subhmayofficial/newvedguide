import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";

export type SiteLogKind = "event" | "integration";

export type SiteLogEntry = {
  id: string;
  kind: SiteLogKind;
  createdAt: string;
  title: string;
  subtitle: string;
  status: string | null;
  orderId: string | null;
  leadId: string | null;
  customerId: string | null;
  detail: Record<string, unknown>;
};

export type SiteLogFilter = "" | "event" | "integration";

const FETCH_EACH = 250;
const DEFAULT_LIMIT = 200;

function asRecord(value: Json | null | undefined): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function matchesQuery(entry: SiteLogEntry, q: string): boolean {
  if (!q) return true;
  const haystack = [
    entry.title,
    entry.subtitle,
    entry.status ?? "",
    entry.orderId ?? "",
    entry.leadId ?? "",
    JSON.stringify(entry.detail),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export async function listSiteLogs(
  supabase: SupabaseClient<Database>,
  input: {
    kind?: SiteLogFilter;
    q?: string;
    limit?: number;
  } = {}
): Promise<{ entries: SiteLogEntry[]; eventsAvailable: boolean; integrationsAvailable: boolean }> {
  const limit = input.limit ?? DEFAULT_LIMIT;
  const q = input.q?.trim().toLowerCase() ?? "";
  const kind = input.kind ?? "";

  const wantEvents = kind !== "integration";
  const wantIntegrations = kind !== "event";

  const [eventsRes, integrationsRes] = await Promise.all([
    wantEvents
      ? supabase
          .from("events")
          .select(
            "id,event_name,event_group,order_id,lead_id,customer_id,source_page,page_path,entry_path,session_id,metadata_json,created_at"
          )
          .order("created_at", { ascending: false })
          .limit(FETCH_EACH)
      : Promise.resolve({ data: null, error: null }),
    wantIntegrations
      ? supabase
          .from("integration_deliveries")
          .select(
            "id,provider,channel,event_name,status,trigger_source,order_id,lead_id,customer_id,request_url,response_status,error_message,request_body_json,response_body,created_by,created_at"
          )
          .order("created_at", { ascending: false })
          .limit(FETCH_EACH)
      : Promise.resolve({ data: null, error: null }),
  ]);

  const eventsAvailable = !eventsRes.error;
  const integrationsAvailable = !integrationsRes.error;

  const merged: SiteLogEntry[] = [];

  for (const row of eventsRes.data ?? []) {
    merged.push({
      id: row.id,
      kind: "event",
      createdAt: row.created_at,
      title: row.event_name,
      subtitle: [row.event_group, row.page_path ?? row.source_page, row.entry_path]
        .filter(Boolean)
        .join(" · "),
      status: null,
      orderId: row.order_id,
      leadId: row.lead_id,
      customerId: row.customer_id,
      detail: {
        session_id: row.session_id,
        metadata_json: row.metadata_json,
      },
    });
  }

  for (const row of integrationsRes.data ?? []) {
    merged.push({
      id: row.id,
      kind: "integration",
      createdAt: row.created_at,
      title: `${row.provider} · ${row.event_name}`,
      subtitle: [row.channel, row.trigger_source, row.request_url].filter(Boolean).join(" · "),
      status: row.status,
      orderId: row.order_id,
      leadId: row.lead_id,
      customerId: row.customer_id,
      detail: {
        response_status: row.response_status,
        error_message: row.error_message,
        request_body_json: row.request_body_json,
        response_body: row.response_body,
        created_by: row.created_by,
      },
    });
  }

  merged.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  const filtered = merged.filter((entry) => matchesQuery(entry, q)).slice(0, limit);

  return { entries: filtered, eventsAvailable, integrationsAvailable };
}
