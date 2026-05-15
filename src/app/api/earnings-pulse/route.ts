import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const yahooFinance = new YahooFinance();

export type EarningsSignal =
  | "double-up" // 營收 + EPS 雙增 YoY
  | "rev-up-eps-down" // 營收增 EPS 衰（毛利壓力）
  | "rev-down-eps-up" // 營收衰 EPS 增（效率改善 / 一次性）
  | "double-down" // 雙減
  | "no-eps"
  | "unknown";

export type RecentEarnings = {
  date: string; // 公布或財報結束日 (YYYY-MM-DD)
  revenue?: number;
  eps?: number;
  revenueYoY?: number;
  epsYoY?: number;
  revenueQoQ?: number;
  epsQoQ?: number;
  signal: EarningsSignal;
};

export type RecentMonthRevenue = {
  yearMonth: string; // YYYY-MM
  announceDate: string;
  revenue: number; // NTD
  yoyChange?: number;
  momChange?: number;
};

export type EarningsPulseItem = {
  symbol: string;
  region: "TW" | "US";
  recentEarnings?: RecentEarnings;
  nextEarningsDate?: string;
  recentMonthRevenue?: RecentMonthRevenue;
  nextMonthRevenueDate?: string;
  error?: string;
};

export type EarningsPulseResponse = {
  items: EarningsPulseItem[];
  asOf: number;
};

// ─── Helpers ───────────────────────────────────────────────
function toDateStr(v: unknown): string {
  if (!v) return "";
  if (typeof v === "string") return v.slice(0, 10);
  if (typeof v === "number") {
    const ms = v > 1e12 ? v : v * 1000;
    return new Date(ms).toISOString().slice(0, 10);
  }
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object" && v !== null) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj = v as any;
    if (typeof obj.raw === "number") {
      const ms = obj.raw > 1e12 ? obj.raw : obj.raw * 1000;
      return new Date(ms).toISOString().slice(0, 10);
    }
    if (typeof obj.fmt === "string") return obj.fmt.slice(0, 10);
  }
  return "";
}

function rawNumber(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "object" && v !== null) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj = v as any;
    if (typeof obj.raw === "number" && Number.isFinite(obj.raw)) return obj.raw;
  }
  return undefined;
}

function pctChange(a?: number, b?: number): number | undefined {
  if (typeof a !== "number" || typeof b !== "number" || b === 0) return undefined;
  if (!Number.isFinite(a) || !Number.isFinite(b)) return undefined;
  return ((a - b) / Math.abs(b)) * 100;
}

// ─── Earnings (Yahoo) ──────────────────────────────────────
async function fetchEarnings(symbol: string): Promise<{
  recent?: RecentEarnings;
  next?: string;
}> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const summary: any = await yahooFinance.quoteSummary(symbol, {
      modules: [
        "earningsHistory",
        "incomeStatementHistoryQuarterly",
        "calendarEvents",
      ],
    });

    // Quarterly EPS (actual)
    const epsHistory = (summary?.earningsHistory?.history ?? []) as unknown[];
    const epsByDate = new Map<string, number>();
    for (const e of epsHistory) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj = e as any;
      const date = toDateStr(obj.quarter);
      const eps = rawNumber(obj.epsActual);
      if (date && typeof eps === "number") epsByDate.set(date, eps);
    }

    // Quarterly income statement
    const isq = (summary?.incomeStatementHistoryQuarterly
      ?.incomeStatementHistory ?? []) as unknown[];

    type Q = { date: string; revenue?: number; eps?: number };
    const quarters: Q[] = isq
      .map((r) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obj = r as any;
        const date = toDateStr(obj.endDate);
        const revenue = rawNumber(obj.totalRevenue);
        return { date, revenue };
      })
      .filter((q) => q.date)
      .map((q) => ({ ...q, eps: epsByDate.get(q.date) }))
      .sort((a, b) => a.date.localeCompare(b.date));

    let recent: RecentEarnings | undefined;
    if (quarters.length > 0) {
      const latest = quarters[quarters.length - 1];
      const yoy = quarters[quarters.length - 5]; // 同季前一年
      const qoq = quarters[quarters.length - 2];

      const revYoY = pctChange(latest.revenue, yoy?.revenue);
      const epsYoY = pctChange(latest.eps, yoy?.eps);
      const revQoQ = pctChange(latest.revenue, qoq?.revenue);
      const epsQoQ = pctChange(latest.eps, qoq?.eps);

      // signal 判定：優先用 YoY（同期比較較有意義），無 YoY 時 fallback 用 QoQ
      let signal: EarningsSignal;
      const useEps = typeof epsYoY === "number" ? epsYoY : epsQoQ;
      const useRev = typeof revYoY === "number" ? revYoY : revQoQ;

      if (typeof useEps !== "number" && typeof useRev !== "number") {
        signal = "unknown";
      } else if (typeof useEps !== "number") {
        signal = "no-eps";
      } else {
        const rev = useRev ?? 0;
        if (rev > 0 && useEps > 0) signal = "double-up";
        else if (rev > 0 && useEps <= 0) signal = "rev-up-eps-down";
        else if (rev <= 0 && useEps > 0) signal = "rev-down-eps-up";
        else signal = "double-down";
      }

      recent = {
        date: latest.date,
        revenue: latest.revenue,
        eps: latest.eps,
        revenueYoY: revYoY,
        epsYoY,
        revenueQoQ: revQoQ,
        epsQoQ,
        signal,
      };
    }

    // Next earnings date
    let next: string | undefined;
    const ce = summary?.calendarEvents?.earnings;
    if (ce?.earningsDate) {
      const dates = Array.isArray(ce.earningsDate)
        ? ce.earningsDate
        : [ce.earningsDate];
      const dStrs = dates.map(toDateStr).filter(Boolean).sort();
      next = dStrs[0];
    }

    return { recent, next };
  } catch {
    return {};
  }
}

// ─── TW Monthly Revenue (FinMind) ──────────────────────────
async function fetchTwMonthRevenue(symbol: string): Promise<{
  recent?: RecentMonthRevenue;
  next?: string;
}> {
  const code = symbol.replace(/\.(TW|TWO)$/i, "");
  const start = new Date();
  start.setMonth(start.getMonth() - 18); // 18 個月歷史足以計算 YoY + MoM
  const startStr = start.toISOString().slice(0, 10);

  const token = process.env.FINMIND_TOKEN;
  const url = new URL("https://api.finmindtrade.com/api/v4/data");
  url.searchParams.set("dataset", "TaiwanStockMonthRevenue");
  url.searchParams.set("data_id", code);
  url.searchParams.set("start_date", startStr);
  if (token) url.searchParams.set("token", token);

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) return {};
    const json = await res.json();
    type Row = {
      date: string;
      revenue: number;
      revenue_year: number;
      revenue_month: number;
    };
    const rows = ((json?.data as Row[] | undefined) ?? [])
      .filter((r) => typeof r.revenue === "number")
      .sort((a, b) => a.date.localeCompare(b.date));

    if (rows.length === 0) return {};

    const latest = rows[rows.length - 1];
    const yoy = rows[rows.length - 13]; // 12 個月前
    const mom = rows[rows.length - 2];

    const recent: RecentMonthRevenue = {
      yearMonth: `${latest.revenue_year}-${String(latest.revenue_month).padStart(2, "0")}`,
      announceDate: latest.date,
      revenue: latest.revenue,
      yoyChange: pctChange(latest.revenue, yoy?.revenue),
      momChange: pctChange(latest.revenue, mom?.revenue),
    };

    // 估算下次公告日：latest 是 N 月營收，下次將公告 N+1 月，預估在 N+2 月 10 號
    let ny = latest.revenue_year;
    let nm = latest.revenue_month + 1;
    if (nm > 12) {
      nm -= 12;
      ny++;
    }
    let am = nm + 1;
    let ay = ny;
    if (am > 12) {
      am -= 12;
      ay++;
    }
    const next = `${ay}-${String(am).padStart(2, "0")}-10`;

    return { recent, next };
  } catch {
    return {};
  }
}

// ─── Main handler ──────────────────────────────────────────
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
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker),
  );
  return out;
}

// GET /api/earnings-pulse?symbols=2330.TW,NVDA,...
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get("symbols") ?? "";
  const symbols = symbolsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (symbols.length === 0) {
    return NextResponse.json({
      items: [],
      asOf: Date.now(),
    } satisfies EarningsPulseResponse);
  }

  const items = await mapWithConcurrency(
    symbols,
    5,
    async (symbol): Promise<EarningsPulseItem> => {
      const region: "TW" | "US" = /\.(TW|TWO)$/i.test(symbol) ? "TW" : "US";
      const [earnings, monthRev] = await Promise.all([
        fetchEarnings(symbol),
        region === "TW"
          ? fetchTwMonthRevenue(symbol)
          : Promise.resolve({ recent: undefined, next: undefined }),
      ]);
      return {
        symbol,
        region,
        recentEarnings: earnings.recent,
        nextEarningsDate: earnings.next,
        recentMonthRevenue: monthRev.recent,
        nextMonthRevenueDate: monthRev.next,
      };
    },
  );

  return NextResponse.json({
    items,
    asOf: Date.now(),
  } satisfies EarningsPulseResponse);
}
