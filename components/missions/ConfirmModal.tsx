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
    <Modal open={open} onClose={onClose} title={title} showBranding={false}>
      <p className="text-sm text-neuro-muted">{message}</p>
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-neuro-border px-4 py-2 text-sm font-medium text-neuro-silver hover:bg-neuro-surface"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading}
          className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
            danger ? "bg-red-600 hover:bg-red-500" : "bg-neuro-blue hover:bg-neuro-blue/90"
          }`}
        >
          {loading ? "…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
