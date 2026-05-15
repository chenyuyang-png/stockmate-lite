import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import YahooFinance from "yahoo-finance2";
import Parser from "rss-parser";
import { usWrapSession } from "@/lib/marketSession";

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
  /** 失敗訊息 */
  error?: string;
  /** ai vs fallback rule */
  source: "ai" | "rule";
};

const SYSTEM_PROMPT = `你是台灣財經速報編輯，使用繁體中文。
任務：整理「今日美股 / 全球財經重點 10 大事項」清單，給台灣投資人晨讀。

格式硬性要求：
- 嚴格輸出 10 條，每條一行
- 每行格式：先公司名 / 主體，再具體事件 + 數字 + 結果
- 簡潔有力，**每行不超過 35 字**
- 涵蓋光譜：科技公司事件、AI、晶片、財報、總體經濟、地緣政治、產業新聞、特殊個股
- 不要寫「今天」「最新」「昨晚」這種冗詞 — 內容已隱含當下
- 不要寫"美股下跌"這種已經給的概要 — 要具體公司 / 事件
- 避免完全相同主題重複（例如不要 3 條都是 Nvidia）

範例：
✅ OpenAI 以 200 億美元入股 Cerebras 11% 股權
✅ 芝商所與 Silicon Data 合推 AI 算力期貨
✅ 三星與工會未能就薪酬協議達成一致
❌ 今日 Nvidia 股價有波動（沒數字 + 含冗詞）
❌ 美股大盤下跌（沒具體事件）

輸出格式（純文字，10 行）：
1. [事件]
2. [事件]
...
10. [事件]

最後一行禁止加註解 / 免責聲明 / 多餘文字 — 只要 10 條編號清單。`;

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

const NEWS_SOURCES = [
  { name: "Bloomberg", url: "https://feeds.bloomberg.com/markets/news.rss" },
  { name: "Yahoo Finance", url: "https://finance.yahoo.com/news/rssindex" },
  { name: "Seeking Alpha", url: "https://seekingalpha.com/market_currents.xml" },
  { name: "經濟日報", url: "https://money.udn.com/rssfeed/news/1001/5588/5589" },
  { name: "經濟日報·台股", url: "https://money.udn.com/rssfeed/news/1001/5588/12017" },
  { name: "ETtoday財經", url: "https://feeds.feedburner.com/ettoday/finance" },
  { name: "中央社國際", url: "https://feeds.feedburner.com/rsscna/intworld" },
];

const parser = new Parser({
  timeout: 6000,
  headers: { "User-Agent": "Mozilla/5.0 (YoyoStocks)" },
});

async function fetchHeadlines(): Promise<string[]> {
  const results = await Promise.all(
    NEWS_SOURCES.map(async (s) => {
      try {
        const feed = await parser.parseURL(s.url);
        return (feed.items ?? []).slice(0, 8).map((item) => ({
          title: item.title ?? "",
          source: s.name,
          isoDate: item.isoDate,
        }));
      } catch {
        return [];
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

  // 隨機抽樣分散來源（同一來源最多取 6 則）
  const bySource: Record<string, typeof all> = {};
  for (const h of all) {
    bySource[h.source] ??= [];
    if (bySource[h.source].length < 6) bySource[h.source].push(h);
  }
  return Object.values(bySource)
    .flat()
    .map((h) => `[${h.source}] ${h.title}`);
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

  // 並行拉資料
  const [indices, adr, tx, headlines] = await Promise.all([
    fetchIndices(),
    fetchAdrs(extraSymbols),
    fetchTxNight(),
    fetchHeadlines(),
  ]);

  const indicesSummary = buildIndicesSummary(indices);
  const adrSummary = buildAdrSummary(adr);
  const futuresSummary = buildFuturesSummary(tx);

  // 用 Claude 生成 10 事件
  let events: DailyWrapEvent[] = [];
  let source: "ai" | "rule" = "rule";
  let error: string | undefined;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey && headlines.length > 5) {
    try {
      const client = new Anthropic({ apiKey });

      const userPrompt = `# 今日財經速報原料

## 大盤摘要（已算好，僅供參考）
- ${indicesSummary}
- ${adrSummary}
- ${futuresSummary}

## 近 30 小時新聞標題（${headlines.length} 條，從多個來源彙整）
${headlines.map((h, i) => `${i + 1}. ${h}`).join("\n")}

請依規定格式輸出 10 條重點事件清單（純文字編號清單，不要 JSON、不要免責聲明）。`;

      // 用 Haiku 4.5 — 結構化清單輸出，Haiku 完全 hold 得住，成本 1/5
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
      else error = "AI 回傳格式異常，已切換為原料條目";
    } catch (e) {
      error = `AI 失敗：${e instanceof Error ? e.message : "未知"}`;
    }
  } else if (!apiKey) {
    error = "未設定 ANTHROPIC_API_KEY，跳過 AI 統整";
  }

  // Fallback：直接從新聞標題截出 10 條（去除來源前綴）
  if (events.length === 0) {
    events = headlines.slice(0, 10).map((h, i) => ({
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
    error,
    source,
    session, // 交易期 ID 給 UI 顯示「美股 5/14 收盤回顧」
  };

  cache = { data, at: Date.now(), key };
  return NextResponse.json(data);
}
