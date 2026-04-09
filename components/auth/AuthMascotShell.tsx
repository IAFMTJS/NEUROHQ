import type { ReactNode } from "react";
import { LoadingMascotHero } from "@/components/loading/LoadingMascotHero";

type AuthMascotShellProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Auth / welcome shell: same card + loading mascot as {@link BootstrapLoader} (“Initializing System”).
 */
export function AuthMascotShell({ children, className = "" }: AuthMascotShellProps) {
  return (
    <section
      className={`w-full max-w-xl rounded-2xl border border-violet-300/30 bg-[linear-gradient(160deg,rgba(35,20,73,0.78),rgba(14,20,52,0.78))] px-6 py-5 shadow-[0_16px_60px_rgba(18,8,40,0.55)] backdrop-blur ${className}`.trim()}
    >
      <LoadingMascotHero className="mb-2" variant="page" />
      {children}
    </section>
  );
}
