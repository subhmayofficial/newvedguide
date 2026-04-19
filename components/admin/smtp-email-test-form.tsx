"use client";

import { useMemo, useState } from "react";
import { collectSmtpTemplateVariableKeys, smtpVarInputName } from "@/lib/smtp-template-vars";

export type SmtpTemplateOption = {
  id: string;
  name: string;
  subject: string;
  html: string;
};

function humanizeVarKey(key: string): string {
  return key
    .split("_")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export function SmtpEmailTestForm({
  templates,
  sendAction,
  supportLinkPlaceholder,
}: {
  templates: SmtpTemplateOption[];
  sendAction: (formData: FormData) => void | Promise<void>;
  supportLinkPlaceholder: string;
}) {
  const [templateId, setTemplateId] = useState("");
  const [customHtml, setCustomHtml] = useState("");

  const selected = useMemo(
    () => templates.find((t) => t.id === templateId) ?? null,
    [templates, templateId]
  );

  /** Built-in HTML path: no saved template selected and no custom HTML override. */
  const legacyMode = !templateId && !customHtml.trim();

  const templateVarKeys = useMemo(() => {
    if (legacyMode) return [] as string[];
    const htmlSrc = customHtml.trim() || selected?.html || "";
    const subjSrc = selected?.subject || "";
    return collectSmtpTemplateVariableKeys(htmlSrc, subjSrc);
  }, [legacyMode, customHtml, selected]);

  return (
    <form action={sendAction} className="mt-4 grid gap-3">
      {templates.length > 0 ? (
        <Field label="HTML template (optional)">
          <select
            name="smtpTemplateId"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className={`${inputCls} h-10`}
          >
            <option value="">(Default payment-success HTML)</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>
      ) : null}

      <Field label="Custom HTML (optional — overrides saved template)">
        <textarea
          name="customHtml"
          value={customHtml}
          onChange={(e) => setCustomHtml(e.target.value)}
          rows={6}
          placeholder="<h2>Hey {{name}},</h2> …"
          className={`${inputCls} min-h-[120px] py-2 font-mono text-[12px]`}
        />
        <p className="text-[10px] text-muted-foreground">
          Use {"{{variable_name}}"} in subject or HTML. Only those fields appear below for sending tests.
        </p>
      </Field>

      {legacyMode ? (
        <>
          <Field label="Full name">
            <input name="fullName" placeholder="Sameer Kumar" className={inputCls} />
          </Field>
          <Field label="Order ID label">
            <input name="orderIdLabel" placeholder="VG-20260415-ABCD" className={inputCls} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Product">
              <input name="product" placeholder="Paid Kundli Report" className={inputCls} />
            </Field>
            <Field label="Amount">
              <input name="amount" placeholder="399" className={inputCls} />
            </Field>
          </div>
          <Field label="Delivery text">
            <input
              name="deliveryText"
              placeholder="Your report delivery is in process. Typical timeline is 24-48 hours."
              className={inputCls}
            />
          </Field>
          <Field label="Support link">
            <input
              name="supportLink"
              placeholder={supportLinkPlaceholder}
              className={inputCls}
            />
          </Field>
        </>
      ) : templateVarKeys.length > 0 ? (
        <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
          <p className="text-xs font-semibold text-foreground">Template variables</p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Pulled from the selected template (and custom HTML override). Values are HTML-escaped when inserted.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {templateVarKeys.map((key) => (
              <Field key={key} label={`${humanizeVarKey(key)} (${key})`}>
                <input
                  name={smtpVarInputName(key)}
                  required
                  placeholder={key}
                  className={inputCls}
                  autoComplete="off"
                />
              </Field>
            ))}
          </div>
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-border/60 px-3 py-2 text-[11px] text-muted-foreground">
          No {"{{variables}}"} in this subject/HTML — the email sends as stored. Only recipient email is required
          besides optional notes below.
        </p>
      )}

      <Field label="Email (required)">
        <input name="email" type="email" placeholder="name@example.com" required className={inputCls} />
      </Field>

      <Field label="Message preview note (optional)">
        <textarea
          name="message"
          rows={3}
          placeholder="(Optional) Internal note for test context"
          className={`${inputCls} py-2`}
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Order ID (optional)">
          <input name="orderId" placeholder="UUID" className={inputCls} />
        </Field>
        <Field label="Lead ID (optional)">
          <input name="leadId" placeholder="UUID" className={inputCls} />
        </Field>
      </div>

      <button
        type="submit"
        className="inline-flex h-10 items-center justify-center rounded-lg bg-brand px-4 text-sm font-semibold text-primary-foreground transition hover:bg-brand-hover"
      >
        Send SMTP test email
      </button>
    </form>
  );
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

const inputCls =
  "h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-ring/60 focus:ring-1 focus:ring-ring/30";
