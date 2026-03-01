"use client";

/**
 * 🎮 SCI-FI BUTTON – COMPLETE EXECUTION SPEC
 *
 * Conceptdefinitie:
 * - Futuristisch HUD-interface element uit een AAA sci-fi game.
 * - Geen corporate UI, geen web SaaS stijl.
 * - Donkere basis, subtiele inner light, diffuse cyan rim glow.
 * - Diepte door layered shadows en pseudo-element highlight.
 *
 * Vermijd:
 * - Flat gradients.
 * - Standaard web button styling.
 * - SaaS UI esthetiek.
 */

import Link from "next/link";
import React from "react";

type CommonProps = {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
};

type ButtonProps = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
    href?: never;
  };

type LinkProps = CommonProps &
  Omit<React.ComponentProps<typeof Link>, "className"> & {
    href: string;
  };

type SciFiButtonProps = ButtonProps | LinkProps;

export function SciFiButton(props: SciFiButtonProps) {
  const { children, className = "", disabled, ...rest } = props as SciFiButtonProps & {
    href?: string;
  };

  const isLink = "href" in props && props.href != null;

  const baseClasses =
    // Vorm & typography
    "relative inline-flex items-center justify-center h-[52px] px-7 " +
    "rounded-full text-sm font-semibold tracking-[0.05em] uppercase " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050810] " +
    // Materiaal – basis dark metal gradient
    "bg-[linear-gradient(180deg,#050811_0%,#0E1624_18%,#111B2A_50%,#050811_100%)] " +
    // Border rim + layered glow (outer halo, rim light, inner energy)
    "border border-[rgba(0,195,255,0.32)] " +
    "shadow-[0_18px_40px_rgba(0,0,0,0.9),0_0_30px_rgba(0,195,255,0.2),inset_0_-6px_12px_rgba(0,0,0,0.7)] " +
    // Text
    "text-[rgba(224,244,255,0.95)] " +
    // Transition / physics baseline
    "transition-all duration-[180ms] ease-[cubic-bezier(0.4,0,0.2,1)] " +
    // Disabled baseline – override via data-disabled (inactive, niet “vergeten”)
    "data-[disabled=true]:cursor-default data-[disabled=true]:opacity-50 " +
    "data-[disabled=true]:shadow-none data-[disabled=true]:border-[rgba(0,195,255,0.1)] " +
    "data-[disabled=true]:text-[rgba(224,244,255,0.5)] " +
    "data-[disabled=true]:bg-[linear-gradient(180deg,#050816_0%,#02040A_100%)] " +
    // Pointer & smoothing
    "cursor-pointer select-none " +
    className;

  const content = (
    <>
      {/* Inner surface highlight – 3D gevoel, horizontale band in het midden */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full opacity-80"
        style={{
          // Midden 8–12% lichter dan bovenzijde, bol volume
          background:
            "linear-gradient(180deg, rgba(0,220,255,0.04) 0%, rgba(0,220,255,0.12) 45%, rgba(0,220,255,0.0) 100%)",
        }}
      />
      {/* Top reflectie / lichtbron van boven */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full opacity-80"
        style={{
          background:
            "radial-gradient(circle at 50% 0%, rgba(0,195,255,0.22), transparent 60%)",
        }}
      />
      {/* Donkere onderrand voor extra materiaal-diepte */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full opacity-90"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.75) 100%)",
        }}
      />
      {/* Asymmetrische outer halo – feller boven / zijkanten */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-[6px] rounded-full opacity-60"
        style={{
          background:
            "radial-gradient(circle at 50% -10%, rgba(0,195,255,0.32), transparent 55%)",
        }}
      />
      {/* Core content */}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </>
  );

  if (isLink) {
    const { href, ...linkRest } = rest as LinkProps;
    return (
      <Link
        href={href}
        data-disabled={disabled ? "true" : "false"}
        className={
          baseClasses +
          // Hover / active physics alleen als niet disabled
          (disabled
            ? ""
            : " hover:-translate-y-[2px] " +
              // Hover: energie-opbouw (ongeveer +25–30% intensiteit op halo/rim/inner)
              "hover:shadow-[0_22px_52px_rgba(0,0,0,0.95),0_0_40px_rgba(0,195,255,0.3),inset_0_-6px_16px_rgba(0,0,0,0.75)] " +
              // Active: mechanische indruk – iets minder halo, iets meer inner energie
              "active:translate-y-0 active:scale-[0.98] " +
              "active:shadow-[0_14px_32px_rgba(0,0,0,0.9),0_0_24px_rgba(0,195,255,0.22),inset_0_-4px_18px_rgba(0,0,0,0.85)]")
        }
        {...(linkRest as Omit<LinkProps, "href">)}
      >
        {content}
      </Link>
    );
  }

  const { type = "button", ...buttonRest } = rest as ButtonProps;

  return (
    <button
      type={type}
      disabled={disabled}
      data-disabled={disabled ? "true" : "false"}
      className={
        baseClasses +
        (disabled
          ? ""
          : " hover:-translate-y-[2px] " +
            "hover:shadow-[0_22px_52px_rgba(0,0,0,0.95),0_0_40px_rgba(0,195,255,0.3),inset_0_-6px_16px_rgba(0,0,0,0.75)] " +
            "active:translate-y-0 active:scale-[0.98] " +
            "active:shadow-[0_14px_32px_rgba(0,0,0,0.9),0_0_24px_rgba(0,195,255,0.22),inset_0_-4px_18px_rgba(0,0,0,0.85)]")
      }
      {...(buttonRest as Omit<ButtonProps, "type">)}
    >
      {content}
    </button>
  );
}

