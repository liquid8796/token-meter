/* eslint-disable @next/next/no-sync-scripts, @next/next/next-script-for-ga -- Keep the vendor-provided Adcash and Google tag snippets in <head>. */
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { getSiteOrigin } from "@/features/seo/metadata";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteOrigin()),
  title: {
    default: "TokenMeter — AI API cost calculator",
    template: "%s | TokenMeter",
  },
  description:
    "Compare source-backed AI model pricing against the workload you actually plan to run.",
  applicationName: "TokenMeter",
  keywords: [
    "AI API cost calculator",
    "LLM pricing comparison",
    "token cost calculator",
    "GPT-6 pricing",
    "Claude pricing",
    "Gemini API pricing",
    "AI token cost estimator",
    "AI model price comparison",
    "prompt cache pricing",
    "batch API pricing",
  ],
  authors: [{ name: "TokenMeter" }],
  creator: "TokenMeter",
  publisher: "TokenMeter",
  category: "technology",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: getSiteOrigin(),
    siteName: "TokenMeter",
    title: "TokenMeter — AI API cost calculator",
    description:
      "Compare source-backed AI model pricing against the workload you actually plan to run.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "TokenMeter — AI API cost calculator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TokenMeter — AI API cost calculator",
    description:
      "Compare source-backed AI model pricing against the workload you actually plan to run.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "TokenMeter",
    alternateName: "TokenMeter AI API Calculator",
    url: `${getSiteOrigin()}/`,
    description:
      "Compare source-backed AI model pricing against the workload you actually plan to run.",
  };

  const webAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "TokenMeter",
    applicationCategory: "BusinessApplication",
    operatingSystem: "All",
    browserRequirements: "Requires JavaScript. Requires HTML5.",
    url: `${getSiteOrigin()}/`,
    description:
      "Source-backed AI API pricing calculator comparing OpenAI, Anthropic, and Google token costs.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#071316" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-ZGNEZPD1Z8"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-ZGNEZPD1Z8');`,
          }}
        />
        <script id="aclib" type="text/javascript" src="//acscdn.com/script/aclib.js" />
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `aclib.runAutoTag({
  zoneId: "01qpchrhzg",
});`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(webAppJsonLd).replace(/</g, "\\u003c"),
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
