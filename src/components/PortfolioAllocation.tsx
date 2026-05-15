"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PieChart } from "lucide-react";
import { useHoldings } from "@/lib/storage";
import { useQuotes } from "@/lib/useQuotes";
import { useExchangeRate } from "@/lib/useExchangeRate";
import { displayName, detectRegion } from "@/lib/symbols";
import { getSectorsOfSymbol, CATEGORY_LABELS, type Category } from "@/lib/sectors";
import { formatLargeNumber } from "@/lib/format";

type Mode = "category" | "market" | "stock";

type Slice = {
  key: string;
  label: string;
  value: number; // TWD
  color: string;
  link?: string;
};

// 16-color palette
const PALETTE = [
  "#ef4444", "#f59e0b", "#eab308", "#84cc16",
  "#22c55e", "#10b981", "#14b8a6", "#06b6d4",
  "#0ea5e9", "#3b82f6", "#6366f1", "#8b5cf6",
  "#a855f7", "#d946ef", "#ec4899", "#f43f5e",
];

export function PortfolioAllocation() {
  const { holdings, hydrated } = useHoldings();
  const symbols = useMemo(() => holdings.map((h) => h.symbol), [holdings]);
  const { quotes } = useQuotes(symbols, 60_000);
  const { toTwd } = useExchangeRate();
  const [mode, setMode] = useState<Mode>("category");

  const slices = useMemo<Slice[]>(() => {
    if (!hydrated || holdings.length === 0) return [];

    // 每檔的 TWD 市值
    const positionsTwd = holdings.map((h) => {
      const q = quotes[h.symbol];
      const price = q?.price ?? h.avgCost;
      const ccy = q?.currency || h.currency || "TWD";
      const market = price * h.shares;
      const marketTwd = toTwd(market, ccy);
      return { holding: h, marketTwd };
    });

    if (mode === "stock") {
      return positionsTwd
        .sort((a, b) => b.marketTwd - a.marketTwd)
        .map((p, i) => ({
          key: p.holding.symbol,
          label: displayName(p.holding.symbol),
          value: p.marketTwd,
          color: PALETTE[i % PALETTE.length],
          link: `/stock/${encodeURIComponent(p.holding.symbol)}`,
        }));
    }

    if (mode === "market") {
      const buckets = new Map<string, number>();
      for (const p of positionsTwd) {
        const region = detectRegion(p.holding.symbol);
        const label = region === "TW" ? "台股" : region === "US" ? "美股" : "其他";
        buckets.set(label, (buckets.get(label) ?? 0) + p.marketTwd);
      }
      const colorMap: Record<string, string> = {
        台股: "#dc2626",
        美股: "#2563eb",
        其他: "#6b7280",
      };
      return Array.from(buckets.entries())
        .map(([label, value]) => ({
          key: label,
          label,
          value,
          color: colorMap[label] ?? "#9ca3af",
        }))
        .sort((a, b) => b.value - a.value);
    }

    // category
    const buckets = new Map<string, number>();
    for (const p of positionsTwd) {
      const sectors = getSectorsOfSymbol(p.holding.symbol);
      // 取最有信號的（第一個）分類，沒有則歸「未分類」
      const cat = sectors[0]?.category as Category | undefined;
      const label = cat ? CATEGORY_LABELS[cat] : "未分類";
      buckets.set(label, (buckets.get(label) ?? 0) + p.marketTwd);
    }
    return Array.from(buckets.entries())
      .map(([label, value], i) => ({
        key: label,
        label,
        value,
        color: PALETTE[i % PALETTE.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [hydrated, holdings, quotes, toTwd, mode]);

  if (!hydrated) return null;
  if (holdings.length === 0) return null;

  const total = slices.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) return null;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <PieChart size={16} className="text-purple-600" />
          <h2 className="text-sm font-semibold text-gray-800">資產配置</h2>
          <span className="text-xs text-gray-500">總市值約 NT$ {formatLargeNumber(total)}</span>
        </div>
        <div className="flex rounded-md border border-gray-200 bg-gray-50 p-0.5 text-xs">
          {(
            [
              ["category", "依產業"],
              ["market", "依市場"],
              ["stock", "依個股"],
            ] as [Mode, string][]
          ).map(([m, label]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded px-2.5 py-1 ${
                mode === m ? "bg-blue-600 text-white" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <DonutChart slices={slices} total={total} />
        <Legend slices={slices} total={total} />
      </div>

      <p className="mt-3 text-[10px] text-gray-400">
        市值依即時報價 × 持有股數計算，美股以即時 USD/TWD 匯率換算為台幣。
      </p>
    </section>
  );
}

function DonutChart({ slices, total }: { slices: Slice[]; total: number }) {
  const size = 240;
  const cx = size / 2;
  const cy = size / 2;
  const r = 90;
  const innerR = 55;

  let cumulative = 0;
  const arcs = slices.map((s) => {
    const start = (cumulative / total) * Math.PI * 2 - Math.PI / 2;
    cumulative += s.value;
    const end = (cumulative / total) * Math.PI * 2 - Math.PI / 2;
    return {
      ...s,
      path: arcPath(cx, cy, r, innerR, start, end),
    };
  });

  const top = slices[0];

  return (
    <div className="flex items-center justify-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="h-auto w-full max-w-[260px]">
        {arcs.map((a) => (
          <path
            key={a.key}
            d={a.path}
            fill={a.color}
            stroke="white"
            strokeWidth="1.5"
          />
        ))}
        {top && (
          <>
            <text
              x={cx}
              y={cy - 6}
              textAnchor="middle"
              className="fill-gray-500"
              fontSize="9"
            >
              最大配置
            </text>
            <text
              x={cx}
              y={cy + 10}
              textAnchor="middle"
              fontSize="14"
              fontWeight="700"
              className="fill-gray-900"
            >
              {top.label}
            </text>
            <text
              x={cx}
              y={cy + 26}
              textAnchor="middle"
              fontSize="11"
              className="fill-gray-600"
            >
              {((top.value / total) * 100).toFixed(1)}%
            </text>
          </>
        )}
      </svg>
    </div>
  );
}

function Legend({ slices, total }: { slices: Slice[]; total: number }) {
  return (
    <ul className="space-y-1.5 text-xs">
      {slices.map((s) => {
        const pct = (s.value / total) * 100;
        return (
          <li key={s.key} className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 shrink-0 rounded-sm"
              style={{ backgroundColor: s.color }}
            />
            {s.link ? (
              <Link
                href={s.link}
                className="flex-1 truncate text-gray-700 hover:text-blue-700"
              >
                {s.label}
              </Link>
            ) : (
              <span className="flex-1 truncate text-gray-700">{s.label}</span>
            )}
            <span className="relative h-2 w-16 shrink-0 overflow-hidden rounded bg-gray-100">
              <span
                className="absolute inset-y-0 left-0"
                style={{ width: `${pct}%`, backgroundColor: s.color }}
              />
            </span>
            <span className="w-12 shrink-0 text-right tabular-nums font-semibold text-gray-800">
              {pct.toFixed(1)}%
            </span>
            <span className="w-16 shrink-0 text-right tabular-nums text-[10px] text-gray-500">
              {formatLargeNumber(s.value)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

// 計算環形扇形 path
function arcPath(
  cx: number,
  cy: number,
  rOut: number,
  rIn: number,
  startAngle: number,
  endAngle: number,
): string {
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

  const x1 = cx + rOut * Math.cos(startAngle);
  const y1 = cy + rOut * Math.sin(startAngle);
  const x2 = cx + rOut * Math.cos(endAngle);
  const y2 = cy + rOut * Math.sin(endAngle);

  const x3 = cx + rIn * Math.cos(endAngle);
  const y3 = cy + rIn * Math.sin(endAngle);
  const x4 = cx + rIn * Math.cos(startAngle);
  const y4 = cy + rIn * Math.sin(startAngle);

  return [
    `M ${x1} ${y1}`,
    `A ${rOut} ${rOut} 0 ${largeArc} 1 ${x2} ${y2}`,
    `L ${x3} ${y3}`,
    `A ${rIn} ${rIn} 0 ${largeArc} 0 ${x4} ${y4}`,
    "Z",
  ].join(" ");
}
