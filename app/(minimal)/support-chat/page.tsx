"use client";

import Link from "next/link";
import { ArrowLeft, MessageCircle, Mail } from "lucide-react";
import { AppBottomNav } from "@/components/shared/app-bottom-nav";

export default function SupportChatPage() {
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
          Support Chat
        </h1>
      </div>

      <div className="px-4 py-6 max-w-lg mx-auto space-y-4">
        <a
          href="https://wa.me/917892614605?text=Hi%20VedGuide%2C%20I%20need%20help%20with%20my%20account."
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-green-200 transition"
        >
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-green-50">
            <MessageCircle className="size-6 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">Chat on WhatsApp</p>
            <p className="text-sm text-gray-500 mt-0.5">Fastest response · Usually within minutes</p>
          </div>
          <span className="text-[11px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
            Online
          </span>
        </a>

        <a
          href="mailto:support@vedguide.com"
          className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-blue-200 transition"
        >
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-50">
            <Mail className="size-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">Email Support</p>
            <p className="text-sm text-gray-500 mt-0.5">support@vedguide.com</p>
          </div>
        </a>

        <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4 text-sm text-amber-800">
          <p className="font-semibold mb-1">Support Hours</p>
          <p>Monday – Saturday: 9 AM – 9 PM IST</p>
          <p>Sunday: 10 AM – 6 PM IST</p>
        </div>
      </div>

      <AppBottomNav />
    </div>
  );
}
