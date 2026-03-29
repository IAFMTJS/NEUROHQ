"use client";

import { useId, useMemo } from "react";

type Props = {
  /** Fraction of hex cells that receive accent fill (0–100). Default 60. */
  fillPct?: number;
  /** Hex circumradius in local SVG units. */
  hexRadius?: number;
  columns?: number;
  rows?: number;
  className?: string;
};

function flatTopHexPoints(cx: number, cy: number, R: number): string {
  const pts: string[] = [];
  for (let k = 0; k < 6; k++) {
    const a = -Math.PI / 6 + (k * Math.PI) / 3;
    pts.push(`${cx + R * Math.cos(a)},${cy + R * Math.sin(a)}`);
  }
  return pts.join(" ");
}

const MESH_PAD = 8;

export function VisualLabHexMesh({
  fillPct = 60,
  hexRadius: R = 11,
  columns = 8,
  rows = 5,
  className = "",
}: Props) {
  const gid = useId().replace(/:/g, "");
  const gradId = `vl-hex-mesh-grad-${gid}`;

  const { cells, filledCount, total, width, height } = useMemo(() => {
    const dx = Math.sqrt(3) * R;
    const dy = 1.5 * R;
    const list: { cx: number; cy: number; key: string }[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++) {
        const cx = c * dx + (r % 2) * (dx / 2) + R;
        const cy = r * dy + R;
        list.push({ cx, cy, key: `${r}-${c}` });
      }
    }
    const n = list.length;
    const p = Math.max(0, Math.min(100, fillPct));
    const filled = Math.round((n * p) / 100);
    const maxCx = (columns - 1) * dx + ((rows - 1) % 2) * (dx / 2) + R;
    const maxCy = (rows - 1) * dy + R;
    const w = maxCx + R + 2 * MESH_PAD;
    const h = maxCy + R + 2 * MESH_PAD;
    return { cells: list, filledCount: filled, total: n, width: w, height: h };
  }, [R, columns, rows, fillPct]);

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full max-h-[220px]"
        role="img"
        aria-label={`Hex mesh, ${fillPct} percent of ${total} cells filled`}
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="rgba(0,212,255,0.88)" />
            <stop offset="55%" stopColor="rgba(56,189,248,0.45)" />
            <stop offset="100%" stopColor="rgba(52,211,153,0.4)" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="rgba(4,12,22,0.5)" rx="10" />
        <g transform={`translate(${MESH_PAD}, ${MESH_PAD})`}>
          {cells.map((cell, i) => {
            const filled = i < filledCount;
            const pts = flatTopHexPoints(cell.cx, cell.cy, R - 0.35);
            return (
              <polygon
                key={cell.key}
                points={pts}
                fill={filled ? `url(#${gradId})` : "rgba(6,18,30,0.75)"}
                stroke={filled ? "rgba(0,212,255,0.5)" : "rgba(255,255,255,0.1)"}
                strokeWidth={filled ? 1.15 : 0.85}
                opacity={filled ? 0.95 : 1}
              />
            );
          })}
        </g>
      </svg>
      <p className="mt-2 text-center text-[10px] font-semibold tabular-nums text-[var(--text-secondary)]">
        {filledCount} / {total} cells · {fillPct}% fill
      </p>
    </div>
  );
}
