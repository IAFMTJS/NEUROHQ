import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NEUROHQ",
  description: "Nervous-system-aware personal operating system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-neuro-dark text-white antialiased">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
