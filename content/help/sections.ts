/**
 * Canonical Help Center content source.
 *
 * Update this file when user-facing behavior changes.
 * The Help page renders directly from these definitions.
 */

export const HELP_LAST_UPDATED = "2026-03-23";

export type HelpGroupId = "start" | "systems" | "reference";

export type HelpGroup = {
  id: HelpGroupId;
  label: string;
  description: string;
};

export type HelpStep = {
  title: string;
  body: string;
};

export type HelpLink = {
  label: string;
  href: string;
};

export type HelpSection = {
  id: string;
  title: string;
  group: HelpGroupId;
  summary: string;
  highlights?: string[];
  steps?: HelpStep[];
  tips?: string[];
  seeAlso?: HelpLink[];
};

export const HELP_GROUPS: HelpGroup[] = [
  {
    id: "start",
    label: "Start Here",
    description: "Dagelijkse flow: check-in, missies, ritme.",
  },
  {
    id: "systems",
    label: "Core Systems",
    description: "Pagina's en systemen die je voortgang sturen.",
  },
  {
    id: "reference",
    label: "Reference",
    description: "Instellingen, data, routes en extra uitleg.",
  },
];

export const HELP_QUICK_START_STEPS: HelpStep[] = [
  {
    title: "Start op HQ",
    body: "Log je brain status (energie, focus, load) zodat de dagplanning op jouw staat wordt afgestemd.",
  },
  {
    title: "Open Missions",
    body: "Werk eerst Critical en daarna High impact af om streak en momentum stabiel te houden.",
  },
  {
    title: "Sluit af met review",
    body: "Check Insights en Strategy tabs om patronen te zien en je volgende dag scherper te plannen.",
  },
];

export const HELP_QUICK_LINKS: HelpLink[] = [
  { label: "HQ", href: "/dashboard" },
  { label: "Missions", href: "/tasks" },
  { label: "Growth", href: "/learning?tab=command" },
  { label: "Strategy", href: "/strategy?tab=overview" },
  { label: "Insights", href: "/profile?view=insights&tab=overview" },
  { label: "Budget", href: "/budget" },
  { label: "XP", href: "/profile" },
  { label: "Settings", href: "/settings" },
];

export const HELP_TERMS: { term: string; definition: string }[] = [
  {
    term: "Brain status",
    definition: "Dagelijkse check-in (energie, focus, load) die mission-intensiteit en suggesties aanstuurt.",
  },
  {
    term: "Critical / High impact / Growth boost",
    definition: "Prioriteitslagen voor taken: eerst stabiliteit, daarna impact, daarna ontwikkeling.",
  },
  {
    term: "Progression ladder",
    definition: "Taken die in levels oplopen (bijv. 30 -> 60 -> 90 min) op basis van eerdere completions.",
  },
  {
    term: "Recovery mode",
    definition: "Beschermende modus bij hoge load: lichtere taken om terug in ritme te komen.",
  },
];

export const HELP_SECTIONS: HelpSection[] = [
  {
    id: "dashboard",
    title: "HQ dashboard",
    group: "start",
    summary:
      "HQ is je command center: hier check je hoe je erbij staat, zie je je dagstatus en bepaal je de toon van je uitvoering.",
    highlights: [
      "Brain status is de input voor auto-missions en mode-beslissingen.",
      "Je ziet level, streak, dagprogressie en snelle acties op een plek.",
      "Kleurmodus en UI-accenten volgen je actuele mode (focus/war/recovery).",
    ],
    steps: [
      {
        title: "Log je status",
        body: "Vul energie, focus en load in voordat je taken gaat plannen.",
      },
      {
        title: "Lees de prioriteit",
        body: "Gebruik de dagsignalen als indicatie of je push, stabiliseert of herstelt.",
      },
    ],
    seeAlso: [
      { label: "Open HQ", href: "/dashboard" },
      { label: "Insights overview", href: "/profile?view=insights&tab=overview" },
    ],
  },
  {
    id: "missions",
    title: "Missions en taskflow",
    group: "start",
    summary:
      "Missions combineert handmatige taken, auto-suggesties en routines. Voltooien werkt direct door in XP, streak en progression.",
    highlights: [
      "Tabs: Today, Calendar, Routine en Overdue.",
      "Task state blijft behouden over refresh/sluiten via store + snapshot + bootstrap.",
      "Na task-acties wordt state direct gesynchroniseerd met serverdata.",
    ],
    steps: [
      {
        title: "Kies je tab",
        body: "Werk vanuit Today voor executie, Calendar/Routine voor planning.",
      },
      {
        title: "Sluit de loop",
        body: "Complete of plan bewust door; vermijd losse half-open taken.",
      },
    ],
    tips: [
      "Minimaal 1 completion per dag houdt je streak levend.",
      "Gebruik Routine voor terugkerende systemen in plaats van losse adhoc taken.",
    ],
    seeAlso: [
      { label: "Open Missions", href: "/tasks" },
      { label: "Routine tab", href: "/tasks?tab=routine" },
    ],
  },
  {
    id: "automation",
    title: "Auto mission engine",
    group: "start",
    summary:
      "Auto-missions worden gekozen via state-triggers (energie/focus/load/sleep/day-off/mode) en ondersteund met progression ladders.",
    highlights: [
      "Template picks krijgen expliciete trigger-reason voor explainability.",
      "Nieuwe templates worden gevalideerd via inventory/validator scripts.",
      "Progression state wordt per gebruiker opgeslagen en geüpdatet bij completion.",
    ],
    steps: [
      {
        title: "Check trigger-context",
        body: "Brain status en dagtype bepalen welke missies in de pool vallen.",
      },
      {
        title: "Laat progression lopen",
        body: "Herhaal vergelijkbare missies om naar hogere tiers te groeien.",
      },
    ],
    seeAlso: [
      { label: "Missions", href: "/tasks" },
      { label: "Strategy overview", href: "/strategy?tab=overview" },
    ],
  },
  {
    id: "growth",
    title: "Growth command center",
    group: "systems",
    summary:
      "Growth gebruikt echte URL-tabs en diepere protocolinhoud met execution flows, reflectieblokken en missie-commit.",
    highlights: [
      "Tabs zijn deeplinkable met ?tab= (hash-links worden ondersteund).",
      "Protocol viewer toont micro/meso/macro uitvoering en quality gates.",
      "Protocol missions bevatten rijkere notes/tags voor praktische uitvoering.",
    ],
    seeAlso: [
      { label: "Growth command", href: "/learning?tab=command" },
      { label: "Protocol systeem", href: "/learning?tab=system" },
    ],
  },
  {
    id: "strategy",
    title: "Strategy tabs",
    group: "systems",
    summary:
      "Strategy heeft nu duidelijke tab-verantwoordelijkheden zonder duplicate content en met stabiele URL-tab-state.",
    highlights: [
      "Elke tab heeft een eigen focus: overview, focus/budget, alignment, review.",
      "Tabs zijn shareable via ?tab=.",
      "Growth-bridge duplicatie is verwijderd voor minder ruis.",
    ],
    seeAlso: [
      { label: "Open Strategy", href: "/strategy?tab=overview" },
      { label: "Alignment tab", href: "/strategy?tab=alignment" },
    ],
  },
  {
    id: "insights",
    title: "Insights report",
    group: "systems",
    summary:
      "Insights gebruikt taakgerichte tabs: overview, performance en patterns met collapsibles.",
    highlights: [
      "Patterns-signalen zijn gemerged om duplicatie te verminderen.",
      "Weekselector behoudt actieve tab in de URL.",
    ],
    seeAlso: [
      { label: "Insights overview", href: "/profile?view=insights&tab=overview" },
      { label: "Patterns tab", href: "/profile?view=insights&tab=patterns" },
      { label: "Performance tab", href: "/profile?view=insights&tab=performance" },
    ],
  },
  {
    id: "budget",
    title: "Budget en discipline",
    group: "systems",
    summary:
      "Budget combineert periodestatus, entries, doelen en discipline-signalen met consistente periodedata over cards.",
    highlights: [
      "Payday en period bounds worden centraal beheerd.",
      "Optimistische updates worden na sync teruggespiegeld naar server state.",
      "Frozen/hold flows helpen impulsuitgaven vertragen.",
    ],
    seeAlso: [
      { label: "Open Budget", href: "/budget" },
      { label: "Missions ↔ budget context", href: "/tasks" },
    ],
  },
  {
    id: "xp-system",
    title: "XP, rank en streak",
    group: "systems",
    summary:
      "XP wordt bepaald door taakcompletion en contextfactoren (timing, fit, mode). Rank- en streakinformatie geven voortgang en stabiliteit.",
    highlights: [
      "Recent rank history staat beschikbaar in Insights performance.",
      "Streak-risico en level-prognose staan in Insights overview.",
      "Mode/load-semantiek is genormaliseerd voor consistente beslissingen.",
    ],
    seeAlso: [
      { label: "Profiel (XP context)", href: "/profile" },
      { label: "Insights performance", href: "/profile?view=insights&tab=performance" },
    ],
  },
  {
    id: "settings",
    title: "Settings",
    group: "reference",
    summary:
      "Settings is de centrale plek voor profiel, voorkeuren, weergave en automatische systemen. Voorkeuren worden user-specifiek gesynchroniseerd.",
    highlights: [
      "Server state is leidend; client persistence wordt alleen voor korte UX gebruikt.",
      "Wijzigingen invalideren read-through data zodat alle pagina's direct consistent zijn.",
      "Gebruik days-off en auto-mission toggles om planning op je ritme af te stemmen.",
    ],
    seeAlso: [{ label: "Open Settings", href: "/settings" }],
  },
  {
    id: "data-storage",
    title: "Data, snapshots en offline",
    group: "reference",
    summary:
      "NeuroHQ gebruikt serverdata als source of truth met dagelijkse snapshots voor snelle first paint en offline continuiteit.",
    highlights: [
      "Today-tasks worden niet meer overschreven door stale snapshot state.",
      "Snapshot versiebeheer bewaakt compatibiliteit bij nieuwe velden.",
      "Bij netwerkherstel wordt gemergde state opnieuw gesynchroniseerd.",
    ],
    seeAlso: [
      { label: "Insights overview", href: "/profile?view=insights&tab=overview" },
      { label: "Open Missions", href: "/tasks" },
    ],
  },
  {
    id: "pages-routes",
    title: "Belangrijkste routes",
    group: "reference",
    summary:
      "Gebruik deze routes voor snelle navigatie en delen van specifieke contexten.",
    highlights: [
      "/dashboard -> HQ",
      "/tasks -> Missions",
      "/learning?tab=command -> Growth command center",
      "/strategy?tab=overview -> Strategy overview",
      "/profile?view=insights&tab=overview -> Insights",
      "/settings -> Settings",
    ],
    seeAlso: [{ label: "Terug naar HQ", href: "/dashboard" }],
  },
];

export const HELP_FAQ: { question: string; answer: string }[] = [
  {
    question: "Waarom zie ik soms vooral recovery-taken?",
    answer:
      "Bij hoge load of herstel-signalen prioriteert het systeem lichtere missies om terug in ritme te komen zonder overbelasting.",
  },
  {
    question: "Waarom veranderen mijn auto-missions per dag?",
    answer:
      "De allocator gebruikt je actuele status (energie/focus/load/slaap/dagtype) en voorkomt repetitie met triggerregels en dedupe.",
  },
  {
    question: "Hoe deel ik direct een specifieke Insights-view?",
    answer:
      "Gebruik URL-tabs, bijvoorbeeld /profile?view=insights&tab=patterns of /profile?view=insights&tab=performance.",
  },
  {
    question: "Blijven completions bewaard na refresh of heropenen?",
    answer:
      "Ja. Task state voor vandaag wordt nu consistent gemerged tussen persistence, snapshot en bootstrap.",
  },
];
