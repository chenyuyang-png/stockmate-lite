"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Target, TrendingDown, TrendingUp, ArrowRight, Info } from "lucide-react";
import { useHoldings } from "@/lib/storage";
import { useQuotes } from "@/lib/useQuotes";
import { useExchangeRate } from "@/lib/useExchangeRate";
import { displayName, detectRegion } from "@/lib/symbols";
import {
  formatChange,
  formatLargeNumber,
  formatPercent,
  formatPrice,
} from "@/lib/format";
import type { Holding } from "@/lib/types";

type PlannedRow = {
  h: Holding;
  name: string;
  cleanCode: string;
  currency: string;
  region: "TW" | "US";
  currentPrice: number;
  currentShares: number;
  currentAvgCost: number;
  currentCostBasis: number;
  currentMarketValue: number;
  currentPnL: number;
  currentPnLPct: number;
  plannedShares: number;
  plannedPrice: number;
  plannedInvestment: number;
  newTotalShares: number;
  newTotalCost: number;
  newAvgCost: number;
  projMarketValue: number;
  projPnL: number;
  projPnLPct: number;
};

export function PlanningDashboard() {
  const { holdings, hydrated } = useHoldings();
  const { quotes } = useQuotes(holdings.map((h) => h.symbol));
  const { toTwd } = useExchangeRate();

  const rows = useMemo<PlannedRow[]>(() => {
    return holdings
      .filter((h) => h.plannedShares && h.plannedShares > 0)
      .map((h) => {
        const q = quotes[h.symbol];
        const currentPrice = q?.price ?? 0;
        const plannedPrice = h.plannedPrice ?? currentPrice;
        const plannedShares = h.plannedShares ?? 0;
        const region = detectRegion(h.symbol);
        const currency = q?.currency ?? (region === "TW" ? "TWD" : "USD");

        const currentCostBasis = h.shares * h.avgCost;
        const currentMarketValue = h.shares * currentPrice;
        const currentPnL = currentMarketValue - currentCostBasis;
        const currentPnLPct =
          currentCostBasis > 0 ? (currentPnL / currentCostBasis) * 100 : 0;

        const plannedInvestment = plannedShares * plannedPrice;
        const newTotalShares = h.shares + plannedShares;
        const newTotalCost = currentCostBasis + plannedInvestment;
        const newAvgCost =
          newTotalShares > 0 ? newTotalCost / newTotalShares : 0;
        const projMarketValue = newTotalShares * currentPrice;
        const projPnL = projMarketValue - newTotalCost;
        const projPnLPct =
          newTotalCost > 0 ? (projPnL / newTotalCost) * 100 : 0;

        return {
          h,
          name: displayName(h.symbol, q?.name),
          cleanCode: h.symbol.replace(/\.(TW|TWO)$/i, ""),
          currency,
          region,
          currentPrice,
          currentShares: h.shares,
          currentAvgCost: h.avgCost,
          currentCostBasis,
          currentMarketValue,
          currentPnL,
          currentPnLPct,
          plannedShares,
          plannedPrice,
          plannedInvestment,
          newTotalShares,
          newTotalCost,
          newAvgCost,
          projMarketValue,
          projPnL,
          projPnLPct,
        };
      });
  }, [holdings, quotes]);

  // 跨幣別 → TWD 加總（給聚合用）
  const totals = useMemo(() => {
    let plannedTwd = 0;
    let projPnLTwd = 0;
    let currentCostTwd = 0;
    let newCostTwd = 0;

    for (const r of rows) {
      plannedTwd += toTwd(r.plannedInvestment, r.currency);
      projPnLTwd += toTwd(r.projPnL, r.currency);
      currentCostTwd += toTwd(r.currentCostBasis, r.currency);
      newCostTwd += toTwd(r.newTotalCost, r.currency);
    }
    return { plannedTwd, projPnLTwd, currentCostTwd, newCostTwd };
  }, [rows, toTwd]);

  if (!hydrated) return null;

  return (
    <section className="rounded-xl border border-cyan-200 bg-gradient-to-br from-cyan-50/40 to-white p-4">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Target size={16} className="text-cyan-700" />
          <h2 className="text-sm font-semibold text-gray-800">預期加碼計畫</h2>
          <span className="text-xs text-gray-500">
            {rows.length > 0 ? `${rows.length} 個計畫中` : "尚未設定"}
          </span>
        </div>
      </header>

      {rows.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-gray-500">尚未設定任何加碼計畫</p>
          <p className="mt-1 text-[11px] text-gray-400">
            在下方持股表點 <span className="rounded bg-cyan-100 px-1.5 py-0.5 text-cyan-700">🎯 設定</span> 按鈕來規劃加碼
          </p>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <SummaryStats totals={totals} />

          {/* Chart: 均價變化視覺 */}
          <div className="my-4">
            <AvgCostChart rows={rows} />
          </div>

          {/* Per-holding cards */}
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
            {rows.map((r) => (
              <PlanningCard key={r.h.id} row={r} />
            ))}
          </div>

          <p className="mt-3 flex items-start gap-1 text-[10px] text-gray-500">
            <Info size={10} className="mt-0.5 shrink-0" />
            <span>
              所有試算依目前股價計算「預期損益」，**不影響實際持股**。
              要把計畫實現，請在下方持股表點 ✏️ 編輯按鈕直接更新股數 / 均價。
            </span>
          </p>
        </>
      )}
    </section>
  );
}

function SummaryStats({
  totals,
}: {
  totals: {
    plannedTwd: number;
    projPnLTwd: number;
    currentCostTwd: number;
    newCostTwd: number;
  };
}) {
  const totalGrowthPct =
    totals.currentCostTwd > 0
      ? ((totals.newCostTwd - totals.currentCostTwd) / totals.currentCostTwd) *
        100
      : 0;
  const projReturnPct =
    totals.newCostTwd > 0 ? (totals.projPnLTwd / totals.newCostTwd) * 100 : 0;
  const pnlColor =
    totals.projPnLTwd >= 0 ? "text-red-700" : "text-green-700";

  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
      <StatCard
        label="預計投入"
        value={formatLargeNumber(totals.plannedTwd)}
        suffix="元"
        emoji="💰"
      />
      <StatCard
        label="部位放大"
        value={`+${totalGrowthPct.toFixed(1)}%`}
        suffix={`(原 ${formatLargeNumber(totals.currentCostTwd)} 元)`}
        emoji="📈"
      />
      <StatCard
        label="加碼後總成本"
        value={formatLargeNumber(totals.newCostTwd)}
        suffix="元"
        emoji="🧮"
      />
      <StatCard
        label="預期損益"
        value={formatChange(totals.projPnLTwd)}
        suffix={`(${formatPercent(projReturnPct)})`}
        emoji={totals.projPnLTwd >= 0 ? "🚀" : "⚠️"}
        valueClass={pnlColor}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix,
  emoji,
  valueClass = "text-gray-900",
}: {
  label: string;
  value: string;
  suffix?: string;
  emoji?: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-lg border border-cyan-200 bg-white p-2.5">
      <div className="text-[11px] text-gray-500">
        {emoji} {label}
      </div>
      <div className={`mt-0.5 text-lg font-bold tabular-nums ${valueClass}`}>
        {value}
      </div>
      {suffix && (
        <div className="text-[10px] text-gray-500">{suffix}</div>
      )}
    </div>
  );
}

// ─── 均價變化圖（橫向條形圖）─────────────────────────────
function AvgCostChart({ rows }: { rows: PlannedRow[] }) {
  // 找全域價格範圍：所有 currentAvgCost / newAvgCost / currentPrice 的 min/max
  const allPrices = rows.flatMap((r) => [
    r.currentAvgCost,
    r.newAvgCost,
    r.currentPrice,
  ]);
  const pMin = Math.min(...allPrices);
  const pMax = Math.max(...allPrices);
  const range = Math.max(1, pMax - pMin);
  // padding 10%
  const xMin = pMin - range * 0.1;
  const xMax = pMax + range * 0.1;
  const xRange = xMax - xMin;

  function pct(v: number): number {
    return ((v - xMin) / xRange) * 100;
  }

  return (
    <div className="rounded-md border border-gray-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-semibold text-gray-700">📊 均價變化圖</span>
        <Legend />
      </div>
      <div className="space-y-2.5">
        {rows.map((r) => {
          const isLowered = r.newAvgCost < r.currentAvgCost;
          const isInProfit = r.currentPrice > r.newAvgCost;

          return (
            <div key={r.h.id}>
              <div className="mb-1 flex items-baseline justify-between text-[11px]">
                <span className="font-medium text-gray-800">
                  {r.name}
                  <span className="ml-1 text-[10px] text-gray-400">
                    {r.cleanCode}
                  </span>
                </span>
                <div className="flex items-center gap-2 text-[10px] tabular-nums">
                  <span className="text-gray-600">
                    {formatPrice(r.currentAvgCost)}
                  </span>
                  <ArrowRight
                    size={9}
                    className={isLowered ? "text-green-600" : "text-red-600"}
                  />
                  <span
                    className={`font-bold ${
                      isLowered ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {formatPrice(r.newAvgCost)}
                  </span>
                </div>
              </div>

              {/* Bar with markers */}
              <div className="relative h-7">
                {/* Background track */}
                <div className="absolute inset-x-0 top-3 h-1 rounded bg-gray-100" />

                {/* Range between current avg cost and new avg cost */}
                {(() => {
                  const left = Math.min(
                    pct(r.currentAvgCost),
                    pct(r.newAvgCost),
                  );
                  const right = Math.max(
                    pct(r.currentAvgCost),
                    pct(r.newAvgCost),
                  );
                  return (
                    <div
                      className={`absolute top-3 h-1 rounded ${
                        isLowered ? "bg-green-300" : "bg-red-300"
                      }`}
                      style={{ left: `${left}%`, width: `${right - left}%` }}
                    />
                  );
                })()}

                {/* Current avg cost marker (灰) */}
                <Marker
                  pos={pct(r.currentAvgCost)}
                  label="原均"
                  color="#6b7280"
                  position="top"
                />
                {/* New avg cost marker (青) */}
                <Marker
                  pos={pct(r.newAvgCost)}
                  label="新均"
                  color={isLowered ? "#15803d" : "#b91c1c"}
                  position="bottom"
                  bold
                />
                {/* Current price marker (藍菱形) */}
                <PriceMarker
                  pos={pct(r.currentPrice)}
                  price={r.currentPrice}
                  isAbove={isInProfit}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Marker({
  pos,
  label,
  color,
  position,
  bold,
}: {
  pos: number;
  label: string;
  color: string;
  position: "top" | "bottom";
  bold?: boolean;
}) {
  return (
    <div
      className="absolute flex flex-col items-center"
      style={{
        left: `${pos}%`,
        top: position === "top" ? 0 : 16,
        transform: "translateX(-50%)",
      }}
    >
      {position === "top" && (
        <span
          className="text-[8px] tabular-nums"
          style={{ color, fontWeight: bold ? 700 : 500 }}
        >
          {label}
        </span>
      )}
      <span
        className="block h-3 w-0.5"
        style={{ backgroundColor: color }}
      />
      {position === "bottom" && (
        <span
          className="text-[8px] tabular-nums"
          style={{ color, fontWeight: bold ? 700 : 500 }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

function PriceMarker({
  pos,
  price,
  isAbove,
}: {
  pos: number;
  price: number;
  isAbove: boolean;
}) {
  return (
    <div
      className="absolute top-1.5 flex flex-col items-center"
      style={{ left: `${pos}%`, transform: "translateX(-50%)" }}
      title={`現價 ${price.toFixed(2)}`}
    >
      <div className="h-3 w-3 rotate-45 transform bg-blue-600 ring-1 ring-white" />
      <span className="-mt-0.5 text-[7px] font-bold tabular-nums text-blue-700">
        現{price.toFixed(0)}
      </span>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-2 text-[9px]">
      <span className="flex items-center gap-0.5">
        <span className="block h-2.5 w-0.5 bg-gray-500" /> 原均
      </span>
      <span className="flex items-center gap-0.5">
        <span className="block h-2.5 w-0.5 bg-cyan-700" /> 新均
      </span>
      <span className="flex items-center gap-0.5">
        <span className="h-1.5 w-1.5 rotate-45 transform bg-blue-600" /> 現價
      </span>
    </div>
  );
}

// ─── 單檔加碼卡片 ─────────────────────────────────────────
function PlanningCard({ row }: { row: PlannedRow }) {
  const r = row;
  const isLowered = r.newAvgCost < r.currentAvgCost;
  const avgChange =
    ((r.newAvgCost - r.currentAvgCost) / r.currentAvgCost) * 100;
  const projColor = r.projPnL >= 0 ? "text-red-700" : "text-green-700";

  const regionBadge =
    r.region === "TW" ? (
      <span className="shrink-0 rounded bg-blue-50 px-1 py-0.5 text-[9px] font-semibold text-blue-700">
        🇹🇼 TW
      </span>
    ) : (
      <span className="shrink-0 rounded bg-purple-50 px-1 py-0.5 text-[9px] font-semibold text-purple-700">
        🇺🇸 US
      </span>
    );

  return (
    <Link
      href={`/stock/${encodeURIComponent(r.h.symbol)}`}
      className="block rounded-lg border border-cyan-200 bg-white p-3 transition hover:border-cyan-400 hover:shadow-sm"
    >
      <header className="flex items-baseline gap-2">
        {regionBadge}
        <span className="truncate text-sm font-semibold text-gray-900">
          {r.name}
        </span>
        <span className="shrink-0 rounded bg-gray-100 px-1 py-0.5 text-[10px] tabular-nums text-gray-600">
          {r.cleanCode}
        </span>
        <span className="ml-auto shrink-0 text-[10px] text-gray-500">
          現價 {formatPrice(r.currentPrice)} {r.currency}
        </span>
      </header>

      <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
        <Box label="目前">
          <Line label="股數" value={r.currentShares.toLocaleString()} />
          <Line label="均價" value={formatPrice(r.currentAvgCost)} />
          <Line
            label="損益"
            value={formatPercent(r.currentPnLPct)}
            className={r.currentPnL >= 0 ? "text-red-700" : "text-green-700"}
          />
        </Box>
        <Box label="計畫加碼" tone="cyan">
          <Line label="股數" value={`+${r.plannedShares.toLocaleString()}`} />
          <Line label="價格" value={formatPrice(r.plannedPrice)} />
          <Line
            label="投入"
            value={`${formatLargeNumber(r.plannedInvestment)} ${r.currency}`}
          />
        </Box>
        <Box label="加碼後" tone="emphasis">
          <Line
            label="總股數"
            value={r.newTotalShares.toLocaleString()}
            bold
          />
          <Line
            label="新均價"
            value={formatPrice(r.newAvgCost)}
            bold
            className={isLowered ? "text-green-700" : "text-red-700"}
          />
          <Line
            label="預期報酬"
            value={formatPercent(r.projPnLPct)}
            bold
            className={projColor}
          />
        </Box>
      </div>

      <footer className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2 text-[11px]">
        <span className="text-gray-500">
          {isLowered ? (
            <span className="text-green-700">
              <TrendingDown size={10} className="inline" /> 均價降低{" "}
              {avgChange.toFixed(2)}%
            </span>
          ) : (
            <span className="text-red-700">
              <TrendingUp size={10} className="inline" /> 均價提高 +
              {avgChange.toFixed(2)}%
            </span>
          )}
        </span>
        <span className={`font-semibold tabular-nums ${projColor}`}>
          預期損益 {formatChange(r.projPnL)} {r.currency}
        </span>
      </footer>
    </Link>
  );
}

function Box({
  label,
  children,
  tone,
}: {
  label: string;
  children: React.ReactNode;
  tone?: "cyan" | "emphasis";
}) {
  const bg =
    tone === "cyan"
      ? "bg-cyan-50/60 border-cyan-200"
      : tone === "emphasis"
        ? "bg-emerald-50/60 border-emerald-300"
        : "bg-gray-50 border-gray-200";
  return (
    <div className={`rounded-md border p-1.5 ${bg}`}>
      <div className="mb-0.5 text-[10px] font-semibold uppercase text-gray-500">
        {label}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function Line({
  label,
  value,
  className = "text-gray-800",
  bold,
}: {
  label: string;
  value: string;
  className?: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-1 text-[10px]">
      <span className="text-gray-500">{label}</span>
      <span
        className={`tabular-nums ${className} ${bold ? "font-bold" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
