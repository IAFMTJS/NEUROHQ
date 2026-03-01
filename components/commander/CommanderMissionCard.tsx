"use client";

import Link from "next/link";

export type MissionState = "active" | "locked" | "completed";

type Props = {
  id: string;
  title: string;
  subtitle?: string;
  /** Template/mission description (e.g. from mission_templates). */
  description?: string | null;
  state: MissionState;
  progressPct?: number;
  href?: string;
};

export function CommanderMissionCard({
  id,
  title,
  subtitle,
  description,
  state,
  progressPct,
  href,
}: Props) {
  const content = (
    <>
      <h3>{title}</h3>
      {subtitle && <p className="text-soft">{subtitle}</p>}
      {description && <p className="mt-1 text-xs text-[var(--text-muted)] line-clamp-2">{description}</p>}
      {state === "active" && progressPct != null && (
        <div className="progress">
          <div
            className="progress-fill"
            style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      )}
    </>
  );

  const className = `mission-card ${state}`;

  if (href && state !== "locked") {
    return (
      <Link href={href} className={`${className} block no-underline text-inherit`}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
