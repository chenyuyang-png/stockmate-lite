"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Zap, TrendingUp, TrendingDown } from "lucide-react";
import { useHoldings, useWatchlist } from "@/lib/storage";
import { displayName } from "@/lib/symbols";
import { changeColor, formatPercent } from "@/lib/format";
import { getTodayEvents } from "@/lib/economicCalendar";
import type { MoverEntry } from "@/app/api/premarket-movers/route";

// 顯示美股盤前/盤後異動（>1% 的）+ 連結到當天 macro event
export function PreMarketAlert() {
  const { holdings, hydrated: hh } = useHoldings();
  const { items: watchlist, hydrated: wh } = useWatchlist();

  // 只取美股
  const usSymbols = useMemo(() => {
    const set = new Set<string>();
    for (const h of holdings) if (!/\.(TW|TWO)$/i.test(h.symbol)) set.add(h.symbol);
    for (const w of watchlist) if (!/\.(TW|TWO)$/i.test(w.symbol)) set.add(w.symbol);
    return Array.from(set);
  }, [holdings, watchlist]);

  const [movers, setMovers] = useState<MoverEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hh || !wh) return;
    if (usSymbols.length === 0) return;
    setLoading(true);
    fetch(`/api/premarket-movers?symbols=${encodeURIComponent(usSymbols.join(","))}`)
      .then((r) => r.json())
      .then((d) => setMovers(d.movers ?? []))
      .finally(() => setLoading(false));
    const id = setInterval(() => {
      fetch(`/api/premarket-movers?symbols=${encodeURIComponent(usSymbols.join(","))}`)
        .then((r) => r.json())
        .then((d) => setMovers(d.movers ?? []));
    }, 120_000);
    return () => clearInterval(id);
  }, [hh, wh, usSymbols.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  const todayEvents = getTodayEvents().filter((e) => e.region === "US");

  // 找有顯著盤前/盤後變動的（>1%）
  const significant = movers
    .map((m) => {
      // 優先顯示 pre-market（若有），否則 post-market
      const preChg = m.preMarketChangePercent;
      const postChg = m.postMarketChangePercent;
      let changePct: number | undefined;
      let phase: "pre" | "post" | null = null;
      if (preChg !== undefined && Math.abs(preChg) >= 1) {
        changePct = preChg;
        phase = "pre";
      } else if (postChg !== undefined && Math.abs(postChg) >= 1) {
        changePct = postChg;
        phase = "post";
      }
      return { ...m, changePct, phase };
    })
    .filter((m) => m.phase !== null)
    .sort((a, b) => Math.abs(b.changePct!) - Math.abs(a.changePct!));

  if (!hh || !wh) return null;
  if (usSymbols.length === 0) return null;
  if (loading && significant.length === 0) return null;
  if (significant.length === 0 && todayEvents.length === 0) return null;

  return (
    <section className="rounded-xl border border-blue-200 bg-blue-50/40 p-4">
      <header className="mb-3 flex items-center gap-2">
        <Zap size={16} className="text-blue-700" />
        <h2 className="text-sm font-semibold text-gray-800">🇺🇸 美股盤前 / 盤後異動</h2>
        <span className="text-[11px] text-gray-500">變動 ≥ 1% · 每 2 分鐘更新</span>
      </header>

      {/* 今日 macro event 連結 */}
      {todayEvents.length > 0 && (
        <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs">
          <div className="flex items-start gap-1.5">
            <span className="font-bold text-amber-900">⚡ 今日有重大事件 — 可能引發盤前異動</span>
          </div>
          <ul className="mt-1 space-y-0.5">
            {todayEvents.map((e, i) => (
              <li key={i} className="text-[11px] text-amber-800">
                <span className="font-semibold">{e.event}</span>
                {e.time && <span className="ml-1 text-gray-600">({e.time})</span>}
                <span className="ml-1 text-gray-600">— {e.description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 盤前/盤後異動股 */}
      {significant.length > 0 && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {significant.map((m) => (
            <MoverCard key={m.symbol} mover={m} />
          ))}
        </div>
      )}

      {significant.length === 0 && (
        <p className="py-2 text-center text-xs text-gray-500">
          目前盤前 / 盤後沒有顯著異動（變動 &lt; 1%）。
        </p>
      )}
    </section>
  );
}

function MoverCard({
  mover,
}: {
  mover: MoverEntry & { changePct?: number; phase?: "pre" | "post" | null };
}) {
  const phase = mover.phase;
  const pct = mover.changePct ?? 0;
  const up = pct > 0;
  const Icon = up ? TrendingUp : TrendingDown;
  const bg = up ? "bg-red-50 border-red-300" : "bg-green-50 border-green-300";
  const phaseLabel = phase === "pre" ? "盤前" : "盤後";

  return (
    <Link
      href={`/stock/${encodeURIComponent(mover.symbol)}`}
      className={`rounded-lg border ${bg} p-2.5 hover:shadow-sm`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="font-bold text-gray-900">
            {displayName(mover.symbol, mover.name ?? "")}
          </span>
          <span className="text-[10px] text-gray-500">{mover.symbol}</span>
        </div>
        <span className="rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          {phaseLabel}
        </span>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <span className={`flex items-center gap-0.5 text-lg font-bold tabular-nums ${changeColor(pct)}`}>
          <Icon size={14} />
          {formatPercent(pct)}
        </span>
        <span className="text-xs text-gray-500">
          ${phase === "pre" ? mover.preMarketPrice?.toFixed(2) : mover.postMarketPrice?.toFixed(2)}
        </span>
      </div>
      <div className="mt-0.5 text-[10px] text-gray-500">
        昨日收盤 ${mover.regularPrice?.toFixed(2)}
      </div>
    </Link>
  );
}
