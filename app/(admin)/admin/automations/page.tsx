import { createServiceClient } from "@/lib/supabase/server";
import {
  submitEmailAutomationTestForm,
  submitEmailAutomationUpdateForm,
} from "@/app/(admin)/admin/actions";
import { listAdminEmailAutomations } from "@/lib/services/email-automations";
import { formatAdminDateTime } from "@/lib/admin/time";

export const dynamic = "force-dynamic";

type DeliveryLogRow = {
  id: string;
  event_name: string;
  status: string;
  trigger_source: string | null;
  created_at: string;
  request_body_json: unknown;
  error_message: string | null;
};

export default async function AdminAutomationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const supabase = createServiceClient();
  const { data: emailAutomations, errorCode, errorMessage } = await listAdminEmailAutomations(supabase);
  const { data: logsRaw } = await supabase
    .from("integration_deliveries")
    .select("id,event_name,status,trigger_source,created_at,request_body_json,error_message")
    .eq("channel", "email")
    .order("created_at", { ascending: false })
    .limit(40);
  const logs = (logsRaw as DeliveryLogRow[] | null) ?? [];
  const automationLogs = logs.filter((log) => (log.trigger_source ?? "").startsWith("automation_"));

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <header>
        <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-foreground">Automations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure trigger-based email automations with template control and on/off toggle.
        </p>
      </header>

      {sp.automation_status ? (
        <section
          className={`rounded-xl border px-4 py-3 text-sm ${
            sp.automation_status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/25 dark:text-emerald-300"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/25 dark:text-red-300"
          }`}
        >
          <span className="font-semibold">Automation:</span> {sp.automation_message ?? "Done"}
        </section>
      ) : null}

      {(errorCode === "42P01" || errorCode === "42703") && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
          <p className="font-semibold">Email automations migration required.</p>
          <p className="mt-1">
            Run: <code>supabase/migrations/024_admin_email_automations.sql</code>
          </p>
          {errorMessage ? <p className="mt-1 text-xs">{errorMessage}</p> : null}
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <Stat title="Total automations" value={emailAutomations.length} />
        <Stat title="Enabled" value={emailAutomations.filter((a) => a.is_enabled).length} />
        <Stat title="Disabled" value={emailAutomations.filter((a) => !a.is_enabled).length} />
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">Email automation rules</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          For each automation, choose template name and save. Template must exist in Integrations - Email templates.
        </p>
        <div className="mt-4 space-y-3">
          {emailAutomations.length ? (
            emailAutomations.map((a) => (
              <div
                key={a.id}
                className="rounded-xl border border-border/60 bg-muted/20 p-4"
              >
                <form action={submitEmailAutomationUpdateForm}>
                  <input type="hidden" name="automationKey" value={a.automation_key} />
                  <input type="hidden" name="label" value={a.label} />
                  <input type="hidden" name="description" value={a.description ?? ""} />
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{a.label}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{a.description ?? "No description"}</p>
                      <p className="mt-1 text-[11px] font-mono text-muted-foreground">Key: {a.automation_key}</p>
                    </div>
                    <label className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium">
                      <input
                        type="checkbox"
                        name="isEnabled"
                        defaultChecked={a.is_enabled}
                        className="h-4 w-4 rounded border border-input"
                      />
                      Enabled
                    </label>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                    <input
                      name="templateName"
                      defaultValue={a.template_name}
                      className={inputCls}
                      placeholder="kundli_order_confirmation"
                      required
                    />
                    <button
                      type="submit"
                      className="inline-flex h-10 items-center justify-center rounded-lg bg-brand px-4 text-sm font-semibold text-primary-foreground transition hover:bg-brand-hover"
                    >
                      Save
                    </button>
                  </div>
                </form>
                <div className="mt-3 rounded-lg border border-border/60 bg-background/70 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Test send
                  </p>
                  <form action={submitEmailAutomationTestForm} className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
                    <input type="hidden" name="automationKey" value={a.automation_key} />
                    <input
                      type="email"
                      name="testEmail"
                      required
                      className={inputCls}
                      placeholder="your-email@example.com"
                    />
                    <button
                      type="submit"
                      className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground transition hover:bg-muted/60"
                    >
                      Send test now
                    </button>
                  </form>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-lg border border-dashed border-border/60 px-3 py-2 text-xs text-muted-foreground">
              No automation rows found yet.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">Recent automation runs</h2>
        <p className="mt-1 text-xs text-muted-foreground">Latest email automation executions with status and errors.</p>
        <ul className="mt-4 divide-y divide-border/50 rounded-xl border border-border/60">
          {automationLogs.length ? (
            automationLogs.map((log) => {
              const req = (log.request_body_json ?? {}) as Record<string, unknown>;
              const to = Array.isArray(req.to) ? String(req.to[0] ?? "-") : String(req.to ?? "-");
              const subject = String(req.subject ?? "(no subject)");
              return (
                <li key={log.id} className="px-4 py-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-foreground">{subject}</p>
                    <StatusDot status={log.status} />
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    {log.event_name} | {log.trigger_source ?? "-"} | {to} | {formatAdminDateTime(log.created_at)}
                  </p>
                  {log.error_message ? <p className="mt-1 text-red-600 dark:text-red-400">{log.error_message}</p> : null}
                </li>
              );
            })
          ) : (
            <li className="px-4 py-6 text-sm text-muted-foreground">No automation runs yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <article className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
    </article>
  );
}

function StatusDot({ status }: { status: string }) {
  const lower = status.toLowerCase();
  const cls =
    lower === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/25 dark:text-emerald-300"
      : lower === "failed"
        ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/25 dark:text-red-300"
        : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-300";
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>{status}</span>;
}

const inputCls =
  "h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-ring/60 focus:ring-1 focus:ring-ring/30";
