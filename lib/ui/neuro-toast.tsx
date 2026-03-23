"use client";

import { toast, type ExternalToast } from "sonner";
import { NeuroToastIcon } from "@/components/brand/NeuroToastIcon";

function withIcon(
  variant: "default" | "success" | "error" | "warning" | "info" | "loading",
  options?: ExternalToast
): ExternalToast {
  if (options?.icon != null) return options;
  return {
    ...options,
    icon: <NeuroToastIcon variant={variant} />,
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
