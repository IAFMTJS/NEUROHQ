"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { createTask, type MissionIntent, type StrategyDomainTask, type AvoidanceTag } from "@/app/actions/tasks";
import { getSimilarTasksCompletionRate } from "@/app/actions/missions-performance";
import { getChainsForUser, createChain, addStepToChain } from "@/app/actions/mission-chains";
import { MISSION_TEMPLATES, xpLevelLabel, type MissionTemplate } from "@/lib/mission-templates";
import type { HeadroomTier } from "@/lib/brain-mode";
import { maxAllowedIntensityForTier } from "@/lib/brain-mode";

const INTENTS: { value: MissionIntent; label: string }[] = [
  { value: "discipline", label: "Discipline" },
  { value: "recovery", label: "Recovery" },
  { value: "pressure", label: "Druk" },
  { value: "alignment", label: "Alignment" },
  { value: "experiment", label: "Experiment" },
];

const DOMAINS: { value: StrategyDomainTask; label: string }[] = [
  { value: "discipline", label: "Discipline (+30%)" },
  { value: "health", label: "Health (+30%)" },
  { value: "learning", label: "Learning (+30%)" },
  { value: "business", label: "Business (+30%)" },
];

const DNA_PRESETS = [
  { id: "light", label: "Light", cognitive: 0.2, emotional: 0.2, energy: 2 },
  { id: "medium", label: "Medium", cognitive: 0.5, emotional: 0.4, energy: 4 },
  { id: "deep", label: "Deep Work", cognitive: 0.8, emotional: 0.5, energy: 6 },
  { id: "pressure", label: "High Pressure", cognitive: 0.9, emotional: 0.8, energy: 8 },
];

const COMPLETION_TYPES = [
  { value: "time", label: "Tijd gebaseerd (bijv. 25 min)" },
  { value: "output", label: "Output gebaseerd (bijv. 3 pagina's)" },
  { value: "quality", label: "Kwaliteitsdrempel" },
];

const PSYCHOLOGY_LABELS = [
  { value: "", label: "— Geen label" },
  { value: "Avoidance Breaker", label: "Avoidance Breaker" },
  { value: "Identity Reinforcer", label: "Identity Reinforcer" },
  { value: "Consistency Builder", label: "Consistency Builder" },
  { value: "Momentum Booster", label: "Momentum Booster" },
  { value: "Fear Confronter", label: "Fear Confronter" },
];

const AVOIDANCE_TAG_OPTIONS: { value: AvoidanceTag | ""; label: string }[] = [
  { value: "", label: "— Geen (optioneel)" },
  { value: "household", label: "Household (huishouden)" },
  { value: "administration", label: "Administration (administratie)" },
  { value: "social", label: "Social (sociaal)" },
];

const VALIDATION_TYPES: { value: "binary" | "structured" | "high_stakes"; label: string }[] = [
  { value: "binary", label: "Binary (klaar / niet klaar)" },
  { value: "structured", label: "Gestructureerd (checklist)" },
  { value: "high_stakes", label: "High stakes (review/approval)" },
];

export type StrategyMapping = { primaryDomain: string; secondaryDomains: string[] } | null;

type Props = {
  open: boolean;
  onClose: () => void;
  date: string;
  /** For Step 2: Primary (+30%), Secondary (+10%), Outside (-20%) with confirmation. */
  strategyMapping?: StrategyMapping;
  onAdded?: () => void;
  /** Optional brain-mode tier for today to cap intensity. */
  headroomTierToday?: HeadroomTier;
  /** Active missions today (top-level, incomplete) to enforce focus slots. */
  activeCountToday?: number;
  /** Max focus slots from brain mode. */
  maxSlotsToday?: number;
  /** Whether adding missions for today is blocked due to very high load. */
  addBlockedToday?: boolean;
};

const DOMAIN_LABELS: Record<string, string> = { discipline: "Discipline", health: "Health", learning: "Learning", business: "Business" };

export function AddMissionModal3({
  open,
  onClose,
  date,
  strategyMapping,
  onAdded,
  headroomTierToday,
  activeCountToday,
  maxSlotsToday,
  addBlockedToday,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [frictionAlert, setFrictionAlert] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [intent, setIntent] = useState<MissionIntent | "">("");
  const [domain, setDomain] = useState<StrategyDomainTask | "">("");
  const [domainType, setDomainType] = useState<"primary" | "secondary" | "outside" | "">("");
  const [outsideConfirmed, setOutsideConfirmed] = useState(false);
  const [cognitiveLoad, setCognitiveLoad] = useState(0.5);
  const [emotionalResistance, setEmotionalResistance] = useState(0.4);
  const [energyCost, setEnergyCost] = useState(4);
  const [dueDate, setDueDate] = useState(date);
  const [campaignMode, setCampaignMode] = useState<"standalone" | "chain" | "new">("standalone");
  const [selectedChainId, setSelectedChainId] = useState<string | null>(null);
  const [newChainName, setNewChainName] = useState("");
  const [chains, setChains] = useState<Awaited<ReturnType<typeof getChainsForUser>>>([]);
  const [completionType, setCompletionType] = useState<"time" | "output" | "quality">("time");
  const [commitmentPct, setCommitmentPct] = useState(80);
  const [psychologyLabel, setPsychologyLabel] = useState("");
  const [similarFrictionMessage, setSimilarFrictionMessage] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<MissionTemplate | null>(null);
  const [validationType, setValidationType] = useState<"binary" | "structured" | "high_stakes" | "">("binary");
  const [filterDomain, setFilterDomain] = useState<"" | "discipline" | "learning" | "health" | "business">("");
  const [filterXpLevel, setFilterXpLevel] = useState<"" | "low" | "normal" | "high">("");
  const [avoidanceTag, setAvoidanceTag] = useState<AvoidanceTag | "">("");

  useEffect(() => {
    if (step !== 6 || !open) return;
    getSimilarTasksCompletionRate({
      cognitiveLoad: cognitiveLoad,
      energyRequired: energyCost,
      domain: domain || undefined,
    }).then(({ message }) => setSimilarFrictionMessage(message));
  }, [step, open, cognitiveLoad, energyCost, domain]);

  useEffect(() => {
    if (!open || step !== 5 || campaignMode !== "chain") return;
    getChainsForUser().then(setChains);
  }, [open, step, campaignMode]);

  const estimatedXP = Math.max(10, Math.min(100, Math.round((cognitiveLoad + 0.5) * 50)));
  const alignmentImpact =
    domainType === "primary" ? 30 : domainType === "secondary" ? 10 : domainType === "outside" ? -20 : domain ? 30 : 0;
  const disciplineEffect = intent === "discipline" ? 15 : intent === "recovery" ? 5 : 10;
  const isOutside = domainType === "outside";
  const needsOutsideConfirm = isOutside && !outsideConfirmed;
  const maxIntensityToday = headroomTierToday ? maxAllowedIntensityForTier(headroomTierToday) : "heavy";

  function clampEnergyToTier(energy: number): number {
    if (maxIntensityToday === "light") return Math.min(3, energy);
    if (maxIntensityToday === "medium") return Math.min(6, energy);
    return energy;
  }

  function applyPreset(preset: (typeof DNA_PRESETS)[0]) {
    setCognitiveLoad(preset.cognitive);
    setEmotionalResistance(preset.emotional);
    setEnergyCost(clampEnergyToTier(preset.energy));
  }

  function applyTemplate(t: MissionTemplate) {
    setSelectedTemplate(t);
    setTitle(t.title);
    setDomain(t.domain);
    setEnergyCost(t.energy);
    if (t.category) setIntent(t.category === "work" ? "discipline" : "recovery");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step < 6) {
      setStep(step + 1);
      return;
    }
    setError(null);
    if (commitmentPct < 70) {
      setFrictionAlert("Commitment onder 70%. Overweeg de missie aan te passen voor hogere slagingskans.");
      return;
    }
    const effectiveDate = dueDate || date;
    const slotsFilled =
      typeof maxSlotsToday === "number" && typeof activeCountToday === "number"
        ? activeCountToday >= maxSlotsToday
        : false;
    const limitMessage =
      addBlockedToday && effectiveDate === date
        ? "Mentale belasting te hoog. Vandaag geen nieuwe missies toevoegen; afronden of uit je agenda halen."
        : slotsFilled && effectiveDate === date
          ? "Je hebt je focus slots gevuld. Kies één missie om eerst af te maken of te verplaatsen; dan mag er weer één bij."
          : null;
    if (limitMessage) {
      setError(limitMessage);
      return;
    }
    startTransition(async () => {
      try {
        let chainId: string | null = null;
        if (campaignMode === "chain" && selectedChainId) chainId = selectedChainId;
        if (campaignMode === "new" && newChainName.trim()) {
          const id = await createChain(newChainName.trim(), 10);
          if (id) chainId = id;
        }
        const result = await createTask({
          title: title.trim(),
          due_date: dueDate || date,
          energy_required: energyCost,
          domain: domain || undefined,
          cognitive_load: cognitiveLoad,
          emotional_resistance: emotionalResistance,
          discipline_weight: intent === "discipline" ? 0.8 : 0.3,
          strategic_value: domainType === "primary" ? 0.9 : domainType === "secondary" ? 0.7 : domain ? 0.5 : 0.5,
          mission_intent: intent || undefined,
          psychology_label: psychologyLabel.trim() || undefined,
          impact: Math.round((cognitiveLoad + 0.5) * 2.5) as 1 | 2 | 3,
          mission_chain_id: chainId,
          validation_type: validationType || undefined,
          base_xp: selectedTemplate?.baseXP ?? undefined,
          avoidance_tag: avoidanceTag || null,
        });
        if (chainId && result?.id) await addStepToChain(chainId, result.id);
        onAdded?.();
        router.refresh();
        onClose();
        setStep(1);
        setTitle("");
        setIntent("");
        setDomain("");
        setDomainType("");
        setOutsideConfirmed(false);
        setCommitmentPct(80);
        setPsychologyLabel("");
        setSelectedChainId(null);
        setNewChainName("");
        setValidationType("binary");
        setAvoidanceTag("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add");
      }
    });
  }

  const canNext =
    step === 1
      ? !!intent
      : step === 2
        ? !!domain && (domainType !== "outside" || outsideConfirmed)
        : step === 3
          ? true
          : step === 4
            ? true
            : step === 5
              ? true
              : title.trim().length > 0;

  return (
    <Modal open={open} onClose={onClose} title="Add mission 3.0" showBranding={false}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
        {frictionAlert && <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">{frictionAlert}</p>}
        {similarFrictionMessage && <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">{similarFrictionMessage}</p>}

        {/* Step indicator */}
        <p className="text-xs font-medium text-[var(--text-muted)]">Stap {step} van 6</p>

        {step === 1 && (
          <>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">1. Intent — Waarom maak je dit?</h3>
            <p className="text-xs text-[var(--text-muted)] mb-2">Optioneel: kies een template. Filter op domein of XP-niveau.</p>
            <div className="mb-2 flex flex-wrap gap-2">
              <select
                value={filterDomain}
                onChange={(e) => setFilterDomain((e.target.value || "") as "" | "discipline" | "learning" | "health" | "business")}
                className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
                aria-label="Filter op domein"
              >
                <option value="">Alle domeinen</option>
                <option value="discipline">Discipline</option>
                <option value="learning">Learning</option>
                <option value="health">Health</option>
                <option value="business">Business</option>
              </select>
              <select
                value={filterXpLevel}
                onChange={(e) => setFilterXpLevel((e.target.value || "") as "" | "low" | "normal" | "high")}
                className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
                aria-label="Filter op XP-niveau"
              >
                <option value="">Alle XP-niveaus</option>
                <option value="low">Weinig XP (25)</option>
                <option value="normal">Normaal XP (50)</option>
                <option value="high">Veel XP (100)</option>
              </select>
            </div>
            <div className="mb-3 max-h-48 overflow-y-auto rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/50 p-2">
              {(["discipline", "learning", "health", "business"] as const).map((dom) => {
                const list = MISSION_TEMPLATES
                  .filter((t) => (!filterDomain || t.domain === filterDomain) && (!filterXpLevel || t.xpLevel === filterXpLevel) && t.domain === dom);
                if (list.length === 0) return null;
                return (
                  <div key={dom} className="mb-2 last:mb-0">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{DOMAIN_LABELS[dom] ?? dom}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {list.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => applyTemplate(t)}
                          className={`rounded-lg border px-2.5 py-1.5 text-left text-xs font-medium transition-colors ${
                            selectedTemplate?.id === t.id
                              ? "border-[var(--accent-focus)] bg-[var(--accent-focus)]/20 text-[var(--accent-focus)]"
                              : "border-[var(--card-border)] text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
                          }`}
                          title={`${t.title} — ${xpLevelLabel(t.xpLevel)} (+${t.baseXP} XP)`}
                        >
                          <span className="block truncate max-w-[140px]">{t.title}</span>
                          <span className="mt-0.5 block text-[10px] text-[var(--text-muted)]">{xpLevelLabel(t.xpLevel)} (+{t.baseXP})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            {selectedTemplate && (
              <div className="mb-3 rounded-lg border border-[var(--accent-focus)]/30 bg-[var(--accent-focus)]/5 px-3 py-2 text-xs">
                <p className="font-medium text-[var(--text-primary)]">{selectedTemplate.title}</p>
                <p className="mt-1 text-[var(--text-muted)]">{selectedTemplate.description}</p>
                <p className="mt-1 text-[var(--text-muted)]">+{selectedTemplate.baseXP} XP bij voltooiing · {xpLevelLabel(selectedTemplate.xpLevel)}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {INTENTS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setIntent(value)}
                  className={`rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                    intent === value ? "border-[var(--accent-focus)] bg-[var(--accent-focus)]/20 text-[var(--accent-focus)]" : "border-[var(--card-border)] text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">2. Strategic Mapping</h3>
            <p className="text-xs text-[var(--text-muted)]">Primary +30%, Secondary +10%, Outside -20%. Bevestiging vereist buiten focus.</p>
            {strategyMapping ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-[var(--text-muted)]">Primary (+30%)</p>
                  <button
                    type="button"
                    onClick={() => {
                      setDomain(strategyMapping.primaryDomain as StrategyDomainTask);
                      setDomainType("primary");
                    }}
                    className={`mt-1 w-full rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors ${
                      domainType === "primary" ? "border-[var(--accent-focus)] bg-[var(--accent-focus)]/20 text-[var(--accent-focus)]" : "border-[var(--card-border)] text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
                    }`}
                  >
                    {DOMAIN_LABELS[strategyMapping.primaryDomain] ?? strategyMapping.primaryDomain}
                  </button>
                </div>
                {strategyMapping.secondaryDomains.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-[var(--text-muted)]">Secondary (+10%)</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {strategyMapping.secondaryDomains.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            setDomain(d as StrategyDomainTask);
                            setDomainType("secondary");
                          }}
                          className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                            domainType === "secondary" && domain === d ? "border-[var(--accent-focus)] bg-[var(--accent-focus)]/20 text-[var(--accent-focus)]" : "border-[var(--card-border)] text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
                          }`}
                        >
                          {DOMAIN_LABELS[d] ?? d}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium text-[var(--text-muted)]">Outside focus (-20%) — bevestiging vereist</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {(DOMAINS.map((d) => d.value).filter((d) => d !== strategyMapping.primaryDomain && !strategyMapping.secondaryDomains.includes(d)) as StrategyDomainTask[]).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          setDomain(d);
                          setDomainType("outside");
                          setOutsideConfirmed(false);
                        }}
                        className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                          domainType === "outside" && domain === d ? "border-amber-500/50 bg-amber-500/10 text-amber-200" : "border-[var(--card-border)] text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
                        }`}
                      >
                        {DOMAIN_LABELS[d] ?? d}
                      </button>
                    ))}
                  </div>
                  {domainType === "outside" && (
                    <label className="mt-2 flex items-center gap-2 text-sm text-[var(--text-muted)]">
                      <input type="checkbox" checked={outsideConfirmed} onChange={(e) => setOutsideConfirmed(e.target.checked)} className="rounded border-[var(--card-border)]" />
                      Ik bevestig: deze missie valt buiten mijn huidige focus (-20% alignment).
                    </label>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {DOMAINS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => { setDomain(value); setDomainType(""); }}
                    className={`rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                      domain === value ? "border-[var(--accent-focus)] bg-[var(--accent-focus)]/20 text-[var(--accent-focus)]" : "border-[var(--card-border)] text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">3. Mission DNA</h3>
            <p className="text-xs text-[var(--text-muted)]">Cognitive load, emotional resistance, energy cost — of kies een preset.</p>
            <div className="flex flex-wrap gap-2">
              {DNA_PRESETS.map((p) => (
                <button key={p.id} type="button" onClick={() => applyPreset(p)} className="rounded-lg border border-[var(--card-border)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface)]">
                  {p.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)]">Cognitive load</label>
                <input type="range" min="0.1" max="1" step="0.1" value={cognitiveLoad} onChange={(e) => setCognitiveLoad(parseFloat(e.target.value))} className="mt-1 w-full" />
                <span className="text-[10px] text-[var(--text-muted)]">{cognitiveLoad}</span>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)]">Emotional resistance</label>
                <input type="range" min="0" max="1" step="0.1" value={emotionalResistance} onChange={(e) => setEmotionalResistance(parseFloat(e.target.value))} className="mt-1 w-full" />
                <span className="text-[10px] text-[var(--text-muted)]">{emotionalResistance}</span>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)]">Energy cost (1–10)</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={energyCost}
                  onChange={(e) => {
                    const raw = Math.min(10, Math.max(1, parseInt(e.target.value, 10) || 1));
                    setEnergyCost(clampEnergyToTier(raw));
                  }}
                  className="mt-1 w-full rounded border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1.5 text-sm"
                />
              </div>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">4. Live Impact Preview</h3>
            <p className="text-xs text-[var(--text-muted)]">Geschatte impact op basis van je keuzes.</p>
            <ul className="space-y-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/50 p-3 text-sm">
              <li>Verwachte XP: <strong>{estimatedXP}</strong></li>
              <li>Geschatte tijd: <strong>~{energyCost * 8} min</strong></li>
              <li>Discipline effect: <strong>{disciplineEffect}%</strong></li>
              <li>Alignment impact: <strong>{domain ? (alignmentImpact >= 0 ? `+${alignmentImpact}%` : `${alignmentImpact}%`) : "—"}</strong></li>
              <li>Energy cost: <strong>{energyCost}/10</strong></li>
              {dueDate && (
                <li>Deadline: <strong>{dueDate}</strong></li>
              )}
            </ul>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Validatie</label>
              <select
                value={validationType}
                onChange={(e) => setValidationType((e.target.value || "") as "binary" | "structured" | "high_stakes" | "")}
                className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)]"
              >
                {VALIDATION_TYPES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">5. Campaign Integration</h3>
            <div className="flex flex-wrap gap-2">
              {(["standalone", "chain", "new"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setCampaignMode(m)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium capitalize ${
                    campaignMode === m ? "border-[var(--accent-focus)] bg-[var(--accent-focus)]/20 text-[var(--accent-focus)]" : "border-[var(--card-border)] text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
                  }`}
                >
                  {m === "standalone" ? "Alleen" : m === "chain" ? "Bestaande keten" : "Nieuwe keten"}
                </button>
              ))}
            </div>
            {campaignMode === "chain" && (
              <div className="mt-2">
                <label className="block text-xs font-medium text-[var(--text-muted)]">Kies een keten</label>
                <select
                  value={selectedChainId ?? ""}
                  onChange={(e) => setSelectedChainId(e.target.value || null)}
                  className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)]"
                >
                  <option value="">— Geen —</option>
                  {chains.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
            {campaignMode === "new" && (
              <div className="mt-2">
                <label className="block text-xs font-medium text-[var(--text-muted)]">Naam nieuwe keten</label>
                <input
                  type="text"
                  value={newChainName}
                  onChange={(e) => setNewChainName(e.target.value)}
                  placeholder="bijv. Q1 Launch"
                  className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)]"
                />
              </div>
            )}
          </>
        )}

        {step === 6 && (
          <>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">6. Completion & Commitment</h3>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)]">Titel</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Wat is de missie?" className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)]">Due date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2.5 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)]">Completion</label>
              <select value={completionType} onChange={(e) => setCompletionType(e.target.value as "time" | "output" | "quality")} className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2.5 py-2 text-sm">
                {COMPLETION_TYPES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)]">Psychology label</label>
              <select value={psychologyLabel} onChange={(e) => setPsychologyLabel(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2.5 py-2 text-sm">
                {PSYCHOLOGY_LABELS.map(({ value, label }) => (
                  <option key={value || "none"} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)]">Avoidance tag (optioneel)</label>
              <select
                value={avoidanceTag}
                onChange={(e) => setAvoidanceTag((e.target.value || "") as AvoidanceTag | "")}
                className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2.5 py-2 text-sm"
              >
                {AVOIDANCE_TAG_OPTIONS.map(({ value, label }) => (
                  <option key={value || "none"} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)]">Hoe zeker ben je? {commitmentPct}%</label>
              <input type="range" min="0" max="100" value={commitmentPct} onChange={(e) => setCommitmentPct(parseInt(e.target.value, 10))} className="mt-1 w-full" />
              {commitmentPct < 70 && <p className="mt-1 text-xs text-amber-400">Onder 70% — overweeg de missie aan te passen.</p>}
            </div>
          </>
        )}

        <div className="flex justify-end gap-2">
          {step > 1 && (
            <button type="button" onClick={() => setStep(step - 1)} className="btn-secondary rounded-lg px-4 py-2 text-sm font-medium">
              Back
            </button>
          )}
          <button type="submit" disabled={pending || !canNext} className="btn-primary rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50">
            {step < 6 ? "Volgende" : pending ? "Toevoegen…" : "Add mission"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
