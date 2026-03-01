"use server";

import { createClient } from "@/lib/supabase/server";
import { getBehaviorProfile } from "@/app/actions/behavior-profile";
import { trackEvent } from "@/app/actions/analytics-events";
import { createTask, type MissionIntent, type StrategyDomainTask } from "@/app/actions/tasks";

export type BehaviorMissionKind = "identity" | "pet" | "hobby";

function todayDateStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function createBehaviorMission(kind: BehaviorMissionKind): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const profile = await getBehaviorProfile();
  const due_date = todayDateStr();

  let title: string | null = null;
  let domain: StrategyDomainTask | null = null;
  let intent: MissionIntent | null = null;
  let energy_required: number | null = null;
  let notes: string | null = null;

  if (kind === "identity") {
    const target = profile.identityTargets[0];
    if (!target) return { ok: false };

    if (target === "disciplined") {
      title = "Act like a disciplined person for 20 minutes";
      domain = "discipline";
      intent = "discipline";
      energy_required = 4;
      notes = "No distractions. No excuses. Eén blok waarin je je precies gedraagt zoals de gedisciplineerde versie van jezelf.";
    } else if (target === "fit_person") {
      title = "Prove you are a fit person today";
      domain = "health";
      intent = "discipline";
      energy_required = 3;
      notes = "Kies één concrete beweging (wandeling, workout, core) en doe die volledig.";
    } else if (target === "good_dog_owner") {
      title = "Be a responsible pet owner today";
      domain = "health";
      intent = "discipline";
      energy_required = 2;
      notes = "10 minuten volledige aanwezigheid met je hond (geen telefoon) of 1 verzorgingsactie die je uitstelt.";
    } else if (target === "financial_control") {
      title = "Act financially responsible today";
      domain = "business";
      intent = "alignment";
      energy_required = 2;
      notes = "Betaal 1 open factuur of maak een kort budget‑overzicht. Geen spreadsheets, wel helderheid.";
    } else {
      return { ok: false };
    }
  } else if (kind === "pet") {
    if (profile.petType === "none") return { ok: false };
    const highAttachment = profile.petAttachmentLevel === 2;

    if (profile.petType === "dog") {
      domain = "health";
      intent = "discipline";
      energy_required = highAttachment ? 3 : 2;
      title = highAttachment ? "Deep play session with your dog (10 min)" : "Extra 5 minute walk with your dog";
      notes =
        highAttachment
          ? "10 minuten diepe aanwezigheid: spelen, observeren, 1 teken van vertrouwen noteren."
          : "5 minuten extra wandelen of de voer- en waterplek volledig resetten.";
    } else if (profile.petType === "cat") {
      domain = "health";
      intent = "discipline";
      energy_required = 2;
      title = highAttachment ? "Active play session with your cat (10 min)" : "Full litter box & water reset";
      notes =
        highAttachment
          ? "10 minuten actief spelen met je kat, zonder afleiding. Observeer humeur en noteer 1 inzicht."
          : "Kattenbak volledig schoonmaken en water verversen.";
    } else {
      domain = "health";
      intent = "discipline";
      energy_required = 2;
      title = highAttachment ? "Improve your pet's habitat" : "Quick habitat & feeding check";
      notes =
        highAttachment
          ? "Verbeter vandaag één aspect van de leefomgeving van je dier (comfort, veiligheid of stimulatie)."
          : "Korte check: voeding, water en habitat in orde brengen.";
    }
  } else if (kind === "hobby") {
    const entries = Object.entries(profile.hobbyCommitment);
    if (entries.length === 0) return { ok: false };
    const [key, value] =
      entries.reduce<[string, number] | null>((acc, [k, v]) => {
        if (typeof v !== "number") return acc;
        if (!acc || v > acc[1]) return [k, v];
        return acc;
      }, null) ?? ["", 0];

    if (!key || value < 0.4) return { ok: false };

    domain = "learning";
    intent = "experiment";
    energy_required = 3;

    if (key === "fitness") {
      title = "Hobby: fitness block";
      notes = "20 minuten bewuste fitness‑sessie: workout, core of mobility. Geen PR, wel aanwezigheid.";
    } else if (key === "music") {
      title = "Hobby: music practice block";
      notes = "10 minuten techniek of het moeilijkste gedeelte oefenen; opnemen mag, perfectionisme niet.";
    } else if (key === "language") {
      title = "Hobby: language block";
      notes = "15 minuten taal: 1 episode zonder subtitles, shadowing of 15 nieuwe woorden.";
    } else {
      title = "Hobby: creative block";
      notes = "10–20 minuten creatief werk (schrijven, tekenen, bouwen) aan iets dat je belangrijk vindt.";
    }
  }

  if (!title || !domain || !intent || energy_required == null) {
    return { ok: false };
  }

  await createTask({
    title,
    due_date,
    energy_required,
    domain,
    mission_intent: intent,
    psychology_label: kind === "identity" ? "Identity Reinforcer" : kind === "hobby" ? "Momentum Booster" : "Avoidance Breaker",
    impact: 2,
    urgency: 2,
    notes,
  });

  return { ok: true };
}

/** Anti‑escape: Minimal Integrity micro‑missie na 3+ dagen zonder completion. */
export async function createMinimalIntegrityMission(): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const due_date = todayDateStr();

  await createTask({
    title: "Minimal Integrity: 2–3 min micro‑missie",
    due_date,
    energy_required: 1,
    domain: "discipline",
    mission_intent: "recovery",
    psychology_label: "MinimalIntegrity",
    impact: 1,
    urgency: 1,
    notes:
      "Kies de kleinste mogelijke actie (2–3 minuten) rond een taak die je ontwijkt. Geen perfectionisme, alleen een minimale beweging vooruit.",
  });

  await trackEvent("minimal_integrity_created", {
    due_date,
  });

  return { ok: true };
}

