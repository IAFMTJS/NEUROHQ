import type { BehaviorProfile } from "@/types/behavior-profile.types";
import type { AvoidanceTracker } from "@/app/actions/avoidance-tracker";

export type ConfrontationLevel = 1 | 2 | 3;

export type ConfrontationTag = "household" | "administration" | "social";

export type ConfrontationMission = {
  tag: ConfrontationTag;
  level: ConfrontationLevel;
  title: string;
  description: string;
};

function getBaseLevelFromSkipped(
  skipped: number,
  mode: BehaviorProfile["confrontationMode"]
): ConfrontationLevel | null {
  // Baseline thresholds: 3/5/7.
  // Mild: later escaleren (4/6/8). Strong: sneller escaleren (2/4/6).
  if (mode === "mild") {
    if (skipped >= 8) return 3;
    if (skipped >= 6) return 2;
    if (skipped >= 4) return 1;
    return null;
  }
  if (mode === "strong") {
    if (skipped >= 6) return 3;
    if (skipped >= 4) return 2;
    if (skipped >= 2) return 1;
    return null;
  }
  // standard
  if (skipped >= 7) return 3;
  if (skipped >= 5) return 2;
  if (skipped >= 3) return 1;
  return null;
}

function pickMission(
  tag: ConfrontationTag,
  level: ConfrontationLevel,
  profile: BehaviorProfile,
  opts: { lowEnergy: boolean }
): ConfrontationMission {
  const emotion = profile.avoidancePatterns.find((p) => p.tag === tag)?.emotion ?? null;

  if (opts.lowEnergy) {
    // Minimal Integrity versie: 3 minuten, micro-actie, geen harde druk.
    if (tag === "household") {
      return {
        tag,
        level: 1,
        title: "Minimal Integrity: 3 minuten huishouden",
        description:
          "Kies het kleinste zichtbare rommel-plekje. Zet een timer op 3 minuten, doe alleen dat en stop dan. Geen oordeel — wél een minimale beweging vooruit.",
      };
    }
    if (tag === "administration") {
      return {
        tag,
        level: 1,
        title: "Minimal Integrity: 1 micro-stap administratie",
        description:
          "Open één document of e-mail en markeer alleen wat aandacht nodig heeft. 3 minuten max. Je breekt het patroon zonder jezelf te overvragen.",
      };
    }
    return {
      tag,
      level: 1,
      title: "Minimal Integrity: 1 klein sociaal signaal",
      description:
        "Stuur één kort bericht (“Ik denk aan je” of “Hoe is het?”). Geen grote gesprekken, geen perfect antwoord nodig.",
    };
  }

  if (tag === "household") {
    if (level === 1) {
      if (emotion === "overwhelm") {
        return {
          tag,
          level,
          title: "5 minuten: kleinste zichtbare rommel",
          description:
            "Overwhelm bij huishouden is normaal. Kies het kleinste zichtbare rommel-plekje, zet een timer op 5 minuten en stop zodra de timer afgaat.",
        };
      }
      if (emotion === "anxiety") {
        return {
          tag,
          level,
          title: "5 minuten: één kamer of één stap",
          description:
            "Angst voor het huishouden vermindert als je het klein houdt. Kies letterlijk één kamer of één soort klus (bijv. alleen afwassen). Timer 5 min, daarna stoppen. Geen grote opruim, wel beweging.",
        };
      }
      if (emotion === "avoidance") {
        return {
          tag,
          level,
          title: "Doorbreek de uitstel: 5 minuten huishouden",
          description:
            "Je stelt huishouden uit. Vandaag: kies het eerste wat je ziet (een stapel, een aanrecht) en doe 5 minuten. Geen plan, geen perfectie — alleen het patroon doorbreken.",
        };
      }
      return {
        tag,
        level,
        title: "Open de kleinste huishoud-missie",
        description: "Kies één zone die je vermijdt en doe 5 minuten actie. Geen oordeel, wel gericht.",
      };
    }
    if (level === 2) {
      return {
        tag,
        level,
        title: "Je vermijdt huishouden consequent",
        description: "Vandaag: 15 minuten volledige focus op de ruimte die je het meest ontwijkt. Timer aan, dan stoppen.",
      };
    }
    return {
      tag,
      level,
      title: "Bewijs dat je je omgeving serieus neemt",
      description:
        "Reset je omgeving vandaag echt: kies de ruimte die je schaamtelijk vindt en maak die 20 minuten lang je enige focus.",
    };
  }

  if (tag === "administration") {
    if (level === 1) {
      if (emotion === "anxiety") {
        return {
          tag,
          level,
          title: "Schrijf op wat je vreest (5 min)",
          description:
            "Anxiety bij administratie is voorspelbaar. Schrijf exact op wat je vreest, benoem het worst-case realistisch scenario en werk dan 5 minuten aan één kleine stap.",
        };
      }
      if (emotion === "overwhelm") {
        return {
          tag,
          level,
          title: "Eén ding: open en benoem",
          description:
            "Overwhelm bij administratie: te veel tegelijk. Open vandaag één document of e-mail. Je hoeft niets op te lossen — alleen te benoemen wat erin staat of wat de volgende micro-stap is. 5 minuten max.",
        };
      }
      if (emotion === "avoidance") {
        return {
          tag,
          level,
          title: "Stop met uitstellen: 1 brief of 1 e-mail",
          description:
            "Administratie blijft liggen. Vandaag: open één brief of één e-mail en lees hem volledig. Geen actie verplicht — alleen lezen en eventueel één zin noteren (wat moet er gebeuren?).",
        };
      }
      return {
        tag,
        level,
        title: "Open 1 brief en lees hem volledig",
        description:
          "Je hebt administratie meerdere keren uitgesteld. Open vandaag één brief of e-mail en lees hem rustig, zonder direct iets te hoeven oplossen.",
      };
    }
    if (level === 2) {
      return {
        tag,
        level,
        title: "15 minuten administratie focus",
        description:
          "Je vermijdt administratie consequent. Vandaag: zet een timer voor 15 minuten en werk alleen aan één kleine administratieve taak.",
      };
    }
    const hasFinancialIdentity = profile.identityTargets.includes("financial_control");
    return {
      tag,
      level,
      title: hasFinancialIdentity
        ? "Bewijs dat financiële controle belangrijk is"
        : "Bewijs vandaag dat je je geld serieus neemt",
      description:
        "Kies: betaal 1 factuur of maak een kort budget-overzicht. Geen excuses, alleen één heldere actie.",
    };
  }

  // social
  if (level === 1) {
    if (emotion === "anxiety" || emotion === "avoidance") {
      return {
        tag,
        level,
        title: "Stuur één bericht zonder herschrijven",
        description:
          "Sociale avoidance is herkenbaar. Stuur één eerlijk bericht zonder langer dan één keer te herschrijven. Geen perfecte zin, wel echt contact.",
      };
    }
    return {
      tag,
      level,
      title: "Eén klein sociaal contact",
      description: "Stuur één kort bericht of start één kort gesprek. Niet perfect, wel echt.",
    };
  }
  if (level === 2) {
    return {
      tag,
      level,
      title: "Doorbreek je sociale patroon",
      description:
        "Je vermijdt sociale situaties. Vandaag: spreek je mening één keer uit of stel één vraag die je normaal ontwijkt.",
    };
  }
  return {
    tag,
    level,
    title: "Gedraag je als iemand die relaties belangrijk vindt",
    description:
      "Kies één persoon die belangrijk is en stuur één eerlijke, concrete boodschap. Geen scripts, geen overdenken.",
  };
}

function isSameWeek(a: Date, b: Date): boolean {
  const one = new Date(a);
  const two = new Date(b);
  const startOfWeek = (d: Date) => {
    const result = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const weekday = result.getUTCDay() || 7; // 1=Mon..7=Sun
    result.setUTCDate(result.getUTCDate() - (weekday - 1));
    return result;
  };
  const s1 = startOfWeek(one).toISOString().slice(0, 10);
  const s2 = startOfWeek(two).toISOString().slice(0, 10);
  return s1 === s2;
}

export type ConfrontationCandidate = ConfrontationMission & {
  skipped: number;
};

export function computeConfrontationCandidate(
  tracker: AvoidanceTracker,
  profile: BehaviorProfile,
  today: Date,
  energy: number | null
): ConfrontationCandidate | null {
  const tags: ConfrontationTag[] = ["household", "administration", "social"];
  const lowEnergy = energy != null && energy <= 2.5;

  const candidates: {
    tag: ConfrontationTag;
    level: ConfrontationLevel;
    skipped: number;
    lastForcedAt?: string | null;
  }[] = [];

  // Global cap: als er de afgelopen week al een forced confrontatie was (eender welke tag),
  // dan deze week geen nieuwe forced missie (alleen spiegels via andere lagen).
  const hadForcedThisWeek = Object.values(tracker).some((stats) => {
    if (!stats.lastForcedAt) return false;
    const last = new Date(stats.lastForcedAt);
    return isSameWeek(last, today);
  });

  if (hadForcedThisWeek) {
    return null;
  }

  for (const tag of tags) {
    const stats = tracker[tag];
    if (!stats) continue;

    let level = getBaseLevelFromSkipped(stats.skipped, profile.confrontationMode);
    if (!level) continue;

    // Persoonlijkheid‑schaling: disciplineLevel past drempels aan.
    if (profile.disciplineLevel === "low") {
      // Later escaleren: 5/7/9 in plaats van 3/5/7.
      if (stats.skipped < 5) continue;
      if (stats.skipped >= 9) level = 3;
      else if (stats.skipped >= 7) level = 2;
      else level = 1;
    } else if (profile.disciplineLevel === "high") {
      // Sneller escaleren: 3/5/7 blijft, maar eerder naar hogere levels.
      if (stats.skipped < 3) continue;
      if (stats.skipped >= 7) level = 3;
      else if (stats.skipped >= 5) level = 2;
      else level = 1;
    }

    if (stats.lastForcedAt) {
      const last = new Date(stats.lastForcedAt);
      if (isSameWeek(last, today)) continue;
    }
    candidates.push({ tag, level, skipped: stats.skipped, lastForcedAt: stats.lastForcedAt });
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    if (b.level !== a.level) return b.level - a.level;
    return b.skipped - a.skipped;
  });

  const top = candidates[0];
  const mission = pickMission(top.tag, top.level, profile, { lowEnergy });
  return {
    ...mission,
    skipped: top.skipped,
  };
}

