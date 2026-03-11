import { Suspense } from "react";
import AssistantPageClient from "@/components/dashboard/AssistantPageClient";

export default function AssistantPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] animate-pulse rounded-xl bg-white/5" aria-hidden />}>
      <AssistantPageClient />
    </Suspense>
  );
}

