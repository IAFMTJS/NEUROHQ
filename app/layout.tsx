import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "./design-system.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ReactQueryProvider } from "@/components/providers/ReactQueryProvider";
import { SettingsProvider } from "@/lib/settings-context";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "optional",
  variable: "--font-sans",
});
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { DeferredRootComponents } from "@/components/DeferredRootComponents";
import { DeferredToaster } from "@/components/DeferredToaster";
import { MobileSyncBootstrap } from "@/components/MobileSyncBootstrap";

export const metadata: Metadata = {
  title: "NEUROHQ",
  description: "Nervous-system-aware personal operating system",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  // iOS/macOS “Add to Home Screen”: status bar blends with app, no browser chrome
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NEUROHQ",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#03060c",
  viewportFit: "cover" as const,
};

/** Commander v2 — normal + dark; standard (full) UI. ThemeHydrate overwrites persisted keys to match. */
const themeScript = `
(function(){
  document.documentElement.setAttribute('data-theme','normal');
  document.documentElement.setAttribute('data-color-mode','dark');
  document.documentElement.setAttribute('data-reduced-motion','false');
  document.documentElement.setAttribute('data-compact-ui','false');
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isProduction = process.env.NODE_ENV === "production";

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`min-h-screen antialiased ${plusJakarta.variable} font-sans`}>
        <div id="app-shell" className="hq-app-shell min-h-screen min-h-dvh">
          <ServiceWorkerRegistration />
          <MobileSyncBootstrap />
          <ReactQueryProvider>
            <DeferredRootComponents />
            <SettingsProvider>
              <ThemeProvider>{children}</ThemeProvider>
            </SettingsProvider>
            <DeferredToaster />
          </ReactQueryProvider>
        </div>
        {isProduction ? <Analytics /> : null}
        {isProduction ? <SpeedInsights /> : null}
      </body>
    </html>
  );
}
