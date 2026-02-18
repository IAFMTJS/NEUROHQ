import Link from "next/link";
import { CommanderStatRing } from "./CommanderStatRing";
import { HeroMascotImage } from "@/components/HeroMascotImage";

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

      <section className="mascot-hero mascot-hero-top" data-mascot-page="dashboard" aria-hidden>
        <div className="mascot-hero-inner">
          <HeroMascotImage page="dashboard" className="mascot-img" />
        </div>
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
    </>
  );
}
