import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "../styles/visual-system.css";
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
  themeColor: "#05070F",
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
    <html lang="en" className={font.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
