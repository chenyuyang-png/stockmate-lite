"use client";

import { useEffect, useMemo, useState } from "react";
import { Newspaper, ExternalLink, RefreshCw, Loader2 } from "lucide-react";
import { useHoldings, useWatchlist } from "@/lib/storage";

type NewsItem = {
  title: string;
  link: string;
  isoDate?: string;
  pubDate?: string;
  source: string;
  contentSnippet?: string;
  symbols?: string[];
};

type Tab = "mine" | "tw" | "us" | "all";

const TABS: { id: Tab; label: string; flag: string }[] = [
  { id: "mine", label: "我的", flag: "⭐" },
  { id: "tw", label: "台股", flag: "🇹🇼" },
  { id: "us", label: "美股", flag: "🇺🇸" },
  { id: "all", label: "焦點", flag: "🌐" },
];

export function NewsFeed() {
  const [tab, setTab] = useState<Tab>("mine");
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { holdings } = useHoldings();
  const { items: watchlist } = useWatchlist();

  // 我的股票 = 持股 ∪ 自選股
  const mySymbols = useMemo(() => {
    const s = new Set<string>();
    for (const h of holdings) s.add(h.symbol);
    for (const w of watchlist) s.add(w.symbol);
    return Array.from(s);
  }, [holdings, watchlist]);

  async function fetchNews() {
    setLoading(true);
    try {
      const market = tab === "all" || tab === "mine" ? "all" : tab;
      const symbols = mySymbols.join(",");
      const res = await fetch(
        `/api/news?market=${market}&symbols=${encodeURIComponent(symbols)}`,
        { cache: "no-store" },
      );
      const data = (await res.json()) as { items: NewsItem[] };
      setItems(data.items ?? []);
      setLastUpdate(new Date());
    } catch (e) {
      console.error("[news]", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNews();
    const id = setInterval(fetchNews, 5 * 60_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, mySymbols.join(",")]);

  // 「我的」：只留有對應到我自選/持股股票的新聞
  const filteredItems = useMemo(() => {
    if (tab !== "mine") return items;
    return items.filter((i) => (i.symbols?.length ?? 0) > 0);
  }, [items, tab]);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Newspaper size={16} className="text-sky-600" />
          <h2 className="text-sm font-semibold text-gray-800">新聞</h2>
          {lastUpdate && (
            <span className="text-[10px] text-gray-400">
              更新於 {lastUpdate.toLocaleTimeString("zh-TW")}
            </span>
          )}
        </div>
        <button
          onClick={fetchNews}
          disabled={loading}
          className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
          aria-label="重新整理"
          title="重新整理"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </header>

      {/* Tabs */}
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
            {t.id === "mine" && mySymbols.length > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
                  tab === t.id
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {mySymbols.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 新聞列表 */}
      {loading && filteredItems.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-500">
          <Loader2 size={14} className="animate-spin" />
          <span>載入新聞中…</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">
          {tab === "mine"
            ? `沒有提到你${mySymbols.length} 檔股票的新聞，可切到「台股」/「美股」/「焦點」看更多。`
            : "目前沒有新聞。"}
        </p>
      ) : (
        <ul className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
          {filteredItems.map((item, i) => (
            <li
              key={`${item.link}-${i}`}
              className="rounded-md border border-gray-200 bg-gray-50 p-2.5 transition hover:border-gray-300 hover:bg-gray-100"
            >
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <div className="mb-1 flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span className="rounded bg-gray-200 px-1.5 py-0.5 font-medium text-gray-600">
                    {item.source}
                  </span>
                  <span className="text-gray-500">
                    {formatRelativeTime(item.isoDate)}
                  </span>
                  {item.symbols?.map((s) => (
                    <span
                      key={s}
                      className="rounded bg-red-100 px-1.5 py-0.5 font-semibold text-red-700"
                    >
                      {s.replace(/\.(TW|TWO)$/i, "")}
                    </span>
                  ))}
                  <ExternalLink size={10} className="ml-auto text-gray-400" />
                </div>
                <h3 className="text-sm font-medium leading-snug text-gray-900">
                  {item.title}
                </h3>
                {item.contentSnippet && (
                  <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-gray-600">
                    {item.contentSnippet}
                  </p>
                )}
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function formatRelativeTime(iso?: string): string {
  if (!iso) return "";
  const now = Date.now();
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const diffMin = Math.floor((now - t) / 60_000);
  if (diffMin < 1) return "剛剛";
  if (diffMin < 60) return `${diffMin} 分鐘前`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} 小時前`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay} 天前`;
  return new Date(iso).toLocaleDateString("zh-TW");
}
