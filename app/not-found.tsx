import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg-primary)] px-4">
      <div className="card-modern w-full max-w-sm p-8 text-center shadow-xl">
        <Image src="/app-icon.png" alt="" width={56} height={56} className="mx-auto h-14 w-14 rounded-xl object-contain" />
        <h1 className="mt-4 text-xl font-bold text-neuro-silver">Page not found</h1>
        <p className="mt-2 text-sm text-neuro-muted">
          The page you’re looking for doesn’t exist or was moved.
        </p>
        <Link
          href="/dashboard"
          className="btn-primary mt-6 inline-block rounded-lg px-5 py-2.5 text-sm font-medium"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
