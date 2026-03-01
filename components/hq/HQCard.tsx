"use client";

/**
 * Commander HQ UI Kit – Glass stat card.
 * Uses .hq-glass (design tokens: --hq-glass-bg, --hq-glass-border, --hq-blur-md, --hq-radius-lg).
 */
export type HQCardProps = {
  title: string;
  children: React.ReactNode;
  className?: string;
};

export function HQCard({ title, children, className = "" }: HQCardProps) {
  return (
    <div className={`hq-glass p-6 w-80 ${className}`}>
      <h3 className="text-white text-lg mb-4 tracking-wide">{title}</h3>
      {children}
    </div>
  );
}
