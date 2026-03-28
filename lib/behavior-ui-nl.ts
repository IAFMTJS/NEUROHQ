import type { BehaviorProfile, WeekTheme } from "@/types/behavior-profile.types";

/** Gedeelde NL-copy voor Engine Identiteit + Gedrag (één bron van waarheid). */
export const WEEK_THEME_LABELS_NL: Record<WeekTheme, string> = {
  environment_reset: "Omgeving reset",
  self_discipline: "Zelfdiscipline",
  health_body: "Health & body",
  courage: "Moed / confrontatie",
};

export const IDENTITY_TARGET_LABELS_NL: Record<string, string> = {
  fit_person: "Fit & gezond",
  disciplined: "Discipline",
  good_dog_owner: "Goede hondenbaasje",
  financial_control: "Financiële grip",
};

export const ENERGY_PATTERN_LABELS_NL: Record<BehaviorProfile["energyPattern"], string> = {
  morning_low: "Ochtenddip — later piek",
  stable: "Redelijk stabiel",
  evening_crash: "Avondval / crash",
};

export const DISCIPLINE_LEVEL_LABELS_NL: Record<BehaviorProfile["disciplineLevel"], string> = {
  low: "Lager (meer ruimte)",
  medium: "Gemiddeld",
  high: "Strak / hoog",
};

export const CONFRONTATION_MODE_LABELS_NL: Record<BehaviorProfile["confrontationMode"], string> = {
  mild: "Zacht",
  standard: "Standaard",
  strong: "Sterk",
};

export const CONFRONTATION_MODE_HINTS_NL: Record<BehaviorProfile["confrontationMode"], string> = {
  mild: "Later escaleren, meer micro-stappen en lagere druk.",
  standard: "Balans tussen comfort en confrontatie.",
  strong: "Sneller zwaardere missies als je blijft uitstellen.",
};

export const PET_TYPE_LABELS_NL: Record<BehaviorProfile["petType"], string> = {
  none: "Geen huisdier",
  dog: "Hond",
  cat: "Kat",
  other: "Anders",
};

export const PET_ATTACHMENT_LABELS_NL: Record<0 | 1 | 2, string> = {
  0: "Laag",
  1: "Gemiddeld",
  2: "Hoog",
};

export const AVOIDANCE_ZONE_LABELS_NL: Record<string, string> = {
  household: "Huishouden",
  administration: "Administratie",
  social: "Sociaal",
};

export const AVOIDANCE_EMOTION_LABELS_NL: Record<string, string> = {
  overwhelm: "Overweldiging",
  anxiety: "Spanning / angst",
  avoidance: "Vermijding",
};

export const HOBBY_LABELS_NL: Record<string, string> = {
  fitness: "Fitness",
  music: "Muziek",
  language: "Taal",
  creative: "Creatief",
};
