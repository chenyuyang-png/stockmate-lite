"use client";

import { MARKET_INDICES } from "@/lib/symbols";
import { useQuotes } from "@/lib/useQuotes";
import { changeColor, formatPercent, formatChange, formatPrice } from "@/lib/format";

export function IndexBar() {
  const symbols = MARKET_INDICES.map((i) => i.symbol);
  const { quotes, loading } = useQuotes(symbols);

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {MARKET_INDICES.map((idx) => {
        const q = quotes[idx.symbol];
        const color = changeColor(q?.change);
        return (
          <div
            key={idx.symbol}
            className="rounded-lg border border-gray-200 bg-gray-100 p-3 backdrop-blur"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">{idx.label}</span>
              <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] text-gray-500">
                {idx.region === "TW" ? "台灣" : "美國"}
              </span>
            </div>
            <div className="mt-1.5 text-lg font-semibold tabular-nums text-gray-800">
              {loading && !q ? "—" : formatPrice(q?.price)}
            </div>
            <div className={`text-xs tabular-nums ${color}`}>
              {loading && !q ? "" : (
                <>
                  {formatPercent(q?.changePercent)} ({formatChange(q?.change)})
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
