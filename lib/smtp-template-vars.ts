/**
 * Mustache-style placeholders: {{name}}, {{order_id}}, etc.
 * Used for SMTP HTML templates in admin.
 */

function escapeMustacheValue(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Unique variable names from subject + HTML (sorted). */
export function collectSmtpTemplateVariableKeys(...sources: string[]): string[] {
  const set = new Set<string>();
  const re = /\{\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\}\}/g;
  for (const text of sources) {
    if (!text) continue;
    for (const m of text.matchAll(re)) {
      set.add(m[1]);
    }
  }
  return Array.from(set).sort();
}

/** Replace {{key}} with escaped values (safe for HTML email body and subject lines). */
export function applySmtpTemplateVariables(
  template: string,
  values: Record<string, string>
): string {
  return template.replace(/\{\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\}\}/g, (_, key: string) => {
    const raw = values[key] ?? "";
    return escapeMustacheValue(raw);
  });
}

const SMTP_VAR_PREFIX = "smtpVar__";

export function parseSmtpTemplateVarFields(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (!k.startsWith(SMTP_VAR_PREFIX)) continue;
    const name = k.slice(SMTP_VAR_PREFIX.length);
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name)) continue;
    out[name] = String(v ?? "").trim();
  }
  return out;
}

export function smtpVarInputName(key: string): string {
  return `${SMTP_VAR_PREFIX}${key}`;
}
