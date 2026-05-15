"use client";

import { useEffect, useState } from "react";

// 抓常用匯率（USDTWD），用於跨幣別總計換算
// 每 5 分鐘更新一次（匯率變化慢）

const PAIRS = ["USDTWD=X"]; // 之後要支援更多幣別在這加

type Rates = {
  // 例：{ USD: 31.354 }（表示 1 USD = 31.354 TWD）
  toTwd: Record<string, number>;
  asOf: number;
};

const FALLBACK_RATE = 31.5; // 抓不到時的保守估值

export function useExchangeRate(refreshMs = 5 * 60_000) {
  const [rates, setRates] = useState<Rates>({
    toTwd: { TWD: 1, USD: FALLBACK_RATE },
    asOf: 0,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchRates() {
      try {
        const res = await fetch(`/api/quotes?symbols=${PAIRS.join(",")}`, {
          cache: "no-store",
        });
        const data = (await res.json()) as {
          quotes: { symbol: string; price: number }[];
        };
        const toTwd: Record<string, number> = { TWD: 1 };
        for (const q of data.quotes ?? []) {
          if (q.symbol === "USDTWD=X" && q.price > 0) toTwd.USD = q.price;
        }
        if (!toTwd.USD) toTwd.USD = FALLBACK_RATE;
        if (!cancelled) setRates({ toTwd, asOf: Date.now() });
      } catch {
        /* 失敗時保留上一次 */
      }
    }

    fetchRates();
    const id = setInterval(fetchRates, refreshMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [refreshMs]);

  // 把任意幣別金額換算為 TWD
  function toTwd(amount: number, currency: string | undefined): number {
    const cur = (currency || "TWD").toUpperCase();
    const rate = rates.toTwd[cur] ?? 1;
    return amount * rate;
  }

  return { rates, toTwd };
}
