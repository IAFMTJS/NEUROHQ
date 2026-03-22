export function getCurrentQuarter(): { year: number; quarter: number } {
  const d = new Date();
  const year = d.getFullYear();
  const quarter = Math.floor(d.getMonth() / 3) + 1;
  return { year, quarter };
}

export function getNextQuarter(): { year: number; quarter: number } {
  const { year, quarter } = getCurrentQuarter();
  if (quarter === 4) return { year: year + 1, quarter: 1 };
  return { year, quarter: quarter + 1 };
}

export function getPreviousQuarter(): { year: number; quarter: number } {
  const { year, quarter } = getCurrentQuarter();
  if (quarter === 1) return { year: year - 1, quarter: 4 };
  return { year, quarter: quarter - 1 };
}

/** 1 = first day of current calendar quarter (local date). */
export function getDayIndexInCurrentQuarter(now = new Date()): number {
  const y = now.getFullYear();
  const q = Math.floor(now.getMonth() / 3) + 1;
  const m0 = (q - 1) * 3;
  const start = new Date(y, m0, 1);
  return Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
}
