"use client";

import dynamic from "next/dynamic";

export const ModeBanner = dynamic(
  () => import("@/components/ModeBanner").then((m) => ({ default: m.ModeBanner })),
  { ssr: false, loading: () => null }
);

export const ModeExplanationModal = dynamic(
  () => import("@/components/ModeExplanationModal").then((m) => ({ default: m.ModeExplanationModal })),
  { ssr: false, loading: () => null }
);

export const AddCalendarEventForm = dynamic(
  () => import("@/components/AddCalendarEventForm").then((m) => ({ default: m.AddCalendarEventForm })),
  { ssr: false, loading: () => null }
);
