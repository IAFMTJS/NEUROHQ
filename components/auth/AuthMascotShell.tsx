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
        className="relative z-[1] block w-full select-none object-cover drop-shadow-[0_0_48px_rgba(56,189,248,0.55)]"
        draggable={false}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute -left-[12%] -right-[12%] top-[18%] h-[58%] bg-[radial-gradient(ellipse_at_center,rgba(147,197,253,0.95),rgba(59,130,246,0.84)_28%,rgba(56,189,248,0.72)_48%,rgba(30,64,175,0.5)_67%,transparent_84%)] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-[14%] -right-[14%] top-[9%] h-[64%] bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.58),rgba(59,130,246,0.36)_44%,transparent_76%)] blur-[95px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-[10%] -right-[10%] top-[24%] h-[36%] bg-[radial-gradient(ellipse_at_center,rgba(125,211,252,0.34),rgba(96,165,250,0.26)_42%,transparent_75%)] blur-[72px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[rgba(2,8,16,0.12)]"
      />

      <section className="absolute left-[7%] right-[7%] top-[33%] bottom-[2.5%] z-10 overflow-hidden sm:top-[34%]">
        <div className="relative h-full overflow-y-auto rounded-[18px] bg-[rgba(8,23,64,0.25)] p-2.5 backdrop-blur-[1.5px] sm:p-4">
          {children}
        </div>
      </section>
    </div>
  );
}
