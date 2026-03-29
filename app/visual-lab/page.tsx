import type { Metadata } from "next";
import { VisualLabClient } from "@/components/visual-lab/VisualLabClient";

export const metadata: Metadata = {
  title: "Visual lab · NEUROHQ",
  description: "Standalone design sandbox with mock data",
};

export default function VisualLabPage() {
  return <VisualLabClient />;
}
