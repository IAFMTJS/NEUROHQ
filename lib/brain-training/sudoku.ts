export type SudokuPuzzle = {
  puzzle: number[];
  solution: number[];
};

const BASE_SOLUTION = [
  5, 3, 4, 6, 7, 8, 9, 1, 2,
  6, 7, 2, 1, 9, 5, 3, 4, 8,
  1, 9, 8, 3, 4, 2, 5, 6, 7,
  8, 5, 9, 7, 6, 1, 4, 2, 3,
  4, 2, 6, 8, 5, 3, 7, 9, 1,
  7, 1, 3, 9, 2, 4, 8, 5, 6,
  9, 6, 1, 5, 3, 7, 2, 8, 4,
  2, 8, 7, 4, 1, 9, 6, 3, 5,
  3, 4, 5, 2, 8, 6, 1, 7, 9,
];

function xmur3(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i += 1) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(input: T[], rand: () => number): T[] {
  const out = [...input];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

function transformSolution(seed: string): number[] {
  const seedFn = xmur3(seed);
  const rand = mulberry32(seedFn());

  const digitMap = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rand);
  const rowBandOrder = shuffle([0, 1, 2], rand);
  const colBandOrder = shuffle([0, 1, 2], rand);
  const rowsInBand = [shuffle([0, 1, 2], rand), shuffle([0, 1, 2], rand), shuffle([0, 1, 2], rand)];
  const colsInBand = [shuffle([0, 1, 2], rand), shuffle([0, 1, 2], rand), shuffle([0, 1, 2], rand)];

  const out = new Array<number>(81).fill(0);
  for (let r = 0; r < 9; r += 1) {
    for (let c = 0; c < 9; c += 1) {
      const sourceRowBand = rowBandOrder[Math.floor(r / 3)]!;
      const sourceRow = sourceRowBand * 3 + rowsInBand[sourceRowBand]![r % 3]!;
      const sourceColBand = colBandOrder[Math.floor(c / 3)]!;
      const sourceCol = sourceColBand * 3 + colsInBand[sourceColBand]![c % 3]!;
      const rawDigit = BASE_SOLUTION[sourceRow * 9 + sourceCol]!;
      out[r * 9 + c] = digitMap[rawDigit - 1]!;
    }
  }
  return out;
}

function buildPuzzle(solution: number[], seed: string): number[] {
  const seedFn = xmur3(`${seed}-mask`);
  const rand = mulberry32(seedFn());
  const puzzle = [...solution];
  const indexes = shuffle(Array.from({ length: 81 }, (_, i) => i), rand);
  const blanks = 44; // medium difficulty baseline
  for (let i = 0; i < blanks; i += 1) {
    puzzle[indexes[i]!] = 0;
  }
  return puzzle;
}

export function generateDailySudoku(seed: string): SudokuPuzzle {
  const solution = transformSolution(seed);
  const puzzle = buildPuzzle(solution, seed);
  return { puzzle, solution };
}

export function toBoardString(cells: number[]): string {
  return cells.map((n) => String(Math.max(0, Math.min(9, n)))).join("");
}

export function boardStringToCells(value: string, fallback: number[]): number[] {
  if (value.length !== 81) return [...fallback];
  return value.split("").map((ch, idx) => {
    const digit = Number(ch);
    if (!Number.isInteger(digit) || digit < 0 || digit > 9) return fallback[idx] ?? 0;
    return digit;
  });
}
