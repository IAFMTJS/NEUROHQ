import Link from "next/link";

/** Auth pages: login, signup, forgot-password. Same visual system as dashboard. */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen">
      <div className="relative z-10 mx-auto flex min-h-screen max-w-[420px] flex-col items-center justify-center p-5 md:min-h-[640px]">
        <Link
          href="/"
          className="absolute top-5 left-5 z-20 flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded"
        >
          <span aria-hidden>←</span>
          Back to home
        </Link>
        {children}
      </div>
    </div>
  );
}
