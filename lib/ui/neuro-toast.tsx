"use client";

import { toast, type ExternalToast } from "sonner";
import { NeuroToastIcon } from "@/components/brand/NeuroToastIcon";

function withIcon(
  variant: "default" | "success" | "error" | "warning" | "info" | "loading",
  options?: ExternalToast
): ExternalToast {
  const base: ExternalToast = { ...options };
  if (options?.icon != null) {
    if (options.duration === undefined) {
      delete base.duration;
    }
    return base;
  }
  const out: ExternalToast = {
    ...options,
    icon: <NeuroToastIcon variant={variant} />,
  };
  if (options?.duration === undefined) {
    delete out.duration;
  }
  return out;
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
