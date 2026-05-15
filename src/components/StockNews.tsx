"use client";

import { useEffect, useState } from "react";
import { Newspaper, ExternalLink, RefreshCw } from "lucide-react";

type NewsItem = {
  title: string;
  link: string;
  isoDate?: string;
  source: string;
  contentSnippet?: string;
};

type Props = {
  symbol: string;
};

export function StockNews({ symbol }: Props) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [keywords, setKeywords] = useState<string[]>([]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/stock-news?symbol=${encodeURIComponent(symbol)}`, {
        cache: "no-store",
      });
      const data = (await res.json()) as { items: NewsItem[]; keywords?: string[] };
      setItems(data.items ?? []);
      setKeywords(data.keywords ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol]);

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <header className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Newspaper size={14} className="text-sky-600" />
          <h3 className="text-sm font-semibold text-gray-700">個股新聞</h3>
          {keywords.length > 0 && (
            <span className="text-[10px] text-gray-500">
              關鍵字: {keywords.join(" / ")}
            </span>
          )}
        </div>
        <button
          onClick={load}
          className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
        </button>
      </header>

      {loading && items.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-500">載入中…</p>
      ) : items.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-500">沒有找到相關新聞。</p>
      ) : (
        <ul className="max-h-[400px] space-y-2 overflow-y-auto pr-1">
          {items.map((item, i) => (
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
                <div className="mb-1 flex items-center gap-2 text-[10px]">
                  <span className="rounded bg-gray-200 px-1.5 py-0.5 text-gray-500">
                    {item.source}
                  </span>
                  <span className="text-gray-500">{relativeTime(item.isoDate)}</span>
                  <ExternalLink size={10} className="ml-auto text-gray-400" />
                </div>
                <h4 className="text-sm font-medium leading-snug text-gray-800">
                  {item.title}
                </h4>
                {item.contentSnippet && (
                  <p className="mt-1 line-clamp-2 text-[11px] text-gray-500">
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

function relativeTime(iso?: string): string {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "剛剛";
  if (m < 60) return `${m} 分鐘前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小時前`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} 天前`;
  return new Date(iso).toLocaleDateString("zh-TW");
}
