"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import type { SearchResult } from "@/app/api/search/route";

type Props = {
  onSelect: (result: SearchResult) => void;
  placeholder?: string;
  autoFocus?: boolean;
};

// 含中文／英文／代碼 typeahead 的搜尋輸入框
export function StockSearch({ onSelect, placeholder = "搜尋：台積電、2330、AAPL、輝達…", autoFocus }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // 抖動搜尋
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: ctrl.signal,
        });
        const data = (await res.json()) as { results: SearchResult[] };
        setResults(data.results ?? []);
        setHighlight(0);
      } catch {
        /* aborted or failed */
      } finally {
        setLoading(false);
      }
    }, 150);
    return () => {
      ctrl.abort();
      clearTimeout(timer);
    };
  }, [query]);

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(results.length - 1, h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[highlight]) {
        select(results[highlight]);
      } else if (query.trim()) {
        // 沒匹配：當作裸代碼處理
        select({
          symbol: query.trim().toUpperCase(),
          name: query.trim(),
          region: /^\d/.test(query.trim()) ? "TW" : "US",
          source: "yahoo",
        });
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function select(r: SearchResult) {
    onSelect(r);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 pl-9 text-sm text-gray-800 placeholder:text-gray-400 focus:border-red-500 focus:outline-none"
        />
        {loading && (
          <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-gray-200 bg-gray-100 shadow-xl">
          {results.map((r, i) => {
            const cleanCode = r.symbol.replace(/\.(TW|TWO)$/i, "");
            return (
              <button
                key={r.symbol}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(r)}
                onMouseEnter={() => setHighlight(i)}
                className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm ${
                  i === highlight ? "bg-gray-200" : "hover:bg-gray-200"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-gray-800">{r.name}</div>
                  {r.english && (
                    <div className="truncate text-[10px] text-gray-500">{r.english}</div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-mono text-gray-500">{cleanCode}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] ${
                      r.region === "TW" ? "bg-amber-50 text-amber-700" : "bg-sky-50 text-sky-700"
                    }`}
                  >
                    {r.region}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
