import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const font = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NEUROHQ",
  description: "Nervous-system-aware personal operating system",
  manifest: "/manifest.json",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0B1220",
};

/** Inline script to set theme before first paint (avoids flash). */
const themeScript = `
(function(){
  var t=localStorage.getItem('neurohq-theme')||'normal';
  var c=localStorage.getItem('neurohq-color-mode')||'dark';
  if (!document.documentElement.hasAttribute('data-theme')) document.documentElement.setAttribute('data-theme',t);
  if (!document.documentElement.hasAttribute('data-color-mode')) document.documentElement.setAttribute('data-color-mode',c);
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={font.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-[var(--bg-primary)] font-sans text-[var(--text-primary)] antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
