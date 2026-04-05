"use client";

import { toast, type ExternalToast } from "sonner";
import { NeuroToastIcon } from "@/components/brand/NeuroToastIcon";

const DEFAULT_TOAST_MS = 16_000;

function withIcon(
  variant: "default" | "success" | "error" | "warning" | "info" | "loading",
  options?: ExternalToast
): ExternalToast {
  if (options?.icon != null) {
    return {
      ...options,
      duration: options.duration ?? DEFAULT_TOAST_MS,
    };
  }
  return {
    ...options,
    icon: <NeuroToastIcon variant={variant} />,
    duration: options?.duration ?? DEFAULT_TOAST_MS,
  };
}

export const neuroToast = {
  message(message: string, options?: ExternalToast) {
    return toast(message, withIcon("default", options));
  },
  success(message: string, options?: ExternalToast) {
    return toast.success(message, withIcon("success", options));
  },
  info(message: string, options?: ExternalToast) {
    return toast.info(message, withIcon("info", options));
  },
  warning(message: string, options?: ExternalToast) {
    return toast.warning(message, withIcon("warning", options));
  },
  error(message: string, options?: ExternalToast) {
    return toast.error(message, withIcon("error", options));
  },
  loading(message: string, options?: ExternalToast) {
    return toast.loading(message, withIcon("loading", options));
  },
  dismiss(id?: string | number) {
    toast.dismiss(id);
  },
};
