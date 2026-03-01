import type { BehaviorProfile } from "@/types/behavior-profile.types";

export type BehaviorSuggestions = {
  identity: string | null;
  pet: string | null;
  hobby: string | null;
};

function buildIdentitySuggestion(profile: BehaviorProfile): string | null {
  if (profile.identityTargets.includes("disciplined")) {
    return "Identity: Act like a disciplined person for 20 minutes. No distractions. No excuses.";
  }
  if (profile.identityTargets.includes("fit_person")) {
    return "Identity: Prove you are a fit person today — kies één concrete beweging en doe die.";
  }
  if (profile.identityTargets.includes("good_dog_owner")) {
    return "Identity: Gedraag je als een goede hondenbaas — 10 minuten volledige aanwezigheid zonder telefoon.";
  }
  if (profile.identityTargets.includes("financial_control")) {
    return "Identity: Act financially responsible — één kleine actie (factuur, budget, spaarbeslissing).";
  }
  return null;
}

function buildPetSuggestion(profile: BehaviorProfile): string | null {
  if (profile.petType === "none") return null;
  const highAttachment = profile.petAttachmentLevel === 2;

  if (profile.petType === "dog") {
    if (highAttachment) {
      return "Pet: 10 minuten diepe aanwezigheid met je hond — geen telefoon, observeer 1 teken van vertrouwen.";
    }
    return "Pet: Praktische missie — extra 5 minuten wandelen of voer-/waterplek volledig resetten.";
  }

  if (profile.petType === "cat") {
    if (highAttachment) {
      return "Pet: 10 minuten actief spelen met je kat, zonder afleiding. Let op haar gedrag en noteer 1 inzicht.";
    }
    return "Pet: Maak de kattenbak volledig schoon en ververs het water.";
  }

  // other
  if (highAttachment) {
    return "Pet: Verbeter vandaag één aspect van de leefomgeving van je dier (comfort, veiligheid of stimulatie).";
  }
  return "Pet: Korte check van voeding, water en habitat voor je dier.";
}

function buildHobbySuggestion(profile: BehaviorProfile): string | null {
  const entries = Object.entries(profile.hobbyCommitment);
  if (entries.length === 0) return null;

  const [key, value] = entries.reduce<[string, number] | null>((acc, [k, v]) => {
    if (typeof v !== "number") return acc;
    if (!acc || v > acc[1]) return [k, v];
    return acc;
  }, null) ?? ["", 0];

  if (value < 0.4) return null;

  if (key === "fitness") {
    return `Hobby (fitness): ${Math.round(value * 20)} minuten bewuste beweging vandaag. Geen PR, wel aanwezigheid.`;
  }
  if (key === "music") {
    return "Hobby (music): 10 minuten techniek of het moeilijkste stukje oefenen — opnemen mag, perfectionisme niet.";
  }

  return null;
}

export function buildBehaviorSuggestions(profile: BehaviorProfile): BehaviorSuggestions {
  return {
    identity: buildIdentitySuggestion(profile),
    pet: buildPetSuggestion(profile),
    hobby: buildHobbySuggestion(profile),
  };
}

