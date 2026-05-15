"use client";

import { useState, useMemo } from "react";
import { Star } from "lucide-react";
import { useWatchlist } from "@/lib/storage";
import { useQuotes } from "@/lib/useQuotes";
import { detectRegion, displayName } from "@/lib/symbols";
import { QuoteCard } from "./QuoteCard";
import { AddSymbolDialog } from "./AddSymbolDialog";
import { BulkImportDialog } from "./BulkImportDialog";

type Tab = "all" | "TW" | "US";

export function Watchlist() {
  const { items, hydrated, add, remove } = useWatchlist();
  const [tab, setTab] = useState<Tab>("all");

  const symbols = useMemo(() => items.map((i) => i.symbol), [items]);
  const { quotes, loading } = useQuotes(symbols);

  // 排序：台股 → 美股；同類別依名稱
  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const ar = detectRegion(a.symbol);
      const br = detectRegion(b.symbol);
      if (ar !== br) return ar === "TW" ? -1 : 1;
      return displayName(a.symbol).localeCompare(displayName(b.symbol), "zh-Hant");
    });
  }, [items]);

  const twItems = useMemo(
    () => sorted.filter((i) => detectRegion(i.symbol) === "TW"),
    [sorted],
  );
  const usItems = useMemo(
    () => sorted.filter((i) => detectRegion(i.symbol) === "US"),
    [sorted],
  );

  if (!hydrated) return null;

  const displayItems =
    tab === "all" ? sorted : tab === "TW" ? twItems : usItems;

  const TABS: { id: Tab; label: string; count: number; flag: string }[] = [
    { id: "all", label: "全部", count: items.length, flag: "📋" },
    { id: "TW", label: "台股", count: twItems.length, flag: "🇹🇼" },
    { id: "US", label: "美股", count: usItems.length, flag: "🇺🇸" },
  ];

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Star size={16} className="text-amber-600" />
          <h2 className="text-sm font-semibold text-gray-800">自選股</h2>
          <span className="text-xs text-gray-500">
            台股 {twItems.length} · 美股 {usItems.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <BulkImportDialog
            mode="watchlist"
            onImport={(rows) => {
              for (const r of rows) add(r.symbol, r.group);
            }}
          />
          <AddSymbolDialog onAdd={(sym) => add(sym)} label="新增自選" />
        </div>
      </header>

      {/* Tabs：清楚分離 全部 / 台股 / 美股 */}
      <div className="mb-3 flex items-center gap-1 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px flex items-center gap-1 border-b-2 px-3 py-2 text-sm transition ${
              tab === t.id
                ? "border-blue-600 font-semibold text-blue-700"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <span>{t.flag}</span>
            <span>{t.label}</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
                tab === t.id ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
              }`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* 空狀態 */}
      {displayItems.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-gray-500">
            {tab === "all"
              ? "還沒有自選股"
              : `沒有${tab === "TW" ? "台股" : "美股"}自選`}
          </p>
          <p className="mt-1 text-[11px] text-gray-400">
            點右上「新增自選」加入，可搜尋中文名稱或代碼
          </p>
          <div className="mt-3 inline-block">
            <AddSymbolDialog onAdd={(sym) => add(sym)} label="加入第一檔" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {displayItems.map((item) => (
            <QuoteCard
              key={item.symbol}
              symbol={item.symbol}
              quote={quotes[item.symbol]}
              onRemove={() => remove(item.symbol)}
              loading={!quotes[item.symbol] && loading}
            />
          ))}
        </div>
      )}
    </section>
  );
}
