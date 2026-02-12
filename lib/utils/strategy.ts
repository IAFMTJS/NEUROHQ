export function getCurrentQuarter(): { year: number; quarter: number } {
  const d = new Date();
  const year = d.getFullYear();
  const quarter = Math.floor(d.getMonth() / 3) + 1;
  return { year, quarter };
}
