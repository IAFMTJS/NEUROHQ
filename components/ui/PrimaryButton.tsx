"use client";

export default function PrimaryButton({
  children,
  className = "",
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      className={`neon-button w-full min-h-[60px] text-white font-semibold ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
