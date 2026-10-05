import type { Metadata } from "next";

const DEFAULT_SITE_ORIGIN = "http://localhost:3000";

export interface CanonicalMetadataInput {
  title: string;
  description: string;
  path: string;
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
}: CanonicalMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: { canonical: siteUrl(path) },
  };
}
