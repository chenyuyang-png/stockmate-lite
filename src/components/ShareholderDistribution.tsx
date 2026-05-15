"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import type { StockShareholding } from "@/app/api/stock-shareholding/route";

type Props = {
  symbol: string;
};

export function ShareholderDistribution({ symbol }: Props) {
  const [data, setData] = useState<StockShareholding | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"summary" | "detail" | "foreign">("summary");

  const isTw = /\.(TW|TWO)$/i.test(symbol);

  useEffect(() => {
    if (!isTw) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/stock-shareholding?symbol=${encodeURIComponent(symbol)}`)
      .then((r) => r.json())
      .then((d) => setData(d.error ? null : (d as StockShareholding)))
      .finally(() => setLoading(false));
  }, [symbol, isTw]);

  if (!isTw) return null;

  if (loading)
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 text-center text-sm text-gray-500">
        載入籌碼分析…
      </div>
    );

  if (!data) return null;

  const asOfFormatted = data.asOf.replace(/^(\d{4})(\d{2})(\d{2})$/, "$1/$2/$3");

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Users size={14} className="text-pink-600" />
          <h3 className="text-sm font-semibold text-gray-800">籌碼分析</h3>
          <span className="text-xs text-gray-500">資料日期 {asOfFormatted}</span>
        </div>
        <div className="flex rounded-md border border-gray-200 bg-gray-50 p-0.5 text-xs">
          <button
            onClick={() => setView("summary")}
            className={`rounded px-2.5 py-1 ${
              view === "summary" ? "bg-blue-600 text-white" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            散戶/中實戶/大戶
          </button>
          <button
            onClick={() => setView("detail")}
            className={`rounded px-2.5 py-1 ${
              view === "detail" ? "bg-blue-600 text-white" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            詳細分級
          </button>
          <button
            onClick={() => setView("foreign")}
            className={`rounded px-2.5 py-1 ${
              view === "foreign" ? "bg-blue-600 text-white" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            外資持股趨勢
          </button>
        </div>
      </header>

      {view === "summary" && <SummaryView data={data} />}
      {view === "detail" && <DetailView data={data} />}
      {view === "foreign" && <ForeignView data={data} />}

      <p className="mt-3 text-[10px] text-gray-400">
        資料源：TDCC 集保戶股權分散表 + FinMind 外資持股比例
      </p>
    </section>
  );
}

function SummaryView({ data }: { data: StockShareholding }) {
  const { retail, middle, major } = data.summary;
  const total = retail.percentage + middle.percentage + major.percentage;

  // 圖形化：水平堆疊長條圖
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <Card
          label="散戶"
          subtitle="持股 < 100 張"
          people={retail.people}
          percentage={retail.percentage}
          color="bg-red-500"
          textColor="text-red-700"
        />
        <Card
          label="中實戶"
          subtitle="持股 100-400 張"
          people={middle.people}
          percentage={middle.percentage}
          color="bg-amber-500"
          textColor="text-amber-700"
        />
        <Card
          label="大戶"
          subtitle="持股 > 400 張"
          people={major.people}
          percentage={major.percentage}
          color="bg-green-500"
          textColor="text-green-700"
        />
      </div>

      {/* 堆疊長條圖 */}
      <div>
        <div className="mb-1 text-xs font-semibold text-gray-600">持股佔比分布</div>
        <div className="flex h-8 overflow-hidden rounded-md border border-gray-200">
          <div
            className="flex items-center justify-center bg-red-500 text-[11px] font-semibold text-white"
            style={{ width: `${(retail.percentage / total) * 100}%` }}
          >
            {retail.percentage.toFixed(1)}%
          </div>
          <div
            className="flex items-center justify-center bg-amber-500 text-[11px] font-semibold text-white"
            style={{ width: `${(middle.percentage / total) * 100}%` }}
          >
            {middle.percentage.toFixed(1)}%
          </div>
          <div
            className="flex items-center justify-center bg-green-500 text-[11px] font-semibold text-white"
            style={{ width: `${(major.percentage / total) * 100}%` }}
          >
            {major.percentage.toFixed(1)}%
          </div>
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-gray-500">
          <span>📊 共 {data.summary.totalPeople.toLocaleString()} 位股東</span>
          <span>大戶 {major.percentage > 60 ? "高度集中" : major.percentage > 40 ? "適中集中" : "分散"}</span>
        </div>
      </div>
    </div>
  );
}

function Card({
  label,
  subtitle,
  people,
  percentage,
  color,
  textColor,
}: {
  label: string;
  subtitle: string;
  people: number;
  percentage: number;
  color: string;
  textColor: string;
}) {
  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
      <div className="flex items-center justify-between">
        <div>
          <div className={`text-sm font-bold ${textColor}`}>{label}</div>
          <div className="text-[10px] text-gray-500">{subtitle}</div>
        </div>
        <span className={`inline-block h-2 w-8 rounded ${color}`} />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="text-[10px] text-gray-500">人數</div>
          <div className="font-semibold text-gray-800">{people.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-[10px] text-gray-500">持股</div>
          <div className={`font-semibold ${textColor}`}>{percentage.toFixed(2)}%</div>
        </div>
      </div>
    </div>
  );
}

function DetailView({ data }: { data: StockShareholding }) {
  return (
    <div className="max-h-96 overflow-y-auto">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-white">
          <tr className="border-b border-gray-200 text-[10px] uppercase text-gray-500">
            <th className="px-2 py-1.5 text-left">持股分級</th>
            <th className="px-2 py-1.5 text-right">人數</th>
            <th className="px-2 py-1.5 text-right">股數</th>
            <th className="px-2 py-1.5 text-right">占比</th>
            <th className="px-2 py-1.5"></th>
          </tr>
        </thead>
        <tbody>
          {data.distribution.map((d) => {
            const lvl = parseInt(d.level, 10);
            const tier = lvl <= 9 ? "散戶" : lvl <= 11 ? "中實戶" : "大戶";
            const tierColor = lvl <= 9 ? "text-red-600" : lvl <= 11 ? "text-amber-600" : "text-green-600";
            const barColor = lvl <= 9 ? "bg-red-400" : lvl <= 11 ? "bg-amber-400" : "bg-green-400";
            return (
              <tr key={d.level} className="border-t border-gray-100">
                <td className="px-2 py-1.5">
                  <span className={`mr-1 text-[10px] font-semibold ${tierColor}`}>{tier}</span>
                  <span className="text-gray-700">{d.label}</span>
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums text-gray-700">
                  {d.people.toLocaleString()}
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums text-gray-500">
                  {(d.shares / 1e6).toFixed(1)}M
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums font-semibold text-gray-800">
                  {d.percentage.toFixed(2)}%
                </td>
                <td className="px-2 py-1.5 w-24">
                  <div className="h-1.5 rounded bg-gray-100">
                    <div
                      className={`h-full rounded ${barColor}`}
                      style={{ width: `${Math.min(100, d.percentage * 1.4)}%` }}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ForeignView({ data }: { data: StockShareholding }) {
  const fh = data.foreignHistory;
  if (fh.length < 2) {
    return <p className="py-4 text-center text-sm text-gray-500">外資持股歷史資料不足。</p>;
  }

  const w = 800;
  const h = 200;
  const padL = 40;
  const padR = 10;
  const padT = 16;
  const padB = 30;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;

  const ratios = fh.map((r) => r.foreignRatio);
  const max = Math.max(...ratios);
  const min = Math.min(...ratios);
  const range = Math.max(0.1, max - min);

  function x(i: number) {
    return padL + (i / (fh.length - 1)) * innerW;
  }
  function y(v: number) {
    return padT + (1 - (v - min) / range) * innerH;
  }

  const path = fh.map((r, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(r.foreignRatio)}`).join(" ");
  const areaPath = `${path} L ${x(fh.length - 1)} ${h - padB} L ${padL} ${h - padB} Z`;

  const tickIdx = fh.length <= 6
    ? fh.map((_, i) => i)
    : [0, Math.floor(fh.length / 3), Math.floor(fh.length * 2 / 3), fh.length - 1];

  const first = fh[0].foreignRatio;
  const last = fh[fh.length - 1].foreignRatio;
  const change = last - first;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3 text-xs">
        <div className="rounded-md border border-gray-200 bg-gray-50 p-2">
          <div className="text-[10px] text-gray-500">最新外資持股</div>
          <div className="text-base font-bold text-blue-700">{last.toFixed(2)}%</div>
        </div>
        <div className="rounded-md border border-gray-200 bg-gray-50 p-2">
          <div className="text-[10px] text-gray-500">區間最高 / 最低</div>
          <div className="text-sm font-semibold text-gray-800">
            {max.toFixed(2)}% / {min.toFixed(2)}%
          </div>
        </div>
        <div className="rounded-md border border-gray-200 bg-gray-50 p-2">
          <div className="text-[10px] text-gray-500">3 個月變化</div>
          <div
            className={`text-base font-bold ${
              change > 0 ? "text-red-600" : change < 0 ? "text-green-600" : "text-gray-500"
            }`}
          >
            {change >= 0 ? "+" : ""}
            {change.toFixed(2)}%
          </div>
        </div>
      </div>

      <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
        <line x1={padL} y1={padT} x2={padL} y2={h - padB} stroke="#d1d5db" strokeWidth="0.5" />
        <line x1={padL} y1={h - padB} x2={w - padR} y2={h - padB} stroke="#d1d5db" strokeWidth="0.5" />
        <path d={areaPath} fill="rgba(37, 99, 235, 0.08)" />
        <path d={path} fill="none" stroke="#2563eb" strokeWidth="2" />
        {fh.map((r, i) => (
          <circle key={i} cx={x(i)} cy={y(r.foreignRatio)} r="2" fill="#2563eb" />
        ))}
        <text x={padL - 4} y={padT + 4} textAnchor="end" fontSize="9" fill="#6b7280">
          {max.toFixed(1)}%
        </text>
        <text x={padL - 4} y={h - padB} textAnchor="end" fontSize="9" fill="#6b7280">
          {min.toFixed(1)}%
        </text>
        {tickIdx.map((i) => (
          <text key={i} x={x(i)} y={h - padB + 14} textAnchor="middle" fontSize="9" fill="#6b7280">
            {fh[i].date.slice(5)}
          </text>
        ))}
      </svg>
    </div>
  );
}
