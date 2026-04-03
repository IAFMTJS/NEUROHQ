"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updatePlayProfileDocument } from "@/app/actions/play-profile";
import { mergePlayProfileDataJson } from "@/app/actions/play-deck";
import type {
  PlayProfileDocument,
  PlayEnergyRecharge,
  PlayChallengeAppetite,
  GroceryShopStyle,
  PlayProfileDataV1,
} from "@/types/play-profile.types";

const FUN_STYLE_OPTIONS: { id: string; label: string }[] = [
  { id: "music", label: "Muziek" },
  { id: "games", label: "Games (video)" },
  { id: "boardgames", label: "Bordspellen" },
  { id: "outdoors", label: "Buiten" },
  { id: "creative", label: "Creatief / visueel" },
  { id: "writing", label: "Schrijven / journal" },
  { id: "photography", label: "Fotografie" },
  { id: "podcasts", label: "Podcasts / audio" },
  { id: "cooking", label: "Koken / bakken" },
  { id: "reading", label: "Lezen" },
  { id: "sports", label: "Sport / bewegen" },
  { id: "dancing", label: "Dansen" },
  { id: "social_light", label: "Lichte sociale dingen" },
  { id: "shopping", label: "Boodschappen / shops" },
  { id: "pets", label: "Huisdieren" },
  { id: "film", label: "Film / series" },
  { id: "crafting", label: "Knutselen / craft" },
  { id: "diy", label: "DIY / kleine klus" },
  { id: "puzzles", label: "Puzzels / brein" },
  { id: "nature", label: "Natuur" },
  { id: "learning", label: "Leren voor fun" },
  { id: "competitive", label: "Competitief" },
  { id: "chill", label: "Chill / zacht" },
  { id: "silly", label: "Flauw / absurd mag" },
  { id: "wholesome", label: "Wholesome" },
  { id: "manga", label: "Manga" },
  { id: "anime", label: "Anime" },
  { id: "comics", label: "Comics / graphic novels" },
  { id: "decorating", label: "Decoreren / interieur" },
  { id: "online_shopping", label: "Online shoppen / wishlists" },
  { id: "philosophy", label: "Filosofie / grote vragen" },
  { id: "true_crime", label: "True crime (podcast / docu)" },
  { id: "kdrama", label: "K-drama / Aziatische series" },
  { id: "documentaries", label: "Documentaires" },
  { id: "thrifting", label: "Vintage / tweedehands / snuffelen" },
  { id: "astronomy", label: "Sterren / ruimte / astronomie" },
  { id: "history", label: "Geschiedenis" },
];

type PickKey = keyof Pick<
  PlayProfileDataV1,
  | "energy_recharge"
  | "challenge_appetite"
  | "grocery_shop_style"
  | "morning_energy"
  | "work_context"
  | "living_situation"
  | "commute_band"
  | "social_battery"
  | "friends_rhythm"
  | "screen_relationship"
  | "music_habit"
  | "movement_baseline"
  | "outdoor_access"
  | "cooking_vibe"
  | "humor_vibe"
>;

const PICK_KEYS: PickKey[] = [
  "energy_recharge",
  "challenge_appetite",
  "grocery_shop_style",
  "morning_energy",
  "work_context",
  "living_situation",
  "commute_band",
  "social_battery",
  "friends_rhythm",
  "screen_relationship",
  "music_habit",
  "movement_baseline",
  "outdoor_access",
  "cooking_vibe",
  "humor_vibe",
];

type TextKey = keyof Pick<
  PlayProfileDataV1,
  | "about_you"
  | "daily_life"
  | "favorites"
  | "weekend_vibes"
  | "micro_delights"
  | "play_hard_nos"
  | "sensory_notes"
  | "indoor_hobbies"
  | "games_and_platforms"
  | "travel_daydream"
  | "animals_and_plants"
  | "learning_for_fun"
  | "ideal_microbreak"
>;

const TEXT_KEYS: TextKey[] = [
  "about_you",
  "daily_life",
  "favorites",
  "weekend_vibes",
  "micro_delights",
  "play_hard_nos",
  "sensory_notes",
  "indoor_hobbies",
  "games_and_platforms",
  "travel_daydream",
  "animals_and_plants",
  "learning_for_fun",
  "ideal_microbreak",
];

type Props = {
  initialDocument: PlayProfileDocument;
};

function asStr(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function asNum(v: unknown): string {
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return "";
}

function initPicks(d: PlayProfileDataV1): Record<PickKey, string> {
  return {
    energy_recharge: asStr(d.energy_recharge),
    challenge_appetite: asStr(d.challenge_appetite),
    grocery_shop_style: asStr(d.grocery_shop_style),
    morning_energy: asStr(d.morning_energy),
    work_context: asStr(d.work_context),
    living_situation: asStr(d.living_situation),
    commute_band: asStr(d.commute_band),
    social_battery: asStr(d.social_battery),
    friends_rhythm: asStr(d.friends_rhythm),
    screen_relationship: asStr(d.screen_relationship),
    music_habit: asStr(d.music_habit),
    movement_baseline: asStr(d.movement_baseline),
    outdoor_access: asStr(d.outdoor_access),
    cooking_vibe: asStr(d.cooking_vibe),
    humor_vibe: asStr(d.humor_vibe),
  };
}

function initTexts(d: PlayProfileDataV1): Record<TextKey, string> {
  return {
    about_you: asStr(d.about_you),
    daily_life: asStr(d.daily_life),
    favorites: asStr(d.favorites),
    weekend_vibes: asStr(d.weekend_vibes),
    micro_delights: asStr(d.micro_delights),
    play_hard_nos: asStr(d.play_hard_nos),
    sensory_notes: asStr(d.sensory_notes),
    indoor_hobbies: asStr(d.indoor_hobbies),
    games_and_platforms: asStr(d.games_and_platforms),
    travel_daydream: asStr(d.travel_daydream),
    animals_and_plants: asStr(d.animals_and_plants),
    learning_for_fun: asStr(d.learning_for_fun),
    ideal_microbreak: asStr(d.ideal_microbreak),
  };
}

/** Donkere controls: geen witte browser-default; `color-scheme: dark` voor select/options. */
const FORM_ROOT = "[color-scheme:dark] space-y-5";

const INPUT_BASE =
  "w-full rounded-lg border border-white/[0.1] bg-[rgb(5,10,20)] px-3 py-2.5 text-sm text-[var(--text-primary)] " +
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] placeholder:text-neutral-500 " +
  "outline-none transition focus-visible:border-[rgba(var(--mode-rgb),0.5)] focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.22)] " +
  "disabled:opacity-50";

const SELECT_EXTRA =
  "cursor-pointer appearance-none bg-[rgb(5,10,20)] bg-[length:14px] bg-[position:right_0.7rem_center] bg-no-repeat pr-10 " +
  "[background-image:url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')]";

const LABEL = "mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]";

function DetailsCard({
  title,
  subtitle,
  defaultOpen = false,
  children,
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="group overflow-hidden rounded-xl border border-white/[0.08] bg-[rgba(3,8,18,0.55)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
    >
      <summary className="cursor-pointer list-none px-4 py-3 [&::-webkit-details-marker]:hidden">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[var(--text-primary)]">{title}</p>
            {subtitle ? <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">{subtitle}</p> : null}
          </div>
          <span className="mt-0.5 shrink-0 text-[10px] text-neutral-500 transition group-open:rotate-180" aria-hidden>
            ▼
          </span>
        </div>
      </summary>
      <div className="border-t border-white/[0.06] px-4 py-4">{children}</div>
    </details>
  );
}

export function ProfileEnginePlayDeckTab({ initialDocument }: Props) {
  const router = useRouter();
  const d = initialDocument.data;
  const [picks, setPicks] = useState(() => initPicks(d));
  const [texts, setTexts] = useState(() => initTexts(d));
  const [funStyles, setFunStyles] = useState<string[]>(
    Array.isArray(d.fun_styles) ? d.fun_styles.filter((x): x is string => typeof x === "string") : []
  );
  const [avoidText, setAvoidText] = useState(
    Array.isArray(d.avoid_topics) ? d.avoid_topics.filter((x): x is string => typeof x === "string").join(", ") : ""
  );
  const [weekdayMin, setWeekdayMin] = useState(asNum(d.weekday_play_minutes));
  const [weekendMin, setWeekendMin] = useState(asNum(d.weekend_play_minutes));
  const [extraJson, setExtraJson] = useState(() => {
    const ex = d.extra;
    if (ex && typeof ex === "object" && !Array.isArray(ex)) {
      try {
        return JSON.stringify(ex, null, 2);
      } catch {
        return "{}";
      }
    }
    return "{}";
  });
  const [advancedJson, setAdvancedJson] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function setPick(key: PickKey, value: string) {
    setPicks((prev) => ({ ...prev, [key]: value }));
  }

  function setText(key: TextKey, value: string) {
    setTexts((prev) => ({ ...prev, [key]: value }));
  }

  function toggleStyle(id: string) {
    setFunStyles((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function buildDocument(): PlayProfileDocument {
    let extra: Record<string, unknown> = {};
    try {
      const parsed = JSON.parse(extraJson.trim() || "{}");
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) extra = parsed as Record<string, unknown>;
    } catch {
      extra = {};
    }

    const avoid_topics = avoidText
      .split(/[,;\n]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    const pickPartial: Partial<PlayProfileDataV1> = {};
    for (const key of PICK_KEYS) {
      const v = picks[key].trim();
      if (v) (pickPartial as Record<string, string>)[key] = v;
    }

    const textPartial: Partial<PlayProfileDataV1> = {};
    for (const key of TEXT_KEYS) {
      const v = texts[key].trim();
      if (v) (textPartial as Record<string, string>)[key] = v;
    }

    const data: PlayProfileDocument["data"] = {
      ...initialDocument.data,
      ...pickPartial,
      ...textPartial,
      fun_styles: funStyles.length ? funStyles : undefined,
      avoid_topics: avoid_topics.length ? avoid_topics : undefined,
      weekday_play_minutes: weekdayMin.trim() ? parseInt(weekdayMin, 10) || undefined : undefined,
      weekend_play_minutes: weekendMin.trim() ? parseInt(weekendMin, 10) || undefined : undefined,
      extra: Object.keys(extra).length ? extra : undefined,
    };

    return { schemaVersion: 1, data };
  }

  function save() {
    setMsg(null);
    setErr(null);
    startTransition(async () => {
      const r = await updatePlayProfileDocument(buildDocument());
      if (r.ok) {
        setMsg("Opgeslagen.");
        router.refresh();
      } else setErr(r.error);
    });
  }

  function mergeAdvanced(replace: boolean) {
    setMsg(null);
    setErr(null);
    startTransition(async () => {
      const r = await mergePlayProfileDataJson({ jsonText: advancedJson, replace });
      if (r.ok) {
        setMsg(replace ? "JSON vervangen." : "JSON samengevoegd.");
        router.refresh();
      } else setErr(r.error);
    });
  }

  const grid2 = "grid gap-4 sm:grid-cols-2";

  return (
    <div className={FORM_ROOT}>
      <section className="rounded-xl border border-white/[0.08] bg-[rgba(4,10,22,0.45)] p-4 sm:p-5">
        <h2 className="text-base font-bold text-[var(--text-primary)]">Play deck — uitgebreid profiel</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
          Vul gerust veel in: dit voedt alleen <strong className="font-medium text-[var(--text-secondary)]">optionele</strong> play-ideeën (plezier,
          ontspanning, lichte challenges). Geen therapie-frame. Hoe rijker je profiel, hoe passender de suggesties. Velden zijn bewust donker
          gehouden zodat ze bij de rest van HQ passen.
        </p>
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Op{" "}
          <Link href="/tasks" className="text-[var(--accent-focus)] underline-offset-2 hover:underline">
            Missions
          </Link>{" "}
          → knop <strong className="font-medium">Play deck</strong>.
        </p>
      </section>

      <DetailsCard title="Basis & tijd" subtitle="Energie, uitdaging, boodschappen, ruimte op je dag." defaultOpen>
        <div className={grid2}>
          <div>
            <label className={LABEL}>Ontspanning voelt voor jou het meest als</label>
            <select
              value={picks.energy_recharge}
              onChange={(e) => setPick("energy_recharge", e.target.value)}
              className={`${INPUT_BASE} ${SELECT_EXTRA}`}
            >
              <option value="">— kies —</option>
              <option value="quiet">Rustig / alleen</option>
              <option value="active">Actief / bewegen</option>
              <option value="social">Met mensen</option>
              <option value="mixed">Mix</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>Zin in uitdaging vandaag (in play-ideeën)</label>
            <select
              value={picks.challenge_appetite}
              onChange={(e) => setPick("challenge_appetite", e.target.value)}
              className={`${INPUT_BASE} ${SELECT_EXTRA}`}
            >
              <option value="">— kies —</option>
              <option value="low">Laag (zacht)</option>
              <option value="medium">Middel</option>
              <option value="high">Hoog (pittiger)</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>Boodschappen-patroon</label>
            <select
              value={picks.grocery_shop_style}
              onChange={(e) => setPick("grocery_shop_style", e.target.value)}
              className={`${INPUT_BASE} ${SELECT_EXTRA}`}
            >
              <option value="">— kies —</option>
              <option value="big_rare">Grote ritten, minder vaak</option>
              <option value="small_often">Kleine ritten, vaker</option>
              <option value="mixed">Mix</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>Chronotype (ruw)</label>
            <select
              value={picks.morning_energy}
              onChange={(e) => setPick("morning_energy", e.target.value)}
              className={`${INPUT_BASE} ${SELECT_EXTRA}`}
            >
              <option value="">— kies —</option>
              <option value="early_bird">Ochtendmens</option>
              <option value="steady">Redelijk stabiel</option>
              <option value="night_owl">Avond/nacht</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>Play-ruimte doordeweeks (minuten, indicatie)</label>
            <input
              type="number"
              min={0}
              autoComplete="off"
              value={weekdayMin}
              onChange={(e) => setWeekdayMin(e.target.value)}
              className={INPUT_BASE}
              placeholder="bv. 20"
            />
          </div>
          <div>
            <label className={LABEL}>Weekend (minuten)</label>
            <input
              type="number"
              min={0}
              autoComplete="off"
              value={weekendMin}
              onChange={(e) => setWeekendMin(e.target.value)}
              className={INPUT_BASE}
              placeholder="bv. 90"
            />
          </div>
        </div>
      </DetailsCard>

      <DetailsCard title="Werk, thuis, onderweg" subtitle="Context helpt om realistische micro-ideeën te kiezen.">
        <div className={grid2}>
          <div>
            <label className={LABEL}>Werk / studie</label>
            <select
              value={picks.work_context}
              onChange={(e) => setPick("work_context", e.target.value)}
              className={`${INPUT_BASE} ${SELECT_EXTRA}`}
            >
              <option value="">— kies —</option>
              <option value="home">Voornamelijk thuis</option>
              <option value="office">Op kantoor / locatie</option>
              <option value="hybrid">Mix</option>
              <option value="student">Student</option>
              <option value="free">Anders / variabel</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>Wonen</label>
            <select
              value={picks.living_situation}
              onChange={(e) => setPick("living_situation", e.target.value)}
              className={`${INPUT_BASE} ${SELECT_EXTRA}`}
            >
              <option value="">— kies —</option>
              <option value="alone">Alleen</option>
              <option value="partner">Met partner</option>
              <option value="family">Gezin / familie</option>
              <option value="housemates">Huisgenoten</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>Pendel (indicatie)</label>
            <select
              value={picks.commute_band}
              onChange={(e) => setPick("commute_band", e.target.value)}
              className={`${INPUT_BASE} ${SELECT_EXTRA}`}
            >
              <option value="">— kies —</option>
              <option value="none">Nauwelijks</option>
              <option value="short">Kort</option>
              <option value="medium">Medium</option>
              <option value="long">Lang</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>Buiten / groen in de buurt</label>
            <select
              value={picks.outdoor_access}
              onChange={(e) => setPick("outdoor_access", e.target.value)}
              className={`${INPUT_BASE} ${SELECT_EXTRA}`}
            >
              <option value="">— kies —</option>
              <option value="city">Stad</option>
              <option value="suburbs">Rand / voorstad</option>
              <option value="green_close">Groen dichtbij</option>
              <option value="rural">Landelijk</option>
            </select>
          </div>
        </div>
      </DetailsCard>

      <DetailsCard title="Sociaal & schermen" subtitle="Geen diagnose — alleen smaak voor suggesties.">
        <div className={grid2}>
          <div>
            <label className={LABEL}>Sociale batterij (hoe je jezelf ziet)</label>
            <select
              value={picks.social_battery}
              onChange={(e) => setPick("social_battery", e.target.value)}
              className={`${INPUT_BASE} ${SELECT_EXTRA}`}
            >
              <option value="">— kies —</option>
              <option value="introvert">Meer introvert</option>
              <option value="ambivert">Tussenin</option>
              <option value="extravert">Meer extravert</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>Contact ritme vrienden/kern</label>
            <select
              value={picks.friends_rhythm}
              onChange={(e) => setPick("friends_rhythm", e.target.value)}
              className={`${INPUT_BASE} ${SELECT_EXTRA}`}
            >
              <option value="">— kies —</option>
              <option value="daily">Vaak / dagelijks</option>
              <option value="weekly">Wekelijks</option>
              <option value="monthly">Maandelijks</option>
              <option value="sparse">Zelden maar oké</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>Na een lange dag: schermen</label>
            <select
              value={picks.screen_relationship}
              onChange={(e) => setPick("screen_relationship", e.target.value)}
              className={`${INPUT_BASE} ${SELECT_EXTRA}`}
            >
              <option value="">— kies —</option>
              <option value="enjoy">Nog steeds oké / fijn</option>
              <option value="tired">Liever weg</option>
              <option value="mixed">Wisselend</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>Muziek in je leven</label>
            <select
              value={picks.music_habit}
              onChange={(e) => setPick("music_habit", e.target.value)}
              className={`${INPUT_BASE} ${SELECT_EXTRA}`}
            >
              <option value="">— kies —</option>
              <option value="always_bg">Vaak op de achtergrond</option>
              <option value="sometimes">Soms</option>
              <option value="active_listen">Vooral actief luisteren</option>
              <option value="rare">Zelden</option>
            </select>
          </div>
        </div>
      </DetailsCard>

      <DetailsCard title="Bewegen, koken, humor" subtitle="Voor zachte of pittigere play-suggesties.">
        <div className={grid2}>
          <div>
            <label className={LABEL}>Bewegingsbasis (subjectief)</label>
            <select
              value={picks.movement_baseline}
              onChange={(e) => setPick("movement_baseline", e.target.value)}
              className={`${INPUT_BASE} ${SELECT_EXTRA}`}
            >
              <option value="">— kies —</option>
              <option value="low">Laag / rustig lichaam</option>
              <option value="medium">Middel</option>
              <option value="high">Graag actief</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>Koken / keuken</label>
            <select
              value={picks.cooking_vibe}
              onChange={(e) => setPick("cooking_vibe", e.target.value)}
              className={`${INPUT_BASE} ${SELECT_EXTRA}`}
            >
              <option value="">— kies —</option>
              <option value="minimal">Minimaal nodig</option>
              <option value="simple">Simpel maar oké</option>
              <option value="enjoy">Leuk om te doen</option>
              <option value="love_it">Eén van mijn hobbies</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={LABEL}>Humor voor play-ideeën</label>
            <select
              value={picks.humor_vibe}
              onChange={(e) => setPick("humor_vibe", e.target.value)}
              className={`${INPUT_BASE} ${SELECT_EXTRA}`}
            >
              <option value="">— kies —</option>
              <option value="silly">Licht / flauw / absurd mag</option>
              <option value="dry">Droog / subtiel</option>
              <option value="wholesome">Wholesome / warm</option>
              <option value="any">Maakt me niet uit</option>
            </select>
          </div>
        </div>
      </DetailsCard>

      <DetailsCard title="Stijlen & filters" subtitle="Meerdere tags + harde vermijding (ook in titels van suggesties).">
        <div>
          <span className={LABEL}>Welke play-stijlen wil je vaker zien?</span>
          <div className="flex flex-wrap gap-2">
            {FUN_STYLE_OPTIONS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => toggleStyle(id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  funStyles.includes(id)
                    ? "border-[rgba(var(--mode-rgb),0.45)] bg-[rgba(var(--mode-rgb-deep),0.25)] text-[var(--accent-focus)]"
                    : "border-white/[0.1] bg-[rgb(5,10,20)] text-[var(--text-muted)] hover:border-white/[0.18] hover:text-[var(--text-primary)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-5">
          <label className={LABEL}>Korte vermijdings-tags (komma)</label>
          <input
            type="text"
            autoComplete="off"
            value={avoidText}
            onChange={(e) => setAvoidText(e.target.value)}
            className={INPUT_BASE}
            placeholder="bv. alcohol, dating, competitieve sport"
          />
        </div>
      </DetailsCard>

      <DetailsCard
        title="Lange antwoorden — het belangrijkste voor matching"
        subtitle="Geen limiet qua lengte; schrijf zo uitgebreid als je wilt."
        defaultOpen
      >
        <div className="space-y-4">
          <div>
            <label className={LABEL}>Over jou — humor, waarden, wat je energie geeft</label>
            <textarea
              value={texts.about_you}
              onChange={(e) => setText("about_you", e.target.value)}
              rows={7}
              className={`${INPUT_BASE} min-h-[140px] resize-y`}
              autoComplete="off"
            />
          </div>
          <div>
            <label className={LABEL}>Dagelijks leven — ritme, klussen, werk/thuis, sociale realiteit</label>
            <textarea
              value={texts.daily_life}
              onChange={(e) => setText("daily_life", e.target.value)}
              rows={7}
              className={`${INPUT_BASE} min-h-[140px] resize-y`}
              autoComplete="off"
            />
          </div>
          <div>
            <label className={LABEL}>Favorieten — games, series, sport, artiesten, merken, communities</label>
            <textarea
              value={texts.favorites}
              onChange={(e) => setText("favorites", e.target.value)}
              rows={6}
              className={`${INPUT_BASE} min-h-[120px] resize-y`}
              autoComplete="off"
            />
          </div>
          <div>
            <label className={LABEL}>Weekend & vrije tijd — wat zie je graag, wat vermijd je</label>
            <textarea
              value={texts.weekend_vibes}
              onChange={(e) => setText("weekend_vibes", e.target.value)}
              rows={5}
              className={`${INPUT_BASE} min-h-[100px] resize-y`}
              autoComplete="off"
            />
          </div>
          <div>
            <label className={LABEL}>Micro-blijmakers — kleine dingen die je direct zachter maken</label>
            <textarea
              value={texts.micro_delights}
              onChange={(e) => setText("micro_delights", e.target.value)}
              rows={4}
              className={`${INPUT_BASE} min-h-[88px] resize-y`}
              autoComplete="off"
            />
          </div>
          <div>
            <label className={LABEL}>Ideale micro-pauze (2–7 min) — beschrijf er een paar</label>
            <textarea
              value={texts.ideal_microbreak}
              onChange={(e) => setText("ideal_microbreak", e.target.value)}
              rows={4}
              className={`${INPUT_BASE} min-h-[88px] resize-y`}
              autoComplete="off"
            />
          </div>
        </div>
      </DetailsCard>

      <DetailsCard title="Dieper profiel (optioneel)" subtitle="Games, dieren, reizen, leren, zintuigen — alles helpt.">
        <div className="space-y-4">
          <div>
            <label className={LABEL}>Games — platforms, genres, co-op of solo, wat je níet wilt</label>
            <textarea
              value={texts.games_and_platforms}
              onChange={(e) => setText("games_and_platforms", e.target.value)}
              rows={5}
              className={`${INPUT_BASE} min-h-[100px] resize-y`}
              autoComplete="off"
            />
          </div>
          <div>
            <label className={LABEL}>Binnen hobbies — verzamelen, plants, modelbouw, instruments…</label>
            <textarea
              value={texts.indoor_hobbies}
              onChange={(e) => setText("indoor_hobbies", e.target.value)}
              rows={5}
              className={`${INPUT_BASE} min-h-[100px] resize-y`}
              autoComplete="off"
            />
          </div>
          <div>
            <label className={LABEL}>Dieren & planten</label>
            <textarea
              value={texts.animals_and_plants}
              onChange={(e) => setText("animals_and_plants", e.target.value)}
              rows={4}
              className={`${INPUT_BASE} min-h-[88px] resize-y`}
              autoComplete="off"
            />
          </div>
          <div>
            <label className={LABEL}>Reizen & dagjes — steden, natuur, musea, bucket-ideeën</label>
            <textarea
              value={texts.travel_daydream}
              onChange={(e) => setText("travel_daydream", e.target.value)}
              rows={4}
              className={`${INPUT_BASE} min-h-[88px] resize-y`}
              autoComplete="off"
            />
          </div>
          <div>
            <label className={LABEL}>Leren voor fun — talen, trivia, skills, YouTube-kanalen</label>
            <textarea
              value={texts.learning_for_fun}
              onChange={(e) => setText("learning_for_fun", e.target.value)}
              rows={4}
              className={`${INPUT_BASE} min-h-[88px] resize-y`}
              autoComplete="off"
            />
          </div>
          <div>
            <label className={LABEL}>Zintuigen & drukte — geluid, licht, mensenmenigtes</label>
            <textarea
              value={texts.sensory_notes}
              onChange={(e) => setText("sensory_notes", e.target.value)}
              rows={4}
              className={`${INPUT_BASE} min-h-[88px] resize-y`}
              autoComplete="off"
            />
          </div>
          <div>
            <label className={LABEL}>
              Harde nee’s voor play-suggesties — woorden/zinnen die nooit in een voorstel mogen voorkomen (lang invullen mag)
            </label>
            <textarea
              value={texts.play_hard_nos}
              onChange={(e) => setText("play_hard_nos", e.target.value)}
              rows={4}
              className={`${INPUT_BASE} min-h-[88px] resize-y border-amber-500/25`}
              autoComplete="off"
              placeholder="Komma of nieuwe regel tussen items"
            />
          </div>
        </div>
      </DetailsCard>

      <DetailsCard title="JSON & geavanceerd" subtitle="Voor imports of eigen velden.">
        <div>
          <label className={LABEL}>Extra gestructureerde data (object JSON → data.extra)</label>
          <textarea
            value={extraJson}
            onChange={(e) => setExtraJson(e.target.value)}
            rows={8}
            className={`${INPUT_BASE} mt-1 min-h-[160px] font-mono text-xs`}
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        <div className="mt-4">
          <label className={LABEL}>Merge / vervang hele data-laag</label>
          <textarea
            value={advancedJson}
            onChange={(e) => setAdvancedJson(e.target.value)}
            rows={5}
            className={`${INPUT_BASE} mt-1 min-h-[120px] font-mono text-xs`}
            spellCheck={false}
            autoComplete="off"
            placeholder='{"eigen_veld": "waarde"}'
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => mergeAdvanced(false)}
              className="rounded-lg border border-white/[0.12] bg-[rgb(5,10,20)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-white/[0.06] disabled:opacity-50"
            >
              JSON samenvoegen
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => mergeAdvanced(true)}
              className="rounded-lg border border-amber-500/35 bg-[rgb(25,15,8)] px-3 py-2 text-xs font-semibold text-amber-200/95 hover:bg-amber-500/10 disabled:opacity-50"
            >
              Data volledig vervangen
            </button>
          </div>
        </div>
      </DetailsCard>

      {msg && <p className="text-sm text-emerald-400">{msg}</p>}
      {err && <p className="text-sm text-red-400">{err}</p>}

      <button
        type="button"
        disabled={pending}
        onClick={save}
        className="rounded-xl border border-[rgba(var(--mode-rgb),0.4)] bg-[rgba(var(--mode-rgb-deep),0.22)] px-5 py-3 text-sm font-semibold text-[var(--accent-focus)] hover:bg-[rgba(var(--mode-rgb-deep),0.3)] disabled:opacity-50"
      >
        {pending ? "Bezig…" : "Play-profiel opslaan"}
      </button>
    </div>
  );
}
