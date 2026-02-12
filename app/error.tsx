"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-neuro-silver">
      <h1 className="text-xl font-bold">Something went wrong</h1>
      <p className="max-w-md text-center text-sm text-neutral-400">
        We couldn’t complete that. Try again or go back to the dashboard.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded bg-neuro-blue px-4 py-2 text-sm font-medium text-white hover:bg-neuro-blue/90 focus:outline-none focus:ring-2 focus:ring-neuro-blue"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="rounded border border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-300 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neuro-blue"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
