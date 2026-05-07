import { AstrologersSiteHeader } from "@/components/astrologers/astrologers-site-header";
import { AppBottomNav } from "@/components/shared/app-bottom-nav";
import { createClient } from "@/lib/supabase/server";

export default async function AstrologersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let balancePaise = 0;
  let displayName: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("wallet_balance_paise, display_name")
      .eq("id", user.id)
      .maybeSingle();
    balancePaise = profile?.wallet_balance_paise ?? 0;
    displayName = profile?.display_name ?? null;
  }

  return (
    <>
      <AstrologersSiteHeader
        initialUser={
          user
            ? { id: user.id, email: user.email ?? "", displayName }
            : null
        }
        initialBalancePaise={balancePaise}
      />
      {/* pb-20 so content clears the fixed bottom nav */}
      <main className="flex min-h-0 flex-1 flex-col overflow-x-hidden pb-20">{children}</main>
      <AppBottomNav />
    </>
  );
}
