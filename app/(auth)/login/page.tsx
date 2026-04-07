import Link from "next/link";
import { AuthHeroBrand } from "@/components/branding/AuthHeroBrand";
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
        <AuthHeroBrand />

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
