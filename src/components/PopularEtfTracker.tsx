"use client";

// 熱門 ETF 追蹤 — 台灣最熱門的 ETF（含主動式高股息）
// 顯示成份、規模、即時報價、近 1 月 / 近 1 季 表現
// 樣式參考 aistockmap.com 主動式 ETF 追蹤

import Link from "next/link";
import { useMemo } from "react";
import { Layers, TrendingUp, TrendingDown } from "lucide-react";
import { useQuotes } from "@/lib/useQuotes";
import { useChanges } from "@/lib/useChanges";
import { changeColor, formatPercent } from "@/lib/format";

type EtfMeta = {
  symbol: string;
  name: string;
  /** 簡短策略：年配 / 季配 / 月配 */
  divFreq: string;
  /** 持股策略一行說明 */
  focus: string;
  /** 是否為主動式（非追蹤指數的）*/
  active?: boolean;
};

const POPULAR_TW_ETFS: EtfMeta[] = [
  // 市值型
  { symbol: "0050.TW", name: "元大台灣50", divFreq: "季配", focus: "台股市值前 50 大龍頭" },
  { symbol: "006208.TW", name: "富邦台50", divFreq: "季配", focus: "0050 平替，費用率較低" },

  // 高股息（被動）
  { symbol: "0056.TW", name: "元大高股息", divFreq: "季配", focus: "MSCI 預測殖利率前 30 名" },
  { symbol: "00878.TW", name: "國泰永續高股息", divFreq: "季配", focus: "ESG + 高殖利率，季季配的長青 ETF" },
  { symbol: "00919.TW", name: "群益台灣精選高息", divFreq: "季配", focus: "AI 概念 + 精選殖利率" },
  { symbol: "00713.TW", name: "元大臺灣高息低波", divFreq: "季配", focus: "高息 + 低波動，存股族首選" },

  // 主動式（2024+ 新發行）
  {
    symbol: "00940.TW",
    name: "元大臺灣價值高息",
    divFreq: "月配",
    focus: "巴菲特風 — 價值 + 高息選股",
  },
  {
    symbol: "00929.TW",
    name: "復華台灣科技優息",
    divFreq: "月配",
    focus: "科技股 + 高息，AI 受益首選",
  },

  // 美股 ETF
  { symbol: "00646.TW", name: "元大S&P500", divFreq: "年配", focus: "S&P 500 台幣計價，巴菲特推薦" },
  { symbol: "00662.TW", name: "富邦NASDAQ", divFreq: "年配", focus: "NASDAQ 100 台幣計價，重壓科技七巨頭" },
];

export function PopularEtfTracker() {
  const symbols = useMemo(() => POPULAR_TW_ETFS.map((e) => e.symbol), []);
  const { quotes, loading: qLoading } = useQuotes(symbols, 60_000);
  const { changes: ch1mo } = useChanges(symbols, "1mo", 30 * 60_000);
  const { changes: ch3mo } = useChanges(symbols, "3mo", 30 * 60_000);

  const rows = useMemo(() => {
    return POPULAR_TW_ETFS.map((etf) => {
      const q = quotes[etf.symbol];
      const m = ch1mo[etf.symbol];
      const q3 = ch3mo[etf.symbol];
      return {
        ...etf,
        price: q?.price,
        changePct: q?.changePercent,
        m1: m?.changePercent,
        m3: q3?.changePercent,
      };
    });
  }, [quotes, ch1mo, ch3mo]);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <header className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-violet-700" />
          <h2 className="text-sm font-semibold text-gray-800">熱門 ETF 追蹤</h2>
          <span className="text-[11px] text-gray-500">市值 / 高息 / 主動式 · 即時報價</span>
        </div>
        <Link
          href="/topics"
          className="text-[11px] text-blue-600 hover:underline"
        >
          看完整題材地圖 →
        </Link>
      </header>

      {qLoading && rows.every((r) => r.price === undefined) ? (
        <p className="py-4 text-center text-xs text-gray-500">載入中…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wide text-gray-500">
                <th className="px-2 py-2 font-medium">ETF</th>
                <th className="px-2 py-2 text-center font-medium">配息</th>
                <th className="hidden px-2 py-2 font-medium sm:table-cell">策略</th>
                <th className="px-2 py-2 text-right font-medium">即時</th>
                <th className="px-2 py-2 text-right font-medium">當日</th>
                <th className="px-2 py-2 text-right font-medium">近月</th>
                <th className="px-2 py-2 text-right font-medium">近季</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r) => {
                const cleanCode = r.symbol.replace(/\.(TW|TWO)$/i, "");
                return (
                  <tr key={r.symbol} className="hover:bg-gray-50">
                    <td className="px-2 py-2">
                      <Link
                        href={`/stock/${encodeURIComponent(r.symbol)}`}
                        className="font-semibold text-gray-900 hover:text-blue-700"
                      >
                        {r.name}
                      </Link>
                      <div className="text-[10px] text-gray-500">{cleanCode}</div>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <span
                        className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          r.divFreq === "月配"
                            ? "bg-amber-100 text-amber-800"
                            : r.divFreq === "季配"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {r.divFreq}
                      </span>
                    </td>
                    <td className="hidden px-2 py-2 text-[11px] text-gray-600 sm:table-cell">
                      {r.focus}
                    </td>
                    <td className="px-2 py-2 text-right">
                      <span className="font-bold tabular-nums text-gray-900">
                        {r.price !== undefined ? r.price.toFixed(2) : "—"}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-right">
                      <PctCell pct={r.changePct} />
                    </td>
                    <td className="px-2 py-2 text-right">
                      <PctCell pct={r.m1} />
                    </td>
                    <td className="px-2 py-2 text-right">
                      <PctCell pct={r.m3} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-[10px] leading-relaxed text-gray-500">
        資料源：Yahoo Finance / 季配每年 1, 4, 7, 10 月除息；月配每月 16 日左右。本資訊僅供記錄與分析參考，不構成投資建議。
      </p>
    </section>
  );
}

function PctCell({ pct }: { pct?: number }) {
  if (pct === undefined || !Number.isFinite(pct)) {
    return <span className="text-[10px] text-gray-400">—</span>;
  }
  const color = changeColor(pct);
  const Icon = pct >= 0 ? TrendingUp : TrendingDown;
  return (
    <span
      className={`inline-flex items-center justify-end gap-0.5 tabular-nums font-semibold ${color}`}
    >
      <Icon size={10} />
      {formatPercent(pct)}
    </span>
  );
}
