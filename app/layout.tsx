import type { Metadata } from "next";
import "@fontsource/plus-jakarta-sans/latin.css";
import "./globals.css";
import "./design-system.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { Toaster } from "sonner";
import { StoragePersistenceManager } from "@/components/StoragePersistenceManager";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";

export const metadata: Metadata = {
  title: "NEUROHQ",
  description: "Nervous-system-aware personal operating system",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/app-icon.png",
    apple: "/app-icon.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#050810",
  viewportFit: "cover" as const,
};

/** Commander v2 is de enige visuele stijl – altijd normal + dark. */
const themeScript = `
(function(){
  document.documentElement.setAttribute('data-theme','normal');
  document.documentElement.setAttribute('data-color-mode','dark');
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <ServiceWorkerRegistration />
        <StoragePersistenceManager />
        <PwaInstallPrompt />
        <ThemeProvider>{children}</ThemeProvider>
        <Toaster richColors position="bottom-center" closeButton />
      </body>
    </html>
  );
}
