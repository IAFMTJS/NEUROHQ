import type { QuestCampaignContent } from "@/lib/quests/types";

/** Production default: 10-day Katsuo-ji journey (admin can override JSON in DB). */
export function getDefaultKatsuoQuestContent(): QuestCampaignContent {
  return {
    version: 1,
    storyEpigraph: "Alleen wie de weg van discipline volgt, bereikt de plaats van overwinning.",
    days: [
      {
        day: 1,
        headline: "Dag 1 — Continent",
        kind: "paintings",
        intro: "In elk schilderij zit één letter verborgen. Welk continent bedoelen ze samen?",
        storyLine: "Japan ligt in het oosten — maar eerst het grotere geheel.",
        paintings: [
          { title: "Ochtendmist", letter: "A", caption: "Het begin van de alfabetische reis." },
          { title: "Zuiver water", letter: "Z", caption: "Waar rivieren ontmoeten." },
          { title: "Tempelpoort", letter: "I", caption: "Een slanke streep van licht." },
          { title: "Rijstveld", letter: "E", caption: "De horizon ademt." },
        ],
        accepts: ["azie", "asia", "azië"],
        unlockMessage: "De reis begint in het oosten…",
        unlockWord: "AZIË",
      },
      {
        day: 2,
        headline: "Dag 2 — Kernwaarde",
        kind: "riddle",
        riddle: "Ik buig zonder te breken.\nIk toon kracht door stilte.",
        accepts: ["respect", "respects"],
        unlockMessage: "Woord van de dag: EER.",
        unlockWord: "EER",
      },
      {
        day: 3,
        headline: "Dag 3 — Religie",
        kind: "riddle",
        riddle: "Ik aanbid geen god, maar vele geesten.\nIk leef in natuur, niet in boeken.",
        accepts: ["shinto", "shintoisme", "shintoïsme", "shintoism"],
        unlockMessage: "Woord van de dag: TRADITIE.",
        unlockWord: "TRADITIE",
      },
      {
        day: 4,
        headline: "Dag 4 — Land",
        kind: "riddle",
        riddle: "Mijn eer is mijn leven.\nMijn zwaard spreekt voor mij.",
        accepts: ["japan"],
        unlockMessage: "Woord van de dag: LAND VAN DE ZON.",
        unlockWord: "LAND VAN DE ZON",
      },
      {
        day: 5,
        headline: "Dag 5 — Stad (via gerecht)",
        kind: "multi",
        intro: "Eerst het gerecht, dan de stad.",
        steps: [
          {
            riddle: "Rond, heet en uit de straat geboren.\nMijn hart komt uit de zee.",
            accepts: ["takoyaki"],
          },
          {
            riddle: "Waar vind je mij het meest?",
            accepts: ["osaka"],
          },
        ],
        unlockMessage: "Woord van de dag: STAD.",
        unlockWord: "STAD",
      },
      {
        day: 6,
        headline: "Dag 6 — Richting",
        kind: "riddle",
        riddle: "Ik ben geen plaats, maar ik breng je ernaartoe.\nZonder mij ben je verloren.",
        accepts: ["kompas", "compass"],
        unlockMessage: "Woord van de dag: NOORD.",
        unlockWord: "NOORD",
      },
      {
        day: 7,
        headline: "Dag 7 — Visuele clue",
        kind: "riddle",
        riddle: "Ik val, maar sta altijd weer op.",
        accepts: ["daruma"],
        unlockMessage: "Woord van de dag: VOLHARDING.",
        unlockWord: "VOLHARDING",
      },
      {
        day: 8,
        headline: "Dag 8 — Type locatie",
        kind: "riddle",
        riddle:
          "Ik ben geen huis, maar wel een plaats van rust.\nMensen komen hier niet om te wonen, maar om te worden.",
        accepts: ["tempel", "temple"],
        unlockMessage: "Woord van de dag: PLAATS.",
        unlockWord: "PLAATS",
      },
      {
        day: 9,
        headline: "Dag 9 — Betekenis",
        kind: "riddle",
        intro: "Je hebt gezien: respect, traditie, volharding, tempel, Japan, Osaka.",
        riddle:
          "Welke plek staat symbool voor overwinning door doorzetting?\n(Gebruik de naam van de tempel, of de bekende omschrijving.)",
        accepts: [
          "katsuo-ji",
          "katsuoji",
          "katsuo ji",
          "tempel van overwinning",
          "tempel der overwinning",
          "winning temple",
          "temple of victory",
        ],
        unlockMessage: "De exacte locatie ontbreekt nog…",
        unlockWord: "KATSUO-JI",
      },
      {
        day: 10,
        headline: "Dag 10 — Finale",
        kind: "coords",
        riddle: "Je kent de plaats.\nAlleen wie exact is, bereikt ze.\nVoer de coördinaten in (breedtegraad, lengtegraad).",
        acceptCoords: { lat: 34.865736, lng: 135.491608, epsilon: 0.004 },
        unlockMessage: "Je bent gearriveerd.",
        unlockWord: "34.865736, 135.491608",
      },
    ],
  };
}
