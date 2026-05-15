import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const yahooFinance = new YahooFinance();

export type StockDetail = {
  symbol: string;
  // 基本價量
  price?: number;
  currency?: string;
  marketCap?: number;
  volume?: number;
  averageVolume?: number;
  // 估值
  trailingPE?: number;
  forwardPE?: number;
  priceToBook?: number;
  pegRatio?: number;
  enterpriseValue?: number;
  // 獲利能力
  eps?: number;
  forwardEPS?: number;
  earningsGrowth?: number;
  revenueGrowth?: number;
  // 利潤率
  grossMargins?: number;
  operatingMargins?: number;
  profitMargins?: number;
  ebitdaMargins?: number;
  // 報酬率
  returnOnEquity?: number;
  returnOnAssets?: number;
  // 財務體質
  currentRatio?: number;
  quickRatio?: number;
  debtToEquity?: number;
  totalCash?: number;
  totalDebt?: number;
  // 現金流
  freeCashflow?: number;
  operatingCashflow?: number;
  // 股利
  dividendYield?: number;
  dividendRate?: number;
  payoutRatio?: number;
  // 52 週區間
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  // 公司資訊
  longName?: string;
  shortName?: string;
  sector?: string; // Yahoo 的產業分類
  industry?: string;
  longBusinessSummary?: string;
  fullTimeEmployees?: number;
  city?: string;
  country?: string;
  website?: string;
  // 即期 vs 預期
  recommendationKey?: string;
  numberOfAnalystOpinions?: number;
  targetMeanPrice?: number;
  targetHighPrice?: number;
  targetLowPrice?: number;
  // ─── 3 年歷史財報（給 FinancialDeepDive 用）─────────────
  // 由舊到新排序（最近一筆在最後）
  annualIncome?: AnnualIncomeRow[];
  annualBalance?: AnnualBalanceRow[];
  annualCashflow?: AnnualCashflowRow[];
  fetchedAt?: string; // ISO timestamp 供 "零幻覺" 透明追蹤
};

/** 年度損益表 — 一年一筆 */
export type AnnualIncomeRow = {
  /** 會計年度截止日 YYYY-MM-DD */
  fiscalYear: string;
  totalRevenue?: number;
  grossProfit?: number;
  operatingIncome?: number; // EBIT
  netIncome?: number;
  /** 稅前淨利 — 用來估有效稅率 */
  pretaxIncome?: number;
  /** 所得稅費用 — 算有效稅率 */
  incomeTax?: number;
};

/** 年度資產負債表 */
export type AnnualBalanceRow = {
  fiscalYear: string;
  totalAssets?: number;
  totalLiabilities?: number;
  totalStockholderEquity?: number;
  cash?: number;
  shortLongTermDebt?: number;
  longTermDebt?: number;
  totalCurrentAssets?: number;
  totalCurrentLiabilities?: number;
};

/** 年度現金流量表 */
export type AnnualCashflowRow = {
  fiscalYear: string;
  /** 營運活動現金流 */
  operatingCashflow?: number;
  /** 投資活動現金流（通常為負，買固定資產 / 併購 / 投資金融商品）*/
  investingCashflow?: number;
  /** 籌資活動現金流（發債 / 股利 / 庫藏股 / 還貸）*/
  financingCashflow?: number;
  /** 資本支出（通常為負）*/
  capitalExpenditures?: number;
  /** 折舊攤提 — 算 EBITDA 用 */
  depreciation?: number;
};

/**
 * Yahoo 的數字欄位有時是 `{ raw: number }`、有時直接是 number。統一抽出。
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function asNum(v: any): number | undefined {
  if (v == null) return undefined;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "object" && typeof v.raw === "number") return v.raw;
  return undefined;
}

/** Yahoo 的 endDate 有時是 epoch、Date、或 ISO 字串。統一轉 YYYY-MM-DD */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function asFiscalDate(v: any): string {
  if (!v) return "";
  if (typeof v === "string") return v.slice(0, 10);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "number") {
    const ms = v > 1e12 ? v : v * 1000;
    return new Date(ms).toISOString().slice(0, 10);
  }
  if (typeof v === "object") {
    if (typeof v.fmt === "string") return v.fmt.slice(0, 10);
    if (typeof v.raw === "number") {
      const ms = v.raw > 1e12 ? v.raw : v.raw * 1000;
      return new Date(ms).toISOString().slice(0, 10);
    }
  }
  return "";
}

/** 把 incomeStatementHistory 的某一筆轉成 AnnualIncomeRow */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function flattenIncome(row: any): AnnualIncomeRow | null {
  const fy = asFiscalDate(row?.endDate);
  if (!fy) return null;
  return {
    fiscalYear: fy,
    totalRevenue: asNum(row?.totalRevenue),
    grossProfit: asNum(row?.grossProfit),
    operatingIncome: asNum(row?.operatingIncome ?? row?.ebit),
    netIncome: asNum(row?.netIncome),
    pretaxIncome: asNum(row?.incomeBeforeTax ?? row?.pretaxIncome),
    incomeTax: asNum(row?.incomeTaxExpense),
  };
}

/** 把 balanceSheetHistory 的某一筆轉成 AnnualBalanceRow */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function flattenBalance(row: any): AnnualBalanceRow | null {
  const fy = asFiscalDate(row?.endDate);
  if (!fy) return null;
  return {
    fiscalYear: fy,
    totalAssets: asNum(row?.totalAssets),
    totalLiabilities: asNum(row?.totalLiab ?? row?.totalLiabilities),
    totalStockholderEquity: asNum(
      row?.totalStockholderEquity ?? row?.stockholdersEquity,
    ),
    cash: asNum(row?.cash ?? row?.cashAndCashEquivalents),
    shortLongTermDebt: asNum(row?.shortLongTermDebt),
    longTermDebt: asNum(row?.longTermDebt),
    totalCurrentAssets: asNum(row?.totalCurrentAssets),
    totalCurrentLiabilities: asNum(row?.totalCurrentLiabilities),
  };
}

/** 把 cashflowStatementHistory 的某一筆轉成 AnnualCashflowRow */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function flattenCashflow(row: any): AnnualCashflowRow | null {
  const fy = asFiscalDate(row?.endDate);
  if (!fy) return null;
  return {
    fiscalYear: fy,
    operatingCashflow: asNum(row?.totalCashFromOperatingActivities),
    investingCashflow: asNum(row?.totalCashflowsFromInvestingActivities),
    financingCashflow: asNum(row?.totalCashFromFinancingActivities),
    capitalExpenditures: asNum(row?.capitalExpenditures),
    depreciation: asNum(row?.depreciation),
  };
}

// 將 quoteSummary 的巢狀回傳攤平成一個物件
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function flatten(qs: any): StockDetail {
  const sd = qs?.summaryDetail ?? {};
  const fd = qs?.financialData ?? {};
  const ks = qs?.defaultKeyStatistics ?? {};
  const ap = qs?.assetProfile ?? {};
  const p = qs?.price ?? {};
  return {
    symbol: p?.symbol ?? "",
    price: p?.regularMarketPrice,
    currency: p?.currency,
    marketCap: p?.marketCap ?? sd?.marketCap,
    volume: p?.regularMarketVolume,
    averageVolume: sd?.averageVolume,
    trailingPE: sd?.trailingPE,
    forwardPE: sd?.forwardPE ?? ks?.forwardPE,
    priceToBook: ks?.priceToBook,
    pegRatio: ks?.pegRatio,
    enterpriseValue: ks?.enterpriseValue,
    eps: ks?.trailingEps,
    forwardEPS: ks?.forwardEps,
    earningsGrowth: fd?.earningsGrowth,
    revenueGrowth: fd?.revenueGrowth,
    grossMargins: fd?.grossMargins,
    operatingMargins: fd?.operatingMargins,
    profitMargins: fd?.profitMargins ?? ks?.profitMargins,
    ebitdaMargins: fd?.ebitdaMargins,
    returnOnEquity: fd?.returnOnEquity,
    returnOnAssets: fd?.returnOnAssets,
    currentRatio: fd?.currentRatio,
    quickRatio: fd?.quickRatio,
    debtToEquity: fd?.debtToEquity,
    totalCash: fd?.totalCash,
    totalDebt: fd?.totalDebt,
    freeCashflow: fd?.freeCashflow,
    operatingCashflow: fd?.operatingCashflow,
    dividendYield: sd?.dividendYield,
    dividendRate: sd?.dividendRate,
    payoutRatio: sd?.payoutRatio,
    fiftyTwoWeekHigh: sd?.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: sd?.fiftyTwoWeekLow,
    longName: p?.longName ?? p?.shortName,
    shortName: p?.shortName,
    sector: ap?.sector,
    industry: ap?.industry,
    longBusinessSummary: ap?.longBusinessSummary,
    fullTimeEmployees: ap?.fullTimeEmployees,
    city: ap?.city,
    country: ap?.country,
    website: ap?.website,
    recommendationKey: fd?.recommendationKey,
    numberOfAnalystOpinions: fd?.numberOfAnalystOpinions,
    targetMeanPrice: fd?.targetMeanPrice,
    targetHighPrice: fd?.targetHighPrice,
    targetLowPrice: fd?.targetLowPrice,
  };
}

// GET /api/stock-detail?symbol=2330.TW
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") ?? "";
  if (!symbol) {
    return NextResponse.json({ error: "missing symbol" }, { status: 400 });
  }

  try {
    const qs = await yahooFinance.quoteSummary(
      symbol,
      {
        modules: [
          "price",
          "summaryDetail",
          "financialData",
          "defaultKeyStatistics",
          "assetProfile",
          // ─── 3 年歷史財報三表 ───
          "incomeStatementHistory",
          "balanceSheetHistory",
          "cashflowStatementHistory",
        ],
      },
      { validateResult: false },
    );

    const detail = flatten(qs);

    // 解析 3 年（取最近 4 個年度）的損益 / 資產負債 / 現金流
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inc = (qs as any)?.incomeStatementHistory?.incomeStatementHistory ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bal = (qs as any)?.balanceSheetHistory?.balanceSheetStatements ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cfs = (qs as any)?.cashflowStatementHistory?.cashflowStatements ?? [];

    // Yahoo 預設新→舊（最新一年在最前）。我們翻轉成舊→新方便畫圖
    detail.annualIncome = inc
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((r: any) => flattenIncome(r))
      .filter((r: AnnualIncomeRow | null): r is AnnualIncomeRow => r !== null)
      .reverse()
      .slice(-4);
    detail.annualBalance = bal
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((r: any) => flattenBalance(r))
      .filter((r: AnnualBalanceRow | null): r is AnnualBalanceRow => r !== null)
      .reverse()
      .slice(-4);
    detail.annualCashflow = cfs
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((r: any) => flattenCashflow(r))
      .filter((r: AnnualCashflowRow | null): r is AnnualCashflowRow => r !== null)
      .reverse()
      .slice(-4);

    detail.fetchedAt = new Date().toISOString();

    return NextResponse.json({ detail });
  } catch (err) {
    console.error("[/api/stock-detail]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
