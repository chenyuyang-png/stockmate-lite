import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const yahooFinance = new YahooFinance();

export type MoverEntry = {
  symbol: string;
  name?: string;
  regularPrice?: number;
  regularChangePercent?: number;
  preMarketPrice?: number;
  preMarketChange?: number;
  preMarketChangePercent?: number;
  postMarketPrice?: number;
  postMarketChange?: number;
  postMarketChangePercent?: number;
  marketState?: string; // PRE | REGULAR | POST | CLOSED
};

// GET /api/premarket-movers?symbols=NVDA,SNDK,AAPL
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get("symbols") ?? "";
  const symbols = symbolsParam.split(",").map((s) => s.trim()).filter(Boolean);

  if (symbols.length === 0) return NextResponse.json({ movers: [] });

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: any = await yahooFinance.quote(symbols, {}, { validateResult: false });
    const list = Array.isArray(raw) ? raw : [raw];

    const movers: MoverEntry[] = list
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((r: any) => r && r.symbol)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((r: any) => ({
        symbol: r.symbol,
        name: r.shortName || r.longName,
        regularPrice: r.regularMarketPrice,
        regularChangePercent: r.regularMarketChangePercent,
        preMarketPrice: r.preMarketPrice,
        preMarketChange: r.preMarketChange,
        preMarketChangePercent: r.preMarketChangePercent,
        postMarketPrice: r.postMarketPrice,
        postMarketChange: r.postMarketChange,
        postMarketChangePercent: r.postMarketChangePercent,
        marketState: r.marketState,
      }));

    return NextResponse.json({ movers });
  } catch (err) {
    return NextResponse.json(
      { movers: [], error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
