import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type OrderDeliverySettings = {
  interakt_template_name: string;
  interakt_template_language: string;
  interakt_button_index: string;
};

export const DEFAULT_ORDER_DELIVERY_SETTINGS: OrderDeliverySettings = {
  interakt_template_name: "kundlireportdelivery_bt",
  interakt_template_language: "hi",
  interakt_button_index: "0",
};

type OrderDeliverySettingsRowPick = Pick<
  Database["public"]["Tables"]["admin_order_delivery_settings"]["Row"],
  "interakt_template_name" | "interakt_template_language" | "interakt_button_index"
>;

function mapRow(row: OrderDeliverySettingsRowPick): OrderDeliverySettings {
  return {
    interakt_template_name: row.interakt_template_name,
    interakt_template_language: row.interakt_template_language,
    interakt_button_index: row.interakt_button_index,
  };
}

export async function getOrderDeliverySettings(
  supabase: SupabaseClient<Database>
): Promise<OrderDeliverySettings> {
  const { data, error } = await supabase
    .from("admin_order_delivery_settings")
    .select("interakt_template_name,interakt_template_language,interakt_button_index")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    if (error.code === "42P01" || error.code === "42703") {
      return { ...DEFAULT_ORDER_DELIVERY_SETTINGS };
    }
    console.error("[order-delivery-settings]", error.message);
    return { ...DEFAULT_ORDER_DELIVERY_SETTINGS };
  }

  if (!data) {
    return { ...DEFAULT_ORDER_DELIVERY_SETTINGS };
  }

  return mapRow(data);
}

export async function saveOrderDeliverySettings(
  supabase: SupabaseClient<Database>,
  input: OrderDeliverySettings
): Promise<void> {
  const row: Database["public"]["Tables"]["admin_order_delivery_settings"]["Insert"] = {
    id: 1,
    interakt_template_name: input.interakt_template_name.trim(),
    interakt_template_language: input.interakt_template_language.trim() || "hi",
    interakt_button_index: input.interakt_button_index.trim() || "0",
  };

  const { error } = await supabase
    .from("admin_order_delivery_settings")
    .upsert(row, { onConflict: "id" });

  if (error) throw error;
}
