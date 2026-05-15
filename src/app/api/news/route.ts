import { NextResponse } from "next/server";
import Parser from "rss-parser";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type NewsItem = {
  title: string;
  link: string;
  pubDate?: string;
  isoDate?: string;
  source: string;
  contentSnippet?: string;
  symbols?: string[];
};

type SourceDef = {
  name: string;
  url: string;
  market: "TW" | "US" | "GLOBAL";
};

// 多個 RSS 來源（容錯：抓不到就略過）
const SOURCES: SourceDef[] = [
  // 台股 / 中文財經 — 7 個來源
  { name: "經濟日報", url: "https://money.udn.com/rssfeed/news/1001/5588/5589", market: "TW" },
  { name: "經濟日報·台股", url: "https://money.udn.com/rssfeed/news/1001/5588/12017", market: "TW" },
  { name: "經濟日報·產業", url: "https://money.udn.com/rssfeed/news/1001/5591/7242", market: "TW" },
  { name: "經濟日報·科技", url: "https://money.udn.com/rssfeed/news/1001/5591/12925", market: "TW" },
  { name: "UDN財經", url: "https://udn.com/rssfeed/news/2/6644?if=mr", market: "TW" },
  { name: "ETtoday財經", url: "https://feeds.feedburner.com/ettoday/finance", market: "TW" },
  { name: "中央社財經", url: "https://feeds.feedburner.com/rsscna/finance", market: "TW" },
  // 美股 / 國際 — 4 個來源
  { name: "Yahoo Finance", url: "https://finance.yahoo.com/news/rssindex", market: "US" },
  { name: "Bloomberg Markets", url: "https://feeds.bloomberg.com/markets/news.rss", market: "US" },
  { name: "Investing.com", url: "https://www.investing.com/rss/news.rss", market: "GLOBAL" },
  { name: "Seeking Alpha", url: "https://seekingalpha.com/market_currents.xml", market: "US" },
  { name: "中央社國際", url: "https://feeds.feedburner.com/rsscna/intworld", market: "GLOBAL" },
];

const parser = new Parser({
  timeout: 8000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (compatible; YoyoStocks/1.0; +https://yoyo-stocks.vercel.app)",
  },
});

async function fetchSource(src: SourceDef): Promise<NewsItem[]> {
  try {
    const feed = await parser.parseURL(src.url);
    return (feed.items ?? []).slice(0, 15).map((item) => ({
      title: item.title ?? "(無標題)",
      link: item.link ?? "",
      pubDate: item.pubDate,
      isoDate: item.isoDate,
      source: src.name,
      contentSnippet: item.contentSnippet?.slice(0, 160),
    }));
  } catch {
    return [];
  }
}

// 簡單的相關股票偵測（從標題抓代碼）
function detectSymbols(title: string, watchSymbols: string[]): string[] {
  const found = new Set<string>();
  for (const sym of watchSymbols) {
    const clean = sym.replace(/\.(TW|TWO)$/i, "");
    // 4-6 碼台股
    if (/^\d{4,6}$/.test(clean) && new RegExp(`\\b${clean}\\b`).test(title)) {
      found.add(sym);
    }
    // 美股代碼（大寫單字）
    else if (/^[A-Z]{1,5}$/.test(clean) && new RegExp(`\\b${clean}\\b`).test(title)) {
      found.add(sym);
    }
  }
  return Array.from(found);
}

// GET /api/news?market=TW|US|all&symbols=AAPL,2330.TW
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const marketParam = (searchParams.get("market") ?? "all").toLowerCase();
  const symbolsParam = searchParams.get("symbols") ?? "";
  const watchSymbols = symbolsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // 篩選來源
  let sources = SOURCES;
  if (marketParam === "tw") {
    sources = SOURCES.filter((s) => s.market === "TW" || s.market === "GLOBAL");
  } else if (marketParam === "us") {
    sources = SOURCES.filter((s) => s.market === "US" || s.market === "GLOBAL");
  }

  const results = await Promise.all(sources.map(fetchSource));
  const allItems = results.flat();

  // 標註相關股票
  for (const item of allItems) {
    if (watchSymbols.length > 0) {
      item.symbols = detectSymbols(item.title, watchSymbols);
    }
  }

  // 依時間排序（新到舊）
  allItems.sort((a, b) => {
    const ta = a.isoDate ? new Date(a.isoDate).getTime() : 0;
    const tb = b.isoDate ? new Date(b.isoDate).getTime() : 0;
    return tb - ta;
  });

  // 去重複（依標題）
  const seen = new Set<string>();
  const unique = allItems.filter((item) => {
    const key = item.title.trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return NextResponse.json({ items: unique.slice(0, 50) });
}
