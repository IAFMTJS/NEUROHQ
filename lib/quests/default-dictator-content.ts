import type { QuestCampaignContent } from "@/lib/quests/types";
import {
  DICTATOR_CLOSING_THOUGHT,
  DICTATOR_EPILOGUE_HELP,
  DICTATOR_EPILOGUE_STOP,
  DICTATOR_FINALE_INTRO,
} from "@/lib/quests/dictator-quest-finale-copy";

/**
 * 6-daagse VIREX / “gebroken signaal” quest + finale keuze HELPEN/STOPPEN (XP 1500 / 750) zoals ontwerpbestand.
 * Campagne `reward_xp` kan 0 blijven: keuze-XP wordt server-side toegekend; flex/badge volgen via claim.
 */
export function getDefaultDictatorQuestContent(): QuestCampaignContent {
  return {
    version: 1,
    storyEpigraph: `HET GEBROKEN SIGNAAL

De wereld staat op het punt om te kantelen. Geen klassieke oorlog met tanks en sirenes, maar iets gerichter. Iets dat niemand meteen ziet aankomen.

Een onbekende dictator, codenaam VIREX, communiceert via fragmenten van een onderschept logbestand. Geen gewone taal. Gelaagd. Versleuteld.

Dit is geen waarschuwing.
Dit is een selectie.

Wie het log kan ontcijferen, leert hoe hij denkt.
En wie hem begrijpt… kan hem stoppen.
Of hem helpen.

Je ontvangt 6 dagen lang telkens een fragment.
Elke dag geeft één cruciaal stuk informatie.

Op het einde moet je bepalen:
→ WAAR — HOE — WANNEER
→ HELPEN OF STOPPEN

SPELREGELS
• Elke dag = 1 cipher
• Elke dag = 1 duidelijk antwoord
• Geen gokken, geen interpretatie-chaos
• Alles bouwt logisch op`,
    days: [
      {
        day: 1,
        headline: "Dag 1 — De eerste breuk",
        kind: "riddle",
        intro:
          "Fragment 1 van het log. Onthoud: alles wat volgt, bouwt hierop verder.",
        riddle:
          "Logfragment:\n\nRQGHUJURQGV\n\nHint:\n1. Alles is drie stappen verschoven.\n2. Caesar",
        accepts: ["ondergronds"],
        unlockMessage: "Fragment 1 ontcijferd.",
        unlockWord: "ONDERGRONDS",
      },
      {
        day: 2,
        headline: "Dag 2 — De spiegel",
        kind: "riddle",
        riddle: "Logfragment:\n\nNVGIL\n\nHint:\n1. Kijk ernaar zoals in een spiegel.\n2. Atbash",
        accepts: ["metro"],
        unlockMessage: "Fragment 2 ontcijferd.",
        unlockWord: "METRO",
      },
      {
        day: 3,
        headline: "Dag 3 — Machine en intentie",
        kind: "multi",
        intro: "Twee fragmenten op één dag: eerst de machine, dan de intentie.",
        steps: [
          {
            riddle:
              "A. DE MACHINE\n\nLogfragment:\n\n76 73 74 78\n\nHint:\n1. Machines spreken in cijfers.\n2. ASCII",
            accepts: ["lijn"],
          },
          {
            riddle:
              "B. DE INTENTIE\n\nLogfragment:\n\nDDQYDO\n\nHint:\n1. Niet alles verandert. Soms gewoon dezelfde stap opnieuw.\n2. Caesar",
            accepts: ["aanval"],
          },
        ],
        unlockMessage: "Beide stukken van dag 3 kloppen.",
        unlockWord: "LIJN · AANVAL",
      },
      {
        day: 4,
        headline: "Dag 4 — De sleutel",
        kind: "riddle",
        riddle:
          "Logfragment:\n\nELFHPLVFK\n\nHint:\n1. De sleutel verandert niets… behalve je perspectief.\n2. Caesar",
        accepts: ["chemisch", "chemische"],
        unlockMessage: "Fragment 4 ontcijferd.",
        unlockWord: "CHEMISCH",
      },
      {
        day: 5,
        headline: "Dag 5 — Tijd",
        kind: "riddle",
        riddle: "Logfragment:\n\n13:37\n\nHint:\nSoms is tijd gewoon tijd.",
        accepts: ["13:37", "13 37", "1337"],
        unlockMessage: "Het moment staat vast.",
        unlockWord: "13:37",
      },
      {
        day: 6,
        headline: "Dag 6 — De samenvoeging",
        kind: "multi",
        intro:
          "Logfragment: ZET ALLES OP ZIJN PLAATS.\n\nGebruik je antwoorden uit de eerdere dagen. Drie afzonderlijke invoervelden — waar, hoe, wanneer.",
        steps: [
          {
            riddle:
              "Deel 1 — WAAR (ondergronds vervoer):\n\nCombineer ONDERGRONDS + METRO + LIJN tot één zin, zoals in het log (ondergrondse metrolijn).",
            accepts: [
              "ondergrondse metrolijn",
              "ondergronds metrolijn",
              "ondergrondse metro lijn",
            ],
          },
          {
            riddle:
              "Deel 2 — HOE:\n\nCombineer tot de chemische aanval (zoals voorspeld in het log).",
            accepts: ["chemische aanval", "aanval chemisch", "chemische aanvallen"],
          },
          {
            riddle: "Deel 3 — WANNEER:\n\nHet tijdstip uit dag 5.",
            accepts: ["13:37", "13 37", "1337"],
          },
        ],
        unlockMessage: "Het log is compleet. Je krijgt nu de finale beslissing.",
        unlockWord: "FINALE",
      },
    ],
    finaleChoice: {
      intro: DICTATOR_FINALE_INTRO,
      help: {
        label: "HELPEN",
        xp: 1500,
        epilogue: DICTATOR_EPILOGUE_HELP,
      },
      stop: {
        label: "STOPPEN",
        xp: 750,
        epilogue: DICTATOR_EPILOGUE_STOP,
      },
      closingThought: DICTATOR_CLOSING_THOUGHT,
    },
  };
}
