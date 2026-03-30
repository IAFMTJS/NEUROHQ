import { Suspense } from "react";
import AssistantPageClient from "@/components/dashboard/AssistantPageClient";
import { AssistantPageGate } from "@/components/dashboard/AssistantPageGate";

export default function AssistantPage() {
  return (
    <AssistantPageGate>
      <div className="container page page-wide dashboard-cinematic pb-10 pt-4 sm:pt-5">
        <div className="hq-frosted-main-shell min-h-[min(100dvh,56rem)]">
          <Suspense fallback={null}>
            <AssistantPageClient />
          </Suspense>
        </div>
      </div>
    </AssistantPageGate>
  );
}

