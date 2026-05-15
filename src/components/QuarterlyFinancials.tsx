"use client";

import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import type { QuarterRow } from "@/app/api/stock-history/route";

type Props = {
  symbol: string;
};

type Metric = {
  key: keyof QuarterRow;
  label: string;
  color: string;
  unit: "value" | "eps";
};

const METRICS: Metric[] = [
  { key: "revenue", label: "營收", color: "#dc2626", unit: "value" },
  { key: "grossProfit", label: "毛利", color: "#22d3ee", unit: "value" },
  { key: "operatingIncome", label: "營業利益", color: "#a78bfa", unit: "value" },
  { key: "netIncome", label: "稅後淨利", color: "#dc2626", unit: "value" },
  { key: "eps", label: "EPS", color: "#fbbf24", unit: "eps" },
];

export function QuarterlyFinancials({ symbol }: Props) {
  const [quarters, setQuarters] = useState<QuarterRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stock-history?symbol=${encodeURIComponent(symbol)}&years=3`)
      .then((r) => r.json())
      .then((d) => setQuarters(d.quarters ?? []))
      .finally(() => setLoading(false));
  }, [symbol]);

  if (loading)
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 text-center text-sm text-gray-500">
        載入季度財報…
      </div>
    );

  if (quarters.length === 0)
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-500">
        無季度財報資料。
      </div>
    );

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <header className="mb-3 flex items-center gap-2">
        <BarChart3 size={14} className="text-red-600" />
        <h3 className="text-sm font-semibold text-gray-700">季度財報</h3>
        <span className="text-xs text-gray-500">最近 {quarters.length} 季</span>
      </header>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {METRICS.map((m) => (
          <MetricChart key={String(m.key)} metric={m} quarters={quarters} />
        ))}
      </div>
    </section>
  );
}

function MetricChart({
  metric,
  quarters,
}: {
  metric: Metric;
  quarters: QuarterRow[];
}) {
  const values = quarters.map((q) => q[metric.key] as number | undefined);
  const valid = values.filter((v): v is number => Number.isFinite(v));
  if (valid.length === 0) return null;

  const w = 280;
  const h = 120;
  const padL = 8;
  const padR = 8;
  const padT = 18;
  const padB = 30;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;

  const max = Math.max(...valid, 0);
  const min = Math.min(...valid, 0);
  const range = Math.max(1, max - min);
  const barW = (innerW / quarters.length) * 0.7;
  const stepX = innerW / quarters.length;

  function y(v: number) {
    return padT + ((max - v) / range) * innerH;
  }
  const zeroY = y(0);

  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-xs font-semibold" style={{ color: metric.color }}>
          {metric.label}
        </span>
        <span className="text-[10px] text-gray-500">
          {metric.unit === "eps" ? "元 / 股" : "億元"}
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
        {/* Zero line */}
        {min < 0 && (
          <line
            x1={padL}
            y1={zeroY}
            x2={w - padR}
            y2={zeroY}
            stroke="#9ca3af"
            strokeWidth="0.5"
            strokeDasharray="2 2"
          />
        )}
        {quarters.map((q, i) => {
          const v = q[metric.key] as number | undefined;
          if (!Number.isFinite(v)) return null;
          const cx = padL + stepX * (i + 0.5);
          const yVal = y(v as number);
          const barTop = Math.min(yVal, zeroY);
          const barHeight = Math.abs(yVal - zeroY);
          const display =
            metric.unit === "eps" ? (v as number).toFixed(2) : ((v as number) / 1e8).toFixed(1);
          return (
            <g key={i}>
              <rect
                x={cx - barW / 2}
                y={barTop}
                width={barW}
                height={Math.max(1, barHeight)}
                fill={metric.color}
                opacity={0.8}
                rx={1}
              >
                <title>{`${q.date}: ${display}`}</title>
              </rect>
              <text
                x={cx}
                y={barTop - 3}
                textAnchor="middle"
                fontSize="9"
                fill="#6b7280"
              >
                {display}
              </text>
              {/* x-axis labels: 短日期 e.g. "25Q3" */}
              <text
                x={cx}
                y={h - 8}
                textAnchor="middle"
                fontSize="9"
                fill="#6b7280"
              >
                {shortQuarter(q.date)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function shortQuarter(dateStr: string): string {
  // 2025-09-30 → 25Q3
  const m = dateStr.slice(5, 7);
  const y = dateStr.slice(2, 4);
  const q = m === "03" ? "Q1" : m === "06" ? "Q2" : m === "09" ? "Q3" : "Q4";
  return `${y}${q}`;
}
