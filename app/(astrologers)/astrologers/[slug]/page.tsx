import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LIVE_CHAT_ASTROLOGERS } from "@/lib/data/live-chat-astrologers";
import { AstrologerProfileClient } from "@/components/astrologers/astrologer-profile-client";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return LIVE_CHAT_ASTROLOGERS.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const a = LIVE_CHAT_ASTROLOGERS.find((x) => x.slug === slug);
  if (!a) return {};
  return {
    title: `${a.name} · VedGuide`,
    description: a.shortBio,
  };
}

export default async function AstrologerProfilePage({ params }: Props) {
  const { slug } = await params;
  const astrologer = LIVE_CHAT_ASTROLOGERS.find((a) => a.slug === slug);
  if (!astrologer) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let balancePaise = 0;
  if (user) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("wallet_balance_paise")
      .eq("id", user.id)
      .maybeSingle();
    balancePaise = profile?.wallet_balance_paise ?? 0;
  }

  return (
    <AstrologerProfileClient
      astrologer={astrologer}
      isLoggedIn={!!user}
      balancePaise={balancePaise}
    />
  );
}
