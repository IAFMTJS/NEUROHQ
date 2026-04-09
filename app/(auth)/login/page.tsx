import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthMascotShell } from "@/components/auth/AuthMascotShell";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

/** Login: same initializer card + loading mascot as bootstrap. */
export default async function LoginPage({ searchParams }: Props) {
  const resolved = await searchParams;
  const errorParam = resolved?.error;
  const initialError =
    typeof errorParam === "string" && errorParam.length > 0
      ? decodeURIComponent(errorParam)
      : null;

  return (
    <main
      className="w-full hq-card-enter"
      style={{ animationDelay: "50ms" }}
      data-ui="dark-commander"
    >
      <AuthMascotShell>
        <div className="mb-3 flex justify-center">
          <img
            src="/logo-naam.png"
            alt="NEUROHQ"
            className="h-auto w-full max-w-[160px] select-none object-contain opacity-95"
            draggable={false}
          />
        </div>
        <p className="text-center text-xs font-semibold uppercase tracking-[0.28em] text-violet-100/85">
          Commander Access
        </p>
        <p className="mt-1 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-200/65">
          Secure sign in
        </p>
        <h1 className="mb-4 mt-3 text-center text-sm font-semibold text-violet-50 sm:text-base">
          Sign in to your account
        </h1>

        <LoginForm initialError={initialError} />

        <p className="mt-3 text-center text-sm text-violet-100/75">
          No account?{" "}
          <Link
            href="/signup"
            className="font-medium text-cyan-200/95 hover:text-cyan-100 hover:underline rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          >
            Sign up
          </Link>
        </p>
      </AuthMascotShell>
    </main>
  );
}
