/**
 * Adds scheduling + light coaching fields to lib/protocols-seed-catalog.json tasks
 * (catalog stubs ship without preferred_days / frequency_note).
 *
 * Usage: node scripts/enrich-protocol-catalog-scheduling.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..", "lib", "protocols-seed-catalog.json");

const WHY_KERN =
  "De kernsessie levert het meeste trainingsvolume — plan die op je scherpste momenten in de week.";
const WHY_MICRO =
  "Korte reflectie verankert wat werkte (of niet) voordat je naar de volgende week gaat.";
const MICRO_KERN = [
  "Zet een timer op de gekozen tier-duur",
  "Werk aan één onderwerp; geen multitask",
  "Sluit af met één zin: wat is er concreet gebeurd?",
];
const MICRO_REFLECT = [
  "2 minuten reset (adem / weg van scherm)",
  "Noteer: wat werkte vs. wat stroef voelde",
  "Noteer één aanpassing voor je volgende kernsessie",
];

const data = JSON.parse(readFileSync(root, "utf8"));

for (const proto of data) {
  const def = proto.definition;
  if (!def?.weeks) continue;
  for (const week of def.weeks) {
    if (!Array.isArray(week.tasks)) continue;
    if (!week.week_intent) {
      week.week_intent = `Week ${week.week_index}: hetzelfde weekritme vasthouden en één klein stapje scherper dan vorige week.`;
    }
    week.tasks.forEach((task, ti) => {
      if (ti === 0) {
        if (!task.frequency_note) task.frequency_note = "1× deze week; begin van de week (ma–wo) aanbevolen";
        if (!task.preferred_days) task.preferred_days = [1, 2, 3];
        if (!task.why_it_matters) task.why_it_matters = WHY_KERN;
        if (!task.micro_actions?.length) task.micro_actions = [...MICRO_KERN];
      } else if (ti === 1) {
        if (!task.frequency_note) task.frequency_note = "1× deze week; einde week (do–zo) aanbevolen";
        if (!task.preferred_days) task.preferred_days = [4, 5, 6, 7];
        if (!task.why_it_matters) task.why_it_matters = WHY_MICRO;
        if (!task.micro_actions?.length) task.micro_actions = [...MICRO_REFLECT];
      } else {
        if (!task.frequency_note) task.frequency_note = "1× deze week; flex binnen de week";
        if (!task.preferred_days) task.preferred_days = [1, 2, 3, 4, 5];
        if (!task.why_it_matters) task.why_it_matters = "Deze stap houdt momentum in het traject.";
      }
    });
  }
}

writeFileSync(root, `${JSON.stringify(data, null, 2)}\n`, "utf8");
console.log("Updated", root);
