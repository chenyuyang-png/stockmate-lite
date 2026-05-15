import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
import type { Quote } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const yahooFinance = new YahooFinance();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toQuote(r: any): Quote {
  // Yahoo 對 regularMarketTime / preMarketTime / postMarketTime 有時是 Date / 秒 / 毫秒
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toMs = (v: any): number | undefined => {
    if (v == null) return undefined;
    if (v instanceof Date) return v.getTime();
    if (typeof v === "number") return v > 1e12 ? v : v * 1000;
    return undefined;
  };

  return {
    symbol: r.symbol ?? "",
    name: r.shortName ?? r.longName ?? r.symbol ?? "",
    price: r.regularMarketPrice ?? 0,
    change: r.regularMarketChange ?? 0,
    changePercent: r.regularMarketChangePercent ?? 0,
    volume: r.regularMarketVolume,
    marketCap: r.marketCap,
    currency: r.currency,
    marketState: r.marketState,
    marketTime: toMs(r.regularMarketTime),
    preMarketPrice: r.preMarketPrice,
    preMarketChange: r.preMarketChange,
    preMarketChangePercent: r.preMarketChangePercent,
    postMarketPrice: r.postMarketPrice,
    postMarketChange: r.postMarketChange,
    postMarketChangePercent: r.postMarketChangePercent,
    eps: r.epsTrailingTwelveMonths,
    pe: r.trailingPE,
    dividendYield: r.dividendYield,
  };
}

async function fetchQuotes(symbols: string[]): Promise<Quote[]> {
  if (symbols.length === 0) return [];
  const raw = await yahooFinance.quote(symbols, {}, { validateResult: false });
  const list = Array.isArray(raw) ? raw : [raw];
  return list.filter((r): r is NonNullable<typeof r> => Boolean(r)).map(toQuote);
}

// 批次取得多檔報價
// GET /api/quotes?symbols=2330.TW,AAPL,^TWII
// 如果 .TW 抓不到，會自動 fallback 試 .TWO
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get("symbols") ?? "";
  const symbols = symbolsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (symbols.length === 0) {
    return NextResponse.json({ quotes: [] });
  }

  try {
    const quotes = await fetchQuotes(symbols);
    const found = new Set(quotes.map((q) => q.symbol));

    // 對於沒抓到的 .TW 台股，自動試 .TWO（上櫃）
    // 反方向：對於沒抓到的 .TWO 上櫃股，也試 .TW（避免反向誤判）
    const missingTwToTwo = symbols.filter(
      (s) => !found.has(s) && /^\d{4,6}\.TW$/i.test(s),
    );
    if (missingTwToTwo.length > 0) {
      const fallback = missingTwToTwo.map((s) => s.replace(/\.TW$/i, ".TWO"));
      try {
        const fbQuotes = await fetchQuotes(fallback);
        for (const q of fbQuotes) {
          // 把回傳的 .TWO symbol 對應回原本使用者請求的 .TW（讓前端 lookup 對得到）
          const original = missingTwToTwo.find(
            (o) => o.replace(/\.TW$/i, ".TWO") === q.symbol,
          );
          if (original && !found.has(original)) {
            q.symbol = original;
            quotes.push(q);
            found.add(original);
          }
        }
      } catch {
        /* fallback 失敗就略過 */
      }
    }

    const missingTwoToTw = symbols.filter(
      (s) => !found.has(s) && /^\d{4,6}\.TWO$/i.test(s),
    );
    if (missingTwoToTw.length > 0) {
      const fallback = missingTwoToTw.map((s) => s.replace(/\.TWO$/i, ".TW"));
      try {
        const fbQuotes = await fetchQuotes(fallback);
        for (const q of fbQuotes) {
          const original = missingTwoToTw.find(
            (o) => o.replace(/\.TWO$/i, ".TW") === q.symbol,
          );
          if (original && !found.has(original)) {
            q.symbol = original;
            quotes.push(q);
            found.add(original);
          }
        }
      } catch {
        /* fallback 失敗就略過 */
      }
    }

    return NextResponse.json({ quotes });
  } catch (err) {
    console.error("[/api/quotes] error:", err);
    return NextResponse.json(
      { quotes: [], error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
