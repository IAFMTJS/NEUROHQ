"use client";

export default function GlassCard({
  children,
  className = "",
  ...rest
}: React.ComponentProps<"div">) {
  return (
    <div className={`glass-card p-6 ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}
