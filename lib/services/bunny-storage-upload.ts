import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getBunnyCdnSettings } from "@/lib/admin/bunny-cdn-settings";

const MAX_BYTES = 35 * 1024 * 1024;
const ALLOWED_EXT = new Set([".pdf", ".png", ".jpg", ".jpeg", ".webp"]);

/** Storage zone FTP/API password — trim quotes/BOM/newlines often pasted by mistake. */
function normalizeBunnyAccessKey(raw: string): string {
  let s = raw.trim().replace(/^\uFEFF/, "");
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  return s.replace(/\r\n|\n|\r/g, "");
}

function sanitizeSegment(s: string): string {
  const t = s.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return t.slice(0, 96) || "file";
}

function extFromName(name: string): string {
  const i = name.lastIndexOf(".");
  if (i < 0) return "";
  return name.slice(i).toLowerCase();
}

/**
 * Must match the storage zone’s “FTP & HTTP API” hostname (e.g. `sg` → `sg.storage.bunnycdn.com`).
 * Empty region defaults to Falkenstein (`storage.bunnycdn.com`) — wrong endpoint often yields 401 for other regions.
 */
function bunnyStorageHost(region: string): string {
  const r = region.trim().toLowerCase();
  if (!r) return "storage.bunnycdn.com";
  return `${r}.storage.bunnycdn.com`;
}

function encodeStoragePath(path: string): string {
  return path
    .split("/")
    .map((p) => encodeURIComponent(p))
    .join("/");
}

export async function uploadPaidKundliReportToBunny(
  supabase: SupabaseClient<Database>,
  params: {
    orderNumber: string;
    fileName: string;
    mimeType: string;
    body: Buffer;
  }
): Promise<
  { ok: true; publicUrl: string; storagePath: string } | { ok: false; message: string }
> {
  const apiKeyRaw = process.env.BUNNY_STORAGE_API_KEY;
  const apiKey = apiKeyRaw ? normalizeBunnyAccessKey(apiKeyRaw) : "";
  if (!apiKey) {
    return { ok: false, message: "Server env BUNNY_STORAGE_API_KEY is not set" };
  }

  const settings = await getBunnyCdnSettings(supabase);
  const zone = settings.storage_zone_name.trim();
  if (!zone) {
    return { ok: false, message: "Bunny storage zone name missing (Admin → Settings)" };
  }

  const cdnBase = settings.cdn_public_base_url.trim().replace(/\/+$/, "");
  if (!cdnBase) {
    return { ok: false, message: "Bunny CDN public base URL missing (Admin → Settings)" };
  }

  const ext = extFromName(params.fileName);
  if (!ALLOWED_EXT.has(ext)) {
    return { ok: false, message: "Allowed: PDF, PNG, JPG, JPEG, WebP" };
  }

  if (params.body.length === 0) {
    return { ok: false, message: "Empty file" };
  }
  if (params.body.length > MAX_BYTES) {
    return { ok: false, message: `Max file size is ${Math.round(MAX_BYTES / 1024 / 1024)} MB` };
  }

  const idPart = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  const baseName = sanitizeSegment(params.fileName.replace(/\.[^.]+$/, ""));
  const safeOrder = sanitizeSegment(params.orderNumber);
  const storagePath = `kundli-reports/${safeOrder}/${idPart}-${baseName}${ext}`;

  const regionFromDb = settings.storage_region.trim();
  const regionFromEnv = process.env.BUNNY_STORAGE_REGION?.trim() ?? "";
  const storageRegion = regionFromDb || regionFromEnv;

  const host = bunnyStorageHost(storageRegion);
  const pathPart = encodeStoragePath(storagePath);
  const uploadUrl = `https://${host}/${encodeURIComponent(zone)}/${pathPart}`;

  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      AccessKey: apiKey,
      "Content-Type": params.mimeType?.trim() || "application/octet-stream",
    },
    body: new Uint8Array(params.body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const snippet = `Bunny storage error ${res.status}: ${text.slice(0, 240)}`.trim();
    if (res.status === 401) {
      return {
        ok: false,
        message: `${snippet} — 401 usually means: (1) use the Storage zone “Password” from FTP & API (not account API key / not read-only password), (2) Admin → Settings “Storage region” must match your hostname (e.g. Singapore → sg), or set BUNNY_STORAGE_REGION=sg in .env.local, (3) restart dev server after changing .env.`,
      };
    }
    return { ok: false, message: snippet };
  }

  const publicUrl = `${cdnBase}/${pathPart}`;
  return { ok: true, publicUrl, storagePath };
}
