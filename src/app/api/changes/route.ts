import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const yahooFinance = new YahooFinance();

export type RangeKey = "1d" | "5d" | "1mo" | "3mo" | "6mo" | "1y" | "ytd";

export type SymbolChange = {
  symbol: string;
  current: number;
  start: number;
  changePercent: number;
  range: RangeKey;
};

function rangeToPeriod1(range: RangeKey): Date {
  const now = new Date();
  switch (range) {
    case "1d":
      return new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 天保險
    case "5d":
      return new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    case "1mo":
      return new Date(now.setMonth(now.getMonth() - 1));
    case "3mo":
      return new Date(now.setMonth(now.getMonth() - 3));
    case "6mo":
      return new Date(now.setMonth(now.getMonth() - 6));
    case "1y":
      return new Date(now.setFullYear(now.getFullYear() - 1));
    case "ytd":
      return new Date(now.getFullYear(), 0, 1);
  }
}

// 並行限制：避免一次打 Yahoo 太多請求被擋
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

// 模組內 in-memory cache（同一個 lambda warm instance 內共享）
// 鍵：symbol|range → { value, asOf }
const cache = new Map<string, { value: SymbolChange | null; asOf: number }>();
const CACHE_TTL_MS = 5 * 60_000; // 5 分鐘

async function getChange(symbol: string, range: RangeKey): Promise<SymbolChange | null> {
  const key = `${symbol}|${range}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.asOf < CACHE_TTL_MS) return hit.value;

  try {
    const period1 = rangeToPeriod1(range);
    const result = await yahooFinance.chart(symbol, {
      period1,
      interval: "1d",
      includePrePost: false,
    });
    const quotes = (result.quotes ?? []).filter(
      (q) => q.close !== null && q.close !== undefined,
    );
    if (quotes.length < 2) {
      cache.set(key, { value: null, asOf: Date.now() });
      return null;
    }

    // 對於 1d：取最後一根 K 線的 close vs open，等同當日報酬
    if (range === "1d") {
      const last = quotes[quotes.length - 1];
      const open = last.open ?? last.close;
      const close = last.close ?? open;
      if (!open || open === 0) return null;
      const change = ((close! - open!) / open!) * 100;
      const v: SymbolChange = { symbol, current: close!, start: open!, changePercent: change, range };
      cache.set(key, { value: v, asOf: Date.now() });
      return v;
    }

    const start = quotes[0].close!;
    const last = quotes[quotes.length - 1].close!;
    if (start === 0) return null;
    const pct = ((last - start) / start) * 100;
    const v: SymbolChange = { symbol, current: last, start, changePercent: pct, range };
    cache.set(key, { value: v, asOf: Date.now() });
    return v;
  } catch {
    cache.set(key, { value: null, asOf: Date.now() });
    return null;
  }
}

// GET /api/changes?symbols=2330.TW,2454.TW&range=5d
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get("symbols") ?? "";
  const range = (searchParams.get("range") ?? "5d") as RangeKey;
  const symbols = symbolsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (symbols.length === 0) return NextResponse.json({ changes: [], range });

  const results = await mapWithConcurrency(symbols, 8, (s) => getChange(s, range));
  const changes = results.filter((r): r is SymbolChange => r !== null);
  return NextResponse.json({ changes, range });
}
