export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neuro-dark">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.08),transparent)]" />
      {/* Same mobile-first strip as dashboard for consistent PWA feel */}
      <div className="relative mx-auto flex min-h-screen max-w-[420px] flex-col items-center justify-center p-4 shadow-[0_0_60px_rgba(0,0,0,0.5)] sm:p-6">
        {children}
      </div>
    </div>
  );
}
