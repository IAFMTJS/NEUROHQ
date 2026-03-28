"use client";

import { useState } from "react";
import Link from "next/link";
import { Modal } from "@/components/Modal";
import { ProfileEngineCategoryTile } from "@/components/profile/ProfileEngineCategoryTile";
import { SettingsSimplifiedContent } from "@/components/settings/SettingsSimplifiedContent";

type Props = {
  initialSimplifiedContent: boolean;
};

export function ProfileEngineModesTab({ initialSimplifiedContent }: Props) {
  const [open, setOpen] = useState(false);
  const trait = initialSimplifiedContent
    ? "Eenvoudige modus aan — kortere tekst en minder shortcut-toasts"
    : "Standaardweergave — volledige copy en shortcuts";

  return (
    <div className="space-y-4">
      <section
        className="relative overflow-hidden rounded-2xl border border-[var(--card-border)]/85 border-t-[rgba(var(--mode-rgb),0.22)] bg-gradient-to-b from-[rgba(var(--mode-rgb-deep),0.1)] to-[var(--bg-surface)]/20 px-4 py-4 sm:px-5"
        aria-labelledby="engine-modes-heading"
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--semantic-accent)]">Engine</p>
        <h2 id="engine-modes-heading" className="mt-1 text-lg font-bold tracking-tight text-[var(--text-primary)]">
          Modi
        </h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Open de categorie om je weergavemodus te wijzigen. Thema, push en apparaat:{" "}
          <Link href="/settings" className="font-semibold text-[var(--accent-focus)] underline-offset-2 hover:underline">
            Instellingen
          </Link>
          .
        </p>
        <div className="mt-4">
          <ProfileEngineCategoryTile icon="◫" title="Weergave & eenvoud" trait={trait} onOpen={() => setOpen(true)} />
        </div>
      </section>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Eenvoudige modus"
        subtitle="Minder secundaire tekst en geen growth shortcut-toast; navigatie en thema blijven hetzelfde."
        size="md"
      >
        <SettingsSimplifiedContent initialSimplifiedContent={initialSimplifiedContent} embedded />
      </Modal>
    </div>
  );
}
