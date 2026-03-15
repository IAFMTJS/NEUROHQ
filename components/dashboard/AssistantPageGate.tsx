"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { isAssistantEnabled } from "@/lib/feature-flags";

export function AssistantPageGate({ children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!isAssistantEnabled()) {
      router.replace("/dashboard");
    }
  }, [router]);

  if (!isAssistantEnabled()) {
    return null;
  }

  return <>{children}</>;
}
