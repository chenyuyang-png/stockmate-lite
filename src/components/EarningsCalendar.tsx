"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarCheck } from "lucide-react";
import { useHoldings, useWatchlist } from "@/lib/storage";
import { displayName } from "@/lib/symbols";
import type { EarningsEntry } from "@/app/api/earnings-calendar/route";

export function EarningsCalendar() {
  const { holdings, hydrated: hh } = useHoldings();
  const { items: watchlist, hydrated: wh } = useWatchlist();

  const symbols = useMemo(() => {
    const set = new Set<string>();
    for (const h of holdings) set.add(h.symbol);
    for (const w of watchlist) set.add(w.symbol);
    return Array.from(set);
  }, [holdings, watchlist]);

  const [entries, setEntries] = useState<EarningsEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hh || !wh) return;
    if (symbols.length === 0) return;
    setLoading(true);
    fetch(`/api/earnings-calendar?symbols=${encodeURIComponent(symbols.join(","))}`)
      .then((r) => r.json())
      .then((d) => setEntries(d.earnings ?? []))
      .finally(() => setLoading(false));
  }, [hh, wh, symbols.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hh || !wh) return null;
  if (loading && entries.length === 0)
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 text-center text-sm text-gray-500">
        載入法說財報日曆…
      </div>
    );
  if (entries.length === 0) return null;

  // 分區
  const tw = entries.filter((e) => e.region === "TW");
  const us = entries.filter((e) => e.region === "US");

  return (
    <section className="rounded-xl border border-violet-200 bg-violet-50/30 p-4">
      <header className="mb-3 flex items-center gap-2">
        <CalendarCheck size={16} className="text-violet-700" />
        <h2 className="text-sm font-semibold text-gray-800">📊 我的持股 / 自選股法說日曆</h2>
        <span className="text-[11px] text-gray-500">未來 60 天 · {entries.length} 檔</span>
      </header>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {tw.length > 0 && <Section title="🇹🇼 台股" entries={tw} />}
        {us.length > 0 && <Section title="🇺🇸 美股" entries={us} />}
      </div>
    </section>
  );
}

function Section({ title, entries }: { title: string; entries: EarningsEntry[] }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="mb-2 text-xs font-semibold text-gray-700">{title}</div>
      <ul className="space-y-1.5">
        {entries.map((e) => (
          <EarningRow key={e.symbol} entry={e} />
        ))}
      </ul>
    </div>
  );
}

function EarningRow({ entry }: { entry: EarningsEntry }) {
  const daysFromNow = Math.round(
    (new Date(entry.date).getTime() - Date.now()) / (24 * 60 * 60 * 1000),
  );
  const badge =
    daysFromNow <= 0
      ? "今日"
      : daysFromNow === 1
        ? "明日"
        : daysFromNow <= 7
          ? `${daysFromNow}D`
          : entry.date.slice(5);
  const isUrgent = daysFromNow <= 7;
  const code = entry.symbol.replace(/\.(TW|TWO)$/i, "");
  const eps = entry.epsEstimate;
  const epsLow = entry.epsLow;
  const epsHigh = entry.epsHigh;
  const rev = entry.revenueEstimate;

  return (
    <li
      className={`rounded-md border px-2.5 py-1.5 text-xs ${
        isUrgent ? "border-amber-300 bg-amber-50" : "border-gray-200 bg-gray-50"
      }`}
    >
      <div className="flex items-center justify-between">
        <Link
          href={`/stock/${encodeURIComponent(entry.symbol)}`}
          className="flex items-center gap-1.5 hover:opacity-80"
        >
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
              isUrgent ? "bg-amber-600 text-white" : "bg-gray-600 text-white"
            }`}
          >
            {badge}
          </span>
          <span className="font-semibold text-gray-900 hover:text-blue-700">
            {displayName(entry.symbol)}
          </span>
          <span className="text-[10px] text-gray-500">{code}</span>
        </Link>
        <span className="text-[10px] text-gray-500">{entry.date}</span>
      </div>
      {(eps || rev) && (
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-gray-600">
          {eps && (
            <span>
              預估 EPS:{" "}
              <span className="font-semibold tabular-nums text-gray-900">{eps.toFixed(2)}</span>
              {epsLow && epsHigh && (
                <span className="text-[10px] text-gray-400">
                  {" "}
                  ({epsLow.toFixed(2)}-{epsHigh.toFixed(2)})
                </span>
              )}
            </span>
          )}
          {rev && (
            <span>
              預估營收:{" "}
              <span className="font-semibold tabular-nums text-gray-900">
                {rev >= 1e9 ? `${(rev / 1e9).toFixed(1)} B` : `${(rev / 1e8).toFixed(0)} 億`}
              </span>
            </span>
          )}
        </div>
      )}
    </li>
  );
}
