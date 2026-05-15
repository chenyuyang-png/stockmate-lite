import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const yahooFinance = new YahooFinance();

export type EarningsEntry = {
  symbol: string;
  date: string; // YYYY-MM-DD
  region: "TW" | "US";
  epsEstimate?: number;
  epsLow?: number;
  epsHigh?: number;
  revenueEstimate?: number;
  marketCap?: number;
};

// 抓單一 symbol 的 calendarEvents
async function fetchEarningsForSymbol(symbol: string): Promise<EarningsEntry | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const qs: any = await yahooFinance.quoteSummary(
      symbol,
      { modules: ["calendarEvents", "price"] },
      { validateResult: false },
    );

    const ed = qs?.calendarEvents?.earnings?.earningsDate?.[0];
    if (!ed) return null;

    const date = new Date(ed instanceof Date ? ed : (ed as string | number));
    if (!Number.isFinite(date.getTime())) return null;

    // 只取未來 60 天內的
    const now = Date.now();
    const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000;
    if (date.getTime() < now - 24 * 60 * 60 * 1000 || date.getTime() > now + sixtyDaysMs) {
      return null;
    }

    return {
      symbol,
      date: date.toISOString().slice(0, 10),
      region: /\.(TW|TWO)$/i.test(symbol) ? "TW" : "US",
      epsEstimate: qs?.calendarEvents?.earnings?.earningsAverage,
      epsLow: qs?.calendarEvents?.earnings?.earningsLow,
      epsHigh: qs?.calendarEvents?.earnings?.earningsHigh,
      revenueEstimate: qs?.calendarEvents?.earnings?.revenueAverage,
      marketCap: qs?.price?.marketCap,
    };
  } catch {
    return null;
  }
}

// 並行限制
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

// GET /api/earnings-calendar?symbols=2330.TW,NVDA,AAPL
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get("symbols") ?? "";
  const symbols = symbolsParam.split(",").map((s) => s.trim()).filter(Boolean);

  if (symbols.length === 0) return NextResponse.json({ earnings: [] });

  const results = await mapWithConcurrency(symbols, 8, fetchEarningsForSymbol);
  const earnings = results
    .filter((e): e is EarningsEntry => e !== null)
    .sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({ earnings });
}
