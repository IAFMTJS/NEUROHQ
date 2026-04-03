import type { PlayKind } from "@/types/play-profile.types";

export type PlayDeckTemplate = {
  id: string;
  title: string;
  play_kind: PlayKind;
  /** Match against user fun_styles, energy_recharge, keywords in about_you */
  tags: string[];
  energy: 1 | 2 | 3;
  /** Template difficulty spice — filtered when user challenge appetite is low */
  spice?: "low" | "medium" | "high";
};
