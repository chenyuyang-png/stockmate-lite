import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
import type { OHLC } from "@/lib/types";
import { appendTodayBarIfMissing } from "@/lib/yahooChartSync";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const yahooFinance = new YahooFinance();

type Range = "5d" | "1mo" | "3mo" | "6mo" | "1y" | "2y" | "5y" | "max";
type Interval = "1d" | "1wk" | "1mo";

function rangeToPeriod1(range: Range): Date {
  const now = new Date();
  switch (range) {
    case "5d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "1mo":
      return new Date(now.setMonth(now.getMonth() - 1));
    case "3mo":
      return new Date(now.setMonth(now.getMonth() - 3));
    case "6mo":
      return new Date(now.setMonth(now.getMonth() - 6));
    case "1y":
      return new Date(now.setFullYear(now.getFullYear() - 1));
    case "2y":
      return new Date(now.setFullYear(now.getFullYear() - 2));
    case "5y":
      return new Date(now.setFullYear(now.getFullYear() - 5));
    case "max":
      return new Date("1990-01-01");
  }
}

// GET /api/chart?symbol=2330.TW&range=1y&interval=1d
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") ?? "";
  const range = (searchParams.get("range") ?? "6mo") as Range;
  const interval = (searchParams.get("interval") ?? "1d") as Interval;

  if (!symbol) {
    return NextResponse.json({ error: "missing symbol" }, { status: 400 });
  }

  try {
    const period1 = rangeToPeriod1(range);
    // 並行抓 chart bars + quote — quote 是用來合成「今日 bar」如果 chart 還沒收到的話
    const [result, quoteRaw] = await Promise.all([
      yahooFinance.chart(symbol, {
        period1,
        interval,
        includePrePost: false,
      }),
      yahooFinance.quote(symbol, {}, { validateResult: false }).catch(() => null),
    ]);

    let ohlc: OHLC[] = (result.quotes ?? [])
      .filter(
        (q) =>
          q.open !== null &&
          q.high !== null &&
          q.low !== null &&
          q.close !== null &&
          q.date,
      )
      .map((q) => ({
        time: new Date(q.date as unknown as string | number | Date)
          .toISOString()
          .slice(0, 10),
        open: q.open as number,
        high: q.high as number,
        low: q.low as number,
        close: q.close as number,
        volume: (q.volume as number | null) ?? 0,
      }));

    // 只對 daily K 補今日 bar — Yahoo 常常要等 1-2 小時才把當天 bar 加進來
    if (interval === "1d" && quoteRaw && !Array.isArray(quoteRaw)) {
      ohlc = appendTodayBarIfMissing(symbol, ohlc, quoteRaw);
    }

    return NextResponse.json({
      symbol,
      range,
      interval,
      meta: {
        currency: result.meta?.currency,
        exchangeName: result.meta?.exchangeName,
        instrumentType: result.meta?.instrumentType,
      },
      data: ohlc,
    });
  } catch (err) {
    console.error("[/api/chart] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error", data: [] },
      { status: 500 },
    );
  }
}
