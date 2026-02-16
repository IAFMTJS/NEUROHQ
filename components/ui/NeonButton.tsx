"use client";

import Link from "next/link";

/**
 * Cinematic neon gradient button with layered shadow and glow.
 * Uses design tokens: --neon-btn-gradient, --neon-btn-shadow-layered.
 * Renders as <button> or <Link> when href is provided.
 */

type BaseProps = {
  children: React.ReactNode;
  className?: string;
  /** When true, adds subtle pulsing glow animation */
  pulse?: boolean;
};

type ButtonProps = BaseProps &
  Omit<React.ComponentProps<"button">, "className"> & {
    href?: never;
    type?: "button" | "submit" | "reset";
  };

type LinkProps = BaseProps &
  Omit<React.ComponentProps<typeof Link>, "className"> & {
    href: string;
  };

export function NeonButton(props: ButtonProps | LinkProps) {
  const { children, className = "", pulse, ...rest } = props;
  const isLink = "href" in props && props.href != null;

  const classes = `neon-button inline-flex items-center justify-center min-h-[44px] px-5 py-3 text-white font-semibold text-sm tracking-wide rounded-[18px] transition-all ${
    pulse ? "btn-hq-primary-time-window" : ""
  } ${className}`.trim();

  if (isLink) {
    return (
      <Link href={props.href} className={classes} {...(rest as LinkProps)}>
        {children}
      </Link>
    );
  }

  const { type = "button", ...buttonRest } = rest as ButtonProps;
  return (
    <button type={type} className={classes} {...buttonRest}>
      {children}
    </button>
  );
}
