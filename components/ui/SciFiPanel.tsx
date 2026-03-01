"use client";

/**
 * 🎮 Sci-Fi Panel System v1.0
 *
 * Mechanisch futuristisch paneel met:
 * - Outer frame (metal housing)
 * - Inner body (paneel binnen paneel)
 * - Energy rim + top energy strip
 * - Optionele corner accent nodes
 *
 * Doel: reusable backbone voor modals, cards, settings panels, popups.
 */

import React from "react";

type SciFiPanelProps = {
  /** Inhoud van het paneel (inner body) */
  children: React.ReactNode;
  /** Extra classes voor de inner body (layout / spacing) */
  className?: string;
  /** Extra classes voor het outer frame (breedte, hoogte, layout) */
  frameClassName?: string;
  /** Corner accent nodes aan/uit */
  showCornerAccents?: boolean;
};

export function SciFiPanel({
  children,
  className = "",
  frameClassName = "",
  showCornerAccents = true,
}: SciFiPanelProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-[var(--hud-radius-lg)] p-[2px] ${frameClassName}`}
      style={{
        // STAP 1 – Outer frame structuur (metal housing)
        // Donkerder dan inner body; geen harde neon-rand hier.
        background: "var(--hud-frame-bg)",
        // STAP 2 – Energy rim (diffuse glow + subtiele cyan rand)
        boxShadow: "var(--hud-glow-subtle), var(--hud-glow-medium)",
        border: "1px solid rgba(var(--hud-cyan-600-rgb), 0.22)",
      }}
    >
      {/* Directionele top light op frame – lichtbron komt van boven */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--hud-light-top)", opacity: 0.6 }}
      />

      {/* Corner accent nodes – optioneel maar gamey */}
      {showCornerAccents && (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-4 h-[6px] w-[6px] rounded-full opacity-60"
            style={{
              background: "rgba(var(--hud-cyan-600-rgb), 0.8)",
              boxShadow: "0 0 12px rgba(var(--hud-cyan-600-rgb), 0.8)",
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-4 top-4 h-[6px] w-[6px] rounded-full opacity-60"
            style={{
              background: "rgba(var(--hud-cyan-600-rgb), 0.8)",
              boxShadow: "0 0 12px rgba(var(--hud-cyan-600-rgb), 0.8)",
            }}
          />
        </>
      )}

      {/* STAP 3 – Inner body (paneel binnen paneel) */}
      <div
        className={`relative rounded-[calc(var(--hud-radius-lg)-2px)] p-7 ${className}`}
        style={{
          // Iets lichter dan frame voor duidelijke laagstructuur.
          background: "var(--hud-body-bg)",
          // STAP 5 – Inner depth shadow (paneeldiepte)
          boxShadow: "var(--hud-depth-inset)",
        }}
      >
        {/* STAP 4 – Top energy strip (powered state) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 right-0 top-0 h-[4px]"
          style={{
            background: "var(--hud-energy-strip)",
            opacity: 0.7,
          }}
        />

        {children}
      </div>
    </div>
  );
}

