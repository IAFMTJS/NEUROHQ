"use client";

/**
 * Commander HQ UI Kit – Navigation bar (glass bar + nav items).
 * Uses .hq-glass.
 */
export type HQNavProps = {
  items?: string[];
  /** Optional: render custom link/button per item (item, index) => ReactNode */
  renderItem?: (item: string, index: number) => React.ReactNode;
  className?: string;
};

const defaultItems = ["HQ", "Missions", "Budget", "Growth", "Strategy"];

export function HQNav({
  items = defaultItems,
  renderItem,
  className = "",
}: HQNavProps) {
  return (
    <nav
      className={`hq-glass flex gap-8 px-10 py-4 justify-center flex-wrap ${className}`}
      aria-label="Main navigation"
    >
      {items.map((item, i) =>
        renderItem ? (
          renderItem(item, i)
        ) : (
          <button
            key={item}
            type="button"
            className="text-white/70 hover:text-white transition-all"
          >
            {item}
          </button>
        )
      )}
    </nav>
  );
}
