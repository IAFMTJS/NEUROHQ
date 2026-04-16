"use client";

import { useCallback, useMemo, useState } from "react";
import { neuroToast } from "@/lib/ui/neuro-toast";
import { seededRng } from "@/components/brain/games/_shared";
import { updateTileScore, type BrainTrainingState } from "@/lib/brain-training/store";

type Props = {
  userId: string;
  brainState: BrainTrainingState;
  persistState: (next: BrainTrainingState) => void;
  completeActivity: (activity: "tile_merge") => Promise<void>;
};

type Dir = "up" | "down" | "left" | "right";

function idx(r: number, c: number) {
  return r * 4 + c;
}

function slideLine(line: number[]): { out: number[]; scoreDelta: number; moved: boolean } {
  const tiles = line.filter((n) => n !== 0);
  const out: number[] = [];
  let scoreDelta = 0;
  let moved = false;
  for (let i = 0; i < tiles.length; i += 1) {
    const a = tiles[i]!;
    const b = tiles[i + 1]!;
    if (b != null && a === b) {
      const merged = a + b;
      out.push(merged);
      scoreDelta += merged;
      i += 1;
      moved = true;
    } else {
      out.push(a);
    }
  }
  while (out.length < 4) out.push(0);
  moved ||= out.some((n, i) => n !== (line[i] ?? 0));
  return { out, scoreDelta, moved };
}

function canMove(grid: number[]): boolean {
  if (grid.some((n) => n === 0)) return true;
  for (let r = 0; r < 4; r += 1) {
    for (let c = 0; c < 4; c += 1) {
      const v = grid[idx(r, c)]!;
      if (c < 3 && v === grid[idx(r, c + 1)]!) return true;
      if (r < 3 && v === grid[idx(r + 1, c)]!) return true;
    }
  }
  return false;
}

export function TileMergeGame({ userId, brainState, persistState, completeActivity }: Props) {
  const rand = useMemo(() => seededRng(`${userId}:${brainState.dailyKey}:tile_merge`), [brainState.dailyKey, userId]);

  const [grid, setGrid] = useState<number[]>(() => {
    const g = new Array<number>(16).fill(0);
    return g;
  });
  const [score, setScore] = useState(0);
  const [movesLeft, setMovesLeft] = useState(35);

  const spawn = useCallback(
    (g: number[]) => {
      const empties = g.map((v, i) => (v === 0 ? i : -1)).filter((i) => i >= 0);
      if (empties.length === 0) return g;
      const pick = empties[Math.floor(rand() * empties.length)]!;
      const val = rand() < 0.85 ? 2 : 4;
      const next = [...g];
      next[pick] = val;
      return next;
    },
    [rand]
  );

  const reset = useCallback(() => {
    let g = new Array<number>(16).fill(0);
    g = spawn(spawn(g));
    setGrid(g);
    setScore(0);
    setMovesLeft(35);
  }, [spawn]);

  const finish = useCallback(
    async (finalScore: number) => {
      const next = updateTileScore(brainState, finalScore);
      persistState(next);
      if (!brainState.tileMergeDone) {
        await completeActivity("tile_merge");
        neuroToast.success("Tile Merge voltooid.");
      }
    },
    [brainState, completeActivity, persistState]
  );

  const move = useCallback(
    async (dir: Dir) => {
      if (brainState.tileMergeDone) return;
      if (movesLeft <= 0) return;
      let nextGrid = [...grid];
      let movedAny = false;
      let gained = 0;

      const readLine = (r: number, c: number, dr: number, dc: number) => {
        const line = [];
        for (let i = 0; i < 4; i += 1) {
          line.push(nextGrid[idx(r + dr * i, c + dc * i)]!);
        }
        return line;
      };
      const writeLine = (r: number, c: number, dr: number, dc: number, line: number[]) => {
        for (let i = 0; i < 4; i += 1) {
          nextGrid[idx(r + dr * i, c + dc * i)] = line[i] ?? 0;
        }
      };

      const apply = (r: number, c: number, dr: number, dc: number) => {
        const line = readLine(r, c, dr, dc);
        const { out, scoreDelta, moved } = slideLine(line);
        writeLine(r, c, dr, dc, out);
        gained += scoreDelta;
        movedAny ||= moved;
      };

      if (dir === "left") for (let r = 0; r < 4; r += 1) apply(r, 0, 0, 1);
      if (dir === "right") for (let r = 0; r < 4; r += 1) apply(r, 3, 0, -1);
      if (dir === "up") for (let c = 0; c < 4; c += 1) apply(0, c, 1, 0);
      if (dir === "down") for (let c = 0; c < 4; c += 1) apply(3, c, -1, 0);

      if (!movedAny) return;

      nextGrid = spawn(nextGrid);
      setGrid(nextGrid);
      setScore((prev) => prev + gained);
      setMovesLeft((prev) => prev - 1);

      const nextMoves = movesLeft - 1;
      if (nextMoves <= 0 || !canMove(nextGrid)) {
        await finish(score + gained);
      }
    },
    [brainState.tileMergeDone, finish, grid, movesLeft, score, spawn]
  );

  return (
    <section className="card-simple space-y-3 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Tile Merge</h3>
        <span className={`text-xs font-semibold ${brainState.tileMergeDone ? "text-emerald-300" : "text-[var(--text-muted)]"}`}>
          {brainState.tileMergeDone ? "Voltooid (+30 XP)" : "Niet voltooid"}
        </span>
      </div>

      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-surface)]/40 p-3">
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
          <p>Score: <span className="font-semibold text-[var(--text-primary)]">{score}</span></p>
          <p>Moves: <span className="font-semibold text-[var(--text-primary)]">{movesLeft}</span></p>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2">
          {grid.map((v, i) => (
            <div
              key={i}
              className="flex h-12 items-center justify-center rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] text-sm font-extrabold text-[var(--text-primary)]"
            >
              {v === 0 ? "" : v}
            </div>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div />
          <button
            type="button"
            onClick={() => void move("up")}
            disabled={brainState.tileMergeDone}
            className="rounded-lg border border-[var(--card-border)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:opacity-50"
          >
            ↑
          </button>
          <div />
          <button
            type="button"
            onClick={() => void move("left")}
            disabled={brainState.tileMergeDone}
            className="rounded-lg border border-[var(--card-border)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:opacity-50"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => void move("down")}
            disabled={brainState.tileMergeDone}
            className="rounded-lg border border-[var(--card-border)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:opacity-50"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={() => void move("right")}
            disabled={brainState.tileMergeDone}
            className="rounded-lg border border-[var(--card-border)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:opacity-50"
          >
            →
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
        <button
          type="button"
          onClick={reset}
          disabled={brainState.tileMergeDone}
          className="rounded-lg border border-[var(--card-border)] px-3 py-1.5 font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:opacity-50"
        >
          {movesLeft === 35 ? "Start" : "Reset"}
        </button>
        <p>Beste: <span className="font-semibold text-[var(--text-primary)]">{brainState.tileBestScore ?? "—"}</span></p>
      </div>
    </section>
  );
}

