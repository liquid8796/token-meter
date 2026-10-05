import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "TokenMeter — AI API cost calculator",
    template: "%s | TokenMeter",
  },
  description:
    "Compare source-backed AI model pricing against the workload you actually plan to run.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
