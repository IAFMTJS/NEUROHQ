"use client";

import type { ReactNode } from "react";
import hudStyles from "@/components/hud-test/hud.module.css";
import type { VisualLabPageShellId } from "@/components/visual-lab/visualLabPageShellPresets";

type Props = {
  variant: VisualLabPageShellId;
  children: ReactNode;
};

/**
 * Wraps visual-lab content in one of several full-page shells (background + outer container).
 */
export function VisualLabPageShell({ variant, children }: Props) {
  switch (variant) {
    case "flatGlassLegacy":
      return (
        <div
          className={`${hudStyles.flatGlassPageRoot} text-[var(--text-main)]`}
        >
          <div className="relative isolate z-10 mx-auto max-w-5xl px-[var(--page-padding-x)] py-8 pb-12">
            {children}
          </div>
        </div>
      );

    case "commandStackCinematic":
      return (
        <div className="command-stack-page-root text-[var(--text-main)]">
          <div className={hudStyles.spaceMist} aria-hidden />
          <div className={hudStyles.starLayerFar} aria-hidden />
          <div className={hudStyles.starLayerNear} aria-hidden />
          <div className={hudStyles.backgroundAtmosphere} aria-hidden />
          <div className={hudStyles.colorBlend} aria-hidden />
          <div className={hudStyles.spaceNoise} aria-hidden />
          <div className="container page page-wide dashboard-page dashboard-cinematic relative z-10 pb-10">
            <div className="command-stack-page-inner">{children}</div>
          </div>
        </div>
      );

    case "hubFlatDashboard":
      return (
        <div
          className={`${hudStyles.flatGlassPageRoot} text-[var(--text-main)]`}
        >
          <div className="container page page-wide dashboard-page dashboard-cinematic relative z-10 pb-10">
            <div className="command-stack-page-inner">{children}</div>
          </div>
        </div>
      );

    case "nebulaTokensOnly":
      return (
        <div className="visual-lab-shell-nebula-root text-[var(--text-main)]">
          <div className={hudStyles.spaceMist} aria-hidden />
          <div className={hudStyles.backgroundAtmosphere} aria-hidden />
          <div className={hudStyles.spaceNoise} aria-hidden />
          <div className="container page page-wide dashboard-page dashboard-cinematic relative z-10 pb-10">
            <div className="command-stack-page-inner">{children}</div>
          </div>
        </div>
      );
  }
}
