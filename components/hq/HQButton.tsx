"use client";

/**
 * Commander HQ UI Kit – Primary neon button.
 * Kleur in emissie (diffuse + core); glas bijna kleurloos.
 * Uses design tokens: --hq-cyan, --hq-purple, --hq-green, --hq-blur-md.
 */
export type HQButtonProps = {
  children: React.ReactNode;
  className?: string;
  /** As link: pass href. As button: omit. */
  href?: string;
  "aria-label"?: string;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "children">;

export function HQButton({
  children,
  className = "",
  href,
  "aria-label": ariaLabel,
  ...rest
}: HQButtonProps) {
  const wrapper = "relative w-[320px] h-[72px]";
  const diffuse =
    "absolute -inset-6 rounded-[90px] bg-gradient-to-r from-[var(--hq-cyan)] via-[var(--hq-purple)] to-[var(--hq-green)] blur-[40px] opacity-90";
  const core =
    "absolute inset-0 rounded-[80px] bg-gradient-to-r from-[var(--hq-cyan)] via-[var(--hq-purple)] to-[var(--hq-green)] opacity-95";
  const glass =
    "relative z-10 w-full h-full rounded-[80px] border border-white/30 backdrop-blur-[28px] text-white font-semibold tracking-widest text-lg shadow-[inset_0_4px_8px_rgba(255,255,255,.4),inset_0_-10px_16px_rgba(0,0,0,.6)] hover:scale-[1.02] transition-all duration-300 inline-flex items-center justify-center";

  if (href) {
    return (
      <div className={wrapper}>
        <div className={diffuse} aria-hidden />
        <div className={core} aria-hidden />
        <a
          href={href}
          className={`${glass} ${className}`}
          aria-label={ariaLabel}
          {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {children}
        </a>
      </div>
    );
  }

  return (
    <div className={wrapper}>
      <div className={diffuse} aria-hidden />
      <div className={core} aria-hidden />
      <button
        type="button"
        className={`${glass} ${className}`}
        aria-label={ariaLabel}
        {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {children}
      </button>
    </div>
  );
}
