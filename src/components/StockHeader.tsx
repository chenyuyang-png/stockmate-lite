"use client";

import { useQuotes } from "@/lib/useQuotes";
import { displayName } from "@/lib/symbols";
import { changeColor, formatChange, formatLargeNumber, formatPercent, formatPrice, formatVolume } from "@/lib/format";

type Props = {
  symbol: string;
};

export function StockHeader({ symbol }: Props) {
  const { quotes } = useQuotes([symbol]);
  const q = quotes[symbol];
  const cleanCode = symbol.replace(/\.(TW|TWO)$/i, "");
  const color = changeColor(q?.change);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-baseline gap-3">
        <h1 className="text-xl font-bold text-gray-900">{displayName(symbol, q?.name)}</h1>
        <span className="text-sm text-gray-500">{cleanCode}</span>
        {q?.marketState && (
          <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] text-gray-500">
            {q.marketState === "REGULAR" ? "盤中" : q.marketState === "POSTPOST" ? "盤後" : q.marketState}
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-baseline gap-3">
        <span className="text-3xl font-bold tabular-nums text-gray-900">
          {formatPrice(q?.price)}
        </span>
        <span className="text-sm text-gray-500">{q?.currency ?? ""}</span>
        <span className={`text-lg font-semibold tabular-nums ${color}`}>
          {formatPercent(q?.changePercent)}
        </span>
        <span className={`text-sm tabular-nums ${color}`}>
          ({formatChange(q?.change)})
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-5">
        <Stat label="成交量" value={formatVolume(q?.volume)} />
        <Stat label="市值" value={formatLargeNumber(q?.marketCap)} />
        <Stat label="本益比" value={q?.pe ? q.pe.toFixed(2) : "—"} />
        <Stat label="EPS" value={q?.eps ? q.eps.toFixed(2) : "—"} />
        <Stat label="殖利率" value={q?.dividendYield ? `${q.dividendYield.toFixed(2)}%` : "—"} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase text-gray-500">{label}</div>
      <div className="text-sm tabular-nums text-gray-700">{value}</div>
    </div>
  );
}
