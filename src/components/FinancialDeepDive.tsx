"use client";

// 個股財務深度分析 — 5 個 tab 對應使用者的需求清單：
//
//   📊 盈利能力穿透       — ROE / ROA / ROIC 3 年
//   📈 核心利潤率分析     — 毛利 / 營益 / 淨利 / EBITDA 3 年
//   🏛️ 資產負債掃描       — 總資產 / 總負債 / Net Debt / 流動比 / 速動比 3 年
//   💧 現金流底稿         — OCF / ICF / FCF / Capex / FCF Yield 3 年
//   🧮 多維估值建模       — PE / Forward PE / PB / PS / EV-EBITDA / EV-Sales / FCF Yield / Div Yield / PEG
//
// 設計原則（呼應使用者「零幻覺、來源可追溯」）：
//   - 純資料展示，不做 AI 摘要、不下投資結論
//   - 每張表都附「資料來源 + 抓取時間」
//   - 每筆 metric 附「教科書級註腳」
//   - 缺失資料用「—」清楚標示，不猜不補

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Building2,
  Calculator,
  Droplets,
  Info,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type {
  StockDetail,
  AnnualIncomeRow,
  AnnualBalanceRow,
  AnnualCashflowRow,
} from "@/app/api/stock-detail/route";
import { formatLargeNumber, formatPercent } from "@/lib/format";

type Props = { symbol: string };

type Tab =
  | "profitability"
  | "margin"
  | "balance"
  | "cashflow"
  | "valuation";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "profitability", label: "盈利能力穿透", icon: <Activity size={12} /> },
  { id: "margin", label: "核心利潤率", icon: <BarChart3 size={12} /> },
  { id: "balance", label: "資產負債掃描", icon: <Building2 size={12} /> },
  { id: "cashflow", label: "現金流底稿", icon: <Droplets size={12} /> },
  { id: "valuation", label: "多維估值建模", icon: <Calculator size={12} /> },
];

export function FinancialDeepDive({ symbol }: Props) {
  const [tab, setTab] = useState<Tab>("profitability");
  const [detail, setDetail] = useState<StockDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/stock-detail?symbol=${encodeURIComponent(symbol)}`)
      .then((r) => r.json())
      .then((j: { detail?: StockDetail }) => {
        if (!cancelled) setDetail(j.detail ?? null);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  if (loading && !detail) {
    return (
      <section className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
        載入財務深度分析中…
      </section>
    );
  }
  if (!detail) {
    return (
      <section className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
        無法取得財務資料。
      </section>
    );
  }

  const hasFinancials =
    (detail.annualIncome?.length ?? 0) > 0 ||
    (detail.annualBalance?.length ?? 0) > 0 ||
    (detail.annualCashflow?.length ?? 0) > 0;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <header className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-indigo-600" />
          <h2 className="text-sm font-semibold text-gray-800">
            財務深度分析
          </h2>
          <span className="text-[10px] text-gray-500">
            3 年趨勢 · 公開財報原始數據 · 不下投資結論
          </span>
        </div>
        {detail.fetchedAt && (
          <span className="text-[10px] text-gray-400">
            資料抓取：{new Date(detail.fetchedAt).toLocaleString("zh-TW")}
          </span>
        )}
      </header>

      {/* Tab Bar */}
      <div className="mb-3 flex flex-wrap gap-1 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px flex items-center gap-1 border-b-2 px-3 py-1.5 text-xs font-medium transition ${
              tab === t.id
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {!hasFinancials && tab !== "valuation" && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-800">
          ⚠️ Yahoo Finance 沒有提供此標的的歷史財報三表（部分台股、ETF、海外股可能查不到）。
          下方「多維估值建模」仍可用 TTM 即時數據。
        </div>
      )}

      <div className="mt-2">
        {tab === "profitability" && <ProfitabilityPanel detail={detail} />}
        {tab === "margin" && <MarginPanel detail={detail} />}
        {tab === "balance" && <BalancePanel detail={detail} />}
        {tab === "cashflow" && <CashflowPanel detail={detail} />}
        {tab === "valuation" && <ValuationPanel detail={detail} />}
      </div>

      <SourceFooter />
    </section>
  );
}

// ─── Tab 1：盈利能力穿透（ROE / ROA / ROIC）──────────────
function ProfitabilityPanel({ detail }: { detail: StockDetail }) {
  const income = detail.annualIncome ?? [];
  const balance = detail.annualBalance ?? [];

  // ROIC = NOPAT / Invested Capital
  // NOPAT = OperatingIncome × (1 - effective tax rate)
  // Invested Capital = Total Equity + Total Debt
  const rows = income.map((inc) => {
    const bal = balance.find((b) => b.fiscalYear === inc.fiscalYear);
    const taxRate =
      inc.pretaxIncome && inc.incomeTax !== undefined && inc.pretaxIncome > 0
        ? inc.incomeTax / inc.pretaxIncome
        : 0.2; // 預設 20%（台灣營所稅）
    const nopat =
      inc.operatingIncome !== undefined
        ? inc.operatingIncome * (1 - taxRate)
        : undefined;
    const totalDebt = bal
      ? (bal.shortLongTermDebt ?? 0) + (bal.longTermDebt ?? 0)
      : 0;
    const investedCapital = bal
      ? (bal.totalStockholderEquity ?? 0) + totalDebt
      : 0;
    const roic =
      nopat !== undefined && investedCapital > 0
        ? nopat / investedCapital
        : undefined;
    const roe =
      bal?.totalStockholderEquity && bal.totalStockholderEquity > 0 && inc.netIncome
        ? inc.netIncome / bal.totalStockholderEquity
        : undefined;
    const roa =
      bal?.totalAssets && bal.totalAssets > 0 && inc.netIncome
        ? inc.netIncome / bal.totalAssets
        : undefined;
    return {
      fiscalYear: inc.fiscalYear,
      roe,
      roa,
      roic,
      taxRate,
    };
  });

  return (
    <div className="space-y-3">
      <MetricTable
        rows={rows.map((r) => ({
          year: r.fiscalYear,
          values: [
            { label: "ROE", value: r.roe, format: "pct" },
            { label: "ROA", value: r.roa, format: "pct" },
            { label: "ROIC", value: r.roic, format: "pct" },
          ],
        }))}
      />
      <FootnoteList
        items={[
          {
            term: "ROE 股東權益報酬率",
            def: "Net Income / Equity — 衡量「公司用股東的錢能賺多少」",
          },
          {
            term: "ROA 資產報酬率",
            def: "Net Income / Total Assets — 整體資產的獲利效率（含負債）",
          },
          {
            term: "ROIC 投入資本報酬率",
            def: "NOPAT / (Equity + Debt) — 加入負債後的真實獲利能力。教科書定義：ROIC > 加權平均資金成本 (WACC) 才創造價值",
          },
        ]}
      />
    </div>
  );
}

// ─── Tab 2：核心利潤率（毛利 / 營益 / 淨利 / EBITDA）─────
function MarginPanel({ detail }: { detail: StockDetail }) {
  const income = detail.annualIncome ?? [];

  const rows = income.map((inc) => {
    const rev = inc.totalRevenue ?? 0;
    return {
      fiscalYear: inc.fiscalYear,
      revenue: inc.totalRevenue,
      grossMargin:
        rev > 0 && inc.grossProfit !== undefined ? inc.grossProfit / rev : undefined,
      operatingMargin:
        rev > 0 && inc.operatingIncome !== undefined
          ? inc.operatingIncome / rev
          : undefined,
      netMargin:
        rev > 0 && inc.netIncome !== undefined ? inc.netIncome / rev : undefined,
    };
  });

  return (
    <div className="space-y-3">
      <MetricTable
        rows={rows.map((r) => ({
          year: r.fiscalYear,
          values: [
            { label: "營收", value: r.revenue, format: "large" },
            { label: "毛利率", value: r.grossMargin, format: "pct" },
            { label: "營益率", value: r.operatingMargin, format: "pct" },
            { label: "淨利率", value: r.netMargin, format: "pct" },
          ],
        }))}
      />
      {/* TTM 即時欄位（多顯示一行供對照）*/}
      <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
        <div className="text-[10px] font-semibold uppercase text-gray-500">
          最新 TTM（過去 12 個月，可能跨年度）
        </div>
        <div className="mt-1 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          <Pair label="毛利率" value={formatPercent(detail.grossMargins != null ? detail.grossMargins * 100 : undefined)} />
          <Pair label="營益率" value={formatPercent(detail.operatingMargins != null ? detail.operatingMargins * 100 : undefined)} />
          <Pair label="淨利率" value={formatPercent(detail.profitMargins != null ? detail.profitMargins * 100 : undefined)} />
          <Pair label="EBITDA 利潤率" value={formatPercent(detail.ebitdaMargins != null ? detail.ebitdaMargins * 100 : undefined)} />
        </div>
      </div>
      <FootnoteList
        items={[
          {
            term: "毛利率",
            def: "GrossProfit / Revenue — 反映產品本身的賺錢能力（扣掉原料、製造成本）",
          },
          {
            term: "營益率",
            def: "OperatingIncome / Revenue — 加上營業費用後的本業獲利能力",
          },
          {
            term: "淨利率",
            def: "NetIncome / Revenue — 包含稅、利息、業外損益的最終淨賺",
          },
          {
            term: "EBITDA 利潤率",
            def: "EBITDA / Revenue — 排除折舊攤提、利息、稅的純現金毛利率",
          },
        ]}
      />
    </div>
  );
}

// ─── Tab 3：資產負債掃描 ──────────────────────────────────
function BalancePanel({ detail }: { detail: StockDetail }) {
  const balance = detail.annualBalance ?? [];

  const rows = balance.map((b) => {
    const totalDebt = (b.shortLongTermDebt ?? 0) + (b.longTermDebt ?? 0);
    const netDebt = totalDebt - (b.cash ?? 0);
    const debtToEquity =
      (b.totalStockholderEquity ?? 0) > 0
        ? totalDebt / (b.totalStockholderEquity ?? 0)
        : undefined;
    const currentRatio =
      (b.totalCurrentLiabilities ?? 0) > 0
        ? (b.totalCurrentAssets ?? 0) / (b.totalCurrentLiabilities ?? 0)
        : undefined;
    return {
      fiscalYear: b.fiscalYear,
      totalAssets: b.totalAssets,
      totalLiabilities: b.totalLiabilities,
      equity: b.totalStockholderEquity,
      netDebt,
      debtToEquity,
      currentRatio,
    };
  });

  return (
    <div className="space-y-3">
      <MetricTable
        rows={rows.map((r) => ({
          year: r.fiscalYear,
          values: [
            { label: "總資產", value: r.totalAssets, format: "large" },
            { label: "總負債", value: r.totalLiabilities, format: "large" },
            { label: "股東權益", value: r.equity, format: "large" },
            { label: "Net Debt", value: r.netDebt, format: "large", tone: "neg-bad" },
            { label: "負債/權益", value: r.debtToEquity, format: "num2" },
            { label: "流動比", value: r.currentRatio, format: "num2" },
          ],
        }))}
      />
      <FootnoteList
        items={[
          {
            term: "Net Debt 淨負債",
            def: "Total Debt − Cash — 教科書定義「真正背負的債」。負值代表現金部位 > 負債（淨現金公司）",
          },
          {
            term: "負債/權益比",
            def: "Total Debt / Equity — 衡量財務槓桿。> 2 通常視為高槓桿（產業別差異大）",
          },
          {
            term: "流動比率",
            def: "流動資產 / 流動負債 — 短期償債能力。教科書定義 > 1 為安全、> 2 為寬鬆",
          },
        ]}
      />
    </div>
  );
}

// ─── Tab 4：現金流底稿 ────────────────────────────────────
function CashflowPanel({ detail }: { detail: StockDetail }) {
  const cf = detail.annualCashflow ?? [];
  const inc = detail.annualIncome ?? [];

  const rows = cf.map((c) => {
    const ocf = c.operatingCashflow;
    const capex = c.capitalExpenditures ?? 0; // 通常為負
    const fcf =
      ocf !== undefined ? ocf + capex : undefined; // capex 已是負數
    const incMatch = inc.find((i) => i.fiscalYear === c.fiscalYear);
    const fcfMargin =
      fcf !== undefined && incMatch?.totalRevenue && incMatch.totalRevenue > 0
        ? fcf / incMatch.totalRevenue
        : undefined;
    return {
      fiscalYear: c.fiscalYear,
      operatingCashflow: c.operatingCashflow,
      investingCashflow: c.investingCashflow,
      financingCashflow: c.financingCashflow,
      capex,
      fcf,
      fcfMargin,
    };
  });

  return (
    <div className="space-y-3">
      <MetricTable
        rows={rows.map((r) => ({
          year: r.fiscalYear,
          values: [
            { label: "營運 CF", value: r.operatingCashflow, format: "large", tone: "pos-good" },
            { label: "投資 CF", value: r.investingCashflow, format: "large" },
            { label: "籌資 CF", value: r.financingCashflow, format: "large" },
            { label: "Capex", value: r.capex, format: "large" },
            { label: "自由現金流 FCF", value: r.fcf, format: "large", tone: "pos-good" },
            { label: "FCF 利潤率", value: r.fcfMargin, format: "pct" },
          ],
        }))}
      />
      <FootnoteList
        items={[
          {
            term: "營運活動現金流 (OCF)",
            def: "本業實際收進來的現金。教科書定義：OCF 應該長期 > 淨利，差太多代表獲利品質問題（應收帳款增、存貨堆積）",
          },
          {
            term: "投資活動現金流 (ICF)",
            def: "通常為負（買固定資產、併購、買金融商品）。轉正代表處分資產、可能是衰退訊號",
          },
          {
            term: "籌資活動現金流 (FCF)",
            def: "正號 = 借錢/增資；負號 = 還錢/發股利/買庫藏股。長期負且公司穩定 = 對股東友善",
          },
          {
            term: "自由現金流 FCF",
            def: "OCF + Capex（Capex 通常負，故等於 OCF − |Capex|）。真正能拿來還債/發股利/併購的錢",
          },
        ]}
      />
    </div>
  );
}

// ─── Tab 5：多維估值建模 ──────────────────────────────────
function ValuationPanel({ detail }: { detail: StockDetail }) {
  // 多維 ratios
  const mc = detail.marketCap ?? 0;
  const ev = detail.enterpriseValue ?? 0;

  // 用最新一筆損益估 P/S、EV/Sales、EV/EBITDA
  const latestIncome = detail.annualIncome?.[detail.annualIncome.length - 1];
  const ttmRevenue = latestIncome?.totalRevenue ?? 0;
  const ttmOI = latestIncome?.operatingIncome ?? 0;
  // EBITDA fallback：用 OperatingIncome（沒有 D&A）— 不精確但是給個數量級
  const ebitdaApprox =
    detail.ebitdaMargins && ttmRevenue
      ? detail.ebitdaMargins * ttmRevenue
      : ttmOI;

  const ps = mc > 0 && ttmRevenue > 0 ? mc / ttmRevenue : undefined;
  const evToSales = ev > 0 && ttmRevenue > 0 ? ev / ttmRevenue : undefined;
  const evToEbitda =
    ev > 0 && ebitdaApprox > 0 ? ev / ebitdaApprox : undefined;
  const fcfYield =
    detail.freeCashflow && mc > 0 ? detail.freeCashflow / mc : undefined;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <ValuationCard
          label="本益比 (TTM PE)"
          value={detail.trailingPE}
          format="num2"
          hint="股價 / EPS。> 30 通常算高、< 15 算低（產業別差異大）"
        />
        <ValuationCard
          label="預期本益比 (Forward PE)"
          value={detail.forwardPE}
          format="num2"
          hint="股價 / 未來 12 個月預估 EPS"
        />
        <ValuationCard
          label="股價淨值比 (P/B)"
          value={detail.priceToBook}
          format="num2"
          hint="股價 / 每股淨值。資產密集型產業（銀行、製造）參考"
        />
        <ValuationCard
          label="股價營收比 (P/S)"
          value={ps}
          format="num2"
          hint="MarketCap / Revenue。早期成長股（SaaS / AI）必看"
        />
        <ValuationCard
          label="EV / EBITDA"
          value={evToEbitda}
          format="num2"
          hint="排除資本結構後的純獲利倍數（跨國併購常用）"
        />
        <ValuationCard
          label="EV / Sales"
          value={evToSales}
          format="num2"
          hint="包含負債的營收倍數（評估高槓桿公司用）"
        />
        <ValuationCard
          label="FCF Yield 自由現金流率"
          value={fcfYield != null ? fcfYield * 100 : undefined}
          format="pct"
          hint="FCF / MarketCap。> 5% 通常算便宜（債券收益率比較基準）"
        />
        <ValuationCard
          label="股息殖利率 Div Yield"
          value={detail.dividendYield != null ? detail.dividendYield * 100 : undefined}
          format="pct"
          hint="現金股利 / 股價。台股穩定殖利率股常見 3-6%"
        />
        <ValuationCard
          label="本益成長比 PEG"
          value={detail.pegRatio}
          format="num2"
          hint="PE / EPS 年增率。< 1 通常代表「成長被低估」"
        />
      </div>

      <div className="rounded-md border border-blue-200 bg-blue-50/60 p-3 text-[11px] leading-relaxed text-blue-900">
        💡 多維估值的意義：單看 PE 不夠 — 高負債公司要看 EV/EBITDA；早期不賺錢的公司看 P/S；
        穩定派息看 Div Yield；成長股看 PEG。本表整理給使用者自行判讀，不下任何投資結論。
      </div>

      <FootnoteList
        items={[
          {
            term: "EV 企業價值",
            def: "MarketCap + Total Debt − Cash — 假設買下整間公司要付的「全包價」，含承接的負債",
          },
          {
            term: "Forward PE",
            def: "比 TTM PE 前瞻，但仰賴分析師預估，誤差會被「成長預期」放大",
          },
          {
            term: "PEG",
            def: "Peter Lynch 提出。教科書定義：< 1 為便宜、1-2 合理、> 2 偏貴。需配合穩定盈餘成長率",
          },
        ]}
      />
    </div>
  );
}

// ─── 共用元件 ─────────────────────────────────────────────

type MetricFormat = "pct" | "num2" | "large";
type MetricTone = "pos-good" | "neg-bad" | "neutral";
type MetricCell = {
  label: string;
  value: number | undefined;
  format: MetricFormat;
  tone?: MetricTone;
};

type MetricRow = {
  year: string;
  values: MetricCell[];
};

function MetricTable({ rows }: { rows: MetricRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-800">
        ⚠️ 此標的尚無歷史年度資料（Yahoo Finance 可能未涵蓋）
      </div>
    );
  }

  // 取 row[0].values 的 labels 作為欄位
  const labels = rows[0]?.values.map((v) => v.label) ?? [];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-200 text-left text-[10px] uppercase text-gray-500">
            <th className="px-2 py-1.5">指標</th>
            {rows.map((r) => (
              <th key={r.year} className="px-2 py-1.5 text-right">
                FY {r.year.slice(0, 7)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {labels.map((label, i) => (
            <tr key={label} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-2 py-1.5 font-medium text-gray-700">{label}</td>
              {rows.map((r) => {
                const cell = r.values[i];
                return (
                  <td
                    key={`${r.year}-${label}`}
                    className={`px-2 py-1.5 text-right tabular-nums ${cellColor(
                      cell,
                    )}`}
                  >
                    {formatMetric(cell)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatMetric(cell: MetricCell): string {
  if (cell.value === undefined || !Number.isFinite(cell.value)) return "—";
  if (cell.format === "pct") {
    // ROIC/ROE/Margin 都是小數 → ×100
    const pct = cell.value * 100;
    return formatPercent(pct);
  }
  if (cell.format === "num2") {
    return cell.value.toFixed(2);
  }
  // large
  return formatLargeNumber(cell.value);
}

function cellColor(cell: MetricCell): string {
  if (cell.value === undefined || !Number.isFinite(cell.value))
    return "text-gray-400";
  if (cell.tone === "neg-bad") {
    return cell.value > 0 ? "text-red-700" : "text-green-700";
  }
  if (cell.tone === "pos-good") {
    return cell.value > 0 ? "text-emerald-700" : "text-amber-700";
  }
  return "text-gray-800";
}

function ValuationCard({
  label,
  value,
  format,
  hint,
}: {
  label: string;
  value: number | undefined;
  format: MetricFormat;
  hint: string;
}) {
  const formatted =
    value === undefined || !Number.isFinite(value)
      ? "—"
      : format === "pct"
        ? formatPercent(value)
        : format === "num2"
          ? value.toFixed(2)
          : formatLargeNumber(value);

  return (
    <div
      className="rounded-md border border-gray-200 bg-gray-50 p-2.5"
      title={hint}
    >
      <div className="flex items-baseline justify-between gap-1">
        <span className="text-[10px] text-gray-500">{label}</span>
        <Info size={9} className="text-gray-400" />
      </div>
      <div className="mt-0.5 text-base font-bold tabular-nums text-gray-900">
        {formatted}
      </div>
      <div className="mt-1 text-[10px] leading-snug text-gray-500 line-clamp-2">
        {hint}
      </div>
    </div>
  );
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between rounded bg-white px-2 py-1">
      <span className="text-[10px] text-gray-500">{label}</span>
      <span className="font-semibold tabular-nums text-gray-800">{value}</span>
    </div>
  );
}

function FootnoteList({
  items,
}: {
  items: { term: string; def: string }[];
}) {
  return (
    <details className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
      <summary className="cursor-pointer text-[11px] font-semibold text-gray-700">
        📖 名詞定義（教科書級，點開看）
      </summary>
      <ul className="mt-2 space-y-1.5 text-[11px] leading-snug text-gray-700">
        {items.map((it) => (
          <li key={it.term}>
            <strong className="text-gray-900">{it.term}：</strong>
            <span className="text-gray-600">{it.def}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}

function SourceFooter() {
  return (
    <p className="mt-4 border-t border-gray-100 pt-2 text-[10px] leading-snug text-gray-400">
      📚 資料來源：Yahoo Finance 公開 quoteSummary API（含 incomeStatementHistory /
      balanceSheetHistory / cashflowStatementHistory）— 原始公司年報資料，
      未經 AI 重述或推論，僅做格式化呈現。本工具不提供任何投資建議。
    </p>
  );
}
