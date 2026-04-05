"use client";

import Link from "next/link";
import {
  BRIDGE_MISSION_BODY_CLASS,
  BRIDGE_MISSION_CARD_CLASS,
  BRIDGE_MISSION_EYEBROW_CLASS,
  bridgeMissionEyebrowStyle,
} from "@/components/commander/bridgeMissionCardClasses";

type Props = {
  summary: string | null;
  emptyMessage: string;
  href: string;
};

/** Compact “main mission” summary for the dashboard bridge (left of the mission CTA). */
export function DashboardMainMissionTeaser({ summary, emptyMessage, href }: Props) {
  const line = summary?.trim() || emptyMessage;
  return (
    <Link href={href} className={`bridge-main-mission-teaser ${BRIDGE_MISSION_CARD_CLASS}`}>
      <p className={BRIDGE_MISSION_EYEBROW_CLASS} style={bridgeMissionEyebrowStyle}>
        Hoofdmissie
      </p>
      <p className={BRIDGE_MISSION_BODY_CLASS}>{line}</p>
    </Link>
  );
}
