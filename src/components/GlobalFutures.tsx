"use client";

import { useEffect, useState } from "react";
import { Globe2 } from "lucide-react";
import type { Quote } from "@/lib/types";
import { formatPercent } from "@/lib/format";

type Group = "futures" | "commodity" | "fx" | "yield" | "crypto";
type Item = {
  symbol: string;
  label: string;
  short: string;
  group: Group;
  /** 顯示時是否要把價格顯示到固定小數位 */
  decimals?: number;
  /** 殖利率符號要直接顯示 % */
  isYieldPercent?: boolean;
};

// 全球期貨 / 商品 / 匯率 / 殖利率 — 約 12 個關鍵指標
const ITEMS: Item[] = [
  // 美股期貨（盤後 / 隔夜 / 盤前都會動，是台股早盤最重要的領先指標）
  { symbol: "ES=F", label: "S&P 500 期貨", short: "SPX期", group: "futures" },
  { symbol: "NQ=F", label: "那斯達克 100 期貨", short: "NDX期", group: "futures" },
  { symbol: "YM=F", label: "道瓊期貨", short: "DOW期", group: "futures" },
  { symbol: "RTY=F", label: "羅素 2000 期貨", short: "小型股期", group: "futures" },

  // 商品
  { symbol: "GC=F", label: "黃金", short: "Gold", group: "commodity" },
  { symbol: "CL=F", label: "WTI 原油", short: "Oil", group: "commodity" },

  // 加密貨幣
  { symbol: "BTC-USD", label: "比特幣", short: "BTC", group: "crypto", decimals: 0 },

  // 匯率
  { symbol: "USDTWD=X", label: "美元 / 台幣", short: "USD/TWD", group: "fx", decimals: 3 },
  { symbol: "JPY=X", label: "美元 / 日圓", short: "USD/JPY", group: "fx", decimals: 2 },
  { symbol: "DX-Y.NYB", label: "美元指數", short: "DXY", group: "fx", decimals: 2 },

  // 殖利率（單位本身為 %）
  { symbol: "^TNX", label: "10 年期美債殖利率", short: "10Y", group: "yield", isYieldPercent: true },
  { symbol: "^FVX", label: "5 年期美債殖利率", short: "5Y", group: "yield", isYieldPercent: true },
];

const GROUPS: { id: Group; label: string; emoji: string }[] = [
  { id: "futures", label: "美股期貨", emoji: "📈" },
  { id: "commodity", label: "商品", emoji: "🪙" },
  { id: "crypto", label: "加密貨幣", emoji: "₿" },
  { id: "fx", label: "匯率", emoji: "💱" },
  { id: "yield", label: "美債殖利率", emoji: "📊" },
];

export function GlobalFutures() {
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  async function load() {
    setLoading(true);
    try {
      const symbols = ITEMS.map((i) => i.symbol).join(",");
      const res = await fetch(`/api/quotes?symbols=${encodeURIComponent(symbols)}`, {
        cache: "no-store",
      });
      const data = (await res.json()) as { quotes: Quote[] };
      const map: Record<string, Quote> = {};
      for (const q of data.quotes ?? []) map[q.symbol] = q;
      setQuotes(map);
      setLastUpdate(new Date());
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000); // 每分鐘更新
    return () => clearInterval(id);
  }, []);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <header className="mb-3 flex items-center gap-2">
        <Globe2 size={16} className="text-indigo-600" />
        <h2 className="text-sm font-semibold text-gray-800">全球領先指標</h2>
        <span className="text-xs text-gray-500">期貨 · 商品 · 匯率 · 殖利率</span>
        {lastUpdate && (
          <span className="ml-auto text-[10px] text-gray-400">
            {lastUpdate.toLocaleTimeString("zh-TW")}
          </span>
        )}
      </header>

      <div className="space-y-2">
        {GROUPS.map((g) => {
          const items = ITEMS.filter((i) => i.group === g.id);
          return (
            <div key={g.id} className="flex items-center gap-2">
              <span className="w-20 shrink-0 text-[11px] font-semibold text-gray-600">
                {g.emoji} {g.label}
              </span>
              <div className="grid flex-1 grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4">
                {items.map((i) => (
                  <FutureCell key={i.symbol} item={i} quote={quotes[i.symbol]} loading={loading} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[10px] text-gray-400">
        每分鐘自動更新。美股期貨在台股盤中也持續變動，是預判台股下午 / 隔日方向的最重要領先指標。
      </p>
    </section>
  );
}

function FutureCell({
  item,
  quote,
  loading,
}: {
  item: Item;
  quote?: Quote;
  loading: boolean;
}) {
  const cp = quote?.changePercent;
  const colorClass =
    cp === undefined
      ? "text-gray-400"
      : cp > 0
        ? "text-red-600"
        : cp < 0
          ? "text-green-600"
          : "text-gray-600";

  const bgClass =
    cp === undefined
      ? "bg-gray-50"
      : Math.abs(cp) >= 2
        ? cp > 0
          ? "bg-red-50 border-red-200"
          : "bg-green-50 border-green-200"
        : "bg-gray-50 border-gray-200";

  const price = quote?.price;
  const priceFormatted =
    price === undefined
      ? "—"
      : item.isYieldPercent
        ? `${price.toFixed(2)}%`
        : item.decimals !== undefined
          ? price.toFixed(item.decimals)
          : price.toLocaleString("en-US", {
              minimumFractionDigits: price < 100 ? 2 : 0,
              maximumFractionDigits: 2,
            });

  return (
    <div
      className={`rounded border px-2 py-1 ${bgClass}`}
      title={item.label}
    >
      <div className="flex items-baseline justify-between gap-1">
        <span className="truncate text-[10px] font-medium text-gray-600">
          {item.short}
        </span>
        <span className={`shrink-0 text-[10px] tabular-nums font-semibold ${colorClass}`}>
          {cp === undefined ? (loading ? "…" : "—") : formatPercent(cp)}
        </span>
      </div>
      <div className="truncate text-sm font-bold tabular-nums text-gray-900">
        {priceFormatted}
      </div>
    </div>
  );
}
