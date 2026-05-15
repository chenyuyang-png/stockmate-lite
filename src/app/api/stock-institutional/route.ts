import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export type InstitutionalRow = {
  date: string;
  foreign: number; // 外資（買賣超）股數
  trust: number; // 投信（買賣超）股數
  dealer: number; // 自營商（買賣超）股數 = self + hedging
  total: number;
};

type FinMindRow = {
  date: string;
  stock_id: string;
  buy: number;
  sell: number;
  name: string; // Foreign_Investor | Investment_Trust | Dealer_self | Dealer_Hedging
};

// GET /api/stock-institutional?symbol=2330.TW&days=60
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") ?? "";
  const days = Math.min(180, Math.max(5, Number(searchParams.get("days") ?? "60")));

  if (!symbol) return NextResponse.json({ error: "missing symbol" }, { status: 400 });
  if (!/\.(TW|TWO)$/i.test(symbol)) {
    return NextResponse.json({ rows: [], note: "僅台股提供三大法人資料" });
  }

  const stockId = symbol.replace(/\.(TW|TWO)$/i, "");
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startStr = startDate.toISOString().slice(0, 10);

  // FinMind 免費 API（無需 token，每日有限額）
  // 若設定 FINMIND_TOKEN env 變數，則使用該 token（提升 rate limit）
  const token = process.env.FINMIND_TOKEN;
  const url = new URL("https://api.finmindtrade.com/api/v4/data");
  url.searchParams.set("dataset", "TaiwanStockInstitutionalInvestorsBuySell");
  url.searchParams.set("data_id", stockId);
  url.searchParams.set("start_date", startStr);
  if (token) url.searchParams.set("token", token);

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    const data = (await res.json()) as { status: number; msg: string; data?: FinMindRow[] };
    if (data.status !== 200 || !data.data) {
      return NextResponse.json(
        {
          rows: [],
          error: data.msg ?? "FinMind API error",
          hint: !token
            ? "FinMind 免費額度可能用完。可註冊 finmindtrade.com 取得 token 後設到 Vercel 環境變數 FINMIND_TOKEN。"
            : undefined,
        },
        { status: 503 },
      );
    }

    // 依日期聚合
    const byDate = new Map<string, InstitutionalRow>();
    for (const r of data.data) {
      const net = r.buy - r.sell;
      const row = byDate.get(r.date) ?? {
        date: r.date,
        foreign: 0,
        trust: 0,
        dealer: 0,
        total: 0,
      };
      if (r.name === "Foreign_Investor") row.foreign += net;
      else if (r.name === "Investment_Trust") row.trust += net;
      else if (r.name === "Dealer_self" || r.name === "Dealer_Hedging") row.dealer += net;
      row.total = row.foreign + row.trust + row.dealer;
      byDate.set(r.date, row);
    }

    const rows = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({ rows });
  } catch (err) {
    return NextResponse.json(
      {
        rows: [],
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
