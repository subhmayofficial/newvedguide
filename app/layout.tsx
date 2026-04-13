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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vedguide.in";

export const metadata: Metadata = {
  title: {
    default: "VedGuide — Vedic Astrology & Kundli",
    template: "%s | VedGuide",
  },
  description:
    "Get your free Kundli and personalized Vedic astrology guidance. Explore life, career, marriage, and remedies with AstroGuru Ashutosh.",
  keywords: [
    "free kundli",
    "vedic astrology",
    "kundli report",
    "astro consultation",
    "astro guru ashutosh",
    "birth chart analysis",
    "online astrology consultation",
  ],
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: "VedGuide — Vedic Astrology & Kundli",
    description:
      "Get your free Kundli and personalized Vedic astrology guidance with AstroGuru Ashutosh.",
    siteName: "VedGuide",
    type: "website",
    url: siteUrl,
    locale: "en_IN",
    images: [
      {
        url: "/assets/premium_kundli.webp",
        width: 1200,
        height: 630,
        alt: "VedGuide Kundli and Astrology Services",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VedGuide — Vedic Astrology & Kundli",
    description:
      "Get your free Kundli and personalized Vedic astrology guidance with AstroGuru Ashutosh.",
    images: ["/assets/premium_kundli.webp"],
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
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-WJHMJ92W');`,
          }}
        />
        {/* End Google Tag Manager */}
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
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-WJHMJ92W"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
            title="Google Tag Manager"
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
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
