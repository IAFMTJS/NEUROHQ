import Link from "next/link";
import { getMascotSrcForPage } from "@/lib/mascots";
import { CommanderStatRing } from "./CommanderStatRing";

type Props = {
  energyPct: number;
  focusPct: number;
  loadPct: number;
  missionHref: string;
  missionLabel: string;
};

export function CommanderHomeHero({
  energyPct,
  focusPct,
  loadPct,
  missionHref,
  missionLabel,
}: Props) {
  return (
    <>
      <header>
        <h1>Dashboard</h1>
        <p className="text-soft">System Overview</p>
      </header>

      <section className="mascot-hero mascot-hero-top" aria-hidden>
        <img
          src={getMascotSrcForPage("dashboard")}
          alt=""
          className="mascot-img"
        />
      </section>

      <section className="stats">
        <CommanderStatRing value={energyPct} variant="energy" />
        <CommanderStatRing value={focusPct} variant="focus" />
        <CommanderStatRing value={loadPct} variant="load" />
      </section>

      <Link
        href={missionHref}
        className="primary-btn block no-underline w-full"
      >
        {missionLabel}
      </Link>

      <Link
        href="#brain-status-modal"
        className="block w-full mt-2 py-2 text-center text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors no-underline rounded-lg border border-white/10 hover:border-[rgba(0,212,255,0.25)] hover:bg-white/5"
      >
        Brain Status
      </Link>
    </>
  );
}
