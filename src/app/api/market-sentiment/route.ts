import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const yahooFinance = new YahooFinance();

export type FearGreedIndex = {
  value: number; // 0-100
  rating: string; // Extreme Fear / Fear / Neutral / Greed / Extreme Greed
  previousClose?: number;
  weekAgo?: number;
  monthAgo?: number;
};

export type VixData = {
  current: number;
  change: number;
  changePercent: number;
};

export type MarketSentimentResponse = {
  vix?: VixData;
  fearGreed?: FearGreedIndex;
  asOf: number;
  errors?: string[];
};

// Module-level cache (1 hour — F&G/VIX 變化慢，且 CNN F&G 一天才會大改)
let cache: { data: MarketSentimentResponse; at: number } | null = null;
const TTL = 60 * 60_000;

export async function GET() {
  if (cache && Date.now() - cache.at < TTL) {
    return NextResponse.json(cache.data);
  }

  const errors: string[] = [];
  const out: MarketSentimentResponse = { asOf: Date.now() };

  // VIX from Yahoo
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const q: any = await yahooFinance.quote("^VIX");
    if (q && typeof q.regularMarketPrice === "number") {
      out.vix = {
        current: q.regularMarketPrice,
        change: q.regularMarketChange ?? 0,
        changePercent: q.regularMarketChangePercent ?? 0,
      };
    }
  } catch (e) {
    errors.push(`VIX: ${e instanceof Error ? e.message : "unknown"}`);
  }

  // CNN Fear & Greed
  try {
    const res = await fetch(
      "https://production.dataviz.cnn.io/index/fearandgreed/graphdata",
      {
        headers: {
          // CNN's endpoint requires a UA
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
          accept: "application/json",
        },
        cache: "no-store",
      },
    );
    if (res.ok) {
      const json = await res.json();
      const cur = json?.fear_and_greed;
      if (cur && typeof cur.score === "number") {
        out.fearGreed = {
          value: Math.round(cur.score),
          rating: cur.rating ?? deriveRating(cur.score),
          previousClose:
            typeof cur.previous_close === "number"
              ? Math.round(cur.previous_close)
              : undefined,
          weekAgo:
            typeof cur.previous_1_week === "number"
              ? Math.round(cur.previous_1_week)
              : undefined,
          monthAgo:
            typeof cur.previous_1_month === "number"
              ? Math.round(cur.previous_1_month)
              : undefined,
        };
      }
    } else {
      errors.push(`F&G: HTTP ${res.status}`);
    }
  } catch (e) {
    errors.push(`F&G: ${e instanceof Error ? e.message : "unknown"}`);
  }

  if (errors.length > 0) out.errors = errors;

  cache = { data: out, at: Date.now() };
  return NextResponse.json(out);
}

function deriveRating(score: number): string {
  if (score <= 25) return "Extreme Fear";
  if (score <= 45) return "Fear";
  if (score <= 55) return "Neutral";
  if (score <= 75) return "Greed";
  return "Extreme Greed";
}
