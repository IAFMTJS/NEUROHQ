"use client";

import { Modal } from "@/components/Modal";

type Props = {
  open: boolean;
  onClose: () => void;
  onQuickTour: () => void;
  onFullTour: () => void;
  onSkip: () => void;
};

export function TutorialIntroModal({
  open,
  onClose,
  onQuickTour,
  onFullTour,
  onSkip,
}: Props) {
  function handleSkip() {
    onSkip();
    onClose();
  }

  function handleQuick() {
    onQuickTour();
    onClose();
  }

  function handleFull() {
    onFullTour();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleSkip}
      title="Welcome to NeuroHQ."
      subtitle="This system helps you track your mental state, missions and personal progress. How would you like to explore the system?"
      size="md"
      showBranding
      footer={
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleQuick}
            className="btn-primary w-full rounded-xl px-4 py-3 text-sm font-semibold"
          >
            Quick Tour (2 minutes)
          </button>
          <button
            type="button"
            onClick={handleFull}
            className="btn-hq-secondary w-full rounded-xl px-4 py-3 text-sm font-semibold"
          >
            Full System Tour
          </button>
          <button
            type="button"
            onClick={handleSkip}
            className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] underline underline-offset-2"
          >
            Skip tutorial
          </button>
        </div>
      }
    >
      <p className="text-sm text-[var(--text-muted)]">
        Choose a quick overview of the main features or a detailed walkthrough of the app.
      </p>
    </Modal>
  );
}
