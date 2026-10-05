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
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "TokenMeter",
    url: `${getSiteOrigin()}/`,
  };

  return (
    <html lang="en">
      <head>
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
  zoneId: "6hkumnovjt",
});`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd).replace(/</g, "\\u003c"),
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
