import { NextResponse } from "next/server";
import Parser from "rss-parser";
import { getTwStockName } from "@/lib/twStockNames";
import { getUsStockName, US_STOCKS } from "@/lib/usStockNames";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type NewsItem = {
  title: string;
  link: string;
  isoDate?: string;
  source: string;
  contentSnippet?: string;
};

const parser = new Parser({
  timeout: 10_000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (compatible; YoyoStocks/1.0; +https://yoyo-stocks.vercel.app)",
  },
});

// Google News 標題格式為「標題 - 來源名」— 從右側拆出 source
function splitSource(rawTitle: string): { title: string; source: string } {
  const idx = rawTitle.lastIndexOf(" - ");
  if (idx > 10) {
    return {
      title: rawTitle.slice(0, idx).trim(),
      source: rawTitle.slice(idx + 3).trim(),
    };
  }
  return { title: rawTitle, source: "" };
}

async function fetchGoogleNews(query: string, lang: "zh-TW" | "en-US"): Promise<NewsItem[]> {
  const params = new URLSearchParams({ q: query });
  const url =
    lang === "zh-TW"
      ? `https://news.google.com/rss/search?${params}&hl=zh-TW&gl=TW&ceid=TW:zh-Hant`
      : `https://news.google.com/rss/search?${params}&hl=en-US&gl=US&ceid=US:en`;

  try {
    const feed = await parser.parseURL(url);
    return (feed.items ?? []).slice(0, 25).map((item) => {
      const { title, source } = splitSource(item.title ?? "");
      return {
        title,
        link: item.link ?? "",
        isoDate: item.isoDate,
        source: source || "Google News",
        contentSnippet: item.contentSnippet?.slice(0, 240),
      };
    });
  } catch {
    return [];
  }
}

// 補充：Yahoo Finance 個股 RSS（美股有用、台股回傳英文較不貼）
async function fetchYahooSymbolNews(symbol: string): Promise<NewsItem[]> {
  const url = `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${encodeURIComponent(symbol)}&region=US&lang=en-US`;
  try {
    const feed = await parser.parseURL(url);
    return (feed.items ?? []).slice(0, 10).map((item) => ({
      title: item.title ?? "(no title)",
      link: item.link ?? "",
      isoDate: item.isoDate,
      source: "Yahoo Finance",
      contentSnippet: item.contentSnippet?.slice(0, 200),
    }));
  } catch {
    return [];
  }
}

// GET /api/stock-news?symbol=2330.TW
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") ?? "";
  if (!symbol) return NextResponse.json({ items: [] });

  const isTw = /\.(TW|TWO)$/i.test(symbol);
  const cleanCode = symbol.replace(/\.(TW|TWO)$/i, "");

  let queries: { query: string; lang: "zh-TW" | "en-US" }[] = [];
  const keywords: string[] = [cleanCode];

  if (isTw) {
    // 台股：用中文名 + 代碼 雙條件查
    const cn = getTwStockName(symbol);
    if (cn) {
      keywords.push(cn);
      const clean = cn.replace(/[-*].*$/, "").trim();
      if (clean && clean !== cn) keywords.push(clean);
      // 兩個查詢提高召回：1) 中文名 + 代碼 2) 中文名單獨
      queries = [
        { query: `${cn} ${cleanCode}`, lang: "zh-TW" },
        { query: cn, lang: "zh-TW" },
      ];
    } else {
      queries = [{ query: `台股 ${cleanCode}`, lang: "zh-TW" }];
    }
  } else {
    // 美股：英文 name + ticker
    const cn = getUsStockName(symbol);
    const us = US_STOCKS.find((s) => s.symbol === symbol);
    const eng = us?.english;
    if (cn) keywords.push(cn);
    if (eng) keywords.push(eng);
    keywords.push(symbol);
    // 英文 Google News + Yahoo Finance per-symbol
    queries = [
      { query: eng ? `${symbol} ${eng}` : symbol, lang: "en-US" },
    ];
  }

  // 平行抓所有來源
  const tasks: Promise<NewsItem[]>[] = queries.map((q) => fetchGoogleNews(q.query, q.lang));
  if (!isTw) {
    tasks.push(fetchYahooSymbolNews(symbol));
  }

  const results = await Promise.all(tasks);
  const merged = results.flat();

  // 去重 by title
  const seen = new Set<string>();
  const unique = merged.filter((item) => {
    const key = item.title.trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // 排序：新到舊
  unique.sort((a, b) => {
    const ta = a.isoDate ? new Date(a.isoDate).getTime() : 0;
    const tb = b.isoDate ? new Date(b.isoDate).getTime() : 0;
    return tb - ta;
  });

  return NextResponse.json({ items: unique.slice(0, 25), keywords });
}
