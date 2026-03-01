"use client";

import React from "react";
import styles from "./hud.module.css";

export type BottomNavItem = {
  id: string;
  label: string;
};

export type BottomNavProps = {
  items: BottomNavItem[];
  activeId: string;
  onChange: (id: string) => void;
};

export function BottomNav({ items, activeId, onChange }: BottomNavProps) {
  return (
    <nav className={styles.bottomNav} aria-label="HUD bottom navigation">
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            className={styles.bottomNavItem}
            onClick={() => onChange(item.id)}
            aria-current={active ? "page" : undefined}
            aria-label={item.label}
            style={{ color: active ? "#EAF6FF" : "rgba(234,246,255,0.4)" }}
          >
            <span
              className="mb-1 inline-block h-[12px] w-[12px] rounded-full"
              style={{
                background: active ? "rgba(0,229,255,0.9)" : "rgba(234,246,255,0.35)",
                boxShadow: active ? "0 0 10px rgba(0,229,255,0.8)" : "none",
                opacity: active ? 1 : 0.4,
              }}
            />
            {item.label}
            {active && (
              <span className="absolute -bottom-[2px] h-[2px] w-9 rounded-full bg-[#00E5FF] shadow-[0_0_10px_rgba(0,229,255,0.8)]" />
            )}
          </button>
        );
      })}
    </nav>
  );
}

