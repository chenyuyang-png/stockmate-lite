import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import YahooFinance from "yahoo-finance2";
import Parser from "rss-parser";
import { usWrapSession } from "@/lib/marketSession";
import { US_SECTORS } from "@/lib/sectors";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const yahooFinance = new YahooFinance();

export type DailyWrapEvent = {
  rank: number;
  text: string;
};

export type IndexLine = {
  symbol: string;
  label: string;
  price: number;
  changePercent: number;
};

/** 美股族群輪動 — 該族群當日漲跌平均 + 領頭股 */
export type UsSectorPerf = {
  id: string;
  label: string;
  avgChange: number;
  stockCount: number;
  topMovers: { symbol: string; name: string; changePercent: number }[];
  /** AI 寫的一句話催化劑（30-40 字）*/
  rationale?: string;
};

/** 翻譯後的英文新聞重點（中文摘要 + 原始來源）*/
export type TranslatedHeadline = {
  source: string;
  zhSummary: string;
};

export type DailyWrapResponse = {
  asOf: number;
  generatedAt: number;
  /** 美股交易期 ID YYYY-MM-DD（05:30 TPE 切換到新一輪）*/
  session?: string;
  /** 主要指數（美股 4 大 + 費半）摘要 */
  indices: IndexLine[];
  indicesSummary: string;
  /** ADR / 台股關聯指標 摘要（含使用者持股的 ADR 部位） */
  adr: IndexLine[];
  adrSummary: string;
  /** 台指期夜盤摘要 */
  futuresSummary: string;
  /** 10 大重點事件（AI 統整） */
  events: DailyWrapEvent[];
  /** 🆕 美股族群輪動 — 領漲 / 領跌 Top 3-5 */
  leaderSectors?: UsSectorPerf[];
  laggardSectors?: UsSectorPerf[];
  /** 🆕 中文翻譯的英文新聞重點（5-8 條）*/
  translatedNews?: TranslatedHeadline[];
  /** 失敗訊息 */
  error?: string;
  /** ai vs fallback rule */
  source: "ai" | "rule";
};

// SYSTEM_PROMPT 升級為「3 段結構化輸出」：
//   ## SECTOR_NARRATIVE — 美股族群輪動敘事（4-6 條）
//   ## TRANSLATED_NEWS — 英文新聞中文翻譯重點（5-8 條）
//   ## EVENTS — 10 大綜合重點事件
// parseStructuredAi() 會把 3 段拆開後分別塞回 response
const SYSTEM_PROMPT = `你是台灣財經速報編輯，使用繁體中文（台灣用語）。

任務：根據資料整理輸出 3 個區塊。**嚴格遵守 markdown header 分隔**。

🚨 法律合規（重要）：
- 不可寫「建議買進 / 賣出」「目標價」「該進場」之類措辭
- 不可寫「我看好 / 看空」「會漲 / 會跌」預測語氣
- 純粹**事實整理 + 數字陳述**，使用者自行判斷

✅ 輸出格式（嚴格遵守、不可省略 header）：

# SECTOR_NARRATIVE
輸出 4-6 條美股族群輪動敘事。每條格式：
「[族群名] [漲跌幅] — [領頭股 1] [漲跌幅] / [領頭股 2] [漲跌幅] 帶動 / 拖累，[一句催化劑或事實描述]」
範例：
- AI 半導體領漲 +3.5% — NVDA +6.1% / AVGO +5.2% 帶動，受 OpenAI Dev Day 算力合作消息
- 中國 ADR 領跌 -4.0% — BABA -5% / PDD -4% 拖累，消費刺激政策不如預期
- 記憶體族群 +2.8% — MU +4.5% 帶動，DRAM 現貨報價週漲 6%

# TRANSLATED_NEWS
輸出 5-8 條英文新聞中文翻譯。每條 30-40 字、加上來源括號：
範例：
- 美股科技股齊漲、NVDA 突破 $200，受 OpenAI 合作消息（CNBC）
- Fed 12 月會議紀要顯示官員對降息步調分歧（MarketWatch）
- Apple 印度產線占比突破 25%，預期 2027 翻倍（Reuters）

# EVENTS
輸出 10 條重點事件、編號 1-10。涵蓋：個股財報 / 法說 / 國際 / Fed / 地緣 / 經濟。
每條 < 35 字、先主體再事件 + 數字。
**避免**：流水帳「美股下跌」「今日漲跌互現」，要具體數字 + 主體。
範例：
1. NVDA 與 OpenAI 簽 10 年 $200B 算力協議
2. Fed 主席演講未明示 12 月降息步調
3. TSMC 10 月營收 3,800 億創新高、YoY +24%
...

🚫 三段都禁止：
- 結尾加免責聲明 / 註解
- 重複同一主題（例如 3 條都 NVDA）
- 「今天」「最新」「昨晚」冗詞`;

// ─── Helpers ──────────────────────────────────────────────
async function fetchIndices(): Promise<IndexLine[]> {
  const symbols = [
    { symbol: "^GSPC", label: "S&P 500" },
    { symbol: "^IXIC", label: "那斯達克" },
    { symbol: "^DJI", label: "道瓊" },
    { symbol: "^RUT", label: "羅素 2000" },
    { symbol: "^SOX", label: "費城半導體" },
  ];
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: any = await yahooFinance.quote(
      symbols.map((s) => s.symbol),
      {},
      { validateResult: false },
    );
    const arr = Array.isArray(raw) ? raw : [raw];
    return symbols
      .map((s) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const q = arr.find((x: any) => x?.symbol === s.symbol);
        if (!q || typeof q.regularMarketPrice !== "number") return null;
        return {
          symbol: s.symbol,
          label: s.label,
          price: q.regularMarketPrice,
          changePercent: q.regularMarketChangePercent ?? 0,
        };
      })
      .filter((x): x is IndexLine => x !== null);
  } catch {
    return [];
  }
}

async function fetchAdrs(extraSymbols: string[] = []): Promise<IndexLine[]> {
  // 預設台股 ADR
  const defaults = [
    { symbol: "TSM", label: "台積電 ADR" },
    { symbol: "UMC", label: "聯電 ADR" },
    { symbol: "ASX", label: "日月光 ADR" },
    { symbol: "EWT", label: "iShares 台灣 ETF" },
  ];
  // 加上使用者的美股持股（前 4 個）
  const userUs = extraSymbols
    .filter((s) => !/\.(TW|TWO)$/i.test(s))
    .slice(0, 4)
    .map((s) => ({ symbol: s, label: s }));

  const combined = [...defaults, ...userUs];
  const seen = new Set<string>();
  const uniq = combined.filter((s) => {
    if (seen.has(s.symbol)) return false;
    seen.add(s.symbol);
    return true;
  });

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: any = await yahooFinance.quote(
      uniq.map((s) => s.symbol),
      {},
      { validateResult: false },
    );
    const arr = Array.isArray(raw) ? raw : [raw];
    return uniq
      .map((s) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const q = arr.find((x: any) => x?.symbol === s.symbol);
        if (!q || typeof q.regularMarketPrice !== "number") return null;
        return {
          symbol: s.symbol,
          label: s.label,
          price: q.regularMarketPrice,
          changePercent: q.regularMarketChangePercent ?? 0,
        };
      })
      .filter((x): x is IndexLine => x !== null);
  } catch {
    return [];
  }
}

async function fetchTxNight(): Promise<{
  close?: number;
  changePercent?: number;
}> {
  const token = process.env.FINMIND_TOKEN;
  const start = new Date();
  start.setDate(start.getDate() - 7);
  const url = new URL("https://api.finmindtrade.com/api/v4/data");
  url.searchParams.set("dataset", "TaiwanFuturesDaily");
  url.searchParams.set("data_id", "TX");
  url.searchParams.set("start_date", start.toISOString().slice(0, 10));
  if (token) url.searchParams.set("token", token);

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    const json = await res.json();
    type Row = {
      date: string;
      close: number;
      trading_session?: string;
      contract_date?: string;
    };
    const rows = (json?.data ?? []) as Row[];
    if (rows.length < 2) return {};

    // 取最新 after_market + 前一個 day session
    const sortedAfter = rows
      .filter((r) => r.trading_session === "after_market")
      .sort((a, b) => b.date.localeCompare(a.date));
    const sortedDay = rows
      .filter((r) => r.trading_session !== "after_market")
      .sort((a, b) => b.date.localeCompare(a.date));

    if (sortedAfter.length === 0 || sortedDay.length === 0) return {};
    const after = sortedAfter[0];
    const day = sortedDay[0];
    if (!Number.isFinite(after.close) || !Number.isFinite(day.close)) return {};
    return {
      close: after.close,
      changePercent: ((after.close - day.close) / day.close) * 100,
    };
  } catch {
    return {};
  }
}

// 中文新聞來源（給 EVENTS 區塊用，不需翻譯）
const ZH_NEWS_SOURCES = [
  { name: "Yahoo Finance", url: "https://finance.yahoo.com/news/rssindex" },
  { name: "經濟日報", url: "https://money.udn.com/rssfeed/news/1001/5588/5589" },
  { name: "經濟日報·台股", url: "https://money.udn.com/rssfeed/news/1001/5588/12017" },
  { name: "ETtoday財經", url: "https://feeds.feedburner.com/ettoday/finance" },
  { name: "中央社國際", url: "https://feeds.feedburner.com/rsscna/intworld" },
];

// 英文新聞來源（給 TRANSLATED_NEWS 區塊用，AI 翻譯）
// 選擇仍能 work 的免費 RSS feeds（Bloomberg / Seeking Alpha 改用 paywall）
const EN_NEWS_SOURCES = [
  { name: "CNBC Investing", url: "https://www.cnbc.com/id/100727362/device/rss/rss.html" },
  { name: "CNBC Markets", url: "https://www.cnbc.com/id/15839069/device/rss/rss.html" },
  { name: "MarketWatch", url: "https://feeds.content.dowjones.io/public/rss/mw_topstories" },
];

const NEWS_SOURCES = [...ZH_NEWS_SOURCES, ...EN_NEWS_SOURCES];

const parser = new Parser({
  timeout: 6000,
  headers: { "User-Agent": "Mozilla/5.0 (YoyoStocks)" },
});

type Headline = { title: string; source: string; isoDate?: string };

async function fetchHeadlinesFrom(
  sources: { name: string; url: string }[],
  maxPerSource = 6,
): Promise<Headline[]> {
  const results = await Promise.all(
    sources.map(async (s) => {
      try {
        const feed = await parser.parseURL(s.url);
        return (feed.items ?? []).slice(0, 8).map((item) => ({
          title: item.title ?? "",
          source: s.name,
          isoDate: item.isoDate,
        }));
      } catch {
        return [] as Headline[];
      }
    }),
  );
  const cutoff = Date.now() - 30 * 60 * 60 * 1000; // 30 小時內
  const all = results
    .flat()
    .filter((h) => h.title.length > 5)
    .filter((h) => {
      if (!h.isoDate) return true;
      const t = new Date(h.isoDate).getTime();
      return !Number.isFinite(t) || t >= cutoff;
    });

  // 同一來源最多取 maxPerSource 則
  const bySource: Record<string, Headline[]> = {};
  for (const h of all) {
    bySource[h.source] ??= [];
    if (bySource[h.source].length < maxPerSource) bySource[h.source].push(h);
  }
  return Object.values(bySource).flat();
}

async function fetchZhHeadlines(): Promise<string[]> {
  const items = await fetchHeadlinesFrom(ZH_NEWS_SOURCES, 6);
  return items.map((h) => `[${h.source}] ${h.title}`);
}

async function fetchEnHeadlines(): Promise<string[]> {
  const items = await fetchHeadlinesFrom(EN_NEWS_SOURCES, 5);
  return items.map((h) => `[${h.source}] ${h.title}`);
}

// 舊 fetchHeadlines 保留（給 fallback 用、合併中英文）
async function fetchHeadlines(): Promise<string[]> {
  const [zh, en] = await Promise.all([fetchZhHeadlines(), fetchEnHeadlines()]);
  return [...zh, ...en];
}

// ─── 美股族群輪動 ───────────────────────────────────────
// 拉 US_SECTORS 所有 symbol 報價、按 sector 平均 changePercent 排序，
// 取領漲 / 領跌 Top 3-5。每族群附 top movers 3 檔。
async function fetchUsSectorRotation(): Promise<{
  leaders: UsSectorPerf[];
  laggards: UsSectorPerf[];
}> {
  // 抓所有 US_SECTORS 涉及的 symbol（去重）
  const allSymbols = Array.from(
    new Set(US_SECTORS.flatMap((s) => s.symbols)),
  );

  let quoteList: Array<{
    symbol?: string;
    shortName?: string;
    longName?: string;
    regularMarketChangePercent?: number;
  }> = [];
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: any = await yahooFinance.quote(
      allSymbols,
      {},
      { validateResult: false },
    );
    quoteList = Array.isArray(raw) ? raw : [raw];
  } catch {
    return { leaders: [], laggards: [] };
  }

  // 建立 symbol → (change%, name) 對照表
  const quoteMap = new Map<
    string,
    { changePercent: number; name: string }
  >();
  for (const q of quoteList) {
    if (!q?.symbol) continue;
    const pct = q.regularMarketChangePercent;
    if (typeof pct !== "number" || !Number.isFinite(pct)) continue;
    quoteMap.set(q.symbol, {
      changePercent: pct,
      name: q.shortName ?? q.longName ?? q.symbol,
    });
  }

  // 計算每個 sector 的平均 changePercent + topMovers
  const perfs: UsSectorPerf[] = US_SECTORS.map((sector) => {
    const symPerfs = sector.symbols
      .map((sym) => {
        const q = quoteMap.get(sym);
        if (!q) return null;
        return {
          symbol: sym,
          name: q.name,
          changePercent: q.changePercent,
        };
      })
      .filter(
        (s): s is { symbol: string; name: string; changePercent: number } =>
          s !== null,
      );
    if (symPerfs.length === 0) return null;
    const avg =
      symPerfs.reduce((sum, s) => sum + s.changePercent, 0) / symPerfs.length;
    const topMovers = [...symPerfs]
      .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
      .slice(0, 3);
    return {
      id: sector.id,
      label: sector.label,
      avgChange: avg,
      stockCount: symPerfs.length,
      topMovers,
    };
  }).filter((p): p is UsSectorPerf => p !== null);

  const sorted = [...perfs].sort((a, b) => b.avgChange - a.avgChange);
  return {
    leaders: sorted.slice(0, 5),
    laggards: sorted.slice(-3).reverse(),
  };
}

function buildSectorRotationSummary(
  leaders: UsSectorPerf[],
  laggards: UsSectorPerf[],
): string {
  const fmt = (p: UsSectorPerf) =>
    `${p.label} ${p.avgChange >= 0 ? "+" : ""}${p.avgChange.toFixed(2)}% (${p.topMovers.map((t) => `${t.symbol} ${t.changePercent >= 0 ? "+" : ""}${t.changePercent.toFixed(1)}%`).join(", ")})`;
  const L = leaders.map(fmt).join("\n  - ");
  const G = laggards.map(fmt).join("\n  - ");
  return `領漲：\n  - ${L}\n領跌：\n  - ${G}`;
}

function buildIndicesSummary(indices: IndexLine[]): string {
  if (indices.length === 0) return "美股指數資料暫缺";
  const us4 = indices.filter((i) =>
    ["^GSPC", "^IXIC", "^DJI", "^RUT"].includes(i.symbol),
  );
  if (us4.length === 0) return "";
  const avg = us4.reduce((s, i) => s + i.changePercent, 0) / us4.length;
  const sorted = [...us4].sort((a, b) => a.changePercent - b.changePercent);
  const worst = sorted[0];
  const best = sorted[sorted.length - 1];

  if (avg < -0.3) {
    return `美股四大指數均跌 ${Math.abs(avg).toFixed(2)}%，${worst.label}（${worst.changePercent.toFixed(2)}%）跌幅最重`;
  }
  if (avg > 0.3) {
    return `美股四大指數均漲 +${avg.toFixed(2)}%，${best.label}（+${best.changePercent.toFixed(2)}%）漲幅最大`;
  }
  return `美股四大指數震盪小漲 / 跌 ${avg >= 0 ? "+" : ""}${avg.toFixed(2)}%`;
}

function buildAdrSummary(adr: IndexLine[]): string {
  if (adr.length === 0) return "";
  const tsm = adr.find((a) => a.symbol === "TSM");
  const ewt = adr.find((a) => a.symbol === "EWT");
  const parts: string[] = [];
  if (tsm)
    parts.push(
      `台積電 ADR ${tsm.changePercent >= 0 ? "漲 +" : "跌 "}${tsm.changePercent.toFixed(2)}%`,
    );
  if (ewt)
    parts.push(
      `EWT ${ewt.changePercent >= 0 ? "+" : ""}${ewt.changePercent.toFixed(2)}%`,
    );
  // 找出其他變動 > 1% 的（包含使用者 US 持股）
  const others = adr.filter(
    (a) =>
      a.symbol !== "TSM" &&
      a.symbol !== "EWT" &&
      Math.abs(a.changePercent) >= 1,
  );
  for (const o of others.slice(0, 3)) {
    parts.push(`${o.label} ${o.changePercent >= 0 ? "+" : ""}${o.changePercent.toFixed(2)}%`);
  }
  return parts.join("；");
}

function buildFuturesSummary(tx: {
  close?: number;
  changePercent?: number;
}): string {
  if (typeof tx.changePercent !== "number") {
    return "台指期夜盤資料暫缺";
  }
  return `台指期夜盤 ${tx.changePercent >= 0 ? "漲 +" : "跌 "}${tx.changePercent.toFixed(2)}%（${tx.close?.toLocaleString()}）`;
}

function parseEventsFromText(text: string): DailyWrapEvent[] {
  // 抓 1.~10. 形式
  const lines = text.split("\n");
  const out: DailyWrapEvent[] = [];
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

/**
 * 把 AI 結構化輸出（含 # SECTOR_NARRATIVE / # TRANSLATED_NEWS / # EVENTS）拆成 3 段
 */
function parseStructuredAi(text: string): {
  sectorNarrative: string[];
  translatedNews: TranslatedHeadline[];
  events: DailyWrapEvent[];
} {
  const sections: Record<string, string[]> = {
    SECTOR_NARRATIVE: [],
    TRANSLATED_NEWS: [],
    EVENTS: [],
  };
  let current: keyof typeof sections | null = null;
  for (const rawLine of text.split("\n")) {
    const line = rawLine.replace(/\r/g, "");
    const header = line.match(/^#+\s*(SECTOR_NARRATIVE|TRANSLATED_NEWS|EVENTS)/i);
    if (header) {
      current = header[1].toUpperCase() as keyof typeof sections;
      continue;
    }
    if (!current) continue;
    sections[current].push(line);
  }

  // sector_narrative: 取 - 起頭的列、或非空 markdown bullet
  const sectorNarrative = sections.SECTOR_NARRATIVE.map((l) =>
    l.replace(/^\s*[-•*]\s*/, "").trim(),
  ).filter((l) => l.length > 5 && l.length < 200);

  // translated_news: 同上 + 抓括號內 source
  const translatedNews: TranslatedHeadline[] = sections.TRANSLATED_NEWS.map((l) => {
    const clean = l.replace(/^\s*[-•*]\s*/, "").trim();
    if (clean.length < 5 || clean.length > 200) return null;
    // 抓尾巴的「（CNBC）」「（MarketWatch）」等
    const srcMatch = clean.match(/[（(]([^）)]+)[）)]\s*$/);
    const source = srcMatch ? srcMatch[1] : "英文媒體";
    const summary = srcMatch
      ? clean.replace(/[（(][^）)]+[）)]\s*$/, "").trim()
      : clean;
    return { source, zhSummary: summary };
  }).filter((n): n is TranslatedHeadline => n !== null);

  // events: 編號 1-12 抓
  const events: DailyWrapEvent[] = [];
  for (const line of sections.EVENTS) {
    const m = line.match(/^\s*(\d{1,2})[.、)]\s*(.+?)\s*$/);
    if (m) {
      const rank = parseInt(m[1], 10);
      const t = m[2].trim();
      if (rank >= 1 && rank <= 12 && t.length > 0 && t.length < 80) {
        events.push({ rank, text: t });
      }
    }
  }

  return {
    sectorNarrative,
    translatedNews,
    events: events.slice(0, 10),
  };
}

/**
 * 把 AI 生成的族群 narrative 對應回 UsSectorPerf 的 rationale 欄位
 * （AI 敘事的順序 ≈ leaders + laggards，按名稱對齊）
 */
function mergeSectorRationale(
  perfs: UsSectorPerf[],
  narratives: string[],
): UsSectorPerf[] {
  return perfs.map((p) => {
    // 找一條 narrative，其中包含這個 sector 的中文 label 關鍵字
    // 例如 label "IC 設計｜AI 半導體" → 找含「AI 半導體」或「IC 設計」的 narrative
    const tokens = p.label.split(/[｜|/]/).map((t) => t.trim());
    const match = narratives.find((n) =>
      tokens.some((t) => t.length > 1 && n.includes(t)),
    );
    return { ...p, rationale: match };
  });
}

// ─── Cache ─────────────────────────────────────────────────
// Session-based cache：cache key 包含「交易期 ID」
// 美股 05:30 TPE 切到新 session → cache key 變 → 自動 invalidate
// 避免跨過收盤時間還餵舊版 wrap-up 給使用者
let cache: { data: DailyWrapResponse; at: number; key: string } | null = null;
// 上限保險：就算 session 沒切（例如假日連續），也最多 24 小時就 refresh
const HARD_TTL = 24 * 60 * 60_000;

// ─── Handler ──────────────────────────────────────────────
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get("symbols") ?? "";
  const extraSymbols = symbolsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // cache key 含 extraSymbols 排序 + 美股 session ID（每天 05:30 TPE 切一次）
  const session = usWrapSession();
  const key = `${session}|${extraSymbols.slice().sort().join(",")}`;
  // force=1 → bypass cache（給 cron 強制 refresh 用）
  const force = searchParams.get("force") === "1";
  if (
    !force &&
    cache &&
    Date.now() - cache.at < HARD_TTL &&
    cache.key === key
  ) {
    return NextResponse.json(cache.data);
  }

  // 並行拉資料（多 1 個：sectorRotation；headlines 分中英文）
  const [indices, adr, tx, zhHeadlines, enHeadlines, sectorRotation] =
    await Promise.all([
      fetchIndices(),
      fetchAdrs(extraSymbols),
      fetchTxNight(),
      fetchZhHeadlines(),
      fetchEnHeadlines(),
      fetchUsSectorRotation(),
    ]);

  const indicesSummary = buildIndicesSummary(indices);
  const adrSummary = buildAdrSummary(adr);
  const futuresSummary = buildFuturesSummary(tx);
  const sectorSummary =
    sectorRotation.leaders.length > 0 || sectorRotation.laggards.length > 0
      ? buildSectorRotationSummary(
          sectorRotation.leaders,
          sectorRotation.laggards,
        )
      : "（族群報價暫缺）";

  const allHeadlines = [...zhHeadlines, ...enHeadlines];

  // 用 Claude 生成 3 段結構化內容
  let events: DailyWrapEvent[] = [];
  let translatedNews: TranslatedHeadline[] = [];
  let leaderSectors: UsSectorPerf[] = sectorRotation.leaders;
  let laggardSectors: UsSectorPerf[] = sectorRotation.laggards;
  let source: "ai" | "rule" = "rule";
  let error: string | undefined;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey && allHeadlines.length > 5) {
    try {
      const client = new Anthropic({ apiKey });

      const userPrompt = `# 今日財經速報原料

## 大盤摘要
- ${indicesSummary}
- ${adrSummary}
- ${futuresSummary}

## 美股族群輪動（依 sector symbol 漲跌平均排序）
${sectorSummary}

## 英文新聞標題（${enHeadlines.length} 條，請翻譯成繁體中文後放入 TRANSLATED_NEWS 區塊）
${enHeadlines.map((h, i) => `${i + 1}. ${h}`).join("\n")}

## 中文新聞標題（${zhHeadlines.length} 條，可用來補 EVENTS 區塊）
${zhHeadlines.map((h, i) => `${i + 1}. ${h}`).join("\n")}

請依 system prompt 規定輸出 3 段（# SECTOR_NARRATIVE / # TRANSLATED_NEWS / # EVENTS）。
- SECTOR_NARRATIVE：4-6 條，描述族群輪動 + 領頭股 + 一句催化劑
- TRANSLATED_NEWS：5-8 條，把英文新聞翻譯成繁體中文 + 末尾標來源（CNBC / MarketWatch 等）
- EVENTS：10 條重點事件編號清單`;

      const resp = await client.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 3000,
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

      const parsed = parseStructuredAi(text);
      events = parsed.events;
      translatedNews = parsed.translatedNews;

      // 把 AI narrative 對應回 sector 物件的 rationale
      leaderSectors = mergeSectorRationale(
        sectorRotation.leaders,
        parsed.sectorNarrative,
      );
      laggardSectors = mergeSectorRationale(
        sectorRotation.laggards,
        parsed.sectorNarrative,
      );

      if (events.length >= 5) source = "ai";
      else error = "AI 結構化回應不完整，已 fallback";
    } catch (e) {
      error = `AI 失敗：${e instanceof Error ? e.message : "未知"}`;
    }
  } else if (!apiKey) {
    error = "未設定 ANTHROPIC_API_KEY，跳過 AI 統整";
  }

  // Fallback：events 直接用中文 headlines、translatedNews 留空
  if (events.length === 0) {
    events = zhHeadlines.slice(0, 10).map((h, i) => ({
      rank: i + 1,
      text: h.replace(/^\[[^\]]+\]\s*/, ""),
    }));
    source = "rule";
  }

  const data: DailyWrapResponse & { session?: string } = {
    asOf: Date.now(),
    generatedAt: Date.now(),
    indices,
    indicesSummary,
    adr,
    adrSummary,
    futuresSummary,
    events,
    leaderSectors,
    laggardSectors,
    translatedNews,
    error,
    source,
    session,
  };

  cache = { data, at: Date.now(), key };
  return NextResponse.json(data);
}
