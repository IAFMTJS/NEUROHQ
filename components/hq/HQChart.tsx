"use client";

import {
  LineChart,
  Line,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const defaultData = [
  { name: "Jan", value: 1200 },
  { name: "Feb", value: 2100 },
  { name: "Mar", value: 1800 },
  { name: "Apr", value: 2600 },
  { name: "May", value: 3200 },
  { name: "Jun", value: 2900 },
];

export type HQChartDataPoint = { name: string; value: number };
export type HQChartProps = {
  /** Chart data: { name, value }[] */
  data?: HQChartDataPoint[];
  /** Title above the chart */
  title?: string;
  /** "line" = neon line only; "area" = line + soft fill under (energy field) */
  variant?: "line" | "area";
  /** Data key for values (default "value") */
  dataKey?: string;
  className?: string;
};

const tooltipStyle = {
  background: "rgba(20,20,35,0.8)",
  border: "1px solid rgba(255,255,255,0.2)",
  backdropFilter: "blur(12px)",
  borderRadius: "12px",
  color: "white",
} as const;

export function HQChart({
  data = defaultData,
  title = "Mission Growth",
  variant = "line",
  dataKey = "value",
  className = "",
}: HQChartProps) {
  const ChartComponent = variant === "area" ? AreaChart : LineChart;

  return (
    <div
      className={`hq-glass p-6 h-[320px] w-full relative overflow-hidden ${className}`}
    >
      <h3 className="mb-6 text-lg tracking-wide text-white">{title}</h3>

      <ResponsiveContainer width="100%" height="85%">
        <ChartComponent data={data}>
          <defs>
            <linearGradient id="hqChartNeonStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--hq-cyan)" />
              <stop offset="50%" stopColor="var(--hq-purple)" />
              <stop offset="100%" stopColor="var(--hq-green)" />
            </linearGradient>
            <filter id="hqChartNeonGlow">
              <feGaussianBlur stdDeviation="6" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <CartesianGrid
            stroke="rgba(255,255,255,0.05)"
            vertical={false}
          />

          <XAxis
            dataKey="name"
            stroke="rgba(255,255,255,0.4)"
            tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }}
          />

          <YAxis
            stroke="rgba(255,255,255,0.4)"
            tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }}
          />

          <Tooltip contentStyle={tooltipStyle} />

          {variant === "area" ? (
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke="url(#hqChartNeonStroke)"
              fill="url(#hqChartNeonStroke)"
              fillOpacity={0.1}
              strokeWidth={3}
              filter="url(#hqChartNeonGlow)"
              animationDuration={1500}
              isAnimationActive
            />
          ) : (
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke="url(#hqChartNeonStroke)"
              strokeWidth={3}
              dot={false}
              filter="url(#hqChartNeonGlow)"
              animationDuration={1500}
              isAnimationActive
            />
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
}
