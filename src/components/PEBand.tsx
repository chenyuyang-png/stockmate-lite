"use client";

import { useEffect, useState } from "react";
import { Waves } from "lucide-react";
import type { PEBandResponse } from "@/app/api/stock-pe-band/route";

type Props = { symbol: string };

const YEAR_OPTIONS = [1, 3, 5] as const;

// 河流圖配色：低 PE (便宜) → 高 PE (貴)
const BAND_COLORS = [
  "#dcfce7", // 0-10 (極便宜，深綠底)
  "#bbf7d0", // 10-30
  "#fef3c7", // 30-70 (中性)
  "#fed7aa", // 70-90
  "#fecaca", // 90-100 (極貴)
];
const BAND_LABELS = ["極便宜", "便宜", "合理", "偏貴", "極貴"];

export function PEBand({ symbol }: Props) {
  const [data, setData] = useState<PEBandResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [years, setYears] = useState<1 | 3 | 5>(3);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stock-pe-band?symbol=${encodeURIComponent(symbol)}&years=${years}`)
      .then((r) => r.json())
      .then((d) => setData(d as PEBandResponse))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [symbol, years]);

  if (loading)
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 text-center text-sm text-gray-500">
        計算本益比河流圖中…
      </div>
    );

  if (!data) return null;

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Waves size={14} className="text-cyan-600" />
          <h3 className="text-sm font-semibold text-gray-800">本益比河流圖</h3>
          <span className="text-xs text-gray-500">PE Band 河流圖</span>
        </div>
        <div className="flex rounded-md border border-gray-200 bg-gray-50 p-0.5 text-xs">
          {YEAR_OPTIONS.map((y) => (
            <button
              key={y}
              onClick={() => setYears(y)}
              className={`rounded px-2.5 py-1 ${
                years === y ? "bg-blue-600 text-white" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {y} 年
            </button>
          ))}
        </div>
      </header>

      {data.points.length === 0 || !data.stats ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          ⚠️ {data.message ?? "無法繪製"}
          <div className="mt-1 text-[10px] text-amber-700">
            🔍 PE 河流圖需要至少 4 季正值 EPS。虧損股、新上市、或財報資料不全的股票無法繪製。
          </div>
        </div>
      ) : (
        <>
          <StatsRow stats={data.stats} />
          <ChartView data={data} />
          <Legend bands={data.bands} />
        </>
      )}

      <p className="mt-3 text-[10px] text-gray-400">
        河流分層為近 {years} 年滾動 TTM 本益比的 10/30/50/70/90 百分位線。
        股價低於 10% 百分位 = 極便宜；高於 90% = 極貴。
      </p>
    </section>
  );
}

function StatsRow({ stats }: { stats: NonNullable<PEBandResponse["stats"]> }) {
  const peColor =
    stats.pePercentile < 0.3
      ? "text-green-700"
      : stats.pePercentile > 0.7
        ? "text-red-700"
        : "text-amber-700";
  const peLabel =
    stats.pePercentile < 0.1
      ? "極便宜"
      : stats.pePercentile < 0.3
        ? "便宜"
        : stats.pePercentile < 0.7
          ? "合理"
          : stats.pePercentile < 0.9
            ? "偏貴"
            : "極貴";

  return (
    <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Stat label="現價" value={stats.currentPrice.toFixed(2)} />
      <Stat label="TTM EPS" value={stats.currentTtmEps.toFixed(2)} />
      <Stat label="現時 PE" value={stats.currentPe.toFixed(2)} hint={`歷史中位數 ${stats.medianPe.toFixed(1)}`} />
      <Stat
        label="估值位階"
        value={`${(stats.pePercentile * 100).toFixed(0)}%`}
        valueClass={peColor}
        hint={peLabel}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  valueClass = "text-gray-900",
  hint,
}: {
  label: string;
  value: string;
  valueClass?: string;
  hint?: string;
}) {
  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 p-2">
      <div className="text-[10px] text-gray-500">{label}</div>
      <div className={`text-base font-bold tabular-nums ${valueClass}`}>{value}</div>
      {hint && <div className="text-[10px] text-gray-500">{hint}</div>}
    </div>
  );
}

function ChartView({ data }: { data: PEBandResponse }) {
  const w = 800;
  const h = 320;
  const padL = 44;
  const padR = 12;
  const padT = 12;
  const padB = 30;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;

  const { points, bands } = data;

  // 計算 5 條河流邊界線（每個 multiplier × TTM EPS at each date = band line price）
  const bandLines = bands.map((b) => points.map((p) => p.ttmEps * b.multiplier));

  // Y 軸：取所有 price + band 的 min/max
  const allPrices = [
    ...points.map((p) => p.close),
    ...bandLines.flat(),
  ].filter((v) => Number.isFinite(v));
  const yMin = Math.min(...allPrices) * 0.95;
  const yMax = Math.max(...allPrices) * 1.05;
  const yRange = Math.max(0.01, yMax - yMin);

  function x(i: number) {
    return padL + (i / Math.max(1, points.length - 1)) * innerW;
  }
  function y(v: number) {
    return padT + (1 - (v - yMin) / yRange) * innerH;
  }

  // 繪製河流帶（5 區，由低 PE 到高 PE，依序填色）
  function bandAreaPath(idxLow: number, idxHigh: number): string {
    const top = bandLines[idxHigh];
    const bot = bandLines[idxLow];
    if (!top || !bot) return "";
    const topPath = top.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(v)}`).join(" ");
    const botPath = bot
      .slice()
      .reverse()
      .map((v, i) => `L ${x(bot.length - 1 - i)} ${y(v)}`)
      .join(" ");
    return `${topPath} ${botPath} Z`;
  }

  // 5 個區段：[0,1], [1,2], [2,3], [3,4]（4 個區段 + 上下 extreme 區可用底圖）
  // 為了 5 色，我們畫 4 層 + 上下 extreme 用 dashed line
  const segments = [
    { low: 0, high: 1, color: BAND_COLORS[1] }, // 10-30
    { low: 1, high: 2, color: BAND_COLORS[2] }, // 30-50
    { low: 2, high: 3, color: BAND_COLORS[3] }, // 50-70
    { low: 3, high: 4, color: BAND_COLORS[4] }, // 70-90
  ];

  // 股價折線
  const pricePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p.close)}`)
    .join(" ");

  // X 軸 ticks
  const tickIdx =
    points.length <= 6
      ? points.map((_, i) => i)
      : [0, Math.floor(points.length / 3), Math.floor((points.length * 2) / 3), points.length - 1];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none">
      {/* 河流帶 */}
      {segments.map((seg, i) => (
        <path key={i} d={bandAreaPath(seg.low, seg.high)} fill={seg.color} stroke="none" opacity="0.85" />
      ))}

      {/* 河流邊界線 */}
      {bandLines.map((line, i) => {
        const d = line.map((v, j) => `${j === 0 ? "M" : "L"} ${x(j)} ${y(v)}`).join(" ");
        return (
          <path
            key={i}
            d={d}
            stroke="rgba(0,0,0,0.15)"
            strokeWidth="0.5"
            strokeDasharray={i === 0 || i === bandLines.length - 1 ? "3 3" : ""}
            fill="none"
          />
        );
      })}

      {/* 股價折線 */}
      <path d={pricePath} stroke="#1f2937" strokeWidth="1.8" fill="none" />

      {/* 最新點 highlight */}
      {points.length > 0 && (
        <>
          <circle cx={x(points.length - 1)} cy={y(points[points.length - 1].close)} r="4" fill="#dc2626" />
          <text
            x={x(points.length - 1) - 8}
            y={y(points[points.length - 1].close) - 6}
            textAnchor="end"
            fontSize="10"
            fontWeight="700"
            fill="#dc2626"
          >
            {points[points.length - 1].close.toFixed(2)}
          </text>
        </>
      )}

      {/* 座標軸 */}
      <line x1={padL} y1={padT} x2={padL} y2={h - padB} stroke="#d1d5db" strokeWidth="0.5" />
      <line x1={padL} y1={h - padB} x2={w - padR} y2={h - padB} stroke="#d1d5db" strokeWidth="0.5" />

      {/* Y ticks */}
      {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
        const v = yMin + p * yRange;
        return (
          <g key={i}>
            <text x={padL - 4} y={y(v) + 3} textAnchor="end" fontSize="9" fill="#6b7280">
              {v.toFixed(0)}
            </text>
            <line
              x1={padL}
              y1={y(v)}
              x2={w - padR}
              y2={y(v)}
              stroke="#f3f4f6"
              strokeWidth="0.5"
            />
          </g>
        );
      })}

      {/* X ticks */}
      {tickIdx.map((i) => (
        <text key={i} x={x(i)} y={h - padB + 14} textAnchor="middle" fontSize="9" fill="#6b7280">
          {points[i].date.slice(2, 7).replace("-", "/")}
        </text>
      ))}
    </svg>
  );
}

function Legend({ bands }: { bands: PEBandResponse["bands"] }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px]">
      <span className="text-gray-500">PE 區段：</span>
      {bands.map((b, i) => (
        <span
          key={i}
          className="rounded border px-1.5 py-0.5 text-gray-700"
          style={{ backgroundColor: BAND_COLORS[i], borderColor: BAND_COLORS[i] }}
        >
          {BAND_LABELS[i]} {b.multiplier.toFixed(1)}x
        </span>
      ))}
    </div>
  );
}
