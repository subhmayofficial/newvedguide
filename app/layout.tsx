import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import { PostHogProvider } from "@/components/providers/posthog-provider";
import { GaRouteTracker } from "@/components/analytics/ga-route-tracker";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "VedGuide — Vedic Astrology & Kundli",
    template: "%s | VedGuide",
  },
  description:
    "Get your free Kundli and personalized Vedic astrology insights. Understand your birth chart, life path, and destiny with VedGuide.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://vedguide.in"
  ),
  openGraph: {
    siteName: "VedGuide",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${cormorant.variable} h-full antialiased`}
    >
      <head>
        {/* Microsoft Clarity */}
        {process.env.NEXT_PUBLIC_CLARITY_ID && (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${process.env.NEXT_PUBLIC_CLARITY_ID}");`,
            }}
          />
        )}
        {/* Google Analytics 4 */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', { page_path: window.location.pathname });`,
              }}
            />
          </>
        )}
      </head>
      <body className="min-h-full flex flex-col">
        <PostHogProvider>
          <Suspense fallback={null}>
            <GaRouteTracker />
          </Suspense>
          {children}
        </PostHogProvider>
      </body>
    </html>
  );
}
