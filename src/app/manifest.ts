import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TokenMeter — AI API Cost Calculator",
    short_name: "TokenMeter",
    description: "Compare source-backed AI model pricing against the workload you actually plan to run.",
    start_url: "/",
    display: "standalone",
    background_color: "#071316",
    theme_color: "#071316",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
