import type { QuarterEngineSnapshot } from "@/app/actions/quarter-engine-snapshot";
import { formatCents } from "@/lib/utils/currency";
import {
  EXECUTION_BEHAVIOR_LABELS_NL,
  normalizeExecutionBehaviorFocus,
} from "@/lib/strategy/execution-behavior";

export type PillarCardModel = {
  scoreLine: string;
  summary: string;
  dataLines: string[];
  goodPoints: string[];
  badPoints: string[];
};

function scoreLine(committed: boolean): string {
  if (!committed) {
    return "Pijlerscore staat op neutraal (50% in de mix) zolang er geen contractdoel of onvoldoende data is.";
  }
  return "Deze pijler weegt proportioneel mee in je totaalscore op basis van je commitment en wat je dit kwartaal hebt gelogd.";
}

function pushGoodBad(
  committed: boolean,
  displayPct: number,
  good: string[],
  bad: string[],
  neutralHint?: string
): { goodPoints: string[]; badPoints: string[] } {
  if (!committed) {
    return {
      goodPoints: [],
      badPoints: [
        neutralHint ??
          "Geen harde meting: stel doelen in Strategy → Contract (waar van toepassing) en lever data aan via Budget / Missions.",
      ],
    };
  }
  const g = [...good];
  const b = [...bad];
  if (displayPct >= 72) {
    g.push("Pijler staat ruim op schema of op koers.");
  } else if (displayPct < 48) {
    b.push("Pijler ligt duidelijk onder het beoogde tempo dit kwartaal.");
  } else {
    g.push("Je zit in het middenveld — nog ruim om bij te sturen voor het eind van het kwartaal.");
  }
  return { goodPoints: g, badPoints: b };
}

export function buildPillarCardModel(
  snapshot: QuarterEngineSnapshot,
  key: "budget" | "growth" | "xp" | "discipline"
): PillarCardModel {
  const ep = snapshot.engineParams;
  const m = snapshot.commandMetrics;
  const pillar = snapshot[key];

  if (key === "budget") {
    const tgt = ep.savings.quarterlyMustSaveCents;
    const dataLines: string[] = [];
    if (tgt != null && tgt > 0) {
      dataLines.push(`Kwartaaldoel in contract: ${formatCents(tgt)}.`);
      if (m.savedThisQuarterCents != null) {
        dataLines.push(`Gelogd dit kwartaal: ${formatCents(m.savedThisQuarterCents)}.`);
      } else {
        dataLines.push("Nog geen spaarbijdragen met datum dit kwartaal in je logboek.");
      }
    } else {
      dataLines.push("Geen spaardoel vastgelegd in het kwartaalcontract.");
    }

    const summary =
      pillar.committed && tgt != null && tgt > 0
        ? m.savedThisQuarterCents != null
          ? `Sparen: ${formatCents(m.savedThisQuarterCents)} van ${formatCents(tgt)} — dat komt neer op ${pillar.displayPct}% van je commitment.`
          : "Je hebt een spaardoel gezet; zodra je stortingen op Budget dit kwartaal logt, vult de score zich in."
        : "Zonder spaardoel in het contract blijft deze pijler neutraal in de totaalscore.";

    const good: string[] = [];
    const bad: string[] = [];
    if (pillar.committed && m.savedThisQuarterCents != null && tgt != null && tgt > 0) {
      if (m.savedThisQuarterCents >= tgt) good.push("Doelbedrag voor dit kwartaal is gehaald of overschreden.");
      if (m.savedThisQuarterCents > 0 && pillar.displayPct < 40) bad.push("Nog ruimte tot je kwartaalbedrag — plan vaste stortingen op Budget.");
    }
    if (pillar.committed && m.savedThisQuarterCents == null && tgt != null && tgt > 0) {
      bad.push("Nog geen meting: log stortingen op Budget zodat Strategy je voortgang kan zien.");
    }
    const { goodPoints, badPoints } = pushGoodBad(pillar.committed, pillar.displayPct, good, bad);
    return {
      scoreLine: scoreLine(pillar.committed),
      summary,
      dataLines,
      goodPoints,
      badPoints,
    };
  }

  if (key === "growth") {
    const contractPct = ep.growth.quarterlyLearningProgressTargetPct;
    const pq = snapshot.growthProtocolQuarter;
    const dataLines: string[] = [];

    if (contractPct != null && contractPct > 0) {
      dataLines.push(`Leer-% in contract: ${contractPct}%.`);
    }
    if (pq != null) {
      dataLines.push(
        `Protocol ${pq.protocolTitle}: ${pq.completedTasks}/${pq.expectedTasks} taken afgerond dit kwartaal (verwachte set uit weken ${pq.weekRangeStart}–${pq.weekRangeEnd}).`
      );
    }
    if (m.growthActualPct != null && m.growthEngineTargetPct != null) {
      dataLines.push(`Engine meet nu: ${m.growthActualPct}% t.o.v. intern doel ${m.growthEngineTargetPct}%.`);
    } else if (!pq && contractPct == null) {
      dataLines.push("Geen actief protocol-meetlint of leer-% in contract.");
    }

    const summary = pq
      ? `Leerpijler volgt je protocol dit kwartaal: ${pq.completedTasks} van ${pq.expectedTasks} verwachte taken zitten op je bord afgerond.`
      : pillar.committed
        ? `Leerpijler gebruikt je contractpercentage (${contractPct ?? "—"}%) en beschikbare voortgangssignalen.`
        : "Zonder leercommitment of bruikbaar protocol blijft deze pijler neutraal.";

    const good: string[] = [];
    const bad: string[] = [];
    if (pq && pq.expectedTasks > 0 && pq.completedTasks >= pq.expectedTasks) {
      good.push("Alle verwachte protocoltaken voor dit kwartaal zijn afgerond.");
    }
    if (pq && pq.expectedTasks > 0 && pq.completedTasks === 0) {
      bad.push("Nog geen afgeronde protocoltaken dit kwartaal — pak ze op via Missions.");
    }
    const { goodPoints, badPoints } = pushGoodBad(pillar.committed, pillar.displayPct, good, bad);
    return {
      scoreLine: scoreLine(pillar.committed),
      summary,
      dataLines,
      goodPoints,
      badPoints,
    };
  }

  if (key === "xp") {
    const tgt = ep.xp.quarterlyTargetXpEarned;
    const dataLines: string[] = [];
    if (tgt != null && tgt > 0) {
      dataLines.push(`Doel dit kwartaal: ${tgt} XP (bruto, uit xp_events).`);
      dataLines.push(`Nu verdiend in dit kwartaal: ${m.xpEarnedThisQuarter} XP.`);
    } else {
      dataLines.push("Geen XP-doel in het kwartaalcontract.");
    }

    const summary =
      pillar.committed && tgt != null && tgt > 0
        ? `XP: ${m.xpEarnedThisQuarter} van ${tgt} — ${pillar.displayPct}% van je kwartaaldoel.`
        : "Zonder XP-doel blijft deze pijler neutraal in de totaalscore.";

    const good: string[] = [];
    const bad: string[] = [];
    if (pillar.committed && tgt != null && m.xpEarnedThisQuarter >= tgt) {
      good.push("XP-doel voor dit kwartaal is gehaald.");
    }
    const { goodPoints, badPoints } = pushGoodBad(pillar.committed, pillar.displayPct, good, bad);
    return {
      scoreLine: scoreLine(pillar.committed),
      summary,
      dataLines,
      goodPoints,
      badPoints,
    };
  }

  /* discipline */
  const focus = normalizeExecutionBehaviorFocus(ep.execution?.behaviorFocus);
  const meta = EXECUTION_BEHAVIOR_LABELS_NL[focus];
  const { skip, reschedule, delete: del } = m.missionOutcomesBreakdown;
  const dataLines = [
    `${m.taskCompletesInQuarter} missie-afrondingen dit kwartaal (task_events).`,
    `${m.missionOutcomeNegative} negatieve uitkomsten: ${skip}× skip · ${reschedule}× verzet · ${del}× verwijderd.`,
    `Executie-focus: ${meta.title} — ${meta.measure}`,
  ];

  const summary =
    pillar.committed && m.taskCompletesInQuarter + m.missionOutcomeNegative > 0
      ? `Mix van ${m.taskCompletesInQuarter} voltooide missies en ${m.missionOutcomeNegative} keer verzet/skip/verwijderen dit kwartaal — focus “${meta.title}”.`
      : pillar.committed
        ? "Weinig missie-activiteit dit kwartaal om tegen te meten; zodra je voltooit of uitstelt, vult de pijler zich."
        : "Te weinig data om executie hard te meten — blijf Missions gebruiken.";

  const good: string[] = [];
  const bad: string[] = [];
  if (pillar.committed && m.taskCompletesInQuarter > 0 && m.missionOutcomeNegative === 0) {
    good.push("Geen geregistreerde skip/verzet/verwijder-flows dit kwartaal naast je voltooiingen.");
  }
  if (m.missionOutcomeNegative > m.taskCompletesInQuarter && m.taskCompletesInQuarter > 0) {
    bad.push("Relatief veel negatieve uitkomsten t.o.v. voltooiingen — overweeg kleinere stappen of minder agressieve planning.");
  }
  const { goodPoints, badPoints } = pushGoodBad(
    pillar.committed,
    pillar.displayPct,
    good,
    bad,
    "Nog te weinig missie-activiteit dit kwartaal (voltooien / uitstel) om executie stevig te meten."
  );
  return {
    scoreLine: scoreLine(pillar.committed),
    summary,
    dataLines,
    goodPoints,
    badPoints,
  };
}
