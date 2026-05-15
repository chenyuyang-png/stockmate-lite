import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// TDCC 持股分級 (1-15 等級) 對照
// 1 股 = 1 share, 1000 股 = 1 張
// 散戶: < 100 張 (< 100,000 股)  → Lv 1-9
// 中實戶: 100-400 張             → Lv 10-11
// 大戶: > 400 張                 → Lv 12-15
const TIER_LABELS: Record<string, string> = {
  "1": "1-999 股",
  "2": "1,000-5,000 股",
  "3": "5,001-10,000 股",
  "4": "10,001-15,000 股",
  "5": "15,001-20,000 股",
  "6": "20,001-30,000 股",
  "7": "30,001-40,000 股",
  "8": "40,001-50,000 股",
  "9": "50,001-100,000 股",
  "10": "100,001-200,000 股",
  "11": "200,001-400,000 股",
  "12": "400,001-600,000 股",
  "13": "600,001-800,000 股",
  "14": "800,001-1,000,000 股",
  "15": "> 1,000,000 股",
};

export type DistributionRow = {
  level: string;
  label: string;
  people: number;
  shares: number;
  percentage: number;
};

export type ShareholderSummary = {
  retail: { people: number; shares: number; percentage: number }; // 散戶 (Lv 1-9)
  middle: { people: number; shares: number; percentage: number }; // 中實戶 (Lv 10-11)
  major: { people: number; shares: number; percentage: number }; // 大戶 (Lv 12-15)
  totalPeople: number;
};

export type ForeignRatioRow = {
  date: string;
  foreignRatio: number; // 外資持股比例 %
};

export type StockShareholding = {
  asOf: string; // TDCC 資料日期
  distribution: DistributionRow[];
  summary: ShareholderSummary;
  foreignHistory: ForeignRatioRow[]; // 外資持股比例歷史
};

// TDCC 資料快取（避免每次都打）— 一日內快取
let tdccCache: { data: Record<string, unknown>[]; fetchedAt: number } | null = null;
const TDCC_TTL = 6 * 60 * 60 * 1000; // 6 小時

async function getTdccData(): Promise<Record<string, unknown>[]> {
  if (tdccCache && Date.now() - tdccCache.fetchedAt < TDCC_TTL) {
    return tdccCache.data;
  }
  const res = await fetch("https://openapi.tdcc.com.tw/v1/opendata/1-5", {
    headers: { "User-Agent": "Mozilla/5.0" },
    cache: "no-store",
  });
  const data = (await res.json()) as Record<string, unknown>[];
  tdccCache = { data, fetchedAt: Date.now() };
  return data;
}

async function getForeignHistory(stockId: string): Promise<ForeignRatioRow[]> {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 3);
  const startStr = startDate.toISOString().slice(0, 10);

  const token = process.env.FINMIND_TOKEN;
  const url = new URL("https://api.finmindtrade.com/api/v4/data");
  url.searchParams.set("dataset", "TaiwanStockShareholding");
  url.searchParams.set("data_id", stockId);
  url.searchParams.set("start_date", startStr);
  if (token) url.searchParams.set("token", token);

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    const data = (await res.json()) as {
      status: number;
      data?: { date: string; ForeignInvestmentSharesRatio: number }[];
    };
    if (data.status !== 200 || !data.data) return [];
    return data.data
      .map((r) => ({ date: r.date, foreignRatio: r.ForeignInvestmentSharesRatio }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch {
    return [];
  }
}

// GET /api/stock-shareholding?symbol=2327.TW
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") ?? "";

  if (!symbol) return NextResponse.json({ error: "missing symbol" }, { status: 400 });
  if (!/\.(TW|TWO)$/i.test(symbol)) {
    return NextResponse.json({ error: "僅台股提供持股分級資料" }, { status: 400 });
  }

  const stockId = symbol.replace(/\.(TW|TWO)$/i, "");

  try {
    const [tdcc, foreignHistory] = await Promise.all([
      getTdccData(),
      getForeignHistory(stockId),
    ]);

    const stockRows = tdcc.filter(
      (r) => String((r as Record<string, string>)["證券代號"] ?? "").trim() === stockId,
    );
    if (stockRows.length === 0) {
      return NextResponse.json(
        { error: `TDCC 沒有 ${stockId} 的資料`, foreignHistory },
        { status: 404 },
      );
    }

    // 取最新日期
    const dateKey = Object.keys(stockRows[0]).find((k) => k.includes("資料日期")) ?? "資料日期";
    const asOf = String((stockRows[0] as Record<string, string>)[dateKey] ?? "");

    const distribution: DistributionRow[] = [];
    let retail = { people: 0, shares: 0, percentage: 0 };
    let middle = { people: 0, shares: 0, percentage: 0 };
    let major = { people: 0, shares: 0, percentage: 0 };
    let totalPeople = 0;

    for (const row of stockRows) {
      const r = row as Record<string, string>;
      const lvl = String(r["持股分級"] ?? "");
      const people = parseInt(r["人數"] ?? "0", 10);
      const shares = parseInt(r["股數"] ?? "0", 10);
      const pct = parseFloat(r["占集保庫存數比例%"] ?? "0");

      if (lvl === "17") {
        // 合計
        totalPeople = people;
        continue;
      }
      if (lvl === "16") continue; // 差異數
      if (!TIER_LABELS[lvl]) continue;

      distribution.push({
        level: lvl,
        label: TIER_LABELS[lvl],
        people,
        shares,
        percentage: pct,
      });

      const lvlNum = parseInt(lvl, 10);
      if (lvlNum <= 9) {
        retail.people += people;
        retail.shares += shares;
        retail.percentage += pct;
      } else if (lvlNum <= 11) {
        middle.people += people;
        middle.shares += shares;
        middle.percentage += pct;
      } else {
        major.people += people;
        major.shares += shares;
        major.percentage += pct;
      }
    }

    // 用 totalPeople 校正百分比（避免 floating point 誤差）
    if (totalPeople > 0) {
      retail = { ...retail, percentage: Math.round(retail.percentage * 100) / 100 };
      middle = { ...middle, percentage: Math.round(middle.percentage * 100) / 100 };
      major = { ...major, percentage: Math.round(major.percentage * 100) / 100 };
    }

    return NextResponse.json({
      asOf,
      distribution,
      summary: { retail, middle, major, totalPeople },
      foreignHistory,
    } satisfies StockShareholding);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
