import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neuro-dark px-4 text-neuro-silver">
      <h1 className="text-xl font-bold">You&apos;re offline</h1>
      <p className="text-center text-sm text-neutral-400">
        NEUROHQ needs a connection to load. Check your network and try again.
      </p>
      <Link
        href="/dashboard"
        className="rounded bg-neuro-blue px-4 py-2 text-sm font-medium text-white hover:bg-neuro-blue/90 focus:outline-none focus:ring-2 focus:ring-neuro-blue"
      >
        Try again
      </Link>
    </div>
  );
}
