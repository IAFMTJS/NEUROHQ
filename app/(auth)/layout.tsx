import Link from "next/link";

/** Auth pages: login, signup, forgot-password. Same visual system as dashboard. */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-transparent">
      <div className="relative z-10 flex min-h-screen w-full flex-col items-center justify-center px-4 py-10">
        <Link
          href="/"
          className="absolute top-5 left-5 z-20 flex items-center gap-2 text-sm text-violet-200/70 hover:text-violet-50 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded"
        >
          <span aria-hidden>←</span>
          Back to home
        </Link>
        {children}
      </div>
    </div>
  );
}
