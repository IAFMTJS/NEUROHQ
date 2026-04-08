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
        className="pointer-events-none absolute -left-[10%] -right-[10%] top-[18%] h-[56%] bg-[radial-gradient(ellipse_at_center,rgba(216,180,255,0.92),rgba(192,132,252,0.86)_28%,rgba(147,51,234,0.72)_48%,rgba(76,29,149,0.46)_66%,transparent_84%)] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-[14%] -right-[14%] top-[10%] h-[62%] bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.56),rgba(124,58,237,0.34)_46%,transparent_76%)] blur-[95px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-[10%] -right-[10%] top-[24%] h-[34%] bg-[radial-gradient(ellipse_at_center,rgba(244,114,182,0.28),rgba(192,132,252,0.22)_42%,transparent_75%)] blur-[70px]"
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
