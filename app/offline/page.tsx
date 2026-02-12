import Link from "next/link";
import Image from "next/image";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neuro-dark px-4">
      <div className="card-modern w-full max-w-sm p-8 text-center shadow-xl">
        <Image src="/app-icon.png" alt="" width={56} height={56} className="mx-auto h-14 w-14 rounded-xl object-contain opacity-80" />
        <h1 className="mt-4 text-xl font-bold text-neuro-silver">You&apos;re offline</h1>
        <p className="mt-2 text-sm text-neuro-muted">
          NEUROHQ needs a connection to load. Check your network and try again.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="btn-primary inline-block rounded-lg px-5 py-2.5 text-center text-sm font-medium"
          >
            Try again
          </Link>
          <Link
            href="/"
            className="inline-block rounded-lg border border-neuro-border px-5 py-2.5 text-center text-sm font-medium text-neuro-silver hover:bg-neuro-border/50"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
