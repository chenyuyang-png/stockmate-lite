"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { QuarterRow } from "@/app/api/stock-history/route";

type Props = {
  symbol: string;
};

type Comparison = {
  label: string;
  current: number | undefined;
  prior: number | undefined;
  pctChange: number | undefined;
};

export function GrowthAnalysis({ symbol }: Props) {
  const [quarters, setQuarters] = useState<QuarterRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stock-history?symbol=${encodeURIComponent(symbol)}&years=3`)
      .then((r) => r.json())
      .then((d) => setQuarters(d.quarters ?? []))
      .finally(() => setLoading(false));
  }, [symbol]);

  if (loading)
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 text-center text-sm text-gray-500">
        分析成長動能…
      </div>
    );

  if (quarters.length < 2) return null;

  const latest = quarters[quarters.length - 1];
  const qoqPrior = quarters[quarters.length - 2];
  const yoyPrior = quarters.length >= 5 ? quarters[quarters.length - 5] : undefined;

  function buildCmp(label: string, key: keyof QuarterRow, prior: QuarterRow | undefined): Comparison {
    const cur = latest[key] as number | undefined;
    const prv = prior?.[key] as number | undefined;
    let pct: number | undefined;
    if (Number.isFinite(cur) && Number.isFinite(prv) && (prv as number) !== 0) {
      pct = ((cur as number) - (prv as number)) / Math.abs(prv as number) * 100;
    }
    return { label, current: cur, prior: prv, pctChange: pct };
  }

  const qoqRows: Comparison[] = [
    buildCmp("營收", "revenue", qoqPrior),
    buildCmp("毛利", "grossProfit", qoqPrior),
    buildCmp("營業利益", "operatingIncome", qoqPrior),
    buildCmp("稅後淨利", "netIncome", qoqPrior),
    buildCmp("EPS", "eps", qoqPrior),
  ];

  const yoyRows: Comparison[] = yoyPrior
    ? [
        buildCmp("營收", "revenue", yoyPrior),
        buildCmp("毛利", "grossProfit", yoyPrior),
        buildCmp("營業利益", "operatingIncome", yoyPrior),
        buildCmp("稅後淨利", "netIncome", yoyPrior),
        buildCmp("EPS", "eps", yoyPrior),
      ]
    : [];

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <header className="mb-3 flex items-center gap-2">
        <TrendingUp size={14} className="text-blue-600" />
        <h3 className="text-sm font-semibold text-gray-700">成長動能分析</h3>
        <span className="text-xs text-gray-500">最新季 {latest.date}</span>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* QoQ */}
        <div>
          <div className="mb-2 text-xs font-semibold text-gray-600">
            季增 (QoQ) · 對比 {qoqPrior.date}
          </div>
          <div className="space-y-1">
            {qoqRows.map((r) => (
              <CompareRow key={r.label} cmp={r} unit={r.label === "EPS" ? "eps" : "value"} />
            ))}
          </div>
        </div>

        {/* YoY */}
        <div>
          <div className="mb-2 text-xs font-semibold text-gray-600">
            年增 (YoY) {yoyPrior ? `· 對比 ${yoyPrior.date}` : "· 資料不足"}
          </div>
          {yoyPrior ? (
            <div className="space-y-1">
              {yoyRows.map((r) => (
                <CompareRow key={r.label} cmp={r} unit={r.label === "EPS" ? "eps" : "value"} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500">需要至少 5 季資料才能計算年增。</p>
          )}
        </div>
      </div>

      {/* AI-style 結論小卡 */}
      <SummaryCard qoq={qoqRows} yoy={yoyRows} />
    </section>
  );
}

function CompareRow({ cmp, unit }: { cmp: Comparison; unit: "value" | "eps" }) {
  const pct = cmp.pctChange;
  const icon =
    pct === undefined ? (
      <Minus size={11} className="text-gray-400" />
    ) : pct > 0 ? (
      <TrendingUp size={11} className="text-red-600" />
    ) : (
      <TrendingDown size={11} className="text-green-600" />
    );
  const cls =
    pct === undefined ? "text-gray-400" : pct > 0 ? "text-red-600" : "text-green-600";

  const fmt = (v: number | undefined) =>
    v === undefined || !Number.isFinite(v)
      ? "—"
      : unit === "eps"
        ? v.toFixed(2)
        : `${(v / 1e8).toFixed(1)} 億`;

  return (
    <div className="grid grid-cols-12 gap-1 rounded border border-gray-100 bg-gray-50 px-2 py-1.5 text-xs">
      <span className="col-span-3 text-gray-600">{cmp.label}</span>
      <span className="col-span-3 tabular-nums text-gray-500">{fmt(cmp.prior)}</span>
      <span className="col-span-1 text-center text-gray-400">→</span>
      <span className="col-span-3 tabular-nums font-medium text-gray-800">
        {fmt(cmp.current)}
      </span>
      <span className={`col-span-2 flex items-center justify-end gap-0.5 tabular-nums ${cls}`}>
        {icon}
        {pct === undefined ? "—" : `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`}
      </span>
    </div>
  );
}

function SummaryCard({ qoq, yoy }: { qoq: Comparison[]; yoy: Comparison[] }) {
  // 用簡單規則產生中文結論
  const findPct = (rows: Comparison[], label: string) =>
    rows.find((r) => r.label === label)?.pctChange;

  const epsYoY = findPct(yoy, "EPS");
  const revYoY = findPct(yoy, "營收");
  const epsQoQ = findPct(qoq, "EPS");
  const revQoQ = findPct(qoq, "營收");

  const messages: { tone: "good" | "warn" | "neutral"; text: string }[] = [];

  if (epsYoY !== undefined) {
    if (epsYoY > 30) messages.push({ tone: "good", text: `EPS 年增 ${epsYoY.toFixed(0)}%，獲利動能強勁。` });
    else if (epsYoY > 10) messages.push({ tone: "good", text: `EPS 年增 ${epsYoY.toFixed(0)}%，獲利穩定成長。` });
    else if (epsYoY > 0) messages.push({ tone: "neutral", text: `EPS 年增 ${epsYoY.toFixed(0)}%，僅小幅成長。` });
    else messages.push({ tone: "warn", text: `EPS 年減 ${Math.abs(epsYoY).toFixed(0)}%，獲利轉弱，需留意是否為季節性 / 一次性因素。` });
  }
  if (revYoY !== undefined) {
    if (revYoY > 20) messages.push({ tone: "good", text: `營收年增 ${revYoY.toFixed(0)}%，本業擴張中。` });
    else if (revYoY < -10) messages.push({ tone: "warn", text: `營收年減 ${Math.abs(revYoY).toFixed(0)}%，需檢視終端需求變化。` });
  }
  if (epsQoQ !== undefined && epsYoY !== undefined) {
    if (epsQoQ > 0 && epsYoY > 0) messages.push({ tone: "good", text: "QoQ 與 YoY 同步成長，動能良好。" });
    else if (epsQoQ < 0 && epsYoY > 0) messages.push({ tone: "neutral", text: "雖然 YoY 仍正成長，但 QoQ 已轉弱，留意動能變化。" });
    else if (epsQoQ < 0 && epsYoY < 0) messages.push({ tone: "warn", text: "QoQ 與 YoY 雙降，獲利下行壓力增加。" });
  }
  if (revYoY !== undefined && epsYoY !== undefined) {
    if (revYoY > 10 && epsYoY < 0) messages.push({ tone: "warn", text: "營收成長但獲利衰退，毛利可能被擠壓。" });
  }

  if (messages.length === 0) return null;

  return (
    <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 p-3 text-xs">
      <div className="mb-1 font-semibold text-blue-900">📊 自動解讀</div>
      <ul className="space-y-0.5">
        {messages.map((m, i) => (
          <li key={i} className={
            m.tone === "good" ? "text-red-700" :
            m.tone === "warn" ? "text-green-700" :
            "text-gray-700"
          }>
            • {m.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
