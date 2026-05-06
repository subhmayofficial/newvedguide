import type { Metadata } from "next";
import Link from "next/link";
import { AppBottomNav } from "@/components/shared/app-bottom-nav";
import { ArrowLeft, Bot } from "lucide-react";

export const metadata: Metadata = { title: "Assistant Chat · VedGuide" };

export default function AssistantPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-24">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3.5 flex items-center gap-3">
        <Link
          href="/profile"
          className="flex size-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="font-semibold text-[17px] text-gray-900 flex-1 text-center pr-9">
          Assistant Chat
        </h1>
      </div>
      <div className="flex flex-col items-center gap-4 py-32 px-6 text-center max-w-lg mx-auto">
        <div className="flex size-20 items-center justify-center rounded-full bg-amber-50">
          <Bot className="size-9 text-amber-400" />
        </div>
        <div>
          <p className="font-semibold text-lg text-gray-900">Coming Soon</p>
          <p className="mt-1 text-sm text-gray-500">
            An AI-powered Vedic astrology assistant available 24/7 to answer
            your questions — launching shortly.
          </p>
        </div>
        <Link
          href="/profile"
          className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600"
        >
          Back to Profile
        </Link>
      </div>
      <AppBottomNav />
    </div>
  );
}
