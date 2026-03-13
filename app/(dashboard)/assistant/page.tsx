import { Suspense } from "react";
import AssistantPageClient from "@/components/dashboard/AssistantPageClient";

export default function AssistantPage() {
  return (
    <Suspense fallback={null}>
      <AssistantPageClient />
    </Suspense>
  );
}

