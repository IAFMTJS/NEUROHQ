"use client";

import Link from "next/link";

type MissionButtonProps = {
  href?: string;
  children: React.ReactNode;
  variant?: "default" | "ultra";
  className?: string;
  style?: React.CSSProperties;
  "aria-label"?: string;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">;

const baseWrapper =
  "relative w-full max-w-[620px] min-w-[320px] h-[110px]";
const diffuseLayer =
  "absolute -inset-[40px] rounded-[120px] neon-diffuse z-0";
const coreLayer =
  "absolute inset-0 rounded-[80px] neon-core opacity-95 z-[1]";
const glassButton =
  "relative z-10 w-full h-full rounded-[80px] border border-white/30 glass-surface text-white text-[28px] font-semibold tracking-[4px] uppercase inline-flex items-center justify-center overflow-hidden transition-all duration-300 shadow-[inset_0_5px_10px_rgba(255,255,255,.55),inset_0_-12px_18px_rgba(0,0,0,.6)]";

export function MissionButton({
  href,
  children,
  variant = "default",
  className = "",
  style,
  "aria-label": ariaLabel,
  ...rest
}: MissionButtonProps) {
  const isUltra = variant === "ultra";
  const buttonClasses = [
    glassButton,
    isUltra ? "neon-text light-sweep" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={baseWrapper} style={style}>
      {/* Diffuse glow – kleur in emissie, achter glas */}
      <div
        className={[diffuseLayer, isUltra ? "neon-animate" : ""].join(" ")}
        aria-hidden
      />
      {/* Hard neon core */}
      <div className={coreLayer} aria-hidden />
      {/* Glass button – bijna kleurloos, puur translucency */}
      {href ? (
        <Link
          href={href}
          className={buttonClasses}
          aria-label={ariaLabel}
          {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {children}
        </Link>
      ) : (
        <button
          type="button"
          className={buttonClasses}
          aria-label={ariaLabel}
          {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
        >
          {children}
        </button>
      )}
    </div>
  );
}
