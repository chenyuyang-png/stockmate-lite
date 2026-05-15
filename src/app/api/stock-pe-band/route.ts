import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const yahooFinance = new YahooFinance();

export type PEBandPoint = {
  date: string;
  close: number;
  ttmEps: number;
  ttmPe: number;
};

export type PEBandResponse = {
  symbol: string;
  points: PEBandPoint[]; // 由舊到新
  bands: { multiplier: number; percentile: number }[]; // PE 河流邊界
  stats: {
    currentPrice: number;
    currentTtmEps: number;
    currentPe: number;
    medianPe: number;
    pePercentile: number; // 目前 PE 在歷史百分位
  } | null;
  message?: string;
};

type QuarterRow = { date: string; eps?: number };

function toDateStr(v: unknown): string {
  if (!v) return "";
  if (typeof v === "string") return v.slice(0, 10);
  if (typeof v === "number") {
    const ms = v > 1e12 ? v : v * 1000;
    return new Date(ms).toISOString().slice(0, 10);
  }
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return "";
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return NaN;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * p)));
  return sorted[idx];
}

// GET /api/stock-pe-band?symbol=2330.TW&years=3
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") ?? "";
  const years = Math.min(5, Math.max(1, Number(searchParams.get("years") ?? "3")));

  if (!symbol)
    return NextResponse.json({ error: "missing symbol" }, { status: 400 });

  try {
    // 1) 季度 EPS — 拉 5 年才有足夠 TTM 計算
    const epsYears = 5;
    const period1Eps = new Date();
    period1Eps.setFullYear(period1Eps.getFullYear() - epsYears);

    const earningsQuery = await yahooFinance.quoteSummary(symbol, {
      modules: ["earningsHistory", "incomeStatementHistoryQuarterly"],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eq: any = earningsQuery;

    // earningsHistory 提供季度 EPS（actual）
    const epsRows: QuarterRow[] = [];
    const ehArr = eq.earningsHistory?.history ?? [];
    for (const row of ehArr) {
      const date = toDateStr(row.quarter ?? row.quarter?.raw);
      const eps = row.epsActual?.raw ?? row.epsActual;
      if (date && typeof eps === "number") {
        epsRows.push({ date, eps });
      }
    }

    // Fallback：用 incomeStatementHistoryQuarterly 的 netIncome / sharesOutstanding（粗略）
    if (epsRows.length === 0) {
      const isq = eq.incomeStatementHistoryQuarterly?.incomeStatementHistory ?? [];
      for (const r of isq) {
        const date = toDateStr(r.endDate?.raw ?? r.endDate);
        const ni = r.netIncome?.raw ?? r.netIncome;
        if (date && typeof ni === "number") {
          // 沒有當下 shares，先標記 epsRows 為空（讓前端 fallback 顯示）
          // 不推回去
        }
      }
    }

    if (epsRows.length < 4) {
      return NextResponse.json({
        symbol,
        points: [],
        bands: [],
        stats: null,
        message: "EPS 季度資料不足 4 季，無法計算 TTM 本益比河流圖",
      } satisfies PEBandResponse);
    }

    // 排序（舊到新）
    epsRows.sort((a, b) => a.date.localeCompare(b.date));

    // 2) 價格歷史
    const period1 = new Date();
    period1.setFullYear(period1.getFullYear() - years);
    const chart = await yahooFinance.chart(symbol, {
      period1,
      interval: "1d",
      includePrePost: false,
    });

    const priceRows = (chart.quotes ?? [])
      .filter((q) => q.close !== null && q.close !== undefined && q.date)
      .map((q) => ({
        date: q.date instanceof Date ? q.date.toISOString().slice(0, 10) : String(q.date).slice(0, 10),
        close: q.close as number,
      }));

    if (priceRows.length === 0) {
      return NextResponse.json({
        symbol,
        points: [],
        bands: [],
        stats: null,
        message: "找不到價格歷史資料",
      } satisfies PEBandResponse);
    }

    // 3) 對每個價格日期，找到該日之前最近 4 季 EPS，加總 = TTM EPS
    const points: PEBandPoint[] = [];
    for (const p of priceRows) {
      // 該日期之前（含當日）的 EPS rows
      const past = epsRows.filter((e) => e.date <= p.date);
      if (past.length < 4) continue;
      const last4 = past.slice(-4);
      const ttmEps = last4.reduce(
        (sum, e) => sum + (typeof e.eps === "number" ? e.eps : 0),
        0,
      );
      if (ttmEps <= 0) continue; // 虧損股不畫 PE band
      const ttmPe = p.close / ttmEps;
      points.push({ date: p.date, close: p.close, ttmEps, ttmPe });
    }

    if (points.length < 20) {
      return NextResponse.json({
        symbol,
        points: [],
        bands: [],
        stats: null,
        message: points.length === 0
          ? "TTM EPS 為負或資料對齊失敗（虧損股無法畫 PE 河流圖）"
          : "資料點不足，請選擇較長期間",
      } satisfies PEBandResponse);
    }

    // 4) PE 百分位（5 條河流：10/30/50/70/90）
    const peSorted = [...points.map((p) => p.ttmPe)].sort((a, b) => a - b);
    const bands = [
      { percentile: 0.1, multiplier: percentile(peSorted, 0.1) },
      { percentile: 0.3, multiplier: percentile(peSorted, 0.3) },
      { percentile: 0.5, multiplier: percentile(peSorted, 0.5) },
      { percentile: 0.7, multiplier: percentile(peSorted, 0.7) },
      { percentile: 0.9, multiplier: percentile(peSorted, 0.9) },
    ];

    const latest = points[points.length - 1];
    const currentPePercentile =
      peSorted.findIndex((v) => v >= latest.ttmPe) / peSorted.length;

    return NextResponse.json({
      symbol,
      points,
      bands,
      stats: {
        currentPrice: latest.close,
        currentTtmEps: latest.ttmEps,
        currentPe: latest.ttmPe,
        medianPe: percentile(peSorted, 0.5),
        pePercentile: Math.max(0, Math.min(1, currentPePercentile)),
      },
    } satisfies PEBandResponse);
  } catch (e) {
    return NextResponse.json({
      symbol,
      points: [],
      bands: [],
      stats: null,
      message: `載入失敗：${e instanceof Error ? e.message : "未知"}`,
    } satisfies PEBandResponse);
  }
}
