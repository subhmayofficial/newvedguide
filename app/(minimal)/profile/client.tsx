"use client";

import Link from "next/link";
import { AppBottomNav } from "@/components/shared/app-bottom-nav";
import {
  ArrowLeft,
  Edit2,
  History,
  Wallet,
  Headphones,
  MessageSquare,
  Home,
  LayoutGrid,
  Flame,
  Users,
  Bot,
  Gift,
  ShoppingBag,
  ChevronRight,
} from "lucide-react";
import { AccountSignOutButton } from "@/components/account/account-sign-out-button";

interface ProfileClientProps {
  name: string;
  initials: string;
  phone: string | null;
  balancePaise: number;
  chatCount: number;
}

function SectionItem({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gray-100">
        <Icon className="size-[18px] text-gray-500" />
      </div>
      <span className="flex-1 text-[15px] font-medium text-gray-800">
        {label}
      </span>
      <ChevronRight className="size-4 text-gray-400" />
    </Link>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2 px-1">
        {title}
      </p>
      <div className="bg-white rounded-2xl overflow-hidden divide-y divide-gray-100 shadow-sm border border-gray-100">
        {children}
      </div>
    </div>
  );
}

function QuickTile({
  href,
  icon: Icon,
  label,
  badge,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100 hover:border-gray-200 transition active:scale-95"
    >
      <div className="relative">
        <div className="flex size-12 items-center justify-center rounded-full bg-gray-100">
          <Icon className="size-5 text-gray-600" />
        </div>
        {badge && (
          <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[9px] font-bold rounded-full px-1.5 py-0.5 leading-none">
            {badge}
          </span>
        )}
      </div>
      <span className="text-[12px] font-medium text-gray-700 text-center leading-tight">
        {label}
      </span>
    </Link>
  );
}

export function ProfileClient({
  name,
  initials: _initials,
  phone,
  balancePaise,
  chatCount: _chatCount,
}: ProfileClientProps) {
  const balanceRupees = Math.floor(balancePaise / 100);

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-24">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3.5 flex items-center gap-3">
        <Link
          href="/astrologers"
          className="flex size-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="font-semibold text-[17px] text-gray-900 flex-1 text-center pr-9">
          Profile &amp; Settings
        </h1>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">
        {/* User card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          {/* Yellow orbital logo */}
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "#FDD835",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="36" height="36" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="8" fill="#1a1a1a" />
              <ellipse
                cx="40"
                cy="40"
                rx="28"
                ry="10"
                stroke="#1a1a1a"
                strokeWidth="2.5"
                fill="none"
              />
              <ellipse
                cx="40"
                cy="40"
                rx="28"
                ry="10"
                stroke="#1a1a1a"
                strokeWidth="2.5"
                fill="none"
                transform="rotate(60 40 40)"
              />
              <ellipse
                cx="40"
                cy="40"
                rx="28"
                ry="10"
                stroke="#1a1a1a"
                strokeWidth="2.5"
                fill="none"
                transform="rotate(120 40 40)"
              />
              <circle cx="63" cy="32" r="3.5" fill="#1a1a1a" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[17px] text-gray-900 truncate">
              {name}
            </p>
            {phone && (
              <p className="text-[13px] text-gray-500 mt-0.5">{phone}</p>
            )}
          </div>
          <Link
            href="/users/settings"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
          >
            <Edit2 className="size-4 text-gray-500" />
          </Link>
        </div>

        {/* 3 quick-action tiles */}
        <div className="grid grid-cols-3 gap-3">
          <QuickTile href="/orders" icon={History} label="My Orders" />
          <QuickTile
            href="/astrologers/wallet"
            icon={Wallet}
            label="Wallet"
            badge={balanceRupees > 0 ? `₹${balanceRupees}` : undefined}
          />
          <QuickTile
            href="/support-chat"
            icon={Headphones}
            label="Support Chat"
          />
        </div>

        {/* EXPLORE */}
        <Section title="Explore">
          <SectionItem
            href="/astrologers"
            icon={MessageSquare}
            label="Chat with Astrologer"
          />
          <SectionItem href="/" icon={Home} label="Home" />
          <SectionItem
            href="/free-services"
            icon={LayoutGrid}
            label="Free Services"
          />
          <SectionItem href="/pooja" icon={Flame} label="Book a Pooja" />
        </Section>

        {/* ACCOUNT */}
        <Section title="Account">
          <SectionItem href="/following" icon={Users} label="My following" />
          <SectionItem href="/assistant" icon={Bot} label="Assistant Chat" />
          <SectionItem
            href="/gift-card"
            icon={Gift}
            label="Redeem Gift Card"
          />
        </Section>

        {/* SERVICES */}
        <Section title="Services">
          <SectionItem
            href="/remedy"
            icon={ShoppingBag}
            label="AstroRemedy"
          />
        </Section>

        {/* Sign out */}
        <AccountSignOutButton
          className="w-full rounded-2xl bg-white border border-gray-200 py-3.5 text-sm font-medium text-gray-600 shadow-sm hover:text-red-600 hover:border-red-200 transition"
          variant="outline"
          redirectTo="/login"
        />
      </div>

      <AppBottomNav />
    </div>
  );
}
