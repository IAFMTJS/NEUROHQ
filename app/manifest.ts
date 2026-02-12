import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NEUROHQ",
    short_name: "NEUROHQ",
    description: "Nervous-system-aware personal operating system",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0d1117",
    theme_color: "#58a6ff",
    icons: [
      { src: "/app-icon.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/app-icon.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
