import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export type BrokerSummary = {
  name: string; // 券商名稱
  branch?: string; // 分點（如「凱基-松山」）
  buy: number; // 累計買進張數
  sell: number; // 累計賣出張數
  net: number; // 淨買賣超 = buy - sell
  avgPrice?: number; // 加權平均成交價
};

export type BrokerDetailResponse = {
  symbol: string;
  asOfStart: string;
  asOfEnd: string;
  totalDays: number;
  topBuyers: BrokerSummary[];
  topSellers: BrokerSummary[];
  message?: string;
  hint?: string;
};

type FinMindRow = {
  date: string;
  stock_id: string;
  securities_trader: string; // 券商名稱（含分點）
  securities_trader_id?: string;
  buy: number; // 張
  sell: number; // 張
  price?: number;
};

// GET /api/stock-broker-detail?symbol=2327.TW&days=5
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") ?? "";
  const days = Math.min(20, Math.max(1, Number(searchParams.get("days") ?? "5")));

  if (!symbol)
    return NextResponse.json({ error: "missing symbol" }, { status: 400 });
  if (!/\.(TW|TWO)$/i.test(symbol)) {
    return NextResponse.json({
      symbol,
      asOfStart: "",
      asOfEnd: "",
      totalDays: 0,
      topBuyers: [],
      topSellers: [],
      message: "僅台股提供券商分點資料",
    } satisfies BrokerDetailResponse);
  }

  const stockId = symbol.replace(/\.(TW|TWO)$/i, "");
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days * 3); // 含週末 + 一些 buffer
  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);

  const token = process.env.FINMIND_TOKEN;

  const url = new URL("https://api.finmindtrade.com/api/v4/data");
  url.searchParams.set("dataset", "TaiwanStockTradingDailyReport");
  url.searchParams.set("data_id", stockId);
  url.searchParams.set("start_date", startStr);
  url.searchParams.set("end_date", endStr);
  if (token) url.searchParams.set("token", token);

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    const json = (await res.json()) as {
      status: number;
      msg: string;
      data?: FinMindRow[];
    };

    if (json.status !== 200 || !json.data || json.data.length === 0) {
      return NextResponse.json({
        symbol,
        asOfStart: "",
        asOfEnd: "",
        totalDays: 0,
        topBuyers: [],
        topSellers: [],
        message: token
          ? `FinMind 回傳空資料或受限：${json.msg ?? "未知"}（券商分點屬進階 dataset，可能需付費方案）`
          : "FinMind 券商分點為進階資料集，免費額度通常不含",
        hint: "請至 finmindtrade.com 升級付費方案後，將 token 設為 Vercel 環境變數 FINMIND_TOKEN",
      } satisfies BrokerDetailResponse);
    }

    // 依券商分組（保留含分點的完整名稱）
    const byBroker = new Map<string, BrokerSummary>();
    let totalBuyVolume = 0;
    let weightedSum = 0; // for avgPrice calc

    for (const row of json.data) {
      const name = row.securities_trader || "未知券商";
      const cur =
        byBroker.get(name) ??
        ({
          name,
          buy: 0,
          sell: 0,
          net: 0,
        } as BrokerSummary);

      cur.buy += row.buy ?? 0;
      cur.sell += row.sell ?? 0;
      cur.net = cur.buy - cur.sell;
      byBroker.set(name, cur);

      if (row.price && row.buy) {
        totalBuyVolume += row.buy;
        weightedSum += row.price * row.buy;
      }
    }

    const all = Array.from(byBroker.values()).filter(
      (b) => b.buy > 0 || b.sell > 0,
    );
    const topBuyers = [...all].sort((a, b) => b.net - a.net).slice(0, 15);
    const topSellers = [...all].sort((a, b) => a.net - b.net).slice(0, 15);

    const dates = [...new Set(json.data.map((d) => d.date))].sort();

    return NextResponse.json({
      symbol,
      asOfStart: dates[0] ?? "",
      asOfEnd: dates[dates.length - 1] ?? "",
      totalDays: dates.length,
      topBuyers,
      topSellers,
    } satisfies BrokerDetailResponse);
  } catch (err) {
    return NextResponse.json({
      symbol,
      asOfStart: "",
      asOfEnd: "",
      totalDays: 0,
      topBuyers: [],
      topSellers: [],
      message: `券商分點資料載入失敗：${err instanceof Error ? err.message : "未知錯誤"}`,
      hint: "可能 FinMind API 限流或網路問題，稍後再試",
    } satisfies BrokerDetailResponse);
  }
}
