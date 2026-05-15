import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export type InstitutionalTotal = {
  date: string;
  foreign: { buy: number; sell: number; net: number }; // 外資
  trust: { buy: number; sell: number; net: number }; // 投信
  dealerSelf: { buy: number; sell: number; net: number }; // 自營商-自行
  dealerHedge: { buy: number; sell: number; net: number }; // 自營商-避險
  foreignDealer: { buy: number; sell: number; net: number }; // 外資自營商
  total: { buy: number; sell: number; net: number };
};

export type MarginTotal = {
  date: string;
  marginPurchase: {
    today: number;
    yesterday: number;
    change: number;
    buy: number;
    sell: number;
    returnQty: number;
  };
  shortSale: {
    today: number;
    yesterday: number;
    change: number;
    buy: number;
    sell: number;
    returnQty: number;
  };
};

type FinMindInstRow = { buy: number; sell: number; date: string; name: string };
type FinMindMarginRow = {
  TodayBalance: number;
  YesBalance: number;
  buy: number;
  sell: number;
  Return: number;
  date: string;
  name: string;
};

const FINMIND = "https://api.finmindtrade.com/api/v4/data";

async function fetchInstitutional(): Promise<InstitutionalTotal | null> {
  // 抓近 10 天，取最新有資料的日期
  const start = new Date();
  start.setDate(start.getDate() - 10);
  const startStr = start.toISOString().slice(0, 10);

  const token = process.env.FINMIND_TOKEN;
  const url = new URL(FINMIND);
  url.searchParams.set("dataset", "TaiwanStockTotalInstitutionalInvestors");
  url.searchParams.set("start_date", startStr);
  if (token) url.searchParams.set("token", token);

  const res = await fetch(url.toString(), { cache: "no-store" });
  const data = (await res.json()) as { status: number; data?: FinMindInstRow[] };
  if (data.status !== 200 || !data.data || data.data.length === 0) return null;

  // 取最新日期
  const latestDate = data.data.reduce((max, r) => (r.date > max ? r.date : max), "");
  const todayRows = data.data.filter((r) => r.date === latestDate);

  function pick(name: string) {
    const r = todayRows.find((x) => x.name === name);
    if (!r) return { buy: 0, sell: 0, net: 0 };
    return { buy: r.buy, sell: r.sell, net: r.buy - r.sell };
  }

  const foreign = pick("Foreign_Investor");
  const trust = pick("Investment_Trust");
  const dealerSelf = pick("Dealer_self");
  const dealerHedge = pick("Dealer_Hedging");
  const foreignDealer = pick("Foreign_Dealer_Self");

  const total = {
    buy: foreign.buy + trust.buy + dealerSelf.buy + dealerHedge.buy + foreignDealer.buy,
    sell:
      foreign.sell + trust.sell + dealerSelf.sell + dealerHedge.sell + foreignDealer.sell,
    net:
      foreign.net + trust.net + dealerSelf.net + dealerHedge.net + foreignDealer.net,
  };

  return {
    date: latestDate,
    foreign,
    trust,
    dealerSelf,
    dealerHedge,
    foreignDealer,
    total,
  };
}

async function fetchMargin(): Promise<MarginTotal | null> {
  const start = new Date();
  start.setDate(start.getDate() - 10);
  const startStr = start.toISOString().slice(0, 10);

  const token = process.env.FINMIND_TOKEN;
  const url = new URL(FINMIND);
  url.searchParams.set("dataset", "TaiwanStockTotalMarginPurchaseShortSale");
  url.searchParams.set("start_date", startStr);
  if (token) url.searchParams.set("token", token);

  const res = await fetch(url.toString(), { cache: "no-store" });
  const data = (await res.json()) as { status: number; data?: FinMindMarginRow[] };
  if (data.status !== 200 || !data.data || data.data.length === 0) return null;

  const latestDate = data.data.reduce((max, r) => (r.date > max ? r.date : max), "");
  const todayRows = data.data.filter((r) => r.date === latestDate);

  function pickMargin(name: string) {
    const r = todayRows.find((x) => x.name === name);
    if (!r) {
      return { today: 0, yesterday: 0, change: 0, buy: 0, sell: 0, returnQty: 0 };
    }
    return {
      today: r.TodayBalance,
      yesterday: r.YesBalance,
      change: r.TodayBalance - r.YesBalance,
      buy: r.buy,
      sell: r.sell,
      returnQty: r.Return,
    };
  }

  return {
    date: latestDate,
    marginPurchase: pickMargin("MarginPurchase"),
    shortSale: pickMargin("ShortSale"),
  };
}

// GET /api/market-pulse
export async function GET() {
  try {
    const [institutional, margin] = await Promise.all([
      fetchInstitutional().catch(() => null),
      fetchMargin().catch(() => null),
    ]);
    return NextResponse.json({ institutional, margin });
  } catch (err) {
    console.error("[/api/market-pulse]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
