"use client";

import { useEffect, useState } from "react";
import { Coins } from "lucide-react";
import type { DividendRow } from "@/app/api/stock-history/route";

type Props = {
  symbol: string;
};

export function DividendHistory({ symbol }: Props) {
  const [dividends, setDividends] = useState<DividendRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stock-history?symbol=${encodeURIComponent(symbol)}&years=10`)
      .then((r) => r.json())
      .then((d) => setDividends(d.dividends ?? []))
      .finally(() => setLoading(false));
  }, [symbol]);

  if (loading)
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 text-center text-sm text-gray-500">
        載入股利歷史…
      </div>
    );

  if (dividends.length === 0) return null;

  // 依「年」彙總（台股一年可能配多次：季配 / 半年配）
  const byYear = new Map<string, number>();
  for (const d of dividends) {
    const y = d.date.slice(0, 4);
    byYear.set(y, (byYear.get(y) ?? 0) + d.amount);
  }
  const years = Array.from(byYear.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  const max = Math.max(...years.map(([, v]) => v));
  const w = 600;
  const h = 200;
  const padL = 30;
  const padR = 10;
  const padT = 16;
  const padB = 28;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const barW = (innerW / years.length) * 0.65;
  const stepX = innerW / years.length;

  // 過去 5 年平均（excluding 今年）
  const past = years.slice(-6, -1);
  const avg5y = past.length > 0 ? past.reduce((s, [, v]) => s + v, 0) / past.length : 0;

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <header className="mb-3 flex items-center gap-2">
        <Coins size={14} className="text-amber-600" />
        <h3 className="text-sm font-semibold text-gray-700">股利歷史</h3>
        <span className="text-xs text-gray-500">
          近 {years.length} 年 · 過去 5 年平均 {avg5y.toFixed(2)}
        </span>
      </header>

      <svg viewBox={`0 0 ${w} ${h}`} className="w-full min-w-[400px]">
        {/* Y axis */}
        <line
          x1={padL}
          y1={padT}
          x2={padL}
          y2={h - padB}
          stroke="#d1d5db"
          strokeWidth="0.5"
        />
        <line
          x1={padL}
          y1={h - padB}
          x2={w - padR}
          y2={h - padB}
          stroke="#d1d5db"
          strokeWidth="0.5"
        />
        {/* 5y avg 線 */}
        {avg5y > 0 && (
          <>
            <line
              x1={padL}
              y1={padT + ((max - avg5y) / max) * innerH}
              x2={w - padR}
              y2={padT + ((max - avg5y) / max) * innerH}
              stroke="#fbbf24"
              strokeWidth="1"
              strokeDasharray="4 3"
            />
            <text
              x={w - padR - 4}
              y={padT + ((max - avg5y) / max) * innerH - 3}
              textAnchor="end"
              fontSize="9"
              fill="#fbbf24"
            >
              5 年均 {avg5y.toFixed(2)}
            </text>
          </>
        )}

        {years.map(([y, amount], i) => {
          const cx = padL + stepX * (i + 0.5);
          const yTop = padT + ((max - amount) / max) * innerH;
          const barHeight = h - padB - yTop;
          return (
            <g key={y}>
              <rect
                x={cx - barW / 2}
                y={yTop}
                width={barW}
                height={Math.max(1, barHeight)}
                fill="#fbbf24"
                opacity={0.7}
                rx={2}
              >
                <title>{`${y}: ${amount.toFixed(3)} 元`}</title>
              </rect>
              <text
                x={cx}
                y={yTop - 3}
                textAnchor="middle"
                fontSize="10"
                fill="#1f2937"
                fontWeight="600"
              >
                {amount.toFixed(2)}
              </text>
              <text
                x={cx}
                y={h - 10}
                textAnchor="middle"
                fontSize="10"
                fill="#6b7280"
              >
                {y}
              </text>
            </g>
          );
        })}
      </svg>

      {/* 詳細表（最近 4 次配息） */}
      <div className="mt-3 border-t border-gray-200 pt-2">
        <div className="mb-1 text-[11px] text-gray-500">最近發放紀錄</div>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs sm:grid-cols-4">
          {dividends.slice(-8).reverse().map((d, i) => (
            <li key={i} className="flex justify-between">
              <span className="text-gray-500">{d.date}</span>
              <span className="tabular-nums text-amber-700">{d.amount.toFixed(3)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
