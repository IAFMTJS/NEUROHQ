import type { MetadataRoute } from "next";

/** Absolute origin for PWA start_url so "Add to home screen" always opens the right URL when reopening (avoids "link not found" on mobile). Set NEXT_PUBLIC_APP_URL in Vercel to your production URL, e.g. https://neurohq.vercel.app */
const baseUrl =
  typeof process.env.NEXT_PUBLIC_APP_URL === "string" && process.env.NEXT_PUBLIC_APP_URL
    ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
    : null;

export default function manifest(): MetadataRoute.Manifest {
  const originScopedId = baseUrl ? `${baseUrl}/` : "/";
  return {
    id: originScopedId,
    name: "NEUROHQ",
    short_name: "NEUROHQ",
    description: "Nervous-system-aware personal operating system",
    start_url: baseUrl ? `${baseUrl}/dashboard` : "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#050810",
    theme_color: "#050810",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
    ],
  };
}
