import { Suspense } from "react";
import AssistantPageClient from "@/components/dashboard/AssistantPageClient";
import { AssistantPageGate } from "@/components/dashboard/AssistantPageGate";
import { DashboardCommandDeckFrame } from "@/components/layout/DashboardCommandDeckFrame";

export default function AssistantPage() {
  return (
    <AssistantPageGate>
      <div className="container page page-wide dashboard-cinematic pb-10 pt-4 sm:pt-5">
        <DashboardCommandDeckFrame deckTitle="Assistant" innerClassName="gap-4">
          <Suspense fallback={null}>
            <AssistantPageClient />
          </Suspense>
        </DashboardCommandDeckFrame>
      </div>
    </AssistantPageGate>
  );
}

