"use client";

import { useEffect, useRef, useState } from "react";
import type { Quote } from "./types";

type QuotesMap = Record<string, Quote>;

// 共用的報價抓取 hook
// 給一組 symbols，每 30 秒自動刷新（盤中），回傳 { quote, loading, error, refresh }
export function useQuotes(symbols: string[], refreshMs = 30_000) {
  const [quotes, setQuotes] = useState<QuotesMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const symbolsKey = symbols.join(",");
  const symbolsRef = useRef(symbols);
  symbolsRef.current = symbols;

  async function fetchQuotes() {
    const current = symbolsRef.current;
    if (current.length === 0) {
      setQuotes({});
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/quotes?symbols=${encodeURIComponent(current.join(","))}`, {
        cache: "no-store",
      });
      const data = (await res.json()) as { quotes: Quote[]; error?: string };
      const map: QuotesMap = {};
      for (const q of data.quotes ?? []) {
        if (q.symbol) map[q.symbol] = q;
      }
      setQuotes(map);
      setError(data.error ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fetch error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    fetchQuotes();
    const id = setInterval(fetchQuotes, refreshMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbolsKey, refreshMs]);

  return { quotes, loading, error, refresh: fetchQuotes };
}
