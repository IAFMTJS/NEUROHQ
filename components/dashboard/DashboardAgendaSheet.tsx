"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { UpcomingCalendarList } from "@/components/UpcomingCalendarList";
import { AddCalendarEventForm } from "@/components/AddCalendarEventForm";
import { GlassButton } from "@/components/hud-test/GlassButton";

type Event = {
  id: string;
  title: string | null;
  start_at: string;
  end_at: string;
  is_social: boolean;
  source: string | null;
};

type Props = {
  dateStr: string;
  upcomingEvents: Event[];
  hasGoogleToken: boolean;
  /** Button content (e.g. "Agenda" text or icon). */
  trigger: React.ReactNode;
};

export function DashboardAgendaSheet({
  dateStr,
  upcomingEvents,
  hasGoogleToken,
  trigger,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <GlassButton
        onClick={() => setOpen(true)}
        className="dashboard-hud-trigger shrink-0 h-[26px] w-[26px] rounded-[10px] p-0 text-[9px] tracking-[0.06em]"
        style={{ height: "26px", minHeight: "26px", width: "26px", minWidth: "26px", paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0 }}
        aria-label="Agenda openen"
      >
        <span className="text-[10px]" aria-hidden>📅</span>
        {trigger}
      </GlassButton>
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Agenda"
        subtitle="Vandaag en morgen. Events tellen mee voor je energiebudget."
        sheetClassName="dashboard-hud-sheet"
      >
        <div className="space-y-4">
          <UpcomingCalendarList
            upcomingEvents={upcomingEvents}
            todayStr={dateStr}
            maxDays={2}
          />
          <AddCalendarEventForm
            date={dateStr}
            hasGoogleToken={hasGoogleToken}
            allowAnyDate
          />
        </div>
      </BottomSheet>
    </>
  );
}
