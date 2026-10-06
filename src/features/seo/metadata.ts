import type { Metadata } from "next";

const DEFAULT_SITE_ORIGIN = "http://localhost:3000";

export interface CanonicalMetadataInput {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  image?: string;
}

export function getSiteOrigin(value = process.env.NEXT_PUBLIC_SITE_URL): string {
  if (!value) return DEFAULT_SITE_ORIGIN;

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return DEFAULT_SITE_ORIGIN;
    return url.origin;
  } catch {
    return DEFAULT_SITE_ORIGIN;
  }
}

export function siteUrl(path: string, origin = getSiteOrigin()): string {
  const durablePath = path.split(/[?#]/, 1)[0] || "/";
  const normalizedPath = durablePath.startsWith("/") ? durablePath : `/${durablePath}`;
  return new URL(normalizedPath, `${origin}/`).toString().replace(/\/$/, normalizedPath === "/" ? "/" : "");
}

export function createCanonicalMetadata({
  title,
  description,
  path,
  keywords,
  image,
}: CanonicalMetadataInput): Metadata {
  const canonical = siteUrl(path);
  const ogImageUrl = image || `${getSiteOrigin()}/og-image.png`;

  return {
    title,
    description,
    ...(keywords && keywords.length > 0 ? { keywords } : {}),
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "TokenMeter",
      locale: "en_US",
      type: "website",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${title} — TokenMeter`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}
