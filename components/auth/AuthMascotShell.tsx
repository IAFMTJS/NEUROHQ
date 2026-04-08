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
        className="block w-full select-none object-cover"
        draggable={false}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute left-[2%] right-[2%] top-[28%] h-[34%] bg-[radial-gradient(ellipse_at_center,rgba(167,139,250,0.7),rgba(129,140,248,0.55)_34%,rgba(34,211,238,0.38)_54%,transparent_80%)] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[rgba(2,8,16,0.22)]"
      />

      <section className="absolute left-[7%] right-[7%] top-[37%] bottom-[3%] z-10 overflow-visible">
        <div className="relative h-full rounded-[18px] bg-[rgba(22,10,56,0.24)] p-4 backdrop-blur-[1.5px] sm:p-6">
          {children}
        </div>
      </section>
    </div>
  );
}
