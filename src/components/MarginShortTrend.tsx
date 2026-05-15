"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import type { MarginShortRow } from "@/app/api/stock-margin-detail/route";

type Props = {
  symbol: string;
};

export function MarginShortTrend({ symbol }: Props) {
  const [rows, setRows] = useState<MarginShortRow[]>([]);
  const [loading, setLoading] = useState(true);

  const isTw = /\.(TW|TWO)$/i.test(symbol);

  useEffect(() => {
    if (!isTw) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/stock-margin-detail?symbol=${encodeURIComponent(symbol)}&days=30`)
      .then((r) => r.json())
      .then((d) => setRows(d.rows ?? []))
      .finally(() => setLoading(false));
  }, [symbol, isTw]);

  if (!isTw) return null;

  if (loading)
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 text-center text-sm text-gray-500">
        載入融資融券…
      </div>
    );

  if (rows.length === 0) return null;

  // SVG dual-axis line chart
  const w = 880;
  const h = 220;
  const padL = 50;
  const padR = 50;
  const padT = 16;
  const padB = 34;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;

  const margins = rows.map((r) => r.marginBalance);
  const shorts = rows.map((r) => r.shortBalance);
  const marginMax = Math.max(...margins);
  const marginMin = Math.min(...margins);
  const shortMax = Math.max(...shorts);
  const shortMin = Math.min(...shorts);

  const marginRange = Math.max(1, marginMax - marginMin) || 1;
  const shortRange = Math.max(1, shortMax - shortMin) || 1;

  function x(i: number) {
    if (rows.length === 1) return padL + innerW / 2;
    return padL + (i / (rows.length - 1)) * innerW;
  }
  function yMargin(v: number) {
    return padT + (1 - (v - marginMin) / marginRange) * innerH;
  }
  function yShort(v: number) {
    return padT + (1 - (v - shortMin) / shortRange) * innerH;
  }

  const marginPath = rows.map((r, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${yMargin(r.marginBalance)}`).join(" ");
  const shortPath = rows.map((r, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${yShort(r.shortBalance)}`).join(" ");

  // 顯示日期 ticks
  const tickIdx = rows.length <= 6
    ? rows.map((_, i) => i)
    : [0, Math.floor(rows.length / 3), Math.floor(rows.length * 2 / 3), rows.length - 1];

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <header className="mb-3 flex items-center gap-2">
        <TrendingUp size={14} className="text-orange-600" />
        <h3 className="text-sm font-semibold text-gray-800">融資融券趨勢</h3>
        <span className="text-xs text-gray-500">近 {rows.length} 個交易日</span>
      </header>

      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full min-w-[600px]">
          {/* 軸線 */}
          <line x1={padL} y1={padT} x2={padL} y2={h - padB} stroke="#d1d5db" strokeWidth="0.5" />
          <line x1={w - padR} y1={padT} x2={w - padR} y2={h - padB} stroke="#d1d5db" strokeWidth="0.5" />
          <line x1={padL} y1={h - padB} x2={w - padR} y2={h - padB} stroke="#d1d5db" strokeWidth="0.5" />

          {/* 區域填色 */}
          <path
            d={`${marginPath} L ${x(rows.length - 1)} ${h - padB} L ${padL} ${h - padB} Z`}
            fill="rgba(220, 38, 38, 0.05)"
          />

          {/* 融資線 (紅) */}
          <path d={marginPath} fill="none" stroke="#dc2626" strokeWidth="2" />
          {rows.map((r, i) => (
            <circle key={`m-${i}`} cx={x(i)} cy={yMargin(r.marginBalance)} r="2.5" fill="#dc2626" />
          ))}

          {/* 融券線 (綠) */}
          <path d={shortPath} fill="none" stroke="#16a34a" strokeWidth="2" />
          {rows.map((r, i) => (
            <circle key={`s-${i}`} cx={x(i)} cy={yShort(r.shortBalance)} r="2.5" fill="#16a34a" />
          ))}

          {/* Y 軸標籤 - 融資（左） */}
          <text x={padL - 4} y={padT + 4} textAnchor="end" fontSize="9" fill="#dc2626">
            {marginMax.toLocaleString()}
          </text>
          <text x={padL - 4} y={h - padB - 2} textAnchor="end" fontSize="9" fill="#dc2626">
            {marginMin.toLocaleString()}
          </text>

          {/* Y 軸標籤 - 融券（右） */}
          <text x={w - padR + 4} y={padT + 4} textAnchor="start" fontSize="9" fill="#16a34a">
            {shortMax.toLocaleString()}
          </text>
          <text x={w - padR + 4} y={h - padB - 2} textAnchor="start" fontSize="9" fill="#16a34a">
            {shortMin.toLocaleString()}
          </text>

          {/* X 軸 ticks */}
          {tickIdx.map((i) => (
            <text key={i} x={x(i)} y={h - padB + 14} textAnchor="middle" fontSize="9" fill="#6b7280">
              {rows[i].date.slice(5)}
            </text>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-2 flex justify-center gap-4 text-[11px]">
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-4 bg-red-600" /> 融資餘額（左軸）
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-4 bg-green-600" /> 融券餘額（右軸）
        </span>
      </div>

      {/* 詳細表 — 最近 8 個交易日 */}
      <div className="mt-3 max-h-72 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-gray-200 text-[10px] uppercase text-gray-500">
              <th className="px-2 py-1.5 text-left">日期</th>
              <th className="px-2 py-1.5 text-right">融資餘額</th>
              <th className="px-2 py-1.5 text-right">變化</th>
              <th className="px-2 py-1.5 text-right">融券餘額</th>
              <th className="px-2 py-1.5 text-right">變化</th>
            </tr>
          </thead>
          <tbody>
            {[...rows].reverse().slice(0, 10).map((r) => (
              <tr key={r.date} className="border-t border-gray-100">
                <td className="px-2 py-1.5 text-gray-600">{r.date}</td>
                <td className="px-2 py-1.5 text-right tabular-nums text-gray-800">
                  {r.marginBalance.toLocaleString()}
                </td>
                <td
                  className={`px-2 py-1.5 text-right tabular-nums ${
                    r.marginChange > 0 ? "text-red-600" : r.marginChange < 0 ? "text-green-600" : "text-gray-400"
                  }`}
                >
                  {r.marginChange >= 0 ? "+" : ""}
                  {r.marginChange.toLocaleString()}
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums text-gray-800">
                  {r.shortBalance.toLocaleString()}
                </td>
                <td
                  className={`px-2 py-1.5 text-right tabular-nums ${
                    r.shortChange > 0 ? "text-red-600" : r.shortChange < 0 ? "text-green-600" : "text-gray-400"
                  }`}
                >
                  {r.shortChange >= 0 ? "+" : ""}
                  {r.shortChange.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-[10px] text-gray-400">
        融資增 = 散戶看多加碼；融券增 = 看空力道增加。資料源：FinMind / 證交所
      </p>
    </section>
  );
}
