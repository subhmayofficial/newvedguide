import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { isPhoneOtpSyntheticEmail } from "@/lib/auth/phone-login-identity";
import { UserProfileClient } from "@/components/account/user-profile-client";

export const metadata: Metadata = {
  title: "Your account",
  description: "VedGuide account, wallet, and chats.",
};

export default async function UserDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("display_name, wallet_balance_paise")
    .eq("id", user.id)
    .maybeSingle();

  const { count: chatCount } = await supabase
    .from("chat_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const name =
    profile?.display_name?.trim() ||
    (!isPhoneOtpSyntheticEmail(user.email) && user.email
      ? user.email.split("@")[0]
      : null) ||
    "there";

  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase() || name.slice(0, 2).toUpperCase();

  return (
    <UserProfileClient
      name={name}
      initials={initials}
      balancePaise={profile?.wallet_balance_paise ?? 0}
      chatCount={chatCount ?? 0}
    />
  );
}
