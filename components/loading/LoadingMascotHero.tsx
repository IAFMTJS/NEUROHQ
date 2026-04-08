import { getLoadingMascotSrc } from "@/lib/mascots";

type LoadingMascotHeroProps = {
  className?: string;
  /** `page` for full loading pages, `panel` for in-card fallbacks. */
  variant?: "page" | "panel";
};

export function LoadingMascotHero({ className = "", variant = "page" }: LoadingMascotHeroProps) {
  const frameSizeClass =
    variant === "page"
      ? "h-[30vh] min-h-[210px] max-h-[360px] max-w-[520px]"
      : "h-[18vh] min-h-[130px] max-h-[220px] max-w-[320px]";

  return (
    <div className={`relative mx-auto flex w-full justify-center ${className}`.trim()}>
      <div className={`relative w-full ${frameSizeClass}`}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[28px] bg-[radial-gradient(circle_at_50%_42%,rgba(var(--mode-rgb),0.3),transparent_72%)] blur-2xl"
        />
        <img
          src={getLoadingMascotSrc()}
          alt=""
          aria-hidden
          className="relative z-10 h-full w-full object-contain drop-shadow-[0_14px_35px_rgba(0,0,0,0.45)]"
          draggable={false}
        />
      </div>
    </div>
  );
}
