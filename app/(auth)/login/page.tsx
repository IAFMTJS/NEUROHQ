import Link from "next/link";
import Image from "next/image";
import GlassCard from "@/components/ui/GlassCard";
import { LoginForm } from "@/components/auth/LoginForm";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

/** Login: same layout as home (one card, logo, one primary CTA). Redirect goes to /dashboard after a short delay so session is recognized. */
export default async function LoginPage({ searchParams }: Props) {
  const resolved = await searchParams;
  const errorParam = resolved?.error;
  const initialError =
    typeof errorParam === "string" && errorParam.length > 0
      ? decodeURIComponent(errorParam)
      : null;

  return (
    <main
      className="w-full max-w-[420px] hq-card-enter space-y-6"
      style={{ animationDelay: "50ms" }}
      data-ui="dark-commander"
    >
      <div className="flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <Image
            src="/app-icon.png"
            alt=""
            width={96}
            height={96}
            className="h-24 w-24 rounded-2xl object-contain"
            priority
          />
          <Image
            src="/logo-naam.png"
            alt="NEUROHQ"
            width={220}
            height={58}
            className="h-14 w-auto max-w-[200px] object-contain"
            priority
          />
          <p className="text-xs font-semibold uppercase tracking-widest text-white/60">Your daily HQ</p>
        </div>

        <GlassCard className="w-full max-w-[360px] p-8 rounded-2xl border border-[var(--card-border)]">
          <h2 className="text-center text-sm font-semibold text-[var(--text-secondary)] mb-6">
            Sign in to your account
          </h2>
          <LoginForm initialError={initialError} />
          <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
            No account?{" "}
            <Link
              href="/signup"
              className="font-medium text-[var(--accent-focus)] hover:underline rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-focus)] focus-visible:ring-offset-2 rounded"
            >
              Sign up
            </Link>
          </p>
        </GlassCard>
      </div>
    </main>
  );
}
