import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
import Parser from "rss-parser";
import { getTodayEvents, getUpcomingEvents } from "@/lib/economicCalendar";
import type { EconomicEvent } from "@/lib/economicCalendar";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const yahooFinance = new YahooFinance();

export type IndexSnapshot = {
  symbol: string;
  label: string;
  region: "US" | "TW" | "GLOBAL";
  price: number;
  change: number;
  changePercent: number;
};

export type SectorSnapshot = {
  symbol: string;
  label: string;
  changePercent: number;
};

export type NewsHeadline = {
  title: string;
  link: string;
  source: string;
  pubDate?: string;
  themes: string[]; // 自動標記的主題
};

export type DriverTheme = {
  theme: string;
  weight: number; // 出現次數
  exampleHeadlines: string[];
};

export type MarketExplainerResponse = {
  asOf: number;
  marketDirection: "up" | "down" | "mixed" | "flat"; // 整體大盤方向
  tldr: string; // 一句話摘要
  indices: IndexSnapshot[];
  vix: IndexSnapshot | null;
  sectors: SectorSnapshot[]; // 由弱到強排序
  topNews: NewsHeadline[]; // 頭條新聞
  drivers: DriverTheme[]; // 排序後的關鍵主題
  todayEvents: EconomicEvent[];
  upcomingEvents: EconomicEvent[];
  errors?: string[];
};

// 主要追蹤指數
const TRACK_INDICES: { symbol: string; label: string; region: "US" | "TW" | "GLOBAL" }[] = [
  { symbol: "^GSPC", label: "S&P 500", region: "US" },
  { symbol: "^IXIC", label: "那斯達克", region: "US" },
  { symbol: "^DJI", label: "道瓊", region: "US" },
  { symbol: "^SOX", label: "費城半導體", region: "US" },
  { symbol: "^TWII", label: "台股加權", region: "TW" },
];

// 美股 11 大產業 ETF — 一秒看出今天哪個產業領跌 / 領漲
const SECTOR_ETFS: { symbol: string; label: string }[] = [
  { symbol: "XLK", label: "科技" },
  { symbol: "SMH", label: "半導體" },
  { symbol: "XLF", label: "金融" },
  { symbol: "XLE", label: "能源" },
  { symbol: "XLV", label: "醫療" },
  { symbol: "XLY", label: "非必需消費" },
  { symbol: "XLP", label: "必需消費" },
  { symbol: "XLI", label: "工業" },
  { symbol: "XLU", label: "公用事業" },
  { symbol: "XLB", label: "原物料" },
  { symbol: "XLRE", label: "不動產" },
];

// 新聞主題關鍵字（中英混合）— 用於分類今日「驅動原因」
const THEME_KEYWORDS: Record<string, { keywords: string[]; minLen: number }> = {
  "FOMC / 升降息": {
    keywords: ["FOMC", "Fed", "Powell", "rate cut", "rate hike", "interest rate", "降息", "升息", "鮑爾", "聯準會", "利率"],
    minLen: 3,
  },
  "通膨 / CPI": {
    keywords: ["CPI", "inflation", "PPI", "PCE", "通膨", "消費者物價", "生產者物價"],
    minLen: 3,
  },
  "就業 / 失業": {
    keywords: ["NFP", "nonfarm", "unemployment", "jobless", "payroll", "非農", "就業", "失業"],
    minLen: 3,
  },
  "AI / 半導體": {
    keywords: ["AI", "artificial intelligence", "NVIDIA", "TSMC", "chip", "semiconductor", "輝達", "台積電", "半導體", "晶片", "AI"],
    minLen: 2,
  },
  "中美關係 / 關稅": {
    keywords: ["tariff", "trade war", "China", "Beijing", "Taiwan Strait", "關稅", "貿易戰", "中美", "兩岸"],
    minLen: 4,
  },
  "地緣政治": {
    keywords: ["Russia", "Ukraine", "Israel", "Iran", "war", "conflict", "戰爭", "戰事", "地緣", "俄烏", "中東"],
    minLen: 4,
  },
  "財報季": {
    keywords: ["earnings", "guidance", "beat estimates", "miss estimates", "revenue", "財報", "獲利", "營收", "EPS"],
    minLen: 4,
  },
  "債券 / 殖利率": {
    keywords: ["yield", "Treasury", "10-year", "bond", "殖利率", "公債", "債券"],
    minLen: 4,
  },
  "原油 / 大宗": {
    keywords: ["oil", "crude", "WTI", "Brent", "gold", "原油", "黃金", "大宗"],
    minLen: 3,
  },
  "科技股 / Magnificent 7": {
    keywords: ["Apple", "Microsoft", "Google", "Alphabet", "Amazon", "Meta", "Tesla", "蘋果", "微軟", "特斯拉"],
    minLen: 4,
  },
  "ETF / 資金流向": {
    keywords: ["ETF", "outflow", "inflow", "fund flow", "資金", "外資"],
    minLen: 3,
  },
};

const NEWS_SOURCES = [
  { name: "Bloomberg Markets", url: "https://feeds.bloomberg.com/markets/news.rss" },
  { name: "Yahoo Finance", url: "https://finance.yahoo.com/news/rssindex" },
  { name: "Seeking Alpha", url: "https://seekingalpha.com/market_currents.xml" },
  { name: "中央社國際", url: "https://feeds.feedburner.com/rsscna/intworld" },
  { name: "經濟日報·台股", url: "https://money.udn.com/rssfeed/news/1001/5588/12017" },
  { name: "ETtoday財經", url: "https://feeds.feedburner.com/ettoday/finance" },
];

const parser = new Parser({
  timeout: 6000,
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; YoyoStocks/1.0)",
  },
});

// 模組內快取（6 小時）
// 一天約跑 2 次：台股收盤後（14:00 TPE）+ 美股收盤後（06:00 TPE）
// 中間訪問者都吃 cache，省 token
let cache: { data: MarketExplainerResponse; at: number } | null = null;
const TTL = 6 * 60 * 60_000;

export async function GET() {
  if (cache && Date.now() - cache.at < TTL) {
    return NextResponse.json(cache.data);
  }

  const errors: string[] = [];

  // 1) 拉指數 + VIX + sector ETFs（一次 batch）
  const allSymbols = [
    ...TRACK_INDICES.map((i) => i.symbol),
    "^VIX",
    ...SECTOR_ETFS.map((s) => s.symbol),
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const quotes: Record<string, any> = {};
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results: any = await yahooFinance.quote(allSymbols);
    const arr = Array.isArray(results) ? results : [results];
    for (const q of arr) {
      if (q?.symbol) quotes[q.symbol] = q;
    }
  } catch (e) {
    errors.push(`quotes: ${e instanceof Error ? e.message : "unknown"}`);
  }

  const indices: IndexSnapshot[] = TRACK_INDICES.map((i) => {
    const q = quotes[i.symbol];
    return {
      symbol: i.symbol,
      label: i.label,
      region: i.region,
      price: q?.regularMarketPrice ?? 0,
      change: q?.regularMarketChange ?? 0,
      changePercent: q?.regularMarketChangePercent ?? 0,
    };
  }).filter((i) => i.price > 0);

  const vixQ = quotes["^VIX"];
  const vix: IndexSnapshot | null = vixQ?.regularMarketPrice
    ? {
        symbol: "^VIX",
        label: "VIX 恐慌指數",
        region: "US",
        price: vixQ.regularMarketPrice,
        change: vixQ.regularMarketChange ?? 0,
        changePercent: vixQ.regularMarketChangePercent ?? 0,
      }
    : null;

  const sectors: SectorSnapshot[] = SECTOR_ETFS.map((s) => {
    const q = quotes[s.symbol];
    return {
      symbol: s.symbol,
      label: s.label,
      changePercent: q?.regularMarketChangePercent ?? NaN,
    };
  })
    .filter((s) => Number.isFinite(s.changePercent))
    .sort((a, b) => a.changePercent - b.changePercent);

  // 2) 拉新聞（並行，失敗的忽略）
  const newsResults = await Promise.all(
    NEWS_SOURCES.map(async (src) => {
      try {
        const feed = await parser.parseURL(src.url);
        return (feed.items ?? []).slice(0, 10).map((item) => ({
          title: item.title ?? "",
          link: item.link ?? "",
          source: src.name,
          pubDate: item.pubDate,
          isoDate: item.isoDate,
        }));
      } catch {
        return [];
      }
    }),
  );
  const allHeadlines = newsResults.flat();

  // 篩選：只留近 24 小時
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const recent = allHeadlines.filter((h) => {
    if (!h.isoDate && !h.pubDate) return true; // 不確定日期就保留
    const t = h.isoDate ?? h.pubDate;
    if (!t) return true;
    const d = new Date(t).getTime();
    return Number.isNaN(d) || d >= cutoff;
  });

  // 3) 對每條新聞標記主題
  function detectThemes(title: string): string[] {
    const themes: string[] = [];
    for (const [theme, def] of Object.entries(THEME_KEYWORDS)) {
      for (const kw of def.keywords) {
        if (kw.length < def.minLen) continue;
        const isAscii = /^[\x00-\x7f]+$/.test(kw);
        const found = isAscii
          ? new RegExp(`\\b${kw.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "i").test(title)
          : title.includes(kw);
        if (found) {
          themes.push(theme);
          break;
        }
      }
    }
    return themes;
  }

  const taggedNews: NewsHeadline[] = recent.map((h) => ({
    title: h.title,
    link: h.link,
    source: h.source,
    pubDate: h.pubDate,
    themes: detectThemes(h.title),
  }));

  // 4) 聚合主題 → 找出今日驅動因素
  const themeCount = new Map<string, { count: number; examples: string[] }>();
  for (const n of taggedNews) {
    for (const t of n.themes) {
      const cur = themeCount.get(t) ?? { count: 0, examples: [] };
      cur.count += 1;
      if (cur.examples.length < 3) cur.examples.push(n.title);
      themeCount.set(t, cur);
    }
  }
  const drivers: DriverTheme[] = Array.from(themeCount.entries())
    .map(([theme, v]) => ({ theme, weight: v.count, exampleHeadlines: v.examples }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 6);

  // 5) 整體大盤方向
  const usChanges = indices.filter((i) => i.region === "US").map((i) => i.changePercent);
  const avgUsChange = usChanges.length > 0 ? usChanges.reduce((a, b) => a + b, 0) / usChanges.length : 0;
  let marketDirection: MarketExplainerResponse["marketDirection"];
  if (avgUsChange <= -1.5) marketDirection = "down";
  else if (avgUsChange >= 1.5) marketDirection = "up";
  else if (Math.abs(avgUsChange) < 0.3) marketDirection = "flat";
  else marketDirection = avgUsChange < 0 ? "down" : "up";

  // 6) 產生 TLDR
  const todayEvents = getTodayEvents();
  const upcomingEvents = getUpcomingEvents(7).slice(0, 5);

  const tldr = buildTldr({
    indices,
    vix,
    sectors,
    drivers,
    todayEvents,
    marketDirection,
    avgUsChange,
  });

  // 取頭條新聞（含主題的優先 + 限 12 則）
  const topNews = [...taggedNews]
    .sort((a, b) => b.themes.length - a.themes.length)
    .slice(0, 12);

  const data: MarketExplainerResponse = {
    asOf: Date.now(),
    marketDirection,
    tldr,
    indices,
    vix,
    sectors,
    topNews,
    drivers,
    todayEvents,
    upcomingEvents,
    errors: errors.length > 0 ? errors : undefined,
  };

  cache = { data, at: Date.now() };
  return NextResponse.json(data);
}

function buildTldr(args: {
  indices: IndexSnapshot[];
  vix: IndexSnapshot | null;
  sectors: SectorSnapshot[];
  drivers: DriverTheme[];
  todayEvents: EconomicEvent[];
  marketDirection: MarketExplainerResponse["marketDirection"];
  avgUsChange: number;
}): string {
  const { indices, vix, sectors, drivers, todayEvents, marketDirection, avgUsChange } = args;
  const parts: string[] = [];

  // 方向描述
  const ix = indices.find((i) => i.symbol === "^IXIC");
  const sp = indices.find((i) => i.symbol === "^GSPC");
  const sox = indices.find((i) => i.symbol === "^SOX");
  const tw = indices.find((i) => i.symbol === "^TWII");

  if (marketDirection === "down") {
    parts.push(`📉 美股全面下挫（平均 ${avgUsChange.toFixed(2)}%）`);
    if (sox && sox.changePercent < -1.5)
      parts.push(`費半 ${sox.changePercent.toFixed(2)}% 領跌`);
    else if (ix && ix.changePercent < -1.5)
      parts.push(`那指 ${ix.changePercent.toFixed(2)}% 領跌`);
  } else if (marketDirection === "up") {
    parts.push(`📈 美股普遍上漲（平均 +${avgUsChange.toFixed(2)}%）`);
    if (sp && sp.changePercent > 0.5) parts.push(`S&P ${sp.changePercent.toFixed(2)}%`);
  } else if (marketDirection === "flat") {
    parts.push(`➡️ 美股盤整（${avgUsChange >= 0 ? "+" : ""}${avgUsChange.toFixed(2)}%）`);
  } else {
    parts.push(`〰️ 美股震盪（${avgUsChange >= 0 ? "+" : ""}${avgUsChange.toFixed(2)}%）`);
  }

  // VIX
  if (vix && vix.changePercent > 10) {
    parts.push(`VIX 跳升 +${vix.changePercent.toFixed(1)}% 至 ${vix.price.toFixed(1)}（恐慌升溫）`);
  } else if (vix && vix.changePercent < -10) {
    parts.push(`VIX 下挫 ${vix.changePercent.toFixed(1)}% 至 ${vix.price.toFixed(1)}（恐慌降溫）`);
  } else if (vix && vix.price > 25) {
    parts.push(`VIX ${vix.price.toFixed(1)}（警戒水位）`);
  }

  // 產業領跌 / 領漲
  if (sectors.length > 0) {
    const worst = sectors[0];
    const best = sectors[sectors.length - 1];
    if (marketDirection === "down" && worst.changePercent < -1) {
      parts.push(`${worst.label}股最重（${worst.changePercent.toFixed(2)}%）`);
    } else if (marketDirection === "up" && best.changePercent > 1) {
      parts.push(`${best.label}股領漲（+${best.changePercent.toFixed(2)}%）`);
    }
  }

  // 台股
  if (tw && Math.abs(tw.changePercent) > 0.8) {
    parts.push(`台股 ${tw.changePercent >= 0 ? "+" : ""}${tw.changePercent.toFixed(2)}%`);
  }

  // 焦點主題
  if (drivers.length > 0 && drivers[0].weight >= 3) {
    const topThemes = drivers
      .slice(0, 2)
      .map((d) => d.theme)
      .join(" / ");
    parts.push(`焦點：${topThemes}`);
  }

  // 今日事件
  const criticalEvent = todayEvents.find((e) => e.importance === "critical");
  if (criticalEvent) {
    parts.push(`⚠️ 今日：${criticalEvent.event}`);
  }

  return parts.join(" · ");
}
