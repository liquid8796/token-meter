/* eslint-disable @next/next/no-sync-scripts -- Adcash requires aclib.js before its inline AutoTag initializer. */
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
        <script id="aclib" type="text/javascript" src="//acscdn.com/script/aclib.js" />
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `aclib.runAutoTag({
  zoneId: "8igkljjeqv",
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
