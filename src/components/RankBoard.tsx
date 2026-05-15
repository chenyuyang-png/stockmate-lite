"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Trophy, ArrowDownToLine, ArrowUpFromLine, TrendingUp, TrendingDown } from "lucide-react";
import { TW_SECTORS, US_SECTORS, allSectorSymbols } from "@/lib/sectors";
import { useQuotes } from "@/lib/useQuotes";
import { useChanges } from "@/lib/useChanges";
import { changeColor, formatPercent } from "@/lib/format";
import { displayName } from "@/lib/symbols";
import type { RangeKey } from "@/app/api/changes/route";
import { PaywallBlur } from "./PaywallBlur";

type Market = "TW" | "US";

const RANGE_TABS: { id: RangeKey; label: string }[] = [
  { id: "1d", label: "今日" },
  { id: "5d", label: "近 5 日" },
  { id: "1mo", label: "近月" },
  { id: "3mo", label: "近季" },
  { id: "1y", label: "近年" },
  { id: "ytd", label: "今年" },
];

// 「跨題材」排行榜 — 找出 N 大強勢股、弱勢股
export function RankBoard() {
  const [market, setMarket] = useState<Market>("TW");
  const [range, setRange] = useState<RangeKey>("5d");
  const symbols = useMemo(() => allSectorSymbols(market), [market]);

  const { quotes, loading: qLoading } = useQuotes(symbols, 60_000);
  const { changes, loading: cLoading } = useChanges(symbols, range, 5 * 60_000);

  // 建立 symbol → 主題反查（顯示「該股屬於哪個主題」）
  const symbolToSector = useMemo(() => {
    const map = new Map<string, string>();
    const list = market === "TW" ? TW_SECTORS : US_SECTORS;
    for (const sec of list) {
      for (const s of sec.symbols) {
        if (!map.has(s)) map.set(s, sec.label);
      }
    }
    return map;
  }, [market]);

  // 合併資料：1d 用 quotes、其他用 changes
  const rows = useMemo(() => {
    if (range === "1d") {
      return symbols
        .map((sym) => {
          const q = quotes[sym];
          if (!q || !Number.isFinite(q.changePercent)) return null;
          return { symbol: sym, changePercent: q.changePercent, price: q.price };
        })
        .filter((r): r is { symbol: string; changePercent: number; price: number } => Boolean(r));
    }
    return Object.values(changes).map((c) => ({
      symbol: c.symbol,
      changePercent: c.changePercent,
      price: c.current,
    }));
  }, [range, symbols, quotes, changes]);

  const top = [...rows].sort((a, b) => b.changePercent - a.changePercent).slice(0, 10);
  const bottom = [...rows].sort((a, b) => a.changePercent - b.changePercent).slice(0, 10);

  const isLoading = range === "1d" ? qLoading && rows.length === 0 : cLoading && rows.length === 0;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-yellow-600" />
          <h2 className="text-sm font-semibold text-gray-700">強勢 / 弱勢股排行榜</h2>
          <span className="text-xs text-gray-500">跨題材 · {rows.length} 檔</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
        <p className="py-6 text-center text-sm text-gray-500">載入中…</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <RankList
            title="🚀 強勢股 Top 10"
            icon={<ArrowUpFromLine size={13} className="text-red-600" />}
            rows={top}
            symbolToSector={symbolToSector}
          />
          <RankList
            title="❄️ 弱勢股 Top 10"
            icon={<ArrowDownToLine size={13} className="text-green-600" />}
            rows={bottom}
            symbolToSector={symbolToSector}
          />
        </div>
      )}
    </section>
  );
}

function RankList({
  title,
  icon,
  rows,
  symbolToSector,
}: {
  title: string;
  icon: React.ReactNode;
  rows: { symbol: string; changePercent: number; price: number }[];
  symbolToSector: Map<string, string>;
}) {
  const freeRows = rows.slice(0, 5);
  const paidRows = rows.slice(5, 10);
  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
      <div className="mb-2 flex items-center gap-1 text-xs font-semibold text-gray-600">
        {icon} {title}
      </div>
      <ul className="space-y-1">
        {freeRows.map((r, i) => (
          <RankRow
            key={r.symbol}
            row={r}
            index={i}
            symbolToSector={symbolToSector}
          />
        ))}
      </ul>
      {paidRows.length > 0 && (
        <div className="mt-1">
          <PaywallBlur
            requireTier="pro"
            featureLabel="完整 Top 10 排行"
            hint="升級 Pro 讓 AI 一次彙整完整 Top 10 — 不用自己滑表格找"
            intensity="light"
          >
            <ul className="space-y-1">
              {paidRows.map((r, i) => (
                <RankRow
                  key={r.symbol}
                  row={r}
                  index={i + 5}
                  symbolToSector={symbolToSector}
                />
              ))}
            </ul>
          </PaywallBlur>
        </div>
      )}
    </div>
  );
}

function RankRow({
  row,
  index,
  symbolToSector,
}: {
  row: { symbol: string; changePercent: number; price: number };
  index: number;
  symbolToSector: Map<string, string>;
}) {
  const cleanCode = row.symbol.replace(/\.(TW|TWO)$/i, "");
  const name = displayName(row.symbol);
  const sector = symbolToSector.get(row.symbol);
  const color = changeColor(row.changePercent);
  return (
    <li>
      <Link
        href={`/stock/${encodeURIComponent(row.symbol)}`}
        className="flex items-center justify-between rounded border border-gray-200 bg-white px-2 py-1.5 hover:border-gray-300"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-4 text-[10px] tabular-nums text-gray-400">{index + 1}</span>
          {row.changePercent >= 0 ? (
            <TrendingUp size={11} className="text-red-600 shrink-0" />
          ) : (
            <TrendingDown size={11} className="text-green-600 shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs text-gray-800">{name}</div>
            <div className="flex items-center gap-2 text-[10px] text-gray-500">
              <span>{cleanCode}</span>
              {sector && (
                <span className="rounded bg-gray-200 px-1 py-0.5">{sector}</span>
              )}
            </div>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className={`text-xs font-semibold tabular-nums ${color}`}>
            {formatPercent(row.changePercent)}
          </div>
        </div>
      </Link>
    </li>
  );
}
