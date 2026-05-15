"use client";

// 台美對應股 — 讓使用者一眼看到「這檔台股 ↔ 哪檔美股」
// 用途：
//   1. 收盤速報底下顯示「想知道今晚美股怎麼動 → 看這幾檔」
//   2. 串聯台股盤後 / 美股盤前的腦袋切換
//
// 資料源：src/lib/twUsPairs.ts（手工 curated）+ /api/quotes（即時報價）

import Link from "next/link";
import { useMemo, useState } from "react";
import { Link2, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import {
  TW_US_PAIRS,
  type PairRelation,
  type StockPair,
  relationLabel,
} from "@/lib/twUsPairs";
import { useQuotes } from "@/lib/useQuotes";
import { displayName } from "@/lib/symbols";
import { changeColor, formatPercent } from "@/lib/format";

const RELATION_BADGE: Record<PairRelation, string> = {
  direct: "bg-amber-100 text-amber-800 border-amber-300",
  supplier: "bg-blue-100 text-blue-800 border-blue-300",
  peer: "bg-purple-100 text-purple-800 border-purple-300",
  theme: "bg-emerald-100 text-emerald-800 border-emerald-300",
};

// 預設顯示的「重點對應」— 涵蓋 AI 鏈、蘋果鏈、ADR
const DEFAULT_FEATURED: StockPair[] = [
  TW_US_PAIRS.find((p) => p.from === "2330.TW" && p.to === "TSM")!, // 台積電 ADR
  TW_US_PAIRS.find((p) => p.from === "2330.TW" && p.to === "NVDA")!, // 台積電 - NVDA
  TW_US_PAIRS.find((p) => p.from === "2317.TW" && p.to === "AAPL")!, // 鴻海 - 蘋果
  TW_US_PAIRS.find((p) => p.from === "2317.TW" && p.to === "NVDA")!, // 鴻海 - NVDA
  TW_US_PAIRS.find((p) => p.from === "6669.TW" && p.to === "META")!, // 緯穎 - Meta
  TW_US_PAIRS.find((p) => p.from === "2382.TW" && p.to === "NVDA")!, // 廣達 - NVDA
  TW_US_PAIRS.find((p) => p.from === "2308.TW" && p.to === "TSLA")!, // 台達電 - TSLA
  TW_US_PAIRS.find((p) => p.from === "3324.TWO" && p.to === "NVDA")!, // 雙鴻 - NVDA
].filter(Boolean);

export function TwUsCorrelation() {
  const [expanded, setExpanded] = useState(false);

  const visiblePairs = expanded ? TW_US_PAIRS : DEFAULT_FEATURED;

  // 把所有要報價的 symbol 集起來去重
  const symbols = useMemo(() => {
    const set = new Set<string>();
    for (const p of visiblePairs) {
      set.add(p.from);
      set.add(p.to);
    }
    return Array.from(set);
  }, [visiblePairs]);

  const { quotes } = useQuotes(symbols, 60_000);

  return (
    <div className="rounded-md border border-indigo-200 bg-gradient-to-br from-indigo-50/60 to-blue-50/30 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
          <Link2 size={12} className="text-indigo-700" />
          台美對應個股 — 一眼看穿台股 ↔ 美股關聯
        </div>
        <span className="rounded bg-indigo-200 px-1.5 py-0.5 text-[10px] font-bold text-indigo-900">
          {visiblePairs.length} 組
        </span>
      </div>

      <p className="mb-2 text-[10px] leading-relaxed text-gray-600">
        💡 用法：台股收盤後 → 看對應美股今晚走勢 → 推測明日台股可能跟漲跟跌
      </p>

      <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {visiblePairs.map((p, idx) => (
          <PairRow
            key={`${p.from}-${p.to}-${idx}`}
            pair={p}
            twQuote={quotes[p.from]}
            usQuote={quotes[p.to]}
          />
        ))}
      </ul>

      {/* 展開 / 收合 */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="mt-2 flex w-full items-center justify-center gap-1 rounded-md border border-indigo-200 bg-white/70 px-2 py-1.5 text-[11px] font-semibold text-indigo-700 hover:bg-white"
      >
        {expanded ? (
          <>
            <ChevronUp size={11} /> 收合
          </>
        ) : (
          <>
            <ChevronDown size={11} /> 看全部 {TW_US_PAIRS.length} 組關聯
          </>
        )}
      </button>

      {/* 圖例 */}
      <div className="mt-2 flex flex-wrap gap-1.5 text-[9px] text-gray-600">
        {(["direct", "supplier", "peer", "theme"] as PairRelation[]).map((r) => (
          <span
            key={r}
            className={`rounded border px-1.5 py-0.5 ${RELATION_BADGE[r]}`}
          >
            {relationLabel(r)}
          </span>
        ))}
      </div>
    </div>
  );
}

type RowProps = {
  pair: StockPair;
  twQuote?: { price: number; change: number; changePercent: number; name?: string };
  usQuote?: { price: number; change: number; changePercent: number; name?: string };
};

function PairRow({ pair, twQuote, usQuote }: RowProps) {
  const twName = displayName(pair.from, twQuote?.name);
  const usName = displayName(pair.to, usQuote?.name);

  return (
    <li className="rounded border border-gray-200 bg-white px-2.5 py-2 text-[11px]">
      <div className="flex items-center gap-1.5">
        {/* 台股 */}
        <Link
          href={`/stock/${encodeURIComponent(pair.from)}`}
          className="flex-1 min-w-0 truncate font-semibold text-gray-800 hover:text-red-700"
        >
          <span className="mr-1 text-[9px]">🇹🇼</span>
          {twName}
          {twQuote && (
            <span
              className={`ml-1 tabular-nums ${changeColor(twQuote.change)}`}
            >
              {formatPercent(twQuote.changePercent)}
            </span>
          )}
        </Link>

        <ArrowRight size={11} className="shrink-0 text-gray-400" />

        {/* 美股 */}
        <Link
          href={`/stock/${encodeURIComponent(pair.to)}`}
          className="flex-1 min-w-0 truncate text-right font-semibold text-gray-800 hover:text-blue-700"
        >
          {usQuote && (
            <span
              className={`mr-1 tabular-nums ${changeColor(usQuote.change)}`}
            >
              {formatPercent(usQuote.changePercent)}
            </span>
          )}
          {usName}
          <span className="ml-1 text-[9px]">🇺🇸</span>
        </Link>
      </div>

      <div className="mt-1 flex items-start gap-1.5">
        <span
          className={`shrink-0 rounded border px-1 py-0.5 text-[9px] font-semibold ${RELATION_BADGE[pair.relation]}`}
        >
          {relationLabel(pair.relation)}
        </span>
        <span className="line-clamp-2 text-[10px] leading-snug text-gray-600">
          {pair.note}
        </span>
      </div>
    </li>
  );
}
