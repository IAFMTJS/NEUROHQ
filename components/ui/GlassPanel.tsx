"use client";

/**
 * Cinematic glassmorphism panel with gradient border and depth.
 * Uses design tokens: --glass-panel-bg, --glass-border, --glass-panel-shadow.
 */

export default function GlassPanel({
  children,
  className = "",
  as: Component = "div",
  ...rest
}: React.ComponentProps<"div"> & { as?: "div" | "section" | "article" }) {
  return (
    <Component
      className={`glass-panel ${className}`.trim()}
      {...(rest as React.ComponentProps<"div">)}
    >
      {children}
    </Component>
  );
}
