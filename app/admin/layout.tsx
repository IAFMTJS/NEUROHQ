import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Beheer — NEUROHQ",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#060a12] text-white" data-ui="admin-shell">
      {children}
    </div>
  );
}
