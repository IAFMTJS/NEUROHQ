"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updatePlayProfileDocument } from "@/app/actions/play-profile";
import { mergePlayProfileDataJson } from "@/app/actions/play-deck";
import type { PlayProfileDocument, PlayEnergyRecharge, PlayChallengeAppetite, GroceryShopStyle } from "@/types/play-profile.types";

const FUN_STYLE_OPTIONS: { id: string; label: string }[] = [
  { id: "music", label: "Muziek" },
  { id: "games", label: "Games" },
  { id: "outdoors", label: "Buiten" },
  { id: "creative", label: "Creatief" },
  { id: "cooking", label: "Koken / bakken" },
  { id: "reading", label: "Lezen" },
  { id: "sports", label: "Sport / bewegen" },
  { id: "social_light", label: "Lichte sociale dingen" },
  { id: "shopping", label: "Boodschappen / shops" },
  { id: "pets", label: "Huisdieren" },
  { id: "film", label: "Film / series" },
  { id: "crafting", label: "Knutselen / craft" },
  { id: "puzzles", label: "Puzzels" },
  { id: "nature", label: "Natuur" },
  { id: "competitive", label: "Competitief" },
  { id: "chill", label: "Chill / zacht" },
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

export function ProfileEnginePlayDeckTab({ initialDocument }: Props) {
  const router = useRouter();
  const d = initialDocument.data;
  const [energyRecharge, setEnergyRecharge] = useState<PlayEnergyRecharge | "">(asStr(d.energy_recharge) as PlayEnergyRecharge | "");
  const [challengeAppetite, setChallengeAppetite] = useState<PlayChallengeAppetite | "">(
    asStr(d.challenge_appetite) as PlayChallengeAppetite | ""
  );
  const [groceryStyle, setGroceryStyle] = useState<GroceryShopStyle>(asStr(d.grocery_shop_style) as GroceryShopStyle);
  const [funStyles, setFunStyles] = useState<string[]>(Array.isArray(d.fun_styles) ? d.fun_styles.filter((x): x is string => typeof x === "string") : []);
  const [avoidText, setAvoidText] = useState(
    Array.isArray(d.avoid_topics) ? d.avoid_topics.filter((x): x is string => typeof x === "string").join(", ") : ""
  );
  const [weekdayMin, setWeekdayMin] = useState(asNum(d.weekday_play_minutes));
  const [weekendMin, setWeekendMin] = useState(asNum(d.weekend_play_minutes));
  const [aboutYou, setAboutYou] = useState(asStr(d.about_you));
  const [dailyLife, setDailyLife] = useState(asStr(d.daily_life));
  const [favorites, setFavorites] = useState(asStr(d.favorites));
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

    const data: PlayProfileDocument["data"] = {
      ...initialDocument.data,
      energy_recharge: energyRecharge || undefined,
      challenge_appetite: challengeAppetite || undefined,
      grocery_shop_style: groceryStyle || undefined,
      fun_styles: funStyles.length ? funStyles : undefined,
      avoid_topics: avoid_topics.length ? avoid_topics : undefined,
      weekday_play_minutes: weekdayMin.trim() ? parseInt(weekdayMin, 10) || undefined : undefined,
      weekend_play_minutes: weekendMin.trim() ? parseInt(weekendMin, 10) || undefined : undefined,
      about_you: aboutYou.trim() || undefined,
      daily_life: dailyLife.trim() || undefined,
      favorites: favorites.trim() || undefined,
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

  const fieldClass =
    "w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)]/40 px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.35)]";
  const labelClass = "mb-1 block text-xs font-semibold text-[var(--text-secondary)]";

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[var(--card-border)]/80 bg-[var(--bg-surface)]/30 p-4 sm:p-5">
        <h2 className="text-base font-bold text-[var(--text-primary)]">Play deck</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
          Optioneel profiel voor <strong className="font-semibold text-[var(--text-secondary)]">leuke</strong>,{" "}
          <strong className="font-semibold text-[var(--text-secondary)]">ontspannende</strong> en{" "}
          <strong className="font-semibold text-[var(--text-secondary)]">lichte uitdaging</strong>-ideeën op Missions. Geen
          therapie of gedragsprogramma — alleen voorstellen die bij jou passen. Hoe meer je invult (ook lange teksten), hoe
          beter de match. JSONB kan groot: gebruik gerust uitgebreide notities.
        </p>
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Tip: op{" "}
          <Link href="/tasks" className="text-[var(--accent-focus)] underline-offset-2 hover:underline">
            Missions
          </Link>{" "}
          vind je <strong className="font-medium">Play deck</strong> om ideeën toe te voegen.
        </p>
      </section>

      <section className="rounded-xl border border-[var(--card-border)]/80 p-4 sm:p-5">
        <h3 className="text-sm font-bold text-[var(--text-primary)]">Snelle voorkeuren</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Ontspanning voelt voor jou het meest als</label>
            <select value={energyRecharge} onChange={(e) => setEnergyRecharge(e.target.value as PlayEnergyRecharge | "")} className={fieldClass}>
              <option value="">— kies —</option>
              <option value="quiet">Rustig / alleen</option>
              <option value="active">Actief / bewegen</option>
              <option value="social">Met mensen</option>
              <option value="mixed">Mix</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Zin in uitdaging</label>
            <select
              value={challengeAppetite}
              onChange={(e) => setChallengeAppetite(e.target.value as PlayChallengeAppetite | "")}
              className={fieldClass}
            >
              <option value="">— kies —</option>
              <option value="low">Laag (zacht)</option>
              <option value="medium">Middel</option>
              <option value="high">Hoog (pittiger)</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Boodschappen meestal</label>
            <select value={groceryStyle} onChange={(e) => setGroceryStyle(e.target.value as GroceryShopStyle)} className={fieldClass}>
              <option value="">— kies —</option>
              <option value="big_rare">Grote ritten, minder vaak</option>
              <option value="small_often">Kleine ritten, vaker</option>
              <option value="mixed">Mix</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Ruimte voor play op een doordeweekse dag (minuten, optioneel)</label>
            <input type="number" min={0} value={weekdayMin} onChange={(e) => setWeekdayMin(e.target.value)} className={fieldClass} placeholder="bv. 20" />
          </div>
          <div>
            <label className={labelClass}>Weekend (minuten, optioneel)</label>
            <input type="number" min={0} value={weekendMin} onChange={(e) => setWeekendMin(e.target.value)} className={fieldClass} placeholder="bv. 60" />
          </div>
        </div>

        <div className="mt-5">
          <span className={labelClass}>Interesses / stijlen (meerdere mogelijk)</span>
          <div className="flex flex-wrap gap-2">
            {FUN_STYLE_OPTIONS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => toggleStyle(id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  funStyles.includes(id)
                    ? "border-[rgba(var(--mode-rgb),0.4)] bg-[rgba(var(--mode-rgb-deep),0.2)] text-[var(--accent-focus)]"
                    : "border-[var(--card-border)] text-[var(--text-muted)] hover:border-[var(--card-border)]/80 hover:text-[var(--text-primary)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <label className={labelClass}>Onderwerpen in suggesties vermijden (komma-gescheiden)</label>
          <input
            type="text"
            value={avoidText}
            onChange={(e) => setAvoidText(e.target.value)}
            className={fieldClass}
            placeholder="bv. alcohol, dating apps, sport"
          />
        </div>
      </section>

      <section className="rounded-xl border border-[var(--card-border)]/80 p-4 sm:p-5">
        <h3 className="text-sm font-bold text-[var(--text-primary)]">Vertel meer (helpt matching)</h3>
        <div className="mt-4 space-y-4">
          <div>
            <label className={labelClass}>Over jou — hobbies, humor, wat je leuk vindt</label>
            <textarea value={aboutYou} onChange={(e) => setAboutYou(e.target.value)} rows={6} className={`${fieldClass} min-h-[120px] resize-y`} />
          </div>
          <div>
            <label className={labelClass}>Dagelijks leven — ritme, boodschappen, werk/thuis, sociaal</label>
            <textarea value={dailyLife} onChange={(e) => setDailyLife(e.target.value)} rows={6} className={`${fieldClass} min-h-[120px] resize-y`} />
          </div>
          <div>
            <label className={labelClass}>Favorieten — games, series, sportteams, instrumenten, merken…</label>
            <textarea value={favorites} onChange={(e) => setFavorites(e.target.value)} rows={5} className={`${fieldClass} min-h-[100px] resize-y`} />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--card-border)]/80 p-4 sm:p-5">
        <h3 className="text-sm font-bold text-[var(--text-primary)]">Extra gestructureerde data (JSON)</h3>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Eigen velden voor toekomstige vragenlijsten of imports. Wordt opgeslagen onder <code className="text-[var(--text-secondary)]">data.extra</code>.
        </p>
        <textarea value={extraJson} onChange={(e) => setExtraJson(e.target.value)} rows={8} className={`${fieldClass} mt-3 min-h-[160px] font-mono text-xs`} />
      </section>

      <section className="rounded-xl border border-[var(--card-border)]/80 p-4 sm:p-5">
        <h3 className="text-sm font-bold text-[var(--text-primary)]">Geavanceerd: JSON in heel profiel mergen</h3>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          <strong>Samenvoegen</strong>: top-level keys worden gemengd met bestaande <code className="text-[var(--text-secondary)]">data</code>.{" "}
          <strong>Vervangen</strong>: hele <code className="text-[var(--text-secondary)]">data</code> wordt dit object (formulier hierboven daarna opnieuw opslaan).
        </p>
        <textarea
          value={advancedJson}
          onChange={(e) => setAdvancedJson(e.target.value)}
          rows={6}
          className={`${fieldClass} mt-3 min-h-[120px] font-mono text-xs`}
          placeholder='{"mijn_veld": "waarde"}'
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => mergeAdvanced(false)}
            className="rounded-lg border border-[var(--card-border)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)]/40 disabled:opacity-50"
          >
            JSON samenvoegen
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => mergeAdvanced(true)}
            className="rounded-lg border border-amber-500/40 px-3 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-500/10 disabled:opacity-50"
          >
            Data volledig vervangen
          </button>
        </div>
      </section>

      {msg && <p className="text-sm text-emerald-400">{msg}</p>}
      {err && <p className="text-sm text-red-400">{err}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={save}
          className="rounded-xl border border-[rgba(var(--mode-rgb),0.35)] bg-[rgba(var(--mode-rgb-deep),0.2)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-focus)] hover:bg-[rgba(var(--mode-rgb-deep),0.28)] disabled:opacity-50"
        >
          {pending ? "Bezig…" : "Play-profiel opslaan"}
        </button>
      </div>
    </div>
  );
}
