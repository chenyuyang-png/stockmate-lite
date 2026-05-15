"use client";

import { useEffect, useRef, useState } from "react";
import type { RangeKey, SymbolChange } from "@/app/api/changes/route";

type ChangesMap = Record<string, SymbolChange>;

export function useChanges(symbols: string[], range: RangeKey, refreshMs = 5 * 60_000) {
  const [changes, setChanges] = useState<ChangesMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const key = symbols.join(",") + "|" + range;
  const ref = useRef({ symbols, range });
  ref.current = { symbols, range };

  async function load() {
    const { symbols: ss, range: r } = ref.current;
    if (ss.length === 0) {
      setChanges({});
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(
        `/api/changes?symbols=${encodeURIComponent(ss.join(","))}&range=${r}`,
        { cache: "no-store" },
      );
      const data = (await res.json()) as { changes: SymbolChange[]; error?: string };
      const map: ChangesMap = {};
      for (const c of data.changes ?? []) map[c.symbol] = c;
      setChanges(map);
      setError(data.error ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "fetch error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    load();
    const id = setInterval(load, refreshMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, refreshMs]);

  return { changes, loading, error, refresh: load };
}
