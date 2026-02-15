/**
 * NEUROHQ – Sentiment: herkennen van negatieve en positieve uitingen/emoties.
 * Rule-based; geen AI. Gebruikt om passend te reageren (niet escaleren bij negatief, bevestigen bij positief).
 */

export type Sentiment = "negative" | "positive" | "neutral";

/** Negatieve uitingen: frustratie, schelden, deflectie, "geen zin", etc. → rustig aanspreken, niet escaleren. */
const NEGATIVE_PHRASES: string[] = [
  "geen zin",
  "geen zin in",
  "boeie",
  "boeien",
  "maakt niet uit",
  "niks",
  "niks zin",
  "je moeder",
  "je vader",
  "wtf",
  "w t f",
  "omg",
  "o m g",
  "idgaf",
  "i don't give a fuck",
  "i dont give a fuck",
  "don't give a fuck",
  "dont give a fuck",
  "give a fuck",
  "fuck you",
  "fuck off",
  "fuck this",
  "fuck dat",
  "fuck it",
  "fuck de",
  "kut",
  "kutwerk",
  "kutzooi",
  "shit",
  "bullshit",
  "vervelend",
  "stom",
  "irritant",
  "sleur",
  "saai",
  "who cares",
  "whatever",
  "sodemi",
  "sodeju",
  "godver",
  "godverdomme",
  "tyfus",
  "kanker",
  "tering",
  "klote",
  "kloten",
  "zak",
  "idioot",
  "debiel",
  "sukkel",
  "laat me met rust",
  "rot op",
  "opdonderen",
  "flikker op",
  "krijg de",
  "krijg de tering",
  "krijg de pest",
  "val dood",
  "val neer",
  "kut leven",
  "haat dit",
  "haat het",
  "zie het niet zitten",
  "geen fuck",
  "geen reet",
  "geen reet aan",
  "kap met",
  "hou op",
  "stop met",
];

/** Woorden die alleen negatief tellen als ze prominent zijn (niet in "geen probleem"). */
const NEGATIVE_WORDS_STRONG: string[] = [
  "fuck", "kut", "shit", "tyfus", "kanker", "tering", "klote",
  "godver", "sodemi", "sodeju", "wtf", "idgaf", "rot op", "flikker",
];

/** Positieve uitingen: gelukt, klaar, goed, fijn, etc. → bevestigen en doorvragen. */
const POSITIVE_PHRASES: string[] = [
  "gelukt",
  "gelukt!",
  "klaar",
  "klaar!",
  "gedaan",
  "gedaan!",
  "af",
  "afgerond",
  "voltooid",
  "yes",
  "yes!",
  "ja!",
  "lekker",
  "lekker bezig",
  "fijn",
  "goed",
  "goed gedaan",
  "mooi",
  "mooi zo",
  "top",
  "super",
  "geweldig",
  "trots",
  "blij",
  "blij mee",
  "tevreden",
  "voelt goed",
  "gaat goed",
  "komt goed",
  "beter",
  "veel beter",
  "eerste stap gezet",
  "begonnen",
  "doorgezet",
  "lukt",
  "lukt me",
  "ga lukken",
  "kunnen we",
  "gaan we",
  "komt goed",
  "nice",
  "great",
  "awesome",
  "perfect",
  "love it",
  "lekker gewerkt",
  "goed bezig",
  "ja",
  "ok",
  "oke",
  "oké",
];

function normalizeForMatch(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ");
}

/**
 * Bepaalt sentiment van het bericht: negative, positive, of neutral.
 * Negative = frustratie, schelden, deflectie → bot reageert rustig, niet escalerend.
 * Positive = gelukt, goed, fijn → bot bevestigt en vraagt door.
 */
export function classifySentiment(message: string): Sentiment {
  const raw = message.trim();
  if (!raw) return "neutral";

  const normalized = normalizeForMatch(raw);
  const words = normalized.split(/\s+/).filter(Boolean);

  for (const phrase of NEGATIVE_PHRASES) {
    if (normalized.includes(phrase)) return "negative";
  }
  for (const word of NEGATIVE_WORDS_STRONG) {
    if (words.includes(word) || normalized === word) return "negative";
  }
  if (raw.length <= 2 && !/^\d+$/.test(raw) && !["ja", "ok", "nee"].includes(normalized)) {
    return "negative";
  }

  for (const phrase of POSITIVE_PHRASES) {
    if (normalized.includes(phrase)) return "positive";
  }

  return "neutral";
}
