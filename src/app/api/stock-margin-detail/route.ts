import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export type MarginShortRow = {
  date: string;
  marginBalance: number; // 融資餘額（張）
  marginChange: number; // 較前日變化
  marginBuy: number;
  marginSell: number;
  shortBalance: number; // 融券餘額（張）
  shortChange: number;
  shortBuy: number;
  shortSell: number;
};

type FinMindRow = {
  date: string;
  stock_id: string;
  MarginPurchaseBuy: number;
  MarginPurchaseSell: number;
  MarginPurchaseTodayBalance: number;
  MarginPurchaseYesterdayBalance: number;
  ShortSaleBuy: number;
  ShortSaleSell: number;
  ShortSaleTodayBalance: number;
  ShortSaleYesterdayBalance: number;
};

// GET /api/stock-margin-detail?symbol=2327.TW&days=60
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") ?? "";
  const days = Math.min(180, Math.max(5, Number(searchParams.get("days") ?? "60")));

  if (!symbol) return NextResponse.json({ error: "missing symbol" }, { status: 400 });
  if (!/\.(TW|TWO)$/i.test(symbol)) {
    return NextResponse.json({ rows: [], note: "僅台股提供融資融券資料" });
  }

  const stockId = symbol.replace(/\.(TW|TWO)$/i, "");
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startStr = startDate.toISOString().slice(0, 10);

  const token = process.env.FINMIND_TOKEN;
  const url = new URL("https://api.finmindtrade.com/api/v4/data");
  url.searchParams.set("dataset", "TaiwanStockMarginPurchaseShortSale");
  url.searchParams.set("data_id", stockId);
  url.searchParams.set("start_date", startStr);
  if (token) url.searchParams.set("token", token);

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    const data = (await res.json()) as { status: number; msg: string; data?: FinMindRow[] };

    if (data.status !== 200 || !data.data) {
      return NextResponse.json(
        { rows: [], error: data.msg ?? "FinMind error" },
        { status: 503 },
      );
    }

    const rows: MarginShortRow[] = data.data
      .map((r) => ({
        date: r.date,
        marginBalance: r.MarginPurchaseTodayBalance,
        marginChange:
          r.MarginPurchaseTodayBalance - r.MarginPurchaseYesterdayBalance,
        marginBuy: r.MarginPurchaseBuy,
        marginSell: r.MarginPurchaseSell,
        shortBalance: r.ShortSaleTodayBalance,
        shortChange: r.ShortSaleTodayBalance - r.ShortSaleYesterdayBalance,
        shortBuy: r.ShortSaleBuy,
        shortSell: r.ShortSaleSell,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({ rows });
  } catch (err) {
    return NextResponse.json(
      { rows: [], error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
