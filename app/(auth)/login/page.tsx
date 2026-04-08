import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthMascotShell } from "@/components/auth/AuthMascotShell";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

/** Login: mascot-first screen. Form overlays the lower panel area of the artwork. */
export default async function LoginPage({ searchParams }: Props) {
  const resolved = await searchParams;
  const errorParam = resolved?.error;
  const initialError =
    typeof errorParam === "string" && errorParam.length > 0
      ? decodeURIComponent(errorParam)
      : null;

  return (
    <main
      className="w-full max-w-[760px] hq-card-enter"
      style={{ animationDelay: "50ms" }}
      data-ui="dark-commander"
    >
      <AuthMascotShell>
        <div className="-mt-24 mb-0 flex justify-center sm:-mt-28">
          <img
            src="/logo-naam.png"
            alt="NEUROHQ"
            className="h-auto w-full max-w-[190px] select-none object-contain opacity-95"
            draggable={false}
          />
        </div>
        <p className="mb-0.5 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
          Commander Access
        </p>
        <h1 className="mb-2.5 text-center text-sm font-semibold text-[var(--text-primary)] sm:mb-3 sm:text-base">
          Sign in to your account
        </h1>

        <LoginForm initialError={initialError} />

        <p className="mt-2.5 text-center text-sm text-[var(--text-muted)] sm:mt-3">
          No account?{" "}
          <Link
            href="/signup"
            className="font-medium text-[var(--accent-focus)] hover:underline rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-focus)] focus-visible:ring-offset-2"
          >
            Sign up
          </Link>
        </p>
      </AuthMascotShell>
    </main>
  );
}
