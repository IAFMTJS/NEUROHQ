import { Suspense } from "react";
import AssistantPageClient from "@/components/dashboard/AssistantPageClient";
import { AssistantPageGate } from "@/components/dashboard/AssistantPageGate";
import { VisualLabCommandDeck } from "@/components/visual-lab/VisualLabCommandDeck";
import { CornerNode } from "@/components/hud-test/CornerNode";

export default function AssistantPage() {
  return (
    <AssistantPageGate>
      <div className="container page page-wide dashboard-cinematic pb-10 pt-4 sm:pt-5">
        <div className="hq-frosted-main-shell min-h-[min(100dvh,56rem)]">
          <VisualLabCommandDeck>
            <CornerNode corner="top-left" />
            <CornerNode corner="top-right" />
            <Suspense fallback={null}>
              <AssistantPageClient />
            </Suspense>
          </VisualLabCommandDeck>
        </div>
      </div>
    </AssistantPageGate>
  );
}

