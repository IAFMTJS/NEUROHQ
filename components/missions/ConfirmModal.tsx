"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
};

export function ConfirmModal({
  open,
  onClose,
  title,
  message,
  confirmLabel = "Confirm",
  danger = false,
  onConfirm,
}: Props) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--card-border)] bg-transparent px-5 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--accent-neutral)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50 ${
              danger
                ? "bg-red-500 hover:bg-red-600"
                : "bg-[var(--accent-focus)] hover:opacity-90"
            }`}
          >
            {loading ? "…" : confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-[15px] leading-relaxed text-[var(--text-secondary)]">
        {message}
      </p>
    </Modal>
  );
}
