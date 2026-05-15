import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export type TxFuturesRow = {
  futuresId: "TX" | "MTX";
  contractDate: string; // 月份 YYYYMM
  session: "day" | "after";
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type TwFuturesResponse = {
  asOf: number;
  /** 大台 TX：日盤最新 + 夜盤最新（如有資料） */
  tx: {
    day?: TxFuturesRow;
    after?: TxFuturesRow;
    /** 對比 — 通常用 day 的前一個交易日做 baseline */
    prevDay?: TxFuturesRow;
  };
  mtx: {
    day?: TxFuturesRow;
    after?: TxFuturesRow;
    prevDay?: TxFuturesRow;
  };
  message?: string;
  hint?: string;
};

const FINMIND = "https://api.finmindtrade.com/api/v4/data";

type FinMindRow = {
  date: string;
  futures_id: string;
  contract_date: string;
  trading_session?: string;
  open: number;
  max: number;
  min: number;
  close: number;
  volume: number;
};

async function fetchFinMindFutures(
  futuresId: "TX" | "MTX",
): Promise<TxFuturesRow[]> {
  const token = process.env.FINMIND_TOKEN;
  const start = new Date();
  start.setDate(start.getDate() - 14);
  const url = new URL(FINMIND);
  url.searchParams.set("dataset", "TaiwanFuturesDaily");
  url.searchParams.set("data_id", futuresId);
  url.searchParams.set("start_date", start.toISOString().slice(0, 10));
  if (token) url.searchParams.set("token", token);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`finmind ${res.status}`);
  const json = (await res.json()) as { status: number; data?: FinMindRow[] };
  if (json.status !== 200 || !json.data) throw new Error("no data");

  // 只看「最近月」合約（依 contract_date 升冪取第一個 >= 今日的合約）
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const validRows = json.data.filter(
    (r) =>
      r.contract_date && r.date && Number.isFinite(r.close) && r.close > 0,
  );
  if (validRows.length === 0) return [];

  // 找近月：先依日期 desc，取最新日期上有的「最早 contract_date >= today」
  const dates = Array.from(new Set(validRows.map((r) => r.date))).sort();
  const latestDate = dates[dates.length - 1];
  const rowsOfLatest = validRows.filter((r) => r.date === latestDate);
  const futuresContracts = Array.from(
    new Set(rowsOfLatest.map((r) => r.contract_date)),
  ).sort();
  const nearMonth =
    futuresContracts.find((c) => c >= today.slice(0, 6)) ??
    futuresContracts[0];

  // 取近月 + 把每天每個 session 的 row 整理出來
  return validRows
    .filter((r) => r.contract_date === nearMonth)
    .map(
      (r): TxFuturesRow => ({
        futuresId,
        contractDate: r.contract_date,
        session: r.trading_session === "after_market" ? "after" : "day",
        date: r.date,
        open: r.open,
        high: r.max,
        low: r.min,
        close: r.close,
        volume: r.volume ?? 0,
      }),
    )
    .sort((a, b) =>
      a.date === b.date
        ? a.session === b.session
          ? 0
          : a.session === "day"
            ? -1
            : 1
        : a.date.localeCompare(b.date),
    );
}

function pickLatest(rows: TxFuturesRow[]): {
  day?: TxFuturesRow;
  after?: TxFuturesRow;
  prevDay?: TxFuturesRow;
} {
  if (rows.length === 0) return {};
  // 最新一筆是 day or after
  const last = rows[rows.length - 1];
  // 最後一個 day session
  const daySessions = rows.filter((r) => r.session === "day");
  const afterSessions = rows.filter((r) => r.session === "after");
  const lastDay = daySessions[daySessions.length - 1];
  const lastAfter = afterSessions[afterSessions.length - 1];
  // 前一日 day session（拿來算當日漲跌）
  const prevDay =
    lastDay && daySessions.length >= 2
      ? daySessions[daySessions.length - 2]
      : undefined;

  // 如果最新一筆是 after session 且比最後 day 更晚 → 夜盤現價就是它
  if (lastAfter && lastDay && lastAfter.date >= lastDay.date && last.session === "after") {
    return { day: lastDay, after: lastAfter, prevDay };
  }
  return { day: lastDay, after: lastAfter, prevDay };
}

// In-memory cache 60s
let cache: { data: TwFuturesResponse; at: number } | null = null;
const TTL = 60_000;

export async function GET() {
  if (cache && Date.now() - cache.at < TTL) {
    return NextResponse.json(cache.data);
  }

  try {
    const [txRows, mtxRows] = await Promise.allSettled([
      fetchFinMindFutures("TX"),
      fetchFinMindFutures("MTX"),
    ]);
    const txData = txRows.status === "fulfilled" ? txRows.value : [];
    const mtxData = mtxRows.status === "fulfilled" ? mtxRows.value : [];

    if (txData.length === 0 && mtxData.length === 0) {
      const out: TwFuturesResponse = {
        asOf: Date.now(),
        tx: {},
        mtx: {},
        message: process.env.FINMIND_TOKEN
          ? "FinMind 期貨資料暫時無法取得"
          : "FinMind 期貨資料需付費 token（TaiwanFuturesDaily 進階 dataset）",
        hint: "可從首頁的「美股盤前 / 夜盤」+ 加權指數推估方向；或設 FINMIND_TOKEN 啟用真實數據",
      };
      cache = { data: out, at: Date.now() };
      return NextResponse.json(out);
    }

    const out: TwFuturesResponse = {
      asOf: Date.now(),
      tx: pickLatest(txData),
      mtx: pickLatest(mtxData),
    };
    cache = { data: out, at: Date.now() };
    return NextResponse.json(out);
  } catch (e) {
    return NextResponse.json({
      asOf: Date.now(),
      tx: {},
      mtx: {},
      message: `載入失敗：${e instanceof Error ? e.message : "未知"}`,
    } satisfies TwFuturesResponse);
  }
}
