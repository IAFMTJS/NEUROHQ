import type { ReactNode } from "react";
import { getLoginScreenMascotSrc } from "@/lib/mascots";

type AuthMascotShellProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Shared auth mascot canvas:
 * - glow originates from mascot area
 * - content sits inside the artwork panel area
 * - no hard container contour around the mascot frame
 */
export function AuthMascotShell({ children, className = "" }: AuthMascotShellProps) {
  return (
    <div className={`relative mx-auto w-full max-w-[700px] overflow-visible ${className}`.trim()}>
      <img
        src={getLoginScreenMascotSrc()}
        alt="NEUROHQ auth mascot artwork"
        className="relative z-[1] block w-full select-none object-cover drop-shadow-[0_0_44px_rgba(129,140,248,0.5)]"
        draggable={false}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute -left-[8%] -right-[8%] top-[20%] h-[52%] bg-[radial-gradient(ellipse_at_center,rgba(192,132,252,0.88),rgba(129,140,248,0.72)_30%,rgba(34,211,238,0.5)_52%,transparent_82%)] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-[10%] -right-[10%] top-[12%] h-[58%] bg-[radial-gradient(ellipse_at_center,rgba(167,139,250,0.42),transparent_74%)] blur-[90px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[rgba(2,8,16,0.12)]"
      />

      <section className="absolute left-[7%] right-[7%] top-[37%] bottom-[3%] z-10 overflow-visible">
        <div className="relative h-full rounded-[18px] bg-[rgba(22,10,56,0.24)] p-4 backdrop-blur-[1.5px] sm:p-6">
          {children}
        </div>
      </section>
    </div>
  );
}
