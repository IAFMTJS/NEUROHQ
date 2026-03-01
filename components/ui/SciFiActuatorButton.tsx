"use client";

import Link from "next/link";
import React from "react";

type BaseProps = {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  /** Optional subtle core pulse for AAA feel */
  pulse?: boolean;
  /** Optional tiny shimmer sweep for primary actions */
  shimmer?: boolean;
};

type ButtonProps = BaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
    href?: never;
  };

type LinkProps = BaseProps &
  Omit<React.ComponentProps<typeof Link>, "className"> & {
    href: string;
  };

type SciFiActuatorButtonProps = ButtonProps | LinkProps;

/**
 * Fase 4 – Energy Button v3 (test-only usage)
 * - multi-layer material gradient
 * - rim glow + inner radial highlight
 * - hover lift physics
 * - active compression
 */
export function SciFiActuatorButton(props: SciFiActuatorButtonProps) {
  const { children, className = "", disabled, pulse = false, shimmer = false, ...rest } = props as SciFiActuatorButtonProps & {
    href?: string;
  };
  const isLink = "href" in props && props.href != null;

  const baseClasses =
    // Button v4 – Cinematic HUD Capsule
    "hud-btn relative inline-flex h-[56px] items-center justify-center rounded-full px-8 " +
    "overflow-hidden text-[var(--hud-cyan-100)] " +
    "text-sm font-semibold uppercase tracking-[0.06em] " +
    "select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hud-cyan-400)]/80 " +
    "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hud-dark-5)] " +
    "transition-all duration-[180ms] ease-[cubic-bezier(0.4,0,0.2,1)] " +
    // Basismateriaal: donker / licht kern / donker
    "bg-[linear-gradient(180deg,#0b1c2d_0%,#0f2b44_50%,#0a1826_100%)] " +
    "border border-[rgba(0,200,255,0.35)] " +
    "shadow-[0_8px_25px_rgba(0,0,0,0.6),0_0_20px_rgba(0,200,255,0.25)] " +
    // STEP 3 – inner energy core (::before)
    "before:content-[''] before:absolute before:inset-0 before:rounded-full before:pointer-events-none " +
    "before:bg-[radial-gradient(circle_at_50%_45%,rgba(0,255,255,0.35),transparent_60%)] " +
    (pulse ? "before:animate-[hudEnergyPulse_2.5s_ease-in-out_infinite] " : "before:opacity-80 ") +
    // STEP 4 – sharp rim light (::after)
    "after:content-[''] after:absolute after:inset-0 after:rounded-full after:pointer-events-none " +
    "after:shadow-[inset_0_0_10px_rgba(0,255,255,0.4),0_0_18px_rgba(0,255,255,0.35)] " +
    "data-[disabled=true]:cursor-default data-[disabled=true]:opacity-50 " +
    "data-[disabled=true]:border-[rgba(var(--hud-cyan-600-rgb),0.1)] " +
    "data-[disabled=true]:shadow-[0_6px_14px_rgba(0,0,0,0.55)] " +
    "data-[disabled=true]:before:opacity-0 data-[disabled=true]:after:shadow-none " +
    className;

  const interactiveClasses = disabled
    ? ""
    : " hover:-translate-y-[3px] " +
      "hover:shadow-[0_15px_35px_rgba(0,0,0,0.7),0_0_35px_rgba(0,255,255,0.5)] " +
      "hover:before:opacity-100 " +
      "active:translate-y-0 active:scale-[0.96] " +
      "active:shadow-[0_6px_15px_rgba(0,0,0,0.7),0_0_15px_rgba(0,255,255,0.4)]";

  const label = (
    <span
      className="hud-btn__label relative z-10"
      style={{
        textShadow:
          "0 0 10px rgba(255,255,255,0.28), 0 0 14px rgba(0,200,255,0.26)",
      }}
    >
      {children}
    </span>
  );

  const shimmerLayer = shimmer && !disabled ? (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 rounded-full bg-[linear-gradient(105deg,transparent_28%,rgba(234,246,255,0.26)_48%,transparent_68%)] opacity-0 animate-[hudShimmerSweep_3.2s_ease-in-out_infinite]"
    />
  ) : null;

  if (isLink) {
    const { href, ...linkRest } = rest as LinkProps;
    return (
      <Link
        href={href}
        data-disabled={disabled ? "true" : "false"}
        aria-disabled={disabled ? "true" : "false"}
        className={`${baseClasses}${interactiveClasses}`}
        {...(linkRest as Omit<LinkProps, "href">)}
      >
        {shimmerLayer}
        {label}
      </Link>
    );
  }

  const { type = "button", ...buttonRest } = rest as ButtonProps;
  return (
    <button
      type={type}
      disabled={disabled}
      data-disabled={disabled ? "true" : "false"}
      className={`${baseClasses}${interactiveClasses}`}
      {...(buttonRest as Omit<ButtonProps, "type">)}
    >
      {shimmerLayer}
      {label}
    </button>
  );
}

