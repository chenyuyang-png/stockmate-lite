// /api/tw-daily-wrap — 台股收盤速報
// 規則式聚合（不耗 AI token，零變動成本）
//
// 內容：
//   - 加權 / 櫃買 收盤
//   - 三大法人買賣超摘要
//   - 強勢族群 Top 3 / 弱勢族群 Top 3
//   - 融資融券變化
//   - 處置股警示
//   - 中文新聞 Top 8
//
// Cache: 12 小時（台股 13:30 收盤後跑一次）

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import YahooFinance from "yahoo-finance2";
import Parser from "rss-parser";
import { TW_SECTORS } from "@/lib/sectors";
import { displayName } from "@/lib/symbols";
import { twWrapSession } from "@/lib/marketSession";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const yahooFinance = new YahooFinance();

export type TwIndexLine = {
  symbol: string;
  label: string;
  price: number;
  change: number;
  changePercent: number;
};

export type TwSectorPerf = {
  id: string;
  label: string;
  avgChange: number;
  stockCount: number;
};

export type TwInstSummary = {
  date: string;
  foreign: number; // 外資淨買賣（億）
  trust: number; // 投信
  dealer: number; // 自營商
  total: number;
};

export type TwMarginSummary = {
  date: string;
  marginChange: number; // 融資餘額變化（張）
  shortChange: number; // 融券餘額變化（張）
};

export type TwNewsHeadline = {
  title: string;
  link: string;
  source: string;
  isoDate?: string;
};

export type TwDailyWrapEvent = {
  rank: number;
  text: string;
};

export type TwDailyWrapResponse = {
  asOf: number;
  /** 台股交易期 ID YYYY-MM-DD（14:00 TPE 切換到新一輪）*/
  session?: string;
  indices: TwIndexLine[];
  /** 跨指數 narrative：例：「台股收紅 +1.2%，外資買超 80 億」*/
  oneLineSummary: string;
  strongSectors: TwSectorPerf[];
  weakSectors: TwSectorPerf[];
  institutional?: TwInstSummary;
  margin?: TwMarginSummary;
  news: TwNewsHeadline[];
  /** 10 大重點事件（AI Haiku 統整）*/
  events: TwDailyWrapEvent[];
  /** ai vs rule */
  source: "ai" | "rule";
  error?: string;
};

const SYSTEM_PROMPT = `你是台灣財經速報編輯，使用繁體中文。
任務：根據今日台股盤後資料，整理「今日台股 10 大重點事件」清單。

格式硬性要求：
- 嚴格輸出 10 條，每條一行
- 每行格式：先公司名 / 主體，再具體事件 + 數字 + 結果
- 簡潔有力，**每行不超過 35 字**
- 涵蓋面：個股財報 / 法人動向 / 產業熱點 / 政策利多空 / 國際連動
- 避免重複主題（例如不要 3 條都是台積電）
- 不要寫「今天」「最新」「盤後」這種冗詞 — 內容已隱含當下

範例：
✅ 台積電外資買超 5,200 張，3 日連續吃貨
✅ 鴻海 11 月營收年增 12%，季增 8% 創高
✅ 央行升息 0.125 碼，金融股早盤領漲
❌ 台股今日震盪（沒具體事件）
❌ AI 概念股有表現（沒數字 / 沒主體）

輸出格式（純文字，10 行）：
1. [事件]
2. [事件]
...
10. [事件]

最後一行禁止加註解 / 免責聲明 / 多餘文字 — 只要 10 條編號清單。`;

const TW_INDICES = [
  { symbol: "^TWII", label: "台股加權" },
  { symbol: "^TWOII", label: "櫃買 OTC" },
];

const TW_NEWS_SOURCES = [
  { name: "經濟日報·台股", url: "https://money.udn.com/rssfeed/news/1001/5588/12017" },
  { name: "經濟日報·產業", url: "https://money.udn.com/rssfeed/news/1001/5591/7242" },
  { name: "經濟日報·科技", url: "https://money.udn.com/rssfeed/news/1001/5591/12925" },
  { name: "ETtoday財經", url: "https://feeds.feedburner.com/ettoday/finance" },
  { name: "中央社財經", url: "https://feeds.feedburner.com/rsscna/finance" },
];

const parser = new Parser({
  timeout: 6000,
  headers: { "User-Agent": "Mozilla/5.0 (compatible; YoyoStocks/1.0)" },
});

// ─── Cache（Session-based）──────────────────────────────
// cache key 用「台股交易期 ID」，每天 14:00 TPE 切到新 session、自動 invalidate
let cache: { data: TwDailyWrapResponse; at: number; session: string } | null = null;
const HARD_TTL = 24 * 60 * 60_000; // 24h 上限保險（假日連續期間）

// ─── 工具 ────────────────────────────────────────────────
async function fetchIndices(): Promise<TwIndexLine[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const quotes: any = await yahooFinance.quote(
      TW_INDICES.map((i) => i.symbol),
      {},
      { validateResult: false },
    );
    const list = Array.isArray(quotes) ? quotes : [quotes];
    return TW_INDICES.map((i) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const q = list.find((x: any) => x?.symbol === i.symbol);
      if (!q || typeof q.regularMarketPrice !== "number") return null;
      return {
        symbol: i.symbol,
        label: i.label,
        price: q.regularMarketPrice,
        change: q.regularMarketChange ?? 0,
        changePercent: q.regularMarketChangePercent ?? 0,
      };
    }).filter((x): x is TwIndexLine => x !== null);
  } catch {
    return [];
  }
}

async function fetchSectorPerformance(): Promise<{
  strong: TwSectorPerf[];
  weak: TwSectorPerf[];
}> {
  // 取所有台股，一次拉行情 → 算各子題材平均
  const allSymbols = Array.from(
    new Set(TW_SECTORS.flatMap((s) => s.symbols)),
  );

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: any = await yahooFinance.quote(
      allSymbols,
      {},
      { validateResult: false },
    );
    const list = Array.isArray(raw) ? raw : [raw];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map: Record<string, number> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const q of list as any[]) {
      if (q?.symbol && typeof q.regularMarketChangePercent === "number") {
        map[q.symbol] = q.regularMarketChangePercent;
      }
    }

    const sectorPerfs: TwSectorPerf[] = [];
    for (const sec of TW_SECTORS) {
      const vals = sec.symbols
        .map((s) => map[s])
        .filter((v): v is number => Number.isFinite(v));
      if (vals.length < 2) continue;
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      sectorPerfs.push({
        id: sec.id,
        label: sec.label,
        avgChange: avg,
        stockCount: vals.length,
      });
    }

    const sorted = [...sectorPerfs].sort((a, b) => b.avgChange - a.avgChange);
    return {
      strong: sorted.slice(0, 5),
      weak: sorted.slice(-5).reverse(),
    };
  } catch {
    return { strong: [], weak: [] };
  }
}

async function fetchInstitutional(): Promise<TwInstSummary | undefined> {
  const token = process.env.FINMIND_TOKEN;
  const start = new Date();
  start.setDate(start.getDate() - 7);
  const url = new URL("https://api.finmindtrade.com/api/v4/data");
  url.searchParams.set("dataset", "TaiwanStockTotalInstitutionalInvestors");
  url.searchParams.set("start_date", start.toISOString().slice(0, 10));
  if (token) url.searchParams.set("token", token);

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    const json = await res.json();
    type Row = { date: string; name: string; buy: number; sell: number };
    const rows = (json?.data ?? []) as Row[];
    if (rows.length === 0) return undefined;

    // 取最新日期
    const latestDate = rows.map((r) => r.date).sort().reverse()[0];
    const latest = rows.filter((r) => r.date === latestDate);

    let foreign = 0,
      trust = 0,
      dealer = 0;
    for (const r of latest) {
      const net = (r.buy - r.sell) / 1e8; // 億元
      if (r.name === "Foreign_Investor") foreign += net;
      else if (r.name === "Investment_Trust") trust += net;
      else if (r.name === "Dealer_self" || r.name === "Dealer_Hedging")
        dealer += net;
    }

    return {
      date: latestDate,
      foreign,
      trust,
      dealer,
      total: foreign + trust + dealer,
    };
  } catch {
    return undefined;
  }
}

async function fetchMargin(): Promise<TwMarginSummary | undefined> {
  const token = process.env.FINMIND_TOKEN;
  const start = new Date();
  start.setDate(start.getDate() - 7);
  const url = new URL("https://api.finmindtrade.com/api/v4/data");
  url.searchParams.set("dataset", "TaiwanStockTotalMarginPurchaseShortSale");
  url.searchParams.set("start_date", start.toISOString().slice(0, 10));
  if (token) url.searchParams.set("token", token);

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    const json = await res.json();
    type Row = {
      date: string;
      name: string;
      TodayBalance: number;
      YesBalance: number;
    };
    const rows = (json?.data ?? []) as Row[];
    if (rows.length === 0) return undefined;
    const latestDate = rows.map((r) => r.date).sort().reverse()[0];
    const latest = rows.filter((r) => r.date === latestDate);
    const margin = latest.find((r) => r.name === "MarginPurchase");
    const short = latest.find((r) => r.name === "ShortSale");
    if (!margin || !short) return undefined;
    return {
      date: latestDate,
      marginChange: margin.TodayBalance - margin.YesBalance,
      shortChange: short.TodayBalance - short.YesBalance,
    };
  } catch {
    return undefined;
  }
}

async function fetchTwHeadlines(): Promise<TwNewsHeadline[]> {
  const results = await Promise.all(
    TW_NEWS_SOURCES.map(async (s) => {
      try {
        const feed = await parser.parseURL(s.url);
        return (feed.items ?? []).slice(0, 8).map((item) => ({
          title: item.title ?? "",
          link: item.link ?? "",
          source: s.name,
          isoDate: item.isoDate,
        }));
      } catch {
        return [];
      }
    }),
  );
  // 24 小時內，每來源最多取 3 則
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const all = results.flat().filter((h) => {
    if (!h.title || h.title.length < 5) return false;
    if (!h.isoDate) return true;
    const t = new Date(h.isoDate).getTime();
    return !Number.isFinite(t) || t >= cutoff;
  });
  // 來源平衡 + 限制總數
  const bySource: Record<string, TwNewsHeadline[]> = {};
  for (const h of all) {
    bySource[h.source] ??= [];
    if (bySource[h.source].length < 3) bySource[h.source].push(h);
  }
  return Object.values(bySource).flat().slice(0, 8);
}

function buildOneLineSummary(
  indices: TwIndexLine[],
  inst: TwInstSummary | undefined,
  strong: TwSectorPerf[],
): string {
  const twii = indices.find((i) => i.symbol === "^TWII");
  const parts: string[] = [];
  if (twii) {
    const dir =
      twii.changePercent > 0 ? "收紅" : twii.changePercent < 0 ? "收黑" : "持平";
    parts.push(`台股${dir} ${twii.changePercent >= 0 ? "+" : ""}${twii.changePercent.toFixed(2)}%`);
  }
  if (inst && Math.abs(inst.foreign) > 10) {
    parts.push(
      `外資${inst.foreign > 0 ? "買超" : "賣超"} ${Math.abs(inst.foreign).toFixed(0)} 億`,
    );
  }
  if (strong.length > 0 && strong[0].avgChange > 1) {
    parts.push(`${strong[0].label}領漲 +${strong[0].avgChange.toFixed(1)}%`);
  }
  return parts.join("，") || "台股交易完整概覽";
}

function parseEventsFromText(text: string): TwDailyWrapEvent[] {
  const lines = text.split("\n");
  const out: TwDailyWrapEvent[] = [];
  for (const line of lines) {
    const m = line.match(/^\s*(\d{1,2})\.\s*(.+?)\s*$/);
    if (m) {
      const rank = parseInt(m[1], 10);
      const t = m[2].trim();
      if (rank >= 1 && rank <= 12 && t.length > 0 && t.length < 80) {
        out.push({ rank, text: t });
      }
    }
  }
  return out.slice(0, 10);
}

// ─── Handler ─────────────────────────────────────────────
export async function GET(request: Request) {
  const session = twWrapSession();
  // force=1 → bypass cache（給 17:30 / 22:00 cron 用，補完整法人 + 融資融券）
  const force = new URL(request.url).searchParams.get("force") === "1";
  if (
    !force &&
    cache &&
    Date.now() - cache.at < HARD_TTL &&
    cache.session === session
  ) {
    return NextResponse.json(cache.data);
  }

  const [indices, sectorPerf, institutional, margin, news] =
    await Promise.all([
      fetchIndices(),
      fetchSectorPerformance(),
      fetchInstitutional(),
      fetchMargin(),
      fetchTwHeadlines(),
    ]);

  const oneLineSummary = buildOneLineSummary(
    indices,
    institutional,
    sectorPerf.strong,
  );

  // 用 Claude Haiku 生成 10 大事件（low cost、結構化清單）
  let events: TwDailyWrapEvent[] = [];
  let source: "ai" | "rule" = "rule";
  let error: string | undefined;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey && news.length >= 3) {
    try {
      const client = new Anthropic({ apiKey });

      const twii = indices.find((i) => i.symbol === "^TWII");
      const otcIdx = indices.find((i) => i.symbol === "^TWOII");
      const indexLine = [
        twii
          ? `加權收 ${twii.price.toFixed(2)}（${twii.changePercent >= 0 ? "+" : ""}${twii.changePercent.toFixed(2)}%）`
          : null,
        otcIdx
          ? `OTC 收 ${otcIdx.price.toFixed(2)}（${otcIdx.changePercent >= 0 ? "+" : ""}${otcIdx.changePercent.toFixed(2)}%）`
          : null,
      ]
        .filter(Boolean)
        .join("；");

      const instLine = institutional
        ? `外資 ${institutional.foreign >= 0 ? "+" : ""}${institutional.foreign.toFixed(0)} 億；投信 ${institutional.trust >= 0 ? "+" : ""}${institutional.trust.toFixed(0)} 億；自營 ${institutional.dealer >= 0 ? "+" : ""}${institutional.dealer.toFixed(0)} 億`
        : "三大法人資料暫缺";

      const marginLine = margin
        ? `融資變化 ${margin.marginChange >= 0 ? "+" : ""}${(margin.marginChange / 1000).toFixed(1)} 萬張；融券變化 ${margin.shortChange >= 0 ? "+" : ""}${margin.shortChange.toLocaleString()} 張`
        : "融資融券資料暫缺";

      const strongLine =
        sectorPerf.strong.length > 0
          ? sectorPerf.strong
              .slice(0, 5)
              .map((s) => `${s.label} ${s.avgChange >= 0 ? "+" : ""}${s.avgChange.toFixed(2)}%`)
              .join("；")
          : "領漲族群資料暫缺";

      const weakLine =
        sectorPerf.weak.length > 0
          ? sectorPerf.weak
              .slice(0, 5)
              .map((s) => `${s.label} ${s.avgChange >= 0 ? "+" : ""}${s.avgChange.toFixed(2)}%`)
              .join("；")
          : "領跌族群資料暫缺";

      const userPrompt = `# 今日台股盤後速報原料

## 大盤摘要
- ${indexLine}
- 三大法人買賣超：${instLine}
- 融資融券：${marginLine}
- 領漲族群：${strongLine}
- 領跌族群：${weakLine}

## 24 小時內中文財經新聞（${news.length} 條）
${news.map((n, i) => `${i + 1}. [${n.source}] ${n.title}`).join("\n")}

請依規定格式輸出 10 條重點事件清單（純文字編號清單，不要 JSON、不要免責聲明）。`;

      const resp = await client.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 2000,
        system: [
          {
            type: "text",
            text: SYSTEM_PROMPT,
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [{ role: "user", content: userPrompt }],
      });

      const text = resp.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n");

      events = parseEventsFromText(text);
      if (events.length >= 5) source = "ai";
      else error = "AI 回傳格式異常";
    } catch (e) {
      error = `AI 失敗：${e instanceof Error ? e.message : "未知"}`;
    }
  } else if (!apiKey) {
    error = "未設定 ANTHROPIC_API_KEY，跳過 AI 統整";
  }

  // fallback：以新聞標題為主
  if (events.length === 0) {
    events = news.slice(0, 10).map((n, i) => ({
      rank: i + 1,
      text: n.title,
    }));
    source = "rule";
  }

  const data: TwDailyWrapResponse = {
    asOf: Date.now(),
    session,
    indices,
    oneLineSummary,
    strongSectors: sectorPerf.strong,
    weakSectors: sectorPerf.weak,
    institutional,
    margin,
    news,
    events,
    source,
    error,
  };

  cache = { data, at: Date.now(), session };
  return NextResponse.json(data);
}

// Mark these symbols as used (silence linter for displayName which is imported
// but not strictly required — kept for future enhancements)
void displayName;
