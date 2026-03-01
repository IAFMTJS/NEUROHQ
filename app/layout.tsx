import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "./design-system.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { Toaster } from "sonner";
import { DeferredRootComponents } from "@/components/DeferredRootComponents";

export const metadata: Metadata = {
  title: "NEUROHQ",
  description: "Nervous-system-aware personal operating system",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/app-icon.png",
    apple: "/app-icon.png",
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
      <body className={`min-h-screen antialiased ${plusJakarta.variable} font-sans`}>
        <ServiceWorkerRegistration />
        <DeferredRootComponents />
        <ThemeProvider>{children}</ThemeProvider>
        <Toaster richColors position="bottom-center" closeButton />
      </body>
    </html>
  );
}
