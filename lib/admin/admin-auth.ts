import type { User } from "@supabase/supabase-js";

/** When `ADMIN_EMAIL_ALLOWLIST` is unset, only these emails may access admin. */
const DEFAULT_ADMIN_EMAIL_ALLOWLIST = ["admin@vedguide.com"] as const;

function parseAdminAllowlist(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function effectiveAdminEmails(): string[] {
  const fromEnv = parseAdminAllowlist(process.env.ADMIN_EMAIL_ALLOWLIST);
  if (fromEnv.length > 0) return fromEnv;
  return [...DEFAULT_ADMIN_EMAIL_ALLOWLIST];
}

/** Same rules as proxy.ts admin gate (for server actions / API routes). */
export function isAdminUser(user: User | null): boolean {
  if (!user) return false;
  if (user.app_metadata?.vedguide_admin === true) return true;
  const allow = effectiveAdminEmails();
  const email = user.email?.toLowerCase();
  return !!email && allow.includes(email);
}
