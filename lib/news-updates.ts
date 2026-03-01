/**
 * Lightweight news/updates for dashboard (changelogs, events).
 * Update this array when you ship features or events.
 */

export type NewsItem = {
  date: string; // YYYY-MM-DD
  title: string;
  body: string;
  href?: string;
};

export const NEWS_UPDATES: NewsItem[] = [
  {
    date: "2025-02-22",
    title: "Strategy archive met reden",
    body: "Sluit strategieën af met reden: target gehaald, alignment ok of verloren, plus notitie.",
  },
  {
    date: "2025-02-22",
    title: "Mission templates & ketens",
    body: "Kies een template bij Add Mission; koppel missies aan een keten voor bonus.",
  },
  {
    date: "2025-02-22",
    title: "Toasts met undo",
    body: "Voltooien en verwijderen tonen een toast met Ongedaan maken.",
  },
];

/** Latest N items (default 3). */
export function getLatestNews(limit = 3): NewsItem[] {
  return [...NEWS_UPDATES].sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
}
