"use client";

import { useEffect, useState } from "react";
import { Building, AlertCircle } from "lucide-react";
import type { InstitutionalRow } from "@/app/api/stock-institutional/route";

type Props = {
  symbol: string;
};

const COLORS = {
  foreign: "#3b82f6", // 外資 = 藍
  trust: "#f97316", // 投信 = 橘
  dealer: "#a78bfa", // 自營商 = 紫
};

export function InstitutionalChart({ symbol }: Props) {
  const [rows, setRows] = useState<InstitutionalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ msg: string; hint?: string } | null>(null);

  // 只有台股有
  const isTw = /\.(TW|TWO)$/i.test(symbol);

  useEffect(() => {
    if (!isTw) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`/api/stock-institutional?symbol=${encodeURIComponent(symbol)}&days=60`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError({ msg: d.error, hint: d.hint });
        setRows(d.rows ?? []);
      })
      .catch((e) => setError({ msg: e.message }))
      .finally(() => setLoading(false));
  }, [symbol, isTw]);

  if (!isTw) return null;

  if (loading)
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 text-center text-sm text-gray-500">
        載入三大法人籌碼…
      </div>
    );

  if (error) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50/20 p-4">
        <div className="flex items-start gap-2 text-sm text-green-500">
          <AlertCircle size={14} className="mt-0.5 shrink-0 text-green-600" />
          <div>
            <div>三大法人資料載入失敗：{error.msg}</div>
            {error.hint && <div className="mt-1 text-[11px] text-green-500/80">{error.hint}</div>}
          </div>
        </div>
      </div>
    );
  }

  if (rows.length === 0) return null;

  // 計算近 N 日各家累計買賣超
  const summary = rows.reduce(
    (acc, r) => {
      acc.foreign += r.foreign;
      acc.trust += r.trust;
      acc.dealer += r.dealer;
      acc.total += r.total;
      return acc;
    },
    { foreign: 0, trust: 0, dealer: 0, total: 0 },
  );

  // SVG bar chart
  const w = 800;
  const h = 240;
  const padL = 40;
  const padR = 10;
  const padT = 16;
  const padB = 36;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const barW = (innerW / rows.length) * 0.7;
  const stepX = innerW / rows.length;

  // 每天 total 找 abs max 做為 Y 軸
  const maxAbs = Math.max(
    1,
    ...rows.map((r) => Math.abs(r.foreign + Math.max(0, r.trust) + Math.max(0, r.dealer))),
    ...rows.map((r) => Math.abs(r.foreign + Math.min(0, r.trust) + Math.min(0, r.dealer))),
  );
  const zeroY = padT + innerH / 2;

  function y(v: number) {
    return zeroY - (v / maxAbs) * (innerH / 2);
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Building size={14} className="text-cyan-600" />
          <h3 className="text-sm font-semibold text-gray-700">三大法人籌碼</h3>
          <span className="text-xs text-gray-500">近 {rows.length} 個交易日（單位：股）</span>
        </div>
        <div className="flex flex-wrap gap-3 text-[11px]">
          <Legend color={COLORS.foreign} label="外資" />
          <Legend color={COLORS.trust} label="投信" />
          <Legend color={COLORS.dealer} label="自營" />
        </div>
      </header>

      {/* 近 N 日累計 summary */}
      <div className="mb-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <SummaryCard label="外資累計" value={summary.foreign} color={COLORS.foreign} />
        <SummaryCard label="投信累計" value={summary.trust} color={COLORS.trust} />
        <SummaryCard label="自營累計" value={summary.dealer} color={COLORS.dealer} />
        <SummaryCard label="合計" value={summary.total} bold />
      </div>

      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full min-w-[600px]">
          {/* Zero line */}
          <line
            x1={padL}
            y1={zeroY}
            x2={w - padR}
            y2={zeroY}
            stroke="#9ca3af"
            strokeWidth="0.5"
          />
          {/* Y axis labels */}
          <text x={padL - 5} y={padT + 4} textAnchor="end" fontSize="9" fill="#6b7280">
            +{fmtShares(maxAbs)}
          </text>
          <text x={padL - 5} y={zeroY + 3} textAnchor="end" fontSize="9" fill="#6b7280">
            0
          </text>
          <text x={padL - 5} y={h - padB - 2} textAnchor="end" fontSize="9" fill="#6b7280">
            -{fmtShares(maxAbs)}
          </text>

          {/* Stacked bars: 正值往上堆、負值往下堆 */}
          {rows.map((r, i) => {
            const cx = padL + stepX * (i + 0.5);
            const xLeft = cx - barW / 2;

            // 正向堆疊
            let positiveTop = zeroY;
            // 負向堆疊
            let negativeBottom = zeroY;

            const bars = (
              [
                { v: r.foreign, color: COLORS.foreign, label: "外資" },
                { v: r.trust, color: COLORS.trust, label: "投信" },
                { v: r.dealer, color: COLORS.dealer, label: "自營" },
              ] as const
            ).map((b) => {
              if (b.v === 0) return null;
              if (b.v > 0) {
                const yTop = y(b.v) + (zeroY - positiveTop);
                const height = zeroY - y(b.v);
                const rect = (
                  <rect
                    key={b.label}
                    x={xLeft}
                    y={positiveTop - height}
                    width={barW}
                    height={Math.max(0.5, height)}
                    fill={b.color}
                    opacity={0.85}
                  >
                    <title>{`${r.date} ${b.label}: ${fmtShares(b.v)}`}</title>
                  </rect>
                );
                positiveTop -= height;
                void yTop;
                return rect;
              } else {
                const height = y(b.v) - zeroY;
                const rect = (
                  <rect
                    key={b.label}
                    x={xLeft}
                    y={negativeBottom}
                    width={barW}
                    height={Math.max(0.5, height)}
                    fill={b.color}
                    opacity={0.85}
                  >
                    <title>{`${r.date} ${b.label}: ${fmtShares(b.v)}`}</title>
                  </rect>
                );
                negativeBottom += height;
                return rect;
              }
            });

            return <g key={r.date}>{bars}</g>;
          })}

          {/* X labels（每 10 天標一次） */}
          {rows.map((r, i) => {
            if (i % Math.max(1, Math.floor(rows.length / 8)) !== 0 && i !== rows.length - 1)
              return null;
            const cx = padL + stepX * (i + 0.5);
            return (
              <text
                key={r.date}
                x={cx}
                y={h - 10}
                textAnchor="middle"
                fontSize="9"
                fill="#6b7280"
              >
                {r.date.slice(5)}
              </text>
            );
          })}
        </svg>
      </div>

      <p className="mt-2 text-[10px] text-gray-400">
        資料源：FinMind / 證交所公開資訊。正值 = 買超、負值 = 賣超。
      </p>
    </section>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="inline-block h-2.5 w-3" style={{ background: color }} />
      <span className="text-gray-500">{label}</span>
    </span>
  );
}

function SummaryCard({
  label,
  value,
  color,
  bold,
}: {
  label: string;
  value: number;
  color?: string;
  bold?: boolean;
}) {
  const positive = value >= 0;
  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
      <div className="flex items-center gap-1.5 text-[10px] uppercase text-gray-500">
        {color && <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />}
        {label}
      </div>
      <div
        className={`mt-0.5 text-sm tabular-nums ${
          bold ? "font-bold" : ""
        } ${positive ? "text-red-600" : "text-green-600"}`}
      >
        {positive ? "+" : ""}
        {fmtShares(value)}
      </div>
    </div>
  );
}

function fmtShares(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1e8) return `${(v / 1e8).toFixed(1)}億`;
  if (abs >= 1e4) return `${(v / 1e4).toFixed(1)}萬`;
  return v.toLocaleString();
}
