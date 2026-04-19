import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type BunnyCdnSettings = {
  storage_zone_name: string;
  storage_region: string;
  cdn_public_base_url: string;
};

export const DEFAULT_BUNNY_CDN_SETTINGS: BunnyCdnSettings = {
  storage_zone_name: "",
  /** Empty falls back to Falkenstein API host — set `sg` if FTP hostname is sg.storage.bunnycdn.com */
  storage_region: "sg",
  cdn_public_base_url: "https://vedguide.b-cdn.net",
};

type BunnyCdnRowPick = Pick<
  Database["public"]["Tables"]["admin_bunny_cdn_settings"]["Row"],
  "storage_zone_name" | "storage_region" | "cdn_public_base_url"
>;

function mapRow(row: BunnyCdnRowPick): BunnyCdnSettings {
  return {
    storage_zone_name: row.storage_zone_name,
    storage_region: row.storage_region,
    cdn_public_base_url: row.cdn_public_base_url,
  };
}

export async function getBunnyCdnSettings(
  supabase: SupabaseClient<Database>
): Promise<BunnyCdnSettings> {
  const { data, error } = await supabase
    .from("admin_bunny_cdn_settings")
    .select("storage_zone_name,storage_region,cdn_public_base_url")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    if (error.code === "42P01" || error.code === "42703") {
      return { ...DEFAULT_BUNNY_CDN_SETTINGS };
    }
    console.error("[bunny-cdn-settings]", error.message);
    return { ...DEFAULT_BUNNY_CDN_SETTINGS };
  }

  if (!data) {
    return { ...DEFAULT_BUNNY_CDN_SETTINGS };
  }

  return mapRow(data);
}

export async function saveBunnyCdnSettings(
  supabase: SupabaseClient<Database>,
  input: BunnyCdnSettings
): Promise<void> {
  const row: Database["public"]["Tables"]["admin_bunny_cdn_settings"]["Insert"] = {
    id: 1,
    storage_zone_name: input.storage_zone_name.trim(),
    storage_region: input.storage_region.trim(),
    cdn_public_base_url: input.cdn_public_base_url.trim().replace(/\/+$/, ""),
  };

  const { error } = await supabase.from("admin_bunny_cdn_settings").upsert(row, {
    onConflict: "id",
  });

  if (error) throw error;
}
