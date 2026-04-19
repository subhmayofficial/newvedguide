import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";

export type SavedInteraktTemplateRow =
  Database["public"]["Tables"]["admin_interakt_templates"]["Row"];

export type SavedInteraktTemplate = {
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
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SavedInteraktTemplateInput = {
  name: string;
  languageCode: string;
  headerLabels?: string[];
  bodyLabels?: string[];
  buttonValueLabels?: Array<{ buttonIndex: string; label: string }>;
  buttonPayloadLabels?: Array<{ buttonIndex: string; label: string }>;
  fileNameRequired?: boolean;
  notes?: string | null;
  source?: string;
  isActive?: boolean;
};

function toStringArray(value: Json | null | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
}

function toButtonMappings(
  value: Json | null | undefined
): Array<{ buttonIndex: string; label: string }> {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null;
      const buttonIndex = String(item.buttonIndex ?? "").trim();
      const label = String(item.label ?? "").trim();
      if (!buttonIndex || !label) return null;
      return { buttonIndex, label };
    })
    .filter((item): item is { buttonIndex: string; label: string } => item !== null);
}

function uniqueStrings(values: string[] | undefined): string[] {
  if (!values?.length) return [];
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function uniqueMappings(
  values: Array<{ buttonIndex: string; label: string }> | undefined
): Array<{ buttonIndex: string; label: string }> {
  if (!values?.length) return [];
  const seen = new Set<string>();
  const out: Array<{ buttonIndex: string; label: string }> = [];
  for (const value of values) {
    const buttonIndex = value.buttonIndex.trim();
    const label = value.label.trim();
    if (!buttonIndex || !label) continue;
    const key = `${buttonIndex}:${label}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ buttonIndex, label });
  }
  return out;
}

export function mapSavedInteraktTemplate(row: SavedInteraktTemplateRow): SavedInteraktTemplate {
  return {
    id: row.id,
    name: row.name,
    languageCode: row.language_code,
    headerLabels: toStringArray(row.header_labels_json),
    bodyLabels: toStringArray(row.body_labels_json),
    buttonValueLabels: toButtonMappings(row.button_value_labels_json),
    buttonPayloadLabels: toButtonMappings(row.button_payload_labels_json),
    fileNameRequired: row.file_name_required,
    notes: row.notes,
    source: row.source,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listSavedInteraktTemplates(
  supabase: SupabaseClient<Database>
): Promise<{ data: SavedInteraktTemplate[]; errorCode: string | null; errorMessage: string | null }> {
  const { data, error } = await supabase
    .from("admin_interakt_templates")
    .select(
      "id,name,language_code,header_labels_json,body_labels_json,button_value_labels_json,button_payload_labels_json,file_name_required,notes,source,is_active,created_at,updated_at"
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  return {
    data: ((data as SavedInteraktTemplateRow[] | null) ?? []).map(mapSavedInteraktTemplate),
    errorCode: error?.code ?? null,
    errorMessage: error?.message ?? null,
  };
}

export async function upsertSavedInteraktTemplate(
  supabase: SupabaseClient<Database>,
  input: SavedInteraktTemplateInput
): Promise<void> {
  const row: Database["public"]["Tables"]["admin_interakt_templates"]["Insert"] = {
    name: input.name.trim(),
    language_code: input.languageCode.trim() || "en",
    header_labels_json: uniqueStrings(input.headerLabels) as Json,
    body_labels_json: uniqueStrings(input.bodyLabels) as Json,
    button_value_labels_json: uniqueMappings(input.buttonValueLabels) as unknown as Json,
    button_payload_labels_json: uniqueMappings(input.buttonPayloadLabels) as unknown as Json,
    file_name_required: Boolean(input.fileNameRequired),
    notes: input.notes?.trim() || null,
    source: input.source?.trim() || "manual",
    is_active: input.isActive ?? true,
  };

  const { error } = await supabase
    .from("admin_interakt_templates")
    .upsert(row, { onConflict: "name" });

  if (error) throw error;
}

export async function updateSavedInteraktTemplateById(
  supabase: SupabaseClient<Database>,
  id: string,
  input: SavedInteraktTemplateInput
): Promise<void> {
  const row: Database["public"]["Tables"]["admin_interakt_templates"]["Update"] = {
    name: input.name.trim(),
    language_code: input.languageCode.trim() || "en",
    header_labels_json: uniqueStrings(input.headerLabels) as Json,
    body_labels_json: uniqueStrings(input.bodyLabels) as Json,
    button_value_labels_json: uniqueMappings(input.buttonValueLabels) as unknown as Json,
    button_payload_labels_json: uniqueMappings(input.buttonPayloadLabels) as unknown as Json,
    file_name_required: Boolean(input.fileNameRequired),
    notes: input.notes?.trim() || null,
  };
  if (input.source?.trim()) {
    row.source = input.source.trim();
  }

  const { error } = await supabase.from("admin_interakt_templates").update(row).eq("id", id);

  if (error) throw error;
}

export async function deleteSavedInteraktTemplateById(
  supabase: SupabaseClient<Database>,
  id: string
): Promise<void> {
  const { error } = await supabase.from("admin_interakt_templates").delete().eq("id", id);
  if (error) throw error;
}

function extractPlaceholders(input: string | null | undefined, prefix: string): string[] {
  if (!input) return [];
  const matches = new Set<number>();
  const pattern = /\{\{\s*(\d+)\s*\}\}/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(input)) !== null) {
    matches.add(Number(match[1]));
  }
  return Array.from(matches)
    .sort((a, b) => a - b)
    .map((value) => `${prefix} ${value}`);
}

function normalizeRemoteTemplateItem(item: unknown): SavedInteraktTemplateInput | null {
  if (!item || typeof item !== "object" || Array.isArray(item)) return null;
  const record = item as Record<string, unknown>;
  const rawTemplate =
    typeof record.raw_template === "string"
      ? (() => {
          try {
            return JSON.parse(record.raw_template) as Record<string, unknown>;
          } catch {
            return null;
          }
        })()
      : null;

  const sourceRecord = rawTemplate ?? record;
  const name =
    String(
      sourceRecord.name ?? record.template_name ?? record.code_name ?? record.codename ?? ""
    ).trim();
  if (!name) return null;

  const languageCode = String(
    sourceRecord.language ??
      sourceRecord.languageCode ??
      record.language_code ??
      record.languageCode ??
      "en"
  ).trim() || "en";

  const headerText = String(sourceRecord.header_text ?? sourceRecord.header ?? "").trim();
  const bodyText = String(sourceRecord.body ?? record.body ?? "").trim();

  return {
    name,
    languageCode,
    headerLabels: extractPlaceholders(headerText, "Header"),
    bodyLabels: extractPlaceholders(bodyText, "Body"),
    notes: String(sourceRecord.category ?? record.category ?? "").trim() || null,
    source: "interakt_api",
    isActive: true,
  };
}

function extractRemoteItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const record = payload as Record<string, unknown>;
  const candidates = [
    record.templates,
    record.data,
    record.result,
    record.content,
    record.items,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
      const nested = candidate as Record<string, unknown>;
      const nestedArray = nested.templates ?? nested.content ?? nested.items ?? nested.data;
      if (Array.isArray(nestedArray)) return nestedArray;
    }
  }

  return [];
}

export function normalizeRemoteInteraktTemplates(payload: unknown): SavedInteraktTemplateInput[] {
  return extractRemoteItems(payload)
    .map(normalizeRemoteTemplateItem)
    .filter((item): item is SavedInteraktTemplateInput => item !== null);
}
