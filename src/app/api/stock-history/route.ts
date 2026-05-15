import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const yahooFinance = new YahooFinance();

export type QuarterRow = {
  date: string; // YYYY-MM-DD
  revenue?: number;
  grossProfit?: number;
  operatingIncome?: number;
  netIncome?: number;
  eps?: number;
};

export type DividendRow = {
  date: string; // YYYY-MM-DD
  amount: number;
};

export type StockHistory = {
  quarters: QuarterRow[]; // 由舊到新
  dividends: DividendRow[]; // 由舊到新
  upcoming: {
    nextEarnings?: string;
    earningsEstimate?: { low?: number; high?: number; average?: number };
    revenueEstimate?: { low?: number; high?: number; average?: number };
    exDividendDate?: string;
    dividendDate?: string;
  };
};

// 把 epoch / Date / 字串統一轉成 YYYY-MM-DD
function toDateStr(v: unknown): string {
  if (!v) return "";
  if (typeof v === "string") return v.slice(0, 10);
  if (typeof v === "number") {
    // Yahoo 用秒，不是毫秒
    const ms = v > 1e12 ? v : v * 1000;
    return new Date(ms).toISOString().slice(0, 10);
  }
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return "";
}

// GET /api/stock-history?symbol=2330.TW&years=5
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") ?? "";
  const years = Math.min(10, Math.max(1, Number(searchParams.get("years") ?? "5")));
  if (!symbol) return NextResponse.json({ error: "missing symbol" }, { status: 400 });

  try {
    const period1 = new Date();
    period1.setFullYear(period1.getFullYear() - years);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [qsAny, chart]: [any, any] = await Promise.all([
      yahooFinance
        .quoteSummary(
          symbol,
          {
            modules: [
              "incomeStatementHistoryQuarterly",
              "earningsHistory",
              "calendarEvents",
            ],
          },
          { validateResult: false },
        )
        .catch(() => null),
      yahooFinance
        .chart(
          symbol,
          { period1, interval: "1d", events: "div" },
          { validateResult: false },
        )
        .catch(() => null),
    ]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const qs: any = qsAny;

    // 季度財報 + EPS 合併
    const incomeStmts =
      qs?.incomeStatementHistoryQuarterly?.incomeStatementHistory ?? [];
    const epsHistory = qs?.earningsHistory?.history ?? [];
    const epsByDate = new Map<string, number>();
    for (const e of epsHistory) {
      const d = toDateStr(e.quarter as unknown);
      const eps = e.epsActual as unknown;
      if (d && typeof eps === "number") epsByDate.set(d, eps);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const quarters: QuarterRow[] = (incomeStmts as any[])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((q: any): QuarterRow => {
        const date = toDateStr(q.endDate as unknown);
        return {
          date,
          revenue: q.totalRevenue as number | undefined,
          grossProfit: q.grossProfit as number | undefined,
          operatingIncome: (q.operatingIncome ?? q.ebit) as number | undefined,
          netIncome: q.netIncome as number | undefined,
          eps: epsByDate.get(date),
        };
      })
      .filter((q) => q.date)
      .sort((a, b) => a.date.localeCompare(b.date)); // 由舊到新

    // 股利
    const divEvents = chart?.events?.dividends ?? [];
    const dividends: DividendRow[] = (divEvents as { date: Date | number | string; amount: number }[])
      .map((d) => ({ date: toDateStr(d.date as unknown), amount: d.amount }))
      .filter((d) => d.date)
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calendar events
    const cal = qs?.calendarEvents;
    const upcoming: StockHistory["upcoming"] = {};
    if (cal?.earnings?.earningsDate?.[0]) {
      upcoming.nextEarnings = toDateStr(cal.earnings.earningsDate[0] as unknown);
    }
    if (cal?.earnings) {
      upcoming.earningsEstimate = {
        low: cal.earnings.earningsLow as number | undefined,
        high: cal.earnings.earningsHigh as number | undefined,
        average: cal.earnings.earningsAverage as number | undefined,
      };
      upcoming.revenueEstimate = {
        low: cal.earnings.revenueLow as number | undefined,
        high: cal.earnings.revenueHigh as number | undefined,
        average: cal.earnings.revenueAverage as number | undefined,
      };
    }
    if (cal?.exDividendDate) {
      upcoming.exDividendDate = toDateStr(cal.exDividendDate as unknown);
    }
    if (cal?.dividendDate) {
      upcoming.dividendDate = toDateStr(cal.dividendDate as unknown);
    }

    return NextResponse.json({ quarters, dividends, upcoming } satisfies StockHistory);
  } catch (err) {
    console.error("[/api/stock-history]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
