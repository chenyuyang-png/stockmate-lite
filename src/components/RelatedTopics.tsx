"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Layers, ArrowRight } from "lucide-react";
import { getSectorsOfSymbol } from "@/lib/sectors";
import { INFLUENCE_GROUPS } from "@/lib/influence";
import { displayName } from "@/lib/symbols";
import { useQuotes } from "@/lib/useQuotes";
import { changeColor, formatPercent } from "@/lib/format";

type Props = {
  symbol: string;
};

// 顯示該股所屬的所有題材 + 上游美股對應族群
export function RelatedTopics({ symbol }: Props) {
  const sectors = useMemo(() => getSectorsOfSymbol(symbol), [symbol]);

  // 找出哪些 US influence groups 把這檔台股列為「受影響對象」
  const upstreamGroups = useMemo(() => {
    return INFLUENCE_GROUPS.filter((g) => g.twSymbols.includes(symbol));
  }, [symbol]);

  // 抓所有 upstream 的美股代碼以顯示當前狀態
  const usSymbols = useMemo(() => {
    const set = new Set<string>();
    for (const g of upstreamGroups) for (const s of g.usSymbols) set.add(s);
    return Array.from(set);
  }, [upstreamGroups]);
  const { quotes } = useQuotes(usSymbols, 60_000);

  if (sectors.length === 0 && upstreamGroups.length === 0) return null;

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <header className="mb-3 flex items-center gap-2">
        <Layers size={14} className="text-red-600" />
        <h3 className="text-sm font-semibold text-gray-700">所屬題材 / 上游關聯</h3>
      </header>

      {/* 所屬題材 chips */}
      {sectors.length > 0 && (
        <div className="mb-3">
          <div className="mb-1 text-[11px] text-gray-500">📌 所屬題材</div>
          <div className="flex flex-wrap gap-1.5">
            {sectors.map((s) => (
              <Link
                key={s.id}
                href={`/topics/${s.id}`}
                className="rounded-md border border-red-200 bg-red-100 px-2 py-1 text-xs text-red-500 hover:bg-red-100"
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 上游美股族群 */}
      {upstreamGroups.length > 0 && (
        <div>
          <div className="mb-1 text-[11px] text-gray-500">🇺🇸 上游美股族群（影響此股）</div>
          <ul className="space-y-2">
            {upstreamGroups.map((g) => (
              <li key={g.id} className="rounded-md border border-gray-200 bg-gray-50 p-2">
                <div className="mb-1 flex items-center gap-1.5 text-xs">
                  <span className="font-semibold text-gray-800">{g.label}</span>
                  <ArrowRight size={11} className="text-gray-500" />
                  <span className="text-gray-500">{displayName(symbol)}</span>
                </div>
                <div className="mb-1.5 text-[11px] text-gray-500">{g.rationale}</div>
                <div className="flex flex-wrap gap-1">
                  {g.usSymbols.map((s) => {
                    const q = quotes[s];
                    const pct = q?.changePercent;
                    return (
                      <Link
                        key={s}
                        href={`/stock/${encodeURIComponent(s)}`}
                        className={`rounded px-1.5 py-0.5 text-[11px] hover:brightness-125 ${
                          pct !== undefined && pct >= 0
                            ? "bg-red-50 text-red-500"
                            : pct !== undefined && pct < 0
                              ? "bg-green-50 text-green-500"
                              : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {displayName(s, q?.name)}{" "}
                        <span className={`tabular-nums ${changeColor(q?.change)}`}>
                          {pct !== undefined ? formatPercent(pct) : "—"}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
