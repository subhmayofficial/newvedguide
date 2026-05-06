import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isPhoneOtpSyntheticEmail } from "@/lib/auth/phone-login-identity";
import { ProfileClient } from "./client";

export const metadata: Metadata = {
  title: "Profile & Settings · VedGuide",
};

function fmtPhone(e164: string | null | undefined): string | null {
  if (!e164) return null;
  const d = e164.replace(/^\+91/, "").replace(/\D/g, "");
  return d.length === 10 ? `+91-${d}` : e164;
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/profile");

  const [{ data: profile }, { count: chatCount }] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("display_name, wallet_balance_paise")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("chat_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  const rawName =
    profile?.display_name?.trim() ||
    (!isPhoneOtpSyntheticEmail(user.email ?? "") && user.email
      ? user.email.split("@")[0]
      : null) ||
    "there";

  const initials =
    rawName
      .split(/\s+/)
      .slice(0, 2)
      .map((w: string) => w[0])
      .join("")
      .toUpperCase() || rawName.slice(0, 2).toUpperCase();

  const authPhone =
    (user.user_metadata?.auth_phone as string | undefined) ?? null;
  const phone = fmtPhone(authPhone);

  return (
    <ProfileClient
      name={rawName}
      initials={initials}
      phone={phone}
      balancePaise={profile?.wallet_balance_paise ?? 0}
      chatCount={chatCount ?? 0}
    />
  );
}
