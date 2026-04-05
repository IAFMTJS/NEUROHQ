import type { StrategyIntegrationOverview } from "@/app/actions/strategy-integration";
import type { StrategyPacingHints } from "@/lib/strategy/strategy-pacing-hints";
import { strategyPaceHintLines } from "@/lib/strategy/format-strategy-pace-hints";
import { formatCents } from "@/lib/utils/currency";

export type StrategyAnalysisSnapshot = {
  headline: string;
  bullets: string[];
  budgetHealth: number;
  growthHealth: number;
  missionsHealth: number;
  budgetWarn: boolean;
  growthWarn: boolean;
  /** Strategy engine (read-only pacing) is configured for this quarter. */
  engineReadOnlyActive: boolean;
  /** Kwartaalcontext + read-only toelichting. */
  engineQuarterLine: string | null;
  /** Zelfde uitleg als pace-hints: spaar- en leerregels t.o.v. engine-doelen. */
  engineDetailLines: string[];
  /** Korte cijferregel (fallback als er geen detailregels zijn). */
  engineCompactStats: string | null;
  ctaLabel: string;
  ctaHref: string;
};

type Issue = { id: string; severity: number; headline: string; bullet: string };

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function budgetHealthScore(b: StrategyIntegrationOverview["budget"]): { score: number; stress: boolean } {
  if (!b.hasPlanning) return { score: 22, stress: true };
  const rem = b.remainingCents;
  const planned = b.plannedBudgetCents;
  if (rem != null && rem < 0) return { score: 8, stress: true };
  if (planned != null && planned > 0 && rem != null) {
    const pct = (rem / planned) * 100;
    if (pct < 5) return { score: clamp(Math.round(pct * 3), 12, 35), stress: true };
    if (pct < 18) return { score: clamp(Math.round(pct * 2.5), 35, 52), stress: true };
    if (pct < 35) return { score: 55, stress: true };
    return { score: clamp(Math.round(60 + pct * 0.35), 72, 98), stress: false };
  }
  const d = b.disciplineScore;
  if (d != null && d < 42) return { score: Math.round(d + 15), stress: true };
  if (d != null) return { score: clamp(Math.round(d), 55, 95), stress: d < 58 };
  return { score: 72, stress: false };
}

function growthHealthScore(g: StrategyIntegrationOverview["growth"] | null): { score: number; stress: boolean } {
  if (!g) return { score: 50, stress: true };
  if (!g.hasProtocols) return { score: 40, stress: true };
  if (!g.activeProtocol && g.focus?.slug) return { score: 48, stress: true };
  if (!g.activeProtocol) return { score: 42, stress: true };
  if (!g.tierAligned) return { score: 38, stress: true };
  if (!g.brainLogged) return { score: 52, stress: true };
  return { score: 90, stress: false };
}

function missionsHealthScore(w: StrategyIntegrationOverview["week"], todayOpen: number): { score: number; stress: boolean } {
  let s = 82;
  let stress = false;
  if (w.overloadDays >= 2) {
    s -= 40;
    stress = true;
  } else if (w.overloadDays === 1) {
    s -= 22;
    stress = true;
  }
  if (todayOpen >= 12) {
    s -= 18;
    stress = true;
  } else if (todayOpen >= 8) {
    s -= 10;
    stress = true;
  }
  return { score: clamp(s, 15, 95), stress };
}

function collectIssues(
  data: StrategyIntegrationOverview,
  alignmentScore: number,
  reviewDue: boolean,
): Issue[] {
  const issues: Issue[] = [];
  const { budget: b, week, growth, todayOpenMissionCount } = data;

  if (reviewDue) {
    issues.push({
      id: "review",
      severity: 100,
      headline: "Weekreview open — zonder review staat je week stil.",
      bullet: "Review: nu afronden",
    });
  }

  if (!b.hasPlanning) {
    issues.push({
      id: "budget-plan",
      severity: 92,
      headline: "Geen budgetplan — je cashflow is niet te sturen.",
      bullet: "Budget: geen plan",
    });
  } else if (b.remainingCents != null && b.remainingCents < 0) {
    issues.push({
      id: "budget-neg",
      severity: 95,
      headline: "Budget overschreden — herpak cashflow eerst.",
      bullet: `Budget: ${formatCents(b.remainingCents)}`,
    });
  } else if (b.plannedBudgetCents != null && b.plannedBudgetCents > 0 && b.remainingCents != null) {
    const bufferPct = Math.round((b.remainingCents / b.plannedBudgetCents) * 100);
    if (bufferPct < 18) {
      issues.push({
        id: "budget-tight",
        severity: 78,
        headline: "Budget krap — je buffer is dun deze periode.",
        bullet: `Budget: ${bufferPct}% buffer`,
      });
    }
  }

  if (week.overloadDays >= 2) {
    issues.push({
      id: "overload",
      severity: 88,
      headline: "Week overbelast — te veel geplande dagen.",
      bullet: `Missies: ${week.overloadDays}× overload`,
    });
  } else if (week.overloadDays === 1) {
    issues.push({
      id: "overload-1",
      severity: 62,
      headline: "Drukke week — één dag zit overvol.",
      bullet: "Missies: 1× overload",
    });
  }

  if (growth && growth.activeProtocol && !growth.tierAligned) {
    issues.push({
      id: "growth-tier",
      severity: 72,
      headline: "Growth-loop wringt — protocol past niet bij je energy.",
      bullet: "Growth: tier mismatch",
    });
  } else if (growth && growth.activeProtocol && !growth.brainLogged) {
    issues.push({
      id: "growth-brain",
      severity: 58,
      headline: "Geen brain check-in vandaag — growth mist je signalen.",
      bullet: "Growth: check-in mist",
    });
  } else if (growth && !growth.activeProtocol && growth.hasProtocols) {
    issues.push({
      id: "growth-none",
      severity: 55,
      headline: "Geen actief growth-traject — kies een protocol.",
      bullet: "Growth: geen traject",
    });
  }

  if (alignmentScore < 0.52) {
    issues.push({
      id: "alignment",
      severity: 60,
      headline: "Je week wijkt af van je focus-allocatie.",
      bullet: `Alignment: ${Math.round(alignmentScore * 100)}%`,
    });
  }

  return issues.sort((a, b) => b.severity - a.severity);
}

function engineTargetsActive(h: StrategyPacingHints | null): boolean {
  if (!h) return false;
  const save = h.savingsTargetCents != null && h.savingsTargetCents > 0;
  const learn = h.learningTargetPct != null && h.learningTargetPct > 0;
  return save || learn;
}

function enginePaceSummaryLine(h: StrategyPacingHints | null): string | null {
  if (!engineTargetsActive(h)) return null;
  const hp = h!;
  const q = Math.round(hp.quarterElapsedFrac * 100);
  const bits: string[] = [];
  if (hp.savingsTargetCents != null && hp.savingsTargetCents > 0 && hp.savedThisQuarterCents != null) {
    bits.push(`${formatCents(hp.savedThisQuarterCents)} / ${formatCents(hp.savingsTargetCents)} gespaard`);
  } else if (hp.savingsTargetCents != null && hp.savingsTargetCents > 0) {
    bits.push(`Doel ${formatCents(hp.savingsTargetCents)} · nog geen stortingen dit kwartaal`);
  }
  if (hp.learningTargetPct != null && hp.learningTargetPct > 0 && hp.learningRoughPct != null) {
    bits.push(`Leer ~${hp.learningRoughPct}% t.o.v. ${hp.learningTargetPct}% kwartaaldoel`);
  } else if (hp.learningTargetPct != null && hp.learningTargetPct > 0) {
    bits.push(`Leerdoel ${hp.learningTargetPct}% kwartaal`);
  }
  if (bits.length === 0) return null;
  return `Kwartaal ${q}% voorbij · ${bits.join(" · ")}`;
}

function buildEngineQuarterLine(h: StrategyPacingHints | null): string | null {
  if (!engineTargetsActive(h)) return null;
  const q = Math.round(h!.quarterElapsedFrac * 100);
  return `Het kwartaal is ${q}% verstreken. Spaar- en leertraject worden vergeleken met de engine-curve (read-only). Limieten pas je aan onder Profiel → Engine → Strategy engine.`;
}

function buildEngineDetailLines(hints: StrategyPacingHints | null): string[] {
  if (!engineTargetsActive(hints)) return [];
  const lines = strategyPaceHintLines("both", hints!);
  if (lines.length > 0) return lines;
  const fallback = enginePaceSummaryLine(hints);
  return fallback ? [fallback] : [];
}

function collectEngineIssues(hints: StrategyPacingHints | null): Issue[] {
  if (!hints || !engineTargetsActive(hints)) return [];
  const issues: Issue[] = [];
  if (hints.savingsOnTrack === false) {
    const saved = hints.savedThisQuarterCents;
    const tgt = hints.savingsTargetCents;
    const bullet =
      saved != null && tgt != null
        ? `Engine: sparen ${formatCents(saved)}/${formatCents(tgt)} (achter)`
        : "Engine: spaardoel onder tempo";
    issues.push({
      id: "engine-savings",
      severity: 76,
      headline: "Strategy-engine: spaardoel loopt achter dit kwartaal.",
      bullet,
    });
  }
  if (hints.learningOnTrack === false) {
    const r = hints.learningRoughPct;
    const t = hints.learningTargetPct;
    const bullet =
      r != null && t != null ? `Engine: leer ~${r}%/${t}% (achter)` : "Engine: leerdoel onder tempo";
    issues.push({
      id: "engine-learning",
      severity: 70,
      headline: "Strategy-engine: leerdoel loopt achter dit kwartaal.",
      bullet,
    });
  }
  return issues;
}

function engineNeutralBullet(hints: StrategyPacingHints | null): string | null {
  if (!engineTargetsActive(hints)) return null;
  const h = hints!;
  const parts: string[] = [];
  if (h.savingsTargetCents != null && h.savingsTargetCents > 0) {
    if (h.savedThisQuarterCents != null) {
      parts.push(h.savingsOnTrack === false ? "spaar ↓" : h.savingsOnTrack === true ? "spaar OK" : "spaar track");
    } else {
      parts.push("spaar log");
    }
  }
  if (h.learningTargetPct != null && h.learningTargetPct > 0) {
    if (h.learningRoughPct != null) {
      parts.push(h.learningOnTrack === false ? "leer ↓" : h.learningOnTrack === true ? "leer OK" : `leer ~${h.learningRoughPct}%`);
    } else {
      parts.push("leer start");
    }
  }
  if (parts.length === 0) return "Engine: doelen actief";
  return `Engine: ${parts.join(" · ")}`;
}

function neutralBullets(data: StrategyIntegrationOverview, hints: StrategyPacingHints | null): string[] {
  const b = data.budget;
  const bullets: string[] = [];
  if (b.hasPlanning && b.plannedBudgetCents != null && b.plannedBudgetCents > 0 && b.remainingCents != null) {
    const pct = Math.round((b.remainingCents / b.plannedBudgetCents) * 100);
    bullets.push(`Budget: ${pct}% buffer`);
  } else if (b.hasPlanning) {
    bullets.push(`Budget: ${b.remainingCents != null ? formatCents(b.remainingCents) : "ok"}`);
  } else {
    bullets.push("Budget: plan instellen");
  }

  const g = data.growth;
  if (g?.activeProtocol) {
    bullets.push(g.brainLogged ? "Growth: check-in ok" : "Growth: traject loopt");
  } else {
    bullets.push("Growth: traject kiezen");
  }

  const eng = engineNeutralBullet(hints);
  if (eng) {
    bullets.push(eng);
  } else {
    bullets.push(
      data.todayOpenMissionCount > 0
        ? `Missies: ${data.todayOpenMissionCount} open vandaag`
        : `Missies: ${data.week.totalOpenTasks} deze week`,
    );
  }
  return bullets.slice(0, 3);
}

function pickCta(
  issues: Issue[],
  data: StrategyIntegrationOverview,
  engineHints: StrategyPacingHints | null,
): { label: string; href: string } {
  const top = issues[0];
  if (top?.id === "review") return { label: "Doe weekreview", href: "/strategy?tab=review" };
  if (top?.id === "budget-plan" || top?.id === "budget-neg" || top?.id === "budget-tight") {
    return { label: "Fix budget & focus", href: "/budget" };
  }
  if (top?.id === "engine-savings") return { label: "Bouw spaar-buffer", href: "/budget" };
  if (top?.id === "engine-learning") return { label: "Trek Growth recht", href: "/learning?tab=command" };
  if (top?.id === "overload" || top?.id === "overload-1") return { label: "Herbalanceer week", href: "/tasks" };
  if (top?.id === "growth-tier" || top?.id === "growth-brain" || top?.id === "growth-none") {
    return { label: "Sync Growth", href: "/learning?tab=command" };
  }
  if (top?.id === "alignment") return { label: "Herbalanceer focus", href: "/strategy?tab=focus" };

  const b = data.budget;
  if (!b.hasPlanning) return { label: "Plan budget", href: "/budget" };
  if (b.remainingCents != null && b.remainingCents < 0) return { label: "Fix budget", href: "/budget" };
  if (data.week.overloadDays > 0) return { label: "Ontlast missies", href: "/tasks" };
  if (data.growth && !data.growth.brainLogged && data.growth.activeProtocol) {
    return { label: "Brain check-in", href: "/dashboard" };
  }
  if (engineHints?.savingsOnTrack === false) return { label: "Bouw spaar-buffer", href: "/budget" };
  if (engineHints?.learningOnTrack === false) return { label: "Trek Growth recht", href: "/learning?tab=command" };
  return { label: "Bekijk alignment", href: "/strategy?tab=alignment" };
}

/**
 * Compact command-center snapshot for Strategy “Analysis Square”.
 */
export function buildStrategyAnalysisSnapshot(
  data: StrategyIntegrationOverview | null,
  alignmentScore: number,
  reviewDue: boolean,
  engineHints: StrategyPacingHints | null,
): StrategyAnalysisSnapshot | null {
  if (!data) return null;

  let bH = budgetHealthScore(data.budget);
  let gH = growthHealthScore(data.growth);
  const mHealth = missionsHealthScore(data.week, data.todayOpenMissionCount);
  const issues = [
    ...collectIssues(data, alignmentScore, reviewDue),
    ...collectEngineIssues(engineHints),
  ].sort((a, b) => b.severity - a.severity);

  if (engineHints?.savingsOnTrack === false) {
    bH = { score: Math.min(bH.score, 44), stress: true };
  }
  if (engineHints?.learningOnTrack === false) {
    gH = { score: Math.min(gH.score, 42), stress: true };
  }

  const engineReadOnlyActive = engineTargetsActive(engineHints);
  const engineQuarterLine = buildEngineQuarterLine(engineHints);
  const engineDetailLines = buildEngineDetailLines(engineHints);
  const engineCompactStats = enginePaceSummaryLine(engineHints);

  let headline: string;
  let bullets: string[];

  if (issues.length > 0) {
    headline = issues[0]!.headline;
    bullets = issues.slice(0, 3).map((i) => i.bullet);
    if (bullets.length < 3) {
      const fill = neutralBullets(data, engineHints).filter((line) => !bullets.some((b) => b.startsWith(line.split(":")[0]!)));
      for (const f of fill) {
        if (bullets.length >= 3) break;
        if (!bullets.includes(f)) bullets.push(f);
      }
    }
  } else if (bH.stress || gH.stress || mHealth.stress) {
    headline = "Je week is niet overal in balans.";
    bullets = [];
    if (bH.stress) {
      if (
        data.budget.hasPlanning &&
        data.budget.plannedBudgetCents != null &&
        data.budget.plannedBudgetCents > 0 &&
        data.budget.remainingCents != null
      ) {
        bullets.push(`Budget: ${Math.round((data.budget.remainingCents / data.budget.plannedBudgetCents) * 100)}% buffer`);
      } else {
        bullets.push("Budget: nu alignen");
      }
    }
    if (gH.stress && bullets.length < 3) {
      bullets.push(data.growth && !data.growth.brainLogged ? "Growth: check-in mist" : "Growth: traject alignen");
    }
    if (mHealth.stress && bullets.length < 3) {
      bullets.push(
        data.week.overloadDays > 0
          ? `Missies: ${data.week.overloadDays}× overload`
          : "Missies: hoge load",
      );
    }
    for (const f of neutralBullets(data, engineHints)) {
      if (bullets.length >= 3) break;
      const prefix = f.split(":")[0];
      if (!prefix || !bullets.some((b) => b.startsWith(prefix))) bullets.push(f);
    }
    bullets = bullets.slice(0, 3);
  } else {
    headline = "Je stack staat op één lijn.";
    bullets = neutralBullets(data, engineHints);
  }

  bullets = bullets.slice(0, 3);

  const { label, href } = pickCta(issues, data, engineHints);

  return {
    headline,
    bullets,
    budgetHealth: bH.score,
    growthHealth: gH.score,
    missionsHealth: mHealth.score,
    budgetWarn: bH.stress,
    growthWarn: gH.stress,
    engineReadOnlyActive,
    engineQuarterLine,
    engineDetailLines,
    engineCompactStats,
    ctaLabel: label,
    ctaHref: href,
  };
}
