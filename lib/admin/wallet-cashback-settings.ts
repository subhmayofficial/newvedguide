import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type WalletCashbackSettings = {
  cashback_enabled: boolean;
  cashback_percent: number;
};

export const DEFAULT_WALLET_CASHBACK_SETTINGS: WalletCashbackSettings = {
  cashback_enabled: false,
  cashback_percent: 0,
};

type RowPick = Pick<
  Database["public"]["Tables"]["admin_wallet_cashback_settings"]["Row"],
  "cashback_enabled" | "cashback_percent"
>;

function mapRow(row: RowPick): WalletCashbackSettings {
  return {
    cashback_enabled: row.cashback_enabled,
    cashback_percent: row.cashback_percent,
  };
}

export async function getWalletCashbackSettings(
  supabase: SupabaseClient<Database>
): Promise<WalletCashbackSettings> {
  const { data, error } = await supabase
    .from("admin_wallet_cashback_settings")
    .select("cashback_enabled,cashback_percent")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    if (error.code === "42P01" || error.code === "42703") {
      return { ...DEFAULT_WALLET_CASHBACK_SETTINGS };
    }
    console.error("[wallet-cashback-settings]", error.message);
    return { ...DEFAULT_WALLET_CASHBACK_SETTINGS };
  }

  if (!data) {
    return { ...DEFAULT_WALLET_CASHBACK_SETTINGS };
  }

  return mapRow(data);
}

export async function saveWalletCashbackSettings(
  supabase: SupabaseClient<Database>,
  input: WalletCashbackSettings
): Promise<void> {
  const pct = Math.max(0, Math.min(100, Math.floor(input.cashback_percent)));
  const row: Database["public"]["Tables"]["admin_wallet_cashback_settings"]["Insert"] = {
    id: 1,
    cashback_enabled: input.cashback_enabled,
    cashback_percent: pct,
  };

  const { error } = await supabase
    .from("admin_wallet_cashback_settings")
    .upsert(row, { onConflict: "id" });

  if (error) throw error;
}

/** Minimum top-up in paise that qualifies for cashback (exclusive — must be ABOVE this). */
export const CASHBACK_MIN_ELIGIBLE_PAISE = 9_900; // > ₹99 i.e. ₹100+

/** Extra paise to credit when cashback is enabled.
 *  Cashback only applies when principal > ₹99 (9900 paise). */
export function computeTopupCashbackPaise(
  principalPaise: number,
  settings: WalletCashbackSettings
): number {
  if (!settings.cashback_enabled || settings.cashback_percent <= 0) return 0;
  if (principalPaise <= 0) return 0;
  // Only offer cashback on amounts strictly greater than ₹99
  if (principalPaise <= CASHBACK_MIN_ELIGIBLE_PAISE) return 0;
  return Math.floor((principalPaise * settings.cashback_percent) / 100);
}
