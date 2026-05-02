/** Column present in app types but not yet in remote DB (e.g. migration not applied). */
export function isSupabaseUnknownColumnError(
  message: string | undefined,
  columnName: string
): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  const col = columnName.toLowerCase();
  if (!m.includes(col)) return false;
  return (
    m.includes("column") ||
    m.includes("schema cache") ||
    m.includes("pgrst204") ||
    m.includes("could not find")
  );
}

/** PostgREST / Supabase errors when migrations haven’t been applied yet. */
export function isSupabaseTableMissingError(message: string | undefined): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  return (
    m.includes("schema cache") ||
    m.includes("could not find the table") ||
    (m.includes("relation") && m.includes("does not exist")) ||
    m.includes("pgrst205")
  );
}

export const SCHEMA_NOT_READY_USER_MESSAGE =
  "Wallet and live chat need the latest tables. In Supabase, run migration 026_user_wallet_chat.sql (SQL editor or CLI), then reload this page and try again.";
