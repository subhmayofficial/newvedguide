import { createServiceClient } from "@/lib/supabase/server";
import {
  getDeliveryIntegrationsConfig,
  maskSecret,
} from "@/lib/services/integration-config";
import {
  submitInteraktSavedTemplateSendForm,
  submitInteraktTemplateCatalogForm,
  submitInteraktTemplateDeleteForm,
  submitInteraktTemplateUpdateForm,
  submitSmtpEmailTestForm,
  submitSmtpTemplateCreateForm,
  submitSmtpTemplateUpdateForm,
} from "@/app/(admin)/admin/actions";
import { formatAdminDateTime } from "@/lib/admin/time";
import { InteraktTemplateConsole } from "@/components/admin/interakt-template-console";
import { SmtpEmailTestForm } from "@/components/admin/smtp-email-test-form";
import { listSavedInteraktTemplates } from "@/lib/services/interakt-template-catalog";
import { listSavedSmtpTemplates } from "@/lib/services/smtp-template-catalog";

export const dynamic = "force-dynamic";

type DeliveryLogRow = {
  id: string;
  provider: string;
  channel: string;
  event_name: string;
  status: string;
  trigger_source: string | null;
  order_id: string | null;
  lead_id: string | null;
  request_url: string | null;
  response_status: number | null;
  error_message: string | null;
  created_by: string | null;
  created_at: string;
  request_body_json: unknown;
  response_body: string | null;
};

export default async function AdminIntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const supabase = createServiceClient();
  const config = getDeliveryIntegrationsConfig();
  const {
    data: savedTemplates,
    errorCode: templatesErrorCode,
    errorMessage: templatesErrorMessage,
  } = await listSavedInteraktTemplates(supabase);
  const {
    data: savedSmtpTemplates,
    errorCode: smtpTemplatesErrorCode,
    errorMessage: smtpTemplatesErrorMessage,
  } = await listSavedSmtpTemplates(supabase);

  const { data: logsRaw, error: logsError } = await supabase
    .from("integration_deliveries")
    .select(
      "id,provider,channel,event_name,status,trigger_source,order_id,lead_id,request_url,response_status,error_message,created_by,created_at,request_body_json,response_body"
    )
    .order("created_at", { ascending: false })
    .limit(120);

  const logs = (logsRaw as DeliveryLogRow[] | null) ?? [];
  const migrationMissing = logsError?.code === "42P01" || logsError?.code === "42703";

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <header>
        <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-foreground">
          Integrations
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          WhatsApp delivery via Interakt and SMTP email delivery via Nodemailer, with full logs and test flow.
        </p>
      </header>

      {sp.test_status && (
        <section
          className={`rounded-xl border px-4 py-3 text-sm ${
            sp.test_status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/25 dark:text-emerald-300"
              : sp.test_status === "failed"
                ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/25 dark:text-red-300"
                : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-300"
          }`}
        >
          <span className="font-semibold">{sp.provider ?? "integration"} test:</span>{" "}
          {sp.test_message ?? "done"}
        </section>
      )}

      {migrationMissing && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
          <p className="font-semibold">Migration required before using logs/testing UI.</p>
          <p className="mt-1">
            Run: <code>supabase/migrations/009_integrations_delivery_logs.sql</code>
          </p>
          {logsError?.message && <p className="mt-1 text-xs">{logsError.message}</p>}
        </section>
      )}

      {(templatesErrorCode === "42P01" || templatesErrorCode === "42703") && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
          <p className="font-semibold">Saved template migration required.</p>
          <p className="mt-1">
            Run: <code>supabase/migrations/012_admin_interakt_templates.sql</code>
          </p>
          {templatesErrorMessage && <p className="mt-1 text-xs">{templatesErrorMessage}</p>}
        </section>
      )}

      {(smtpTemplatesErrorCode === "42P01" || smtpTemplatesErrorCode === "42703") && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
          <p className="font-semibold">SMTP HTML templates migration required.</p>
          <p className="mt-1">
            Run: <code>supabase/migrations/016_admin_smtp_templates.sql</code>
          </p>
          {smtpTemplatesErrorMessage && <p className="mt-1 text-xs">{smtpTemplatesErrorMessage}</p>}
        </section>
      )}

      <section className="rounded-xl border border-border/60 bg-muted/15 px-4 py-3 text-sm text-muted-foreground">
        <p className="font-semibold text-foreground">Kundli delivery template (paid-kundli)</p>
        <p className="mt-1">
          Auto WhatsApp after payment uses{" "}
          <code className="rounded bg-muted px-1 font-mono text-xs">
            {config.interakt.kundliDeliveryTemplateName}
          </code>{" "}
          /{" "}
          <code className="rounded bg-muted px-1 font-mono text-xs">
            {config.interakt.kundliDeliveryTemplateLanguage}
          </code>
          : body gets customer name; button index{" "}
          <code className="rounded bg-muted px-1 font-mono text-xs">
            {config.interakt.kundliDeliveryButtonIndex}
          </code>{" "}
          gets the link (
          {config.interakt.kundliDeliveryButtonLinkTemplate ?? "default: site + /kundli-report"}).
        </p>
        <p className="mt-2 text-xs">
          Override with{" "}
          <code className="rounded bg-muted px-1 font-mono">INTERAKT_KUNDLI_*</code> in{" "}
          <code className="rounded bg-muted px-1 font-mono">.env.local</code>. Other products still
          use the default template above. Run migration{" "}
          <code className="rounded bg-muted px-1 font-mono">013_seed_kundlidelivery_interakt_template.sql</code>{" "}
          to add the same preset under &quot;Saved templates&quot; for manual tests.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <ConfigCard
          title="Interakt WhatsApp"
          status={
            config.interakt.enabled && config.interakt.apiKey
              ? "Enabled + API key present"
              : config.interakt.enabled
                ? "Enabled, API key missing"
                : "Disabled"
          }
          rows={[
            ["API URL", config.interakt.endpointUrl],
            ["Template list API", config.interakt.templateListApiUrl ?? "Not set"],
            ["API key", maskSecret(config.interakt.apiKey)],
            ["Template default (non-kundli)", config.interakt.templateName],
            ["Language default", config.interakt.languageCode],
            ["Kundli template", config.interakt.kundliDeliveryTemplateName],
            ["Kundli language", config.interakt.kundliDeliveryTemplateLanguage],
            ["Kundli button index", config.interakt.kundliDeliveryButtonIndex],
            [
              "Kundli button link template",
              config.interakt.kundliDeliveryButtonLinkTemplate ?? "(site + /kundli-report)",
            ],
            ["Country code", config.interakt.countryCode],
            [
              "Auto delivery on payment",
              config.interakt.triggerOnPaymentSuccess ? "Yes" : "No",
            ],
          ]}
        />

        <ConfigCard
          title="SMTP Email (Nodemailer)"
          status={config.email.enabled ? "Enabled" : "Disabled"}
          rows={[
            ["SMTP host", config.email.host ?? "Not set"],
            ["SMTP port", String(config.email.port)],
            ["SMTP secure", config.email.secure ? "true" : "false"],
            ["SMTP user", config.email.user ?? "Not set"],
            ["SMTP pass", maskSecret(config.email.pass)],
            ["From", config.email.from ?? "Not set"],
            ["Reply-To", config.email.replyTo ?? "Not set"],
            ["Support link", config.email.supportLink],
            ["Retry count", String(config.email.retryCount)],
            [
              "Auto delivery on payment",
              config.email.triggerOnPaymentSuccess ? "Yes" : "No",
            ],
          ]}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <InteraktTemplateConsole
          templates={savedTemplates}
          sendAction={submitInteraktSavedTemplateSendForm}
          addTemplateAction={submitInteraktTemplateCatalogForm}
          updateTemplateAction={submitInteraktTemplateUpdateForm}
          deleteTemplateAction={submitInteraktTemplateDeleteForm}
          syncEndpoint="/api/admin/interakt/templates/sync"
        />

        <article className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">SMTP email test</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Sends via Nodemailer and logs the attempt. Pick a saved template or custom HTML with{" "}
            <span className="font-mono text-[11px]">{"{{var}}"}</span> placeholders—the form only asks for those
            variables (plus recipient email). Use the default HTML path to send the built-in payment-success body
            without placeholders.
          </p>

          <SmtpEmailTestForm
            templates={savedSmtpTemplates.map((t) => ({
              id: t.id,
              name: t.name,
              subject: t.subject,
              html: t.html,
            }))}
            sendAction={submitSmtpEmailTestForm}
            supportLinkPlaceholder={config.email.supportLink}
          />

          <ApiDetail
            title="API details used"
            method="SMTP SEND"
            endpoint={`smtp://${config.email.host ?? "not-set"}:${config.email.port}`}
            headers={[
              "host: SMTP_HOST",
              "port: SMTP_PORT",
              "secure: SMTP_SECURE",
              "auth.user: SMTP_USER",
              "auth.pass: SMTP_PASS",
              "from: EMAIL_FROM",
              "replyTo: EMAIL_REPLY_TO (optional)",
            ]}
            payloadExample={{
              subject: "Payment Successful ({{order_id}}) or literal subject",
              smtp_template_vars:
                "{{name}}, {{order_id}}, … detected from subject + HTML; required inputs appear only for those",
              legacy_test_fields_when_no_template:
                "fullName, orderIdLabel, product, amount, deliveryText, supportLink",
              html_example: "<h2>Hey {{name}},</h2><p>Order {{order_id}}</p>",
            }}
          />
        </article>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">SMTP HTML templates</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Save subject + HTML with <span className="font-mono text-[11px]">{"{{snake_case}}"}</span> variables. The
          test form detects them and shows fill fields automatically.
        </p>

        <form action={submitSmtpTemplateCreateForm} className="mt-4 grid gap-3 rounded-xl border border-border/60 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Template name">
              <input name="templateName" required placeholder="payment_success_v1" className={inputCls} />
            </Field>
            <Field label="Subject">
              <input
                name="templateSubject"
                placeholder="Payment Successful - Your Order is Confirmed ({{order_id}})"
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="HTML">
            <textarea
              name="templateHtml"
              required
              rows={10}
              placeholder="<h2>Hey {{name}},</h2> ..."
              className={`${inputCls} min-h-[200px] py-2 font-mono text-[12px]`}
            />
          </Field>
          <Field label="Notes (optional)">
            <input name="notes" placeholder="Used for payment success tests" className={inputCls} />
          </Field>
          <div>
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-brand px-4 text-sm font-semibold text-primary-foreground transition hover:bg-brand-hover"
            >
              Add template
            </button>
          </div>
        </form>

        {savedSmtpTemplates.length ? (
          <div className="mt-6 border-t border-border/60 pt-4">
            <h3 className="text-sm font-semibold text-foreground">Saved templates</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Click edit to update subject / HTML.
            </p>
            <ul className="mt-3 divide-y divide-border/60 rounded-xl border border-border/60">
              {savedSmtpTemplates.map((t) => (
                <li key={t.id} className="px-3 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <span className="font-medium text-foreground">{t.name}</span>
                      {t.notes ? (
                        <span className="mt-0.5 block text-xs text-muted-foreground">{t.notes}</span>
                      ) : null}
                    </div>
                    <details className="w-full sm:w-auto">
                      <summary className="cursor-pointer rounded-lg border border-border/70 px-2.5 py-1 text-xs font-medium text-foreground transition hover:bg-muted/50">
                        Edit
                      </summary>
                      <form
                        action={submitSmtpTemplateUpdateForm}
                        className="mt-3 grid gap-3 rounded-xl border border-border/60 bg-muted/20 p-3"
                      >
                        <input type="hidden" name="templateId" value={t.id} />
                        <Field label="Template name">
                          <input name="templateName" defaultValue={t.name} required className={inputCls} />
                        </Field>
                        <Field label="Subject">
                          <input name="templateSubject" defaultValue={t.subject} className={inputCls} />
                        </Field>
                        <Field label="HTML">
                          <textarea
                            name="templateHtml"
                            defaultValue={t.html}
                            rows={10}
                            className={`${inputCls} min-h-[200px] py-2 font-mono text-[12px]`}
                          />
                        </Field>
                        <Field label="Notes (optional)">
                          <input name="notes" defaultValue={t.notes ?? ""} className={inputCls} />
                        </Field>
                        <button
                          type="submit"
                          className="inline-flex h-10 items-center justify-center rounded-lg bg-brand px-4 text-sm font-semibold text-primary-foreground transition hover:bg-brand-hover"
                        >
                          Save changes
                        </button>
                      </form>
                    </details>
                  </div>
                  <div className="mt-2 rounded-lg border border-border/60 bg-background/60 p-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Subject
                    </p>
                    <p className="mt-1 break-all font-mono text-[11px] text-foreground/80">
                      {t.subject || "(empty — will fallback to default subject)"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/50 px-5 py-4">
          <h2 className="text-lg font-semibold text-foreground">Delivery logs</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Outbound API attempts with request/response details. Latest 120 entries.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="border-b border-border/50 bg-muted/30 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Order / Lead</th>
                <th className="px-4 py-3">Request URL</th>
                <th className="px-4 py-3">Response</th>
                <th className="px-4 py-3">Error</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {migrationMissing ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-muted-foreground" colSpan={9}>
                    Logs table unavailable until migration is applied.
                  </td>
                </tr>
              ) : logs.length ? (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {formatAdminDateTime(log.created_at)}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="font-medium">{log.provider}</span>
                      <span className="ml-1 text-muted-foreground">({log.channel})</span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="font-medium">{log.event_name}</div>
                      <div className="text-muted-foreground">{log.trigger_source ?? "-"}</div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <StatusDot status={log.status} />
                    </td>
                    <td className="px-4 py-3 text-xs font-mono">
                      {log.order_id ? `o:${shortId(log.order_id)}` : "-"}
                      <br />
                      {log.lead_id ? `l:${shortId(log.lead_id)}` : "-"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[240px] truncate">
                      {log.request_url ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-xs">{log.response_status ?? "-"}</td>
                    <td className="px-4 py-3 text-xs text-red-600 dark:text-red-400 max-w-[220px] truncate">
                      {log.error_message ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <details>
                        <summary className="cursor-pointer text-brand">View</summary>
                        <pre className="mt-2 max-h-48 overflow-auto rounded border border-border/60 bg-muted/30 p-2 text-[10px] leading-relaxed">
{JSON.stringify(
  {
    request_body_json: log.request_body_json,
    response_body: log.response_body,
    created_by: log.created_by,
  },
  null,
  2
)}
                        </pre>
                      </details>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-8 text-center text-sm text-muted-foreground" colSpan={9}>
                    No delivery logs yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function shortId(value: string): string {
  return value.length > 8 ? `${value.slice(0, 8)}...` : value;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-xs text-muted-foreground">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}

function ConfigCard({
  title,
  status,
  rows,
}: {
  title: string;
  status: string;
  rows: Array<[string, string]>;
}) {
  return (
    <article className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <span className="rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {status}
        </span>
      </div>
      <dl className="mt-4 grid gap-2 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[170px_1fr] gap-3">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-medium break-all">{value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

function ApiDetail({
  title,
  method,
  endpoint,
  headers,
  payloadExample,
}: {
  title: string;
  method: string;
  endpoint: string;
  headers: string[];
  payloadExample: Record<string, unknown>;
}) {
  return (
    <div className="mt-5 rounded-xl border border-border/60 bg-muted/20 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <p className="mt-2 text-xs">
        <span className="font-semibold">{method}</span>{" "}
        <span className="font-mono text-muted-foreground break-all">{endpoint}</span>
      </p>
      <p className="mt-2 text-[11px] font-medium text-muted-foreground">Headers:</p>
      <ul className="mt-1 space-y-0.5 text-xs text-foreground">
        {headers.map((line) => (
          <li key={line} className="font-mono">{line}</li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] font-medium text-muted-foreground">Payload:</p>
      <pre className="mt-1 max-h-56 overflow-auto rounded border border-border/50 bg-background/70 p-2 text-[10px] leading-relaxed">
{JSON.stringify(payloadExample, null, 2)}
      </pre>
    </div>
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
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      {status}
    </span>
  );
}

const inputCls =
  "h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-ring/60 focus:ring-1 focus:ring-ring/30";
