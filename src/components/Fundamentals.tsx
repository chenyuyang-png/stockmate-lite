"use client";

import { useEffect, useState } from "react";
import { Building2, TrendingUp, ShieldCheck, Wallet, Target } from "lucide-react";
import type { StockDetail } from "@/app/api/stock-detail/route";
import { formatLargeNumber } from "@/lib/format";

type Props = {
  symbol: string;
};

export function Fundamentals({ symbol }: Props) {
  const [data, setData] = useState<StockDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stock-detail?symbol=${encodeURIComponent(symbol)}`)
      .then((r) => r.json())
      .then((res) => setData(res.detail ?? null))
      .finally(() => setLoading(false));
  }, [symbol]);

  if (loading)
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 text-center text-sm text-gray-500">
        載入公司基本面…
      </div>
    );
  if (!data)
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-500">
        無法載入公司基本面資料。
      </div>
    );

  return (
    <section className="space-y-3">
      {/* 公司資訊 */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <header className="mb-2 flex items-center gap-2">
          <Building2 size={14} className="text-sky-600" />
          <h3 className="text-sm font-semibold text-gray-700">公司資訊</h3>
        </header>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-4">
          {data.sector && <Mini label="產業" value={data.sector} />}
          {data.industry && <Mini label="細項" value={data.industry} />}
          {data.fullTimeEmployees && (
            <Mini label="員工數" value={data.fullTimeEmployees.toLocaleString()} />
          )}
          {data.country && <Mini label="總部" value={`${data.city ?? ""} ${data.country}`} />}
        </div>
        {data.longBusinessSummary && (
          <p className="mt-3 line-clamp-4 text-[12px] leading-relaxed text-gray-500">
            {data.longBusinessSummary}
          </p>
        )}
        {data.website && (
          <a
            href={data.website}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-[11px] text-sky-600 hover:underline"
          >
            🔗 官網
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {/* 估值 */}
        <SectionBlock icon={<Target size={14} className="text-amber-600" />} title="估值指標">
          <Stat label="本益比 (PE)" value={data.trailingPE} format="num2" />
          <Stat label="預估本益比" value={data.forwardPE} format="num2" />
          <Stat label="股價淨值比 (P/B)" value={data.priceToBook} format="num2" />
          <Stat label="PEG" value={data.pegRatio} format="num2" />
          <Stat label="市值" value={data.marketCap} format="large" suffix={data.currency} />
          <Stat label="EPS" value={data.eps} format="num2" />
          <Stat label="預估 EPS" value={data.forwardEPS} format="num2" />
          <Stat label="52 週區間" raw={range52w(data)} />
        </SectionBlock>

        {/* 獲利能力 */}
        <SectionBlock icon={<TrendingUp size={14} className="text-red-600" />} title="獲利能力">
          <Stat label="ROE" value={data.returnOnEquity} format="pct" tone />
          <Stat label="ROA" value={data.returnOnAssets} format="pct" tone />
          <Stat label="毛利率" value={data.grossMargins} format="pct" tone />
          <Stat label="營業利益率" value={data.operatingMargins} format="pct" tone />
          <Stat label="淨利率" value={data.profitMargins} format="pct" tone />
          <Stat label="EBITDA 利潤率" value={data.ebitdaMargins} format="pct" tone />
          <Stat label="EPS 成長" value={data.earningsGrowth} format="pct" tone />
          <Stat label="營收成長" value={data.revenueGrowth} format="pct" tone />
        </SectionBlock>

        {/* 財務體質 */}
        <SectionBlock icon={<ShieldCheck size={14} className="text-cyan-600" />} title="財務體質">
          <Stat label="負債比 (D/E)" value={data.debtToEquity} format="num2" invertTone />
          <Stat label="流動比率" value={data.currentRatio} format="num2" tone />
          <Stat label="速動比率" value={data.quickRatio} format="num2" tone />
          <Stat label="現金總額" value={data.totalCash} format="large" suffix={data.currency} />
          <Stat label="總負債" value={data.totalDebt} format="large" suffix={data.currency} />
          <Stat label="自由現金流" value={data.freeCashflow} format="large" suffix={data.currency} />
          <Stat
            label="營業現金流"
            value={data.operatingCashflow}
            format="large"
            suffix={data.currency}
          />
          <Stat label="企業價值" value={data.enterpriseValue} format="large" suffix={data.currency} />
        </SectionBlock>

        {/* 股利 + 分析師目標 */}
        <SectionBlock icon={<Wallet size={14} className="text-violet-600" />} title="股利 / 分析師">
          <Stat label="殖利率" value={data.dividendYield} format="pct" tone />
          <Stat label="現金股利" value={data.dividendRate} format="num2" suffix={data.currency} />
          <Stat label="配息率" value={data.payoutRatio} format="pct" />
          <Stat label="分析師建議" raw={recommendationLabel(data.recommendationKey)} />
          <Stat
            label="分析師人數"
            value={data.numberOfAnalystOpinions}
            format="num0"
          />
          <Stat label="目標均價" value={data.targetMeanPrice} format="num2" suffix={data.currency} />
          <Stat label="目標高價" value={data.targetHighPrice} format="num2" suffix={data.currency} />
          <Stat label="目標低價" value={data.targetLowPrice} format="num2" suffix={data.currency} />
        </SectionBlock>
      </div>
    </section>
  );
}

function range52w(d: StockDetail): string {
  if (d.fiftyTwoWeekLow && d.fiftyTwoWeekHigh) {
    return `${d.fiftyTwoWeekLow} ~ ${d.fiftyTwoWeekHigh}`;
  }
  return "—";
}

function recommendationLabel(key?: string): string {
  if (!key) return "—";
  const map: Record<string, string> = {
    strong_buy: "強力買進",
    buy: "買進",
    hold: "中立",
    sell: "賣出",
    strong_sell: "強力賣出",
    underperform: "不如大盤",
  };
  return map[key] ?? key;
}

function SectionBlock({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <header className="mb-2 flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      </header>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">{children}</div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase text-gray-500">{label}</div>
      <div className="text-gray-700">{value}</div>
    </div>
  );
}

type StatProps = {
  label: string;
  value?: number;
  raw?: string;
  format?: "num2" | "num0" | "pct" | "large";
  suffix?: string;
  tone?: boolean;
  invertTone?: boolean;
};

function Stat({ label, value, raw, format, suffix, tone, invertTone }: StatProps) {
  let display: string;
  if (raw !== undefined) {
    display = raw;
  } else if (value === undefined || value === null || !Number.isFinite(value)) {
    display = "—";
  } else if (format === "num2") {
    display = value.toFixed(2);
  } else if (format === "num0") {
    display = String(Math.round(value));
  } else if (format === "pct") {
    display = `${(value * 100).toFixed(2)}%`;
  } else if (format === "large") {
    display = formatLargeNumber(value);
  } else {
    display = String(value);
  }
  if (suffix && display !== "—" && !display.includes(suffix)) display += ` ${suffix}`;

  let color = "text-gray-700";
  if (tone && Number.isFinite(value)) {
    // 正向越大越好
    if ((value as number) >= 0.15) color = "text-red-600";
    else if ((value as number) >= 0) color = "text-gray-700";
    else color = "text-green-600";
  } else if (invertTone && Number.isFinite(value)) {
    // 數字越小越好（如負債比）
    if ((value as number) < 0.5) color = "text-red-600";
    else if ((value as number) < 1.5) color = "text-gray-700";
    else color = "text-green-600";
  }

  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-gray-500">{label}</span>
      <span className={`tabular-nums ${color}`}>{display}</span>
    </div>
  );
}
