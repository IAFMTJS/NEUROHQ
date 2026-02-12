import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-neuro-silver">
      <h1 className="text-xl font-bold">Page not found</h1>
      <p className="text-sm text-neutral-400">The page you’re looking for doesn’t exist or was moved.</p>
      <Link
        href="/dashboard"
        className="rounded bg-neuro-blue px-4 py-2 text-sm font-medium text-white hover:bg-neuro-blue/90 focus:outline-none focus:ring-2 focus:ring-neuro-blue"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
