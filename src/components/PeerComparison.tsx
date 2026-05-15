"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Users } from "lucide-react";
import { getSectorsOfSymbol } from "@/lib/sectors";
import { useQuotes } from "@/lib/useQuotes";
import { displayName } from "@/lib/symbols";
import { changeColor, formatLargeNumber, formatPercent } from "@/lib/format";
import type { StockDetail } from "@/app/api/stock-detail/route";

type Props = {
  symbol: string;
};

// 同業比較表 — 從該股所屬的第一個題材抓出所有 peer，做表格比較
export function PeerComparison({ symbol }: Props) {
  const sectors = useMemo(() => getSectorsOfSymbol(symbol), [symbol]);
  const primarySector = sectors[0];
  const peerSymbols = useMemo(
    () => (primarySector ? primarySector.symbols : []),
    [primarySector],
  );
  const { quotes } = useQuotes(peerSymbols, 60_000);
  const [details, setDetails] = useState<Record<string, StockDetail>>({});

  // 平行抓 fundamentals — 限制只抓所屬族群的同業，避免一次太多 request
  useEffect(() => {
    if (peerSymbols.length === 0) return;
    let cancelled = false;
    Promise.all(
      peerSymbols.map((s) =>
        fetch(`/api/stock-detail?symbol=${encodeURIComponent(s)}`)
          .then((r) => r.json())
          .then((d) => ({ sym: s, detail: d.detail as StockDetail | null }))
          .catch(() => ({ sym: s, detail: null })),
      ),
    ).then((results) => {
      if (cancelled) return;
      const map: Record<string, StockDetail> = {};
      for (const r of results) {
        if (r.detail) map[r.sym] = r.detail;
      }
      setDetails(map);
    });
    return () => {
      cancelled = true;
    };
  }, [peerSymbols.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!primarySector) return null;

  // 依市值排序
  const rows = [...peerSymbols].sort((a, b) => {
    const ma = details[a]?.marketCap ?? 0;
    const mb = details[b]?.marketCap ?? 0;
    return mb - ma;
  });

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <header className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={14} className="text-pink-600" />
          <h3 className="text-sm font-semibold text-gray-700">同業比較</h3>
          <span className="text-xs text-gray-500">{primarySector.label}</span>
        </div>
        <Link
          href={`/topics/${primarySector.id}`}
          className="text-[11px] text-red-600 hover:underline"
        >
          看完整題材 →
        </Link>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-[10px] uppercase text-gray-500">
              <th className="px-2 py-1.5">公司</th>
              <th className="px-2 py-1.5 text-right">現價</th>
              <th className="px-2 py-1.5 text-right">今日</th>
              <th className="px-2 py-1.5 text-right">市值</th>
              <th className="px-2 py-1.5 text-right">PE</th>
              <th className="px-2 py-1.5 text-right">ROE</th>
              <th className="px-2 py-1.5 text-right">毛利率</th>
              <th className="px-2 py-1.5 text-right">殖利率</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => {
              const isCurrent = s === symbol;
              const q = quotes[s];
              const d = details[s];
              const code = s.replace(/\.(TW|TWO)$/i, "");
              const name = displayName(s, q?.name);
              const pct = q?.changePercent;
              return (
                <tr
                  key={s}
                  className={`border-t border-gray-200 ${
                    isCurrent ? "bg-red-100" : "hover:bg-gray-50"
                  }`}
                >
                  <td className="px-2 py-1.5">
                    {isCurrent ? (
                      <span className="font-semibold text-red-500">
                        {name} <span className="text-[10px] text-gray-500">(此檔)</span>
                      </span>
                    ) : (
                      <Link
                        href={`/stock/${encodeURIComponent(s)}`}
                        className="text-gray-700 hover:text-red-600"
                      >
                        {name}{" "}
                        <span className="text-[10px] text-gray-500">{code}</span>
                      </Link>
                    )}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-gray-600">
                    {q?.price ?? "—"}
                  </td>
                  <td
                    className={`px-2 py-1.5 text-right tabular-nums ${changeColor(q?.change)}`}
                  >
                    {pct !== undefined ? formatPercent(pct) : "—"}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-gray-500">
                    {d?.marketCap ? formatLargeNumber(d.marketCap) : "—"}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-gray-600">
                    {d?.trailingPE ? d.trailingPE.toFixed(1) : "—"}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-gray-600">
                    {d?.returnOnEquity ? `${(d.returnOnEquity * 100).toFixed(1)}%` : "—"}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-gray-600">
                    {d?.grossMargins ? `${(d.grossMargins * 100).toFixed(1)}%` : "—"}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-gray-600">
                    {d?.dividendYield ? `${(d.dividendYield * 100).toFixed(2)}%` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
