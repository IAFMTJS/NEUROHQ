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
