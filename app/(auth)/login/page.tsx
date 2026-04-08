import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { getLoginScreenMascotSrc } from "@/lib/mascots";

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
      <div className="relative mx-auto w-full max-w-[700px] overflow-hidden rounded-[28px] border border-[rgba(var(--mode-rgb),0.34)] bg-[rgba(2,8,16,0.72)] shadow-[0_24px_80px_rgba(0,0,0,0.58)]">
        <img
          src={getLoginScreenMascotSrc()}
          alt="NEUROHQ login command artwork"
          className="block w-full select-none object-cover"
          draggable={false}
        />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[rgba(2,8,16,0.22)]" aria-hidden />

        <section className="absolute left-[7%] right-[7%] top-[46%] bottom-[4%] z-10">
          <div className="h-full rounded-[18px] border border-[rgba(201,174,255,0.35)] bg-[rgba(22,10,56,0.28)] p-4 shadow-[0_14px_40px_rgba(0,0,0,0.45)] backdrop-blur-[1.5px] sm:p-6">
            <p className="mb-1 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
              Commander Access
            </p>
            <h1 className="mb-4 text-center text-sm font-semibold text-[var(--text-primary)] sm:mb-5 sm:text-base">
              Sign in to your account
            </h1>

            <LoginForm initialError={initialError} />

            <p className="mt-4 text-center text-sm text-[var(--text-muted)] sm:mt-6">
              No account?{" "}
              <Link
                href="/signup"
                className="font-medium text-[var(--accent-focus)] hover:underline rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-focus)] focus-visible:ring-offset-2"
              >
                Sign up
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
