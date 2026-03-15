import { Suspense } from "react";
import AssistantPageClient from "@/components/dashboard/AssistantPageClient";
import { AssistantPageGate } from "@/components/dashboard/AssistantPageGate";

export default function AssistantPage() {
  return (
    <AssistantPageGate>
      <Suspense fallback={null}>
        <AssistantPageClient />
      </Suspense>
    </AssistantPageGate>
  );
}

