import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export type DispositionStock = {
  code: string;
  name: string;
  reason: string; // 處置原因
  period: string; // 處置期間
  measure: string; // 處置措施
  date: string; // 公告日期 (民國格式)
};

export type NoticeStock = {
  code: string;
  name: string;
  reason: string; // 注意事由
  closingPrice: number;
  pe: number;
  date: string;
};

export type TwseWarnings = {
  disposition: DispositionStock[];
  notice: NoticeStock[];
};

// 上市股票處置 + 注意
const TWSE_DISPOSITION = "https://openapi.twse.com.tw/v1/announcement/punish";
const TWSE_NOTICE = "https://openapi.twse.com.tw/v1/announcement/notice";

// 上櫃股票處置 + 注意（TPEx 不同 endpoint）
const TPEX_DISPOSITION = "https://www.tpex.org.tw/openapi/v1/tpex_disposalSecurities";
const TPEX_NOTICE = "https://www.tpex.org.tw/openapi/v1/tpex_securitiesUnderAttention";

// 30 分鐘記憶體快取
let cache: { data: TwseWarnings; fetchedAt: number } | null = null;
const TTL = 30 * 60_000;

type TwseDispRow = {
  Code: string;
  Name: string;
  Date: string;
  ReasonsOfDisposition: string;
  DispositionPeriod: string;
  DispositionMeasures: string;
};

type TwseNoticeRow = {
  Code: string;
  Name: string;
  Date: string;
  TradingInfoForAttention: string;
  ClosingPrice: string;
  PE: string;
};

async function fetchTwse(): Promise<{ disp: DispositionStock[]; notice: NoticeStock[] }> {
  try {
    const [dispRes, noticeRes] = await Promise.all([
      fetch(TWSE_DISPOSITION, { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store" })
        .then((r) => r.json())
        .catch(() => []) as Promise<TwseDispRow[]>,
      fetch(TWSE_NOTICE, { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store" })
        .then((r) => r.json())
        .catch(() => []) as Promise<TwseNoticeRow[]>,
    ]);

    const disp = (Array.isArray(dispRes) ? dispRes : [])
      .filter((r) => r.Code && r.Code.trim() !== "")
      .map((r) => ({
        code: r.Code.trim(),
        name: r.Name?.trim() ?? "",
        reason: r.ReasonsOfDisposition ?? "",
        period: r.DispositionPeriod ?? "",
        measure: r.DispositionMeasures ?? "",
        date: r.Date ?? "",
      }));

    const notice = (Array.isArray(noticeRes) ? noticeRes : [])
      .filter((r) => r.Code && r.Code.trim() !== "")
      .map((r) => ({
        code: r.Code.trim(),
        name: r.Name?.trim() ?? "",
        reason: r.TradingInfoForAttention ?? "",
        closingPrice: parseFloat(r.ClosingPrice ?? "0"),
        pe: parseFloat(r.PE ?? "0"),
        date: r.Date ?? "",
      }));

    return { disp, notice };
  } catch {
    return { disp: [], notice: [] };
  }
}

type TpexDispRow = {
  證券代號?: string;
  證券名稱?: string;
  公告日期?: string;
  處置原因?: string;
  處置期間?: string;
  處置措施?: string;
  [key: string]: string | undefined;
};

async function fetchTpex(): Promise<{ disp: DispositionStock[]; notice: NoticeStock[] }> {
  try {
    const [dispRaw, noticeRaw] = await Promise.all([
      fetch(TPEX_DISPOSITION, { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store", redirect: "follow" })
        .then((r) => r.json())
        .catch(() => []) as Promise<TpexDispRow[]>,
      fetch(TPEX_NOTICE, { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store", redirect: "follow" })
        .then((r) => r.json())
        .catch(() => []) as Promise<TpexDispRow[]>,
    ]);

    const disp = (Array.isArray(dispRaw) ? dispRaw : [])
      .filter((r) => r.證券代號)
      .map((r) => ({
        code: (r.證券代號 ?? "").trim(),
        name: (r.證券名稱 ?? "").trim(),
        reason: r.處置原因 ?? "",
        period: r.處置期間 ?? "",
        measure: r.處置措施 ?? "",
        date: r.公告日期 ?? "",
      }));

    const notice = (Array.isArray(noticeRaw) ? noticeRaw : [])
      .filter((r) => r.證券代號)
      .map((r) => ({
        code: (r.證券代號 ?? "").trim(),
        name: (r.證券名稱 ?? "").trim(),
        reason: r["注意交易資訊"] ?? "",
        closingPrice: 0,
        pe: 0,
        date: r.公告日期 ?? "",
      }));

    return { disp, notice };
  } catch {
    return { disp: [], notice: [] };
  }
}

export async function GET() {
  if (cache && Date.now() - cache.fetchedAt < TTL) {
    return NextResponse.json(cache.data);
  }

  const [twse, tpex] = await Promise.all([fetchTwse(), fetchTpex()]);

  const data: TwseWarnings = {
    disposition: [...twse.disp, ...tpex.disp],
    notice: [...twse.notice, ...tpex.notice],
  };

  cache = { data, fetchedAt: Date.now() };
  return NextResponse.json(data);
}
