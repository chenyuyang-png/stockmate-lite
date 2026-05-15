"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Flame, TrendingUp, TrendingDown } from "lucide-react";
import { TW_SECTORS, US_SECTORS, allSectorSymbols, type SectorGroup } from "@/lib/sectors";
import { useQuotes } from "@/lib/useQuotes";
import { useChanges } from "@/lib/useChanges";
import { formatPercent } from "@/lib/format";
import { displayName } from "@/lib/symbols";
import type { RangeKey } from "@/app/api/changes/route";

type Market = "TW" | "US";

const RANGE_TABS: { id: RangeKey; label: string }[] = [
  { id: "1d", label: "日" },
  { id: "5d", label: "週" },
  { id: "1mo", label: "月" },
  { id: "3mo", label: "季" },
  { id: "6mo", label: "半年" },
  { id: "1y", label: "年" },
  { id: "ytd", label: "今年" },
];

// 統一的個股漲跌結構（不論來源）
type CellData = { symbol: string; changePercent: number };

export function SectorHeatmap() {
  const [market, setMarket] = useState<Market>("TW");
  const [range, setRange] = useState<RangeKey>("1d");
  const symbols = useMemo(() => allSectorSymbols(market), [market]);

  // 1d 用 useQuotes（即時、有名稱、有量等資訊）；其他用 /api/changes（歷史計算）
  const quotesResult = useQuotes(symbols, 60_000);
  const changesResult = useChanges(symbols, range, 5 * 60_000);

  const cellMap: Record<string, CellData> = useMemo(() => {
    const map: Record<string, CellData> = {};
    if (range === "1d") {
      for (const sym of symbols) {
        const q = quotesResult.quotes[sym];
        if (q && Number.isFinite(q.changePercent)) {
          map[sym] = { symbol: sym, changePercent: q.changePercent };
        }
      }
    } else {
      for (const c of Object.values(changesResult.changes)) {
        if (Number.isFinite(c.changePercent)) {
          map[c.symbol] = { symbol: c.symbol, changePercent: c.changePercent };
        }
      }
    }
    return map;
  }, [range, symbols, quotesResult.quotes, changesResult.changes]);

  const isLoading =
    range === "1d"
      ? quotesResult.loading && Object.keys(quotesResult.quotes).length === 0
      : changesResult.loading && Object.keys(changesResult.changes).length === 0;

  const sectors = market === "TW" ? TW_SECTORS : US_SECTORS;

  // 計算每個族群的平均漲跌
  const sectorStats = useMemo(() => {
    return sectors
      .map((s) => {
        const cells = s.symbols.map((sym) => cellMap[sym]).filter((c): c is CellData => Boolean(c));
        const avgChange =
          cells.length > 0 ? cells.reduce((sum, c) => sum + c.changePercent, 0) / cells.length : 0;
        return { sector: s, avgChange, cells, total: s.symbols.length, loaded: cells.length };
      })
      .filter((s) => s.cells.length > 0)
      .sort((a, b) => b.avgChange - a.avgChange);
  }, [sectors, cellMap]);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Flame size={16} className="text-orange-600" />
          <h2 className="text-sm font-semibold text-gray-700">產業/題材熱度</h2>
          <span className="text-xs text-gray-500">依平均漲跌排序</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* 時間範圍 */}
          <div className="flex rounded-md border border-gray-300 bg-gray-100 p-0.5 text-xs">
            {RANGE_TABS.map((r) => (
              <button
                key={r.id}
                onClick={() => setRange(r.id)}
                className={`rounded px-2 py-1 ${
                  range === r.id ? "bg-zinc-700 text-gray-800" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          {/* 市場 */}
          <div className="flex rounded-md border border-gray-300 bg-gray-100 p-0.5 text-xs">
            {(["TW", "US"] as Market[]).map((m) => (
              <button
                key={m}
                onClick={() => setMarket(m)}
                className={`rounded px-3 py-1 ${
                  market === m ? "bg-zinc-700 text-gray-800" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {m === "TW" ? "台股" : "美股"}
              </button>
            ))}
          </div>
        </div>
      </header>

      {isLoading ? (
        <p className="py-6 text-center text-sm text-gray-500">
          {range === "1d" ? "載入中…" : "計算歷史漲跌中（首次載入約 3-8 秒）…"}
        </p>
      ) : (
        <>
          <HotSectorAlert sectorStats={sectorStats} range={range} />
          <div className="space-y-2">
            {sectorStats.map(({ sector, avgChange, cells }) => (
              <SectorRow key={sector.id} sector={sector} avgChange={avgChange} cells={cells} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

// 異常族群偵測：用 z-score 找出漲跌偏離大多數族群的群組
function HotSectorAlert({
  sectorStats,
  range,
}: {
  sectorStats: { sector: SectorGroup; avgChange: number }[];
  range: RangeKey;
}) {
  const stats = useMemo(() => {
    const vals = sectorStats.map((s) => s.avgChange).filter((v) => Number.isFinite(v));
    if (vals.length < 3) return null;
    const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
    const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length;
    const std = Math.sqrt(variance);
    if (std < 0.01) return null;
    const hot = sectorStats
      .map((s) => ({ ...s, z: (s.avgChange - mean) / std }))
      .filter((s) => Math.abs(s.z) >= 1.5)
      .sort((a, b) => Math.abs(b.z) - Math.abs(a.z));
    return { mean, std, hot };
  }, [sectorStats]);

  if (!stats || stats.hot.length === 0) return null;
  const rangeLabel = RANGE_TABS.find((r) => r.id === range)?.label ?? "";

  return (
    <div className="mb-3 rounded-lg border border-amber-300 bg-amber-50 p-2.5">
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-amber-700">
        <Flame size={12} /> {rangeLabel}線異動族群（z-score ≥ 1.5）
      </div>
      <div className="flex flex-wrap gap-1.5">
        {stats.hot.map(({ sector, avgChange, z }) => (
          <div
            key={sector.id}
            className={`rounded-md border px-2 py-1 text-xs ${
              avgChange > 0
                ? "border-red-300 bg-red-100 text-red-500"
                : "border-green-300 bg-green-100 text-green-500"
            }`}
          >
            <span className="font-medium">{sector.label}</span>{" "}
            <span className="tabular-nums">{formatPercent(avgChange)}</span>{" "}
            <span className="text-[10px] opacity-70">σ={z.toFixed(1)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectorRow({
  sector,
  avgChange,
  cells,
}: {
  sector: SectorGroup;
  avgChange: number;
  cells: CellData[];
}) {
  const bgClass =
    avgChange >= 3
      ? "bg-red-100 border-red-300"
      : avgChange >= 0
        ? "bg-red-100 border-red-200"
        : avgChange >= -3
          ? "bg-green-50 border-green-200"
          : "bg-green-100 border-green-300";

  const icon =
    avgChange >= 0 ? (
      <TrendingUp size={13} className="text-red-600" />
    ) : (
      <TrendingDown size={13} className="text-green-600" />
    );

  const sorted = [...cells].sort((a, b) => b.changePercent - a.changePercent);

  return (
    <div className={`rounded-lg border ${bgClass} p-2.5`}>
      <div className="mb-2 flex items-center justify-between">
        <Link
          href={`/topics/${sector.id}`}
          className="flex items-center gap-2 hover:opacity-80"
        >
          {icon}
          <span className="text-sm font-semibold text-gray-800 hover:text-red-600 hover:underline">
            {sector.label}
          </span>
          <span className="text-[10px] text-gray-500">{sorted.length} 檔 →</span>
        </Link>
        <span
          className={`text-sm font-semibold tabular-nums ${
            avgChange >= 0 ? "text-red-600" : "text-green-600"
          }`}
        >
          平均 {formatPercent(avgChange)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {sorted.map((c) => (
          <StockCell key={c.symbol} cell={c} />
        ))}
      </div>
    </div>
  );
}

function StockCell({ cell }: { cell: CellData }) {
  const pct = cell.changePercent;
  // 顏色強度依漲跌幅
  const bg =
    pct >= 5
      ? "bg-red-400"
      : pct >= 2
        ? "bg-red-200"
        : pct >= 0
          ? "bg-red-100"
          : pct >= -2
            ? "bg-green-100"
            : pct >= -5
              ? "bg-green-200"
              : "bg-green-400";

  const cleanCode = cell.symbol.replace(/\.(TW|TWO)$/i, "");
  const name = displayName(cell.symbol);
  const isChinese = /[一-鿿]/.test(name);
  const limit = isChinese ? 6 : 10;
  const shortName = name.length > limit ? name.slice(0, limit) : name;

  return (
    <Link
      href={`/stock/${encodeURIComponent(cell.symbol)}`}
      className={`flex flex-col rounded ${bg} px-2 py-1.5 text-xs hover:brightness-125`}
      title={`${name} (${cleanCode}) · ${formatPercent(pct)}`}
    >
      <div className="truncate text-[11px] text-gray-800">{shortName}</div>
      <div className="text-[10px] text-gray-500">{cleanCode}</div>
      <div className="text-[11px] font-semibold tabular-nums text-gray-900">
        {formatPercent(pct)}
      </div>
    </Link>
  );
}
