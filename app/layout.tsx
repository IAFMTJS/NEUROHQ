import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "./design-system.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "optional",
  variable: "--font-sans",
});
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { DeferredRootComponents } from "@/components/DeferredRootComponents";
import { DeferredToaster } from "@/components/DeferredToaster";

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

/** Commander v2 – normal + dark. Light UI default ON for fast load; from localStorage before first paint to avoid flash. */
const themeScript = `
(function(){
  document.documentElement.setAttribute('data-theme','normal');
  document.documentElement.setAttribute('data-color-mode','dark');
  try {
    var lightUi = localStorage.getItem('neurohq-light-ui');
    document.documentElement.setAttribute('data-light-ui', lightUi !== null ? lightUi : 'true');
    var reducedMotion = localStorage.getItem('neurohq-reduced-motion');
    if (reducedMotion !== null) document.documentElement.setAttribute('data-reduced-motion', reducedMotion);
  } catch (e) {}
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
        <DeferredToaster />
      </body>
    </html>
  );
}
