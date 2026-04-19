"use client";

import { useEffect, useMemo, useState } from "react";

type SavedTemplate = {
  id: string;
  name: string;
  languageCode: string;
  headerLabels: string[];
  bodyLabels: string[];
  buttonValueLabels: Array<{ buttonIndex: string; label: string }>;
  buttonPayloadLabels: Array<{ buttonIndex: string; label: string }>;
  fileNameRequired: boolean;
  notes: string | null;
  source: string;
};

type ServerAction = (formData: FormData) => void | Promise<void>;

function labelsToCsv(labels: string[]): string {
  return labels.join(", ");
}

function mappingsToLines(rows: Array<{ buttonIndex: string; label: string }>): string {
  return rows.map((r) => `${r.buttonIndex}: ${r.label}`).join("\n");
}

export function InteraktTemplateConsole({
  templates,
  sendAction,
  addTemplateAction,
  updateTemplateAction,
  deleteTemplateAction,
  syncEndpoint,
}: {
  templates: SavedTemplate[];
  sendAction: ServerAction;
  addTemplateAction: ServerAction;
  updateTemplateAction: ServerAction;
  deleteTemplateAction: ServerAction;
  syncEndpoint: string;
}) {
  const [selectedId, setSelectedId] = useState<string>(templates[0]?.id ?? "");
  const [editing, setEditing] = useState<SavedTemplate | null>(null);
  const [syncState, setSyncState] = useState<{ busy: boolean; message: string | null }>({
    busy: false,
    message: null,
  });

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedId) ?? templates[0] ?? null,
    [selectedId, templates]
  );

  useEffect(() => {
    if (selectedId && !templates.some((t) => t.id === selectedId)) {
      setSelectedId(templates[0]?.id ?? "");
    }
  }, [templates, selectedId]);

  useEffect(() => {
    if (editing && !templates.some((t) => t.id === editing.id)) {
      setEditing(null);
    }
  }, [templates, editing]);

  async function handleSync() {
    setSyncState({ busy: true, message: null });
    try {
      const response = await fetch(syncEndpoint, { method: "POST" });
      const data = (await response.json()) as { ok?: boolean; message?: string; importedCount?: number };
      if (!response.ok || !data.ok) {
        setSyncState({ busy: false, message: data.message ?? "Template sync failed" });
        return;
      }
      setSyncState({
        busy: false,
        message: data.importedCount
          ? `Imported ${data.importedCount} templates. Refreshing...`
          : data.message ?? "Templates synced",
      });
      window.location.reload();
    } catch (error) {
      setSyncState({
        busy: false,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return (
    <div className="grid gap-4">
      <article className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Interakt templates</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Add your template once, then pick it from the list and fill only the required values.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSync}
            disabled={syncState.busy}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-border/70 px-3 text-xs font-medium text-foreground transition hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {syncState.busy ? "Fetching..." : "Try fetch from Interakt API"}
          </button>
        </div>
        {syncState.message && (
          <p className="mt-3 text-xs text-muted-foreground">{syncState.message}</p>
        )}

        <form action={addTemplateAction} className="mt-4 grid gap-3 rounded-xl border border-border/60 p-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Add template</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Use comma-separated labels. These labels will become autofilled input fields when you select the template.
              For <span className="font-medium text-foreground">kundlidelivery_bt</span> (hi): body labels = one name field;
              button URL = one row like <span className="font-mono">0: Report link</span> (index{" "}
              <span className="font-mono">0</span> = first URL button unless Interakt uses another index).
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Template name">
              <input name="templateName" placeholder="order_paid_update" required className={inputCls} />
            </Field>
            <Field label="Language code">
              <input name="languageCode" placeholder="en or hi" defaultValue="en" className={inputCls} />
            </Field>
            <Field label="Header variables">
              <input name="headerLabels" placeholder="Header 1, Header 2" className={inputCls} />
            </Field>
            <Field label="Body variables">
              <input name="bodyLabels" placeholder="Customer Name, Product, Amount" className={inputCls} />
            </Field>
          </div>
          <Field label="Button URL variables">
            <textarea
              name="buttonValueLabels"
              rows={3}
              placeholder={"0: order_id\n1: tracking_id"}
              className={`${inputCls} min-h-[88px] py-2`}
            />
          </Field>
          <Field label="Quick reply payload variables">
            <textarea
              name="buttonPayloadLabels"
              rows={3}
              placeholder={"0: confirm_payload\n1: cancel_payload"}
              className={`${inputCls} min-h-[88px] py-2`}
            />
          </Field>
          <Field label="Notes (optional)">
            <input name="notes" placeholder="Utility template for paid orders" className={inputCls} />
          </Field>
          <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <input type="checkbox" name="fileNameRequired" />
            Requires file name input when sending
          </label>
          <div>
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-brand px-4 text-sm font-semibold text-primary-foreground transition hover:bg-brand-hover"
            >
              Save template
            </button>
          </div>
        </form>

        {templates.length > 0 && (
          <div className="mt-6 border-t border-border/60 pt-4">
            <h3 className="text-sm font-semibold text-foreground">Saved templates</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Edit labels and structure, or remove a preset you no longer use.
            </p>
            <ul className="mt-3 divide-y divide-border/60 rounded-xl border border-border/60">
              {templates.map((t) => (
                <li
                  key={t.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm"
                >
                  <div>
                    <span className="font-medium text-foreground">{t.name}</span>
                    <span className="text-muted-foreground"> · {t.languageCode}</span>
                    {t.notes ? (
                      <span className="mt-0.5 block text-xs text-muted-foreground">{t.notes}</span>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditing(t)}
                      className="rounded-lg border border-border/70 px-2.5 py-1 text-xs font-medium text-foreground transition hover:bg-muted/50"
                    >
                      Edit
                    </button>
                    <form
                      action={deleteTemplateAction}
                      className="inline"
                      onSubmit={(e) => {
                        if (!confirm(`Delete saved template “${t.name}”?`)) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <input type="hidden" name="templateId" value={t.id} />
                      <button
                        type="submit"
                        className="rounded-lg border border-destructive/40 px-2.5 py-1 text-xs font-medium text-destructive transition hover:bg-destructive/10"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {editing && (
          <form
            key={`edit-${editing.id}`}
            action={updateTemplateAction}
            className="mt-6 grid gap-3 rounded-xl border border-brand/30 bg-brand/5 p-4"
          >
            <input type="hidden" name="templateId" value={editing.id} />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-foreground">Edit template</h3>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                Cancel
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Template name">
                <input
                  name="templateName"
                  required
                  defaultValue={editing.name}
                  className={inputCls}
                />
              </Field>
              <Field label="Language code">
                <input
                  name="languageCode"
                  defaultValue={editing.languageCode}
                  placeholder="en or hi"
                  className={inputCls}
                />
              </Field>
              <Field label="Header variables">
                <input
                  name="headerLabels"
                  defaultValue={labelsToCsv(editing.headerLabels)}
                  placeholder="Header 1, Header 2"
                  className={inputCls}
                />
              </Field>
              <Field label="Body variables">
                <input
                  name="bodyLabels"
                  defaultValue={labelsToCsv(editing.bodyLabels)}
                  placeholder="Customer Name"
                  className={inputCls}
                />
              </Field>
            </div>
            <Field label="Button URL variables">
              <textarea
                name="buttonValueLabels"
                rows={3}
                defaultValue={mappingsToLines(editing.buttonValueLabels)}
                placeholder={"0: order_id\n1: tracking_id"}
                className={`${inputCls} min-h-[88px] py-2`}
              />
            </Field>
            <Field label="Quick reply payload variables">
              <textarea
                name="buttonPayloadLabels"
                rows={3}
                defaultValue={mappingsToLines(editing.buttonPayloadLabels)}
                placeholder={"0: confirm_payload"}
                className={`${inputCls} min-h-[88px] py-2`}
              />
            </Field>
            <Field label="Notes (optional)">
              <input name="notes" defaultValue={editing.notes ?? ""} className={inputCls} />
            </Field>
            <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                name="fileNameRequired"
                defaultChecked={editing.fileNameRequired}
              />
              Requires file name input when sending
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-brand px-4 text-sm font-semibold text-primary-foreground transition hover:bg-brand-hover"
              >
                Update template
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted/40"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </article>

      <article className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Send template</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Select a saved template. Variable fields appear automatically from the template you added.
          </p>
        </div>

        {templates.length ? (
          <form action={sendAction} className="mt-4 grid gap-4">
            <Field label="Saved template">
              <select
                value={selectedTemplate?.id ?? ""}
                onChange={(event) => setSelectedId(event.target.value)}
                className={inputCls}
              >
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.languageCode})
                  </option>
                ))}
              </select>
            </Field>

            {selectedTemplate && (
              <>
                <input type="hidden" name="templateName" value={selectedTemplate.name} />
                <input type="hidden" name="languageCode" value={selectedTemplate.languageCode} />

                <div className="rounded-xl border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
                  <p>
                    Using <span className="font-medium text-foreground">{selectedTemplate.name}</span>
                    {selectedTemplate.notes ? ` - ${selectedTemplate.notes}` : ""}
                  </p>
                  <p className="mt-1">Source: {selectedTemplate.source}</p>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <Field label="Phone number">
                    <input name="phone" placeholder="9876543210" required className={inputCls} />
                  </Field>
                  <Field label="Full name">
                    <input name="fullName" placeholder="Sameer Kumar" className={inputCls} />
                  </Field>
                  <Field label="Campaign ID">
                    <input name="campaignId" placeholder="Optional campaign UUID" className={inputCls} />
                  </Field>
                  <Field label="Callback data">
                    <input name="callbackData" placeholder="order_123" className={inputCls} />
                  </Field>
                  <Field label="Order ID">
                    <input name="orderId" placeholder="Optional UUID" className={inputCls} />
                  </Field>
                  <Field label="Lead ID">
                    <input name="leadId" placeholder="Optional UUID" className={inputCls} />
                  </Field>
                  {selectedTemplate.fileNameRequired && (
                    <Field label="File name">
                      <input name="fileName" placeholder="sample.pdf" required className={inputCls} />
                    </Field>
                  )}
                </div>

                {selectedTemplate.headerLabels.length > 0 && (
                  <GeneratedFields title="Header values" labels={selectedTemplate.headerLabels} inputName="headerValues" />
                )}

                {selectedTemplate.bodyLabels.length > 0 && (
                  <GeneratedFields title="Body values" labels={selectedTemplate.bodyLabels} inputName="bodyValues" />
                )}

                {selectedTemplate.buttonValueLabels.length > 0 && (
                  <MappedFields
                    title="Button URL values"
                    rows={selectedTemplate.buttonValueLabels}
                    indexName="buttonValueIndex"
                    valueName="buttonValueValue"
                  />
                )}

                {selectedTemplate.buttonPayloadLabels.length > 0 && (
                  <MappedFields
                    title="Quick reply payload values"
                    rows={selectedTemplate.buttonPayloadLabels}
                    indexName="buttonPayloadIndex"
                    valueName="buttonPayloadValue"
                  />
                )}

                <Field label="Metadata JSON (optional)">
                  <textarea
                    name="metadataJson"
                    rows={4}
                    placeholder='{"source":"admin","flow":"manual-send"}'
                    className={`${inputCls} min-h-[110px] py-2`}
                  />
                </Field>

                <div>
                  <button
                    type="submit"
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-brand px-4 text-sm font-semibold text-primary-foreground transition hover:bg-brand-hover"
                  >
                    Send Interakt template
                  </button>
                </div>
              </>
            )}
          </form>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-border/60 px-4 py-6 text-sm text-muted-foreground">
            No saved templates yet. Add one above, or configure `INTERAKT_TEMPLATE_LIST_API_URL` and use fetch.
          </div>
        )}
      </article>
    </div>
  );
}

function GeneratedFields({
  title,
  labels,
  inputName,
}: {
  title: string;
  labels: string[];
  inputName: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 p-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {labels.map((label) => (
          <Field key={`${inputName}-${label}`} label={label}>
            <input name={inputName} placeholder={label} className={inputCls} />
          </Field>
        ))}
      </div>
    </div>
  );
}

function MappedFields({
  title,
  rows,
  indexName,
  valueName,
}: {
  title: string;
  rows: Array<{ buttonIndex: string; label: string }>;
  indexName: string;
  valueName: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 p-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {rows.map((row, idx) => (
          <div key={`${title}-${row.buttonIndex}-${row.label}-${idx}`}>
            <input type="hidden" name={indexName} value={row.buttonIndex} />
            <Field label={`Button ${row.buttonIndex}: ${row.label}`}>
              <input name={valueName} placeholder={row.label} className={inputCls} />
            </Field>
          </div>
        ))}
      </div>
    </div>
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
