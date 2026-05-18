"use client";

import { useEffect, useState } from "react";
import { Gauge, Activity } from "lucide-react";
import type { MarketSentimentResponse } from "@/app/api/market-sentiment/route";
import { formatPercent } from "@/lib/format";

const RATING_CN: Record<string, string> = {
  "Extreme Fear": "極度恐懼",
  Fear: "恐懼",
  Neutral: "中性",
  Greed: "貪婪",
  "Extreme Greed": "極度貪婪",
};

export function MarketSentiment() {
  const [data, setData] = useState<MarketSentimentResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/market-sentiment");
        const d = (await res.json()) as MarketSentimentResponse;
        if (!cancelled) setData(d);
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const id = setInterval(load, 60 * 60_000); // 1 小時自動更新
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (loading && !data)
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-3 text-center text-xs text-gray-500">
        載入市場情緒指標…
      </div>
    );

  if (!data || (!data.vix && !data.fearGreed)) return null;

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {/* 🇺🇸 美股市場情緒 */}
      <section className="rounded-xl border border-purple-200 bg-purple-50/30 p-4">
        <header className="mb-3 flex items-center gap-2">
          <Gauge size={16} className="text-purple-700" />
          <h2 className="text-sm font-bold text-gray-900">🇺🇸 美股市場情緒</h2>
          <span className="text-[11px] text-gray-500">VIX + F&G</span>
        </header>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {data.fearGreed && <FearGreedGauge fg={data.fearGreed} />}
          {data.vix && <VixCard vix={data.vix} />}
        </div>
        <p className="mt-3 text-[10px] text-gray-400">
          F&G 由 CNN Business Fear & Greed Index 提供；VIX 為芝加哥選擇權交易所恐慌指數（S&P 500 隱含波動率）。
        </p>
      </section>

      {/* 🇹🇼 台股市場情緒 */}
      <TwSentimentCard />
    </div>
  );
}

// 🆕 台股市場情緒卡 — 從 tw-daily-wrap 拉資料合成 panic 分數
function TwSentimentCard() {
  type TwWrap = {
    indices?: { symbol: string; changePercent: number }[];
    institutional?: { foreign: number; trust: number; dealer: number; total: number };
    margin?: { marginChange: number; shortChange: number };
  };
  const [twData, setTwData] = useState<TwWrap | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/tw-daily-wrap");
        const d = (await res.json()) as TwWrap;
        if (!cancelled) setTwData(d);
      } catch {
        /* ignore */
      }
    }
    load();
    const id = setInterval(load, 60 * 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!twData) {
    return (
      <section className="rounded-xl border border-red-200 bg-red-50/30 p-4 text-center text-xs text-gray-500">
        載入台股情緒指標…
      </section>
    );
  }

  const twii = twData.indices?.find((i) => i.symbol === "^TWII");
  const indexChange = twii?.changePercent ?? 0;
  const inst = twData.institutional;
  const margin = twData.margin;

  // 合成「台股恐慌分數」0-100（直觀：分數越高越恐慌）
  // - 加權指數 -3% = +30、-2% = +20、-1% = +10
  // - 外資 + 投信合計賣超 100 億+ = +30、賣超 50-100 億 = +20、買超 = -10
  // - 融資餘額月變化 -5 萬張+ = +20、+5 萬張+ = -10（散戶冷靜）
  let panic = 50; // 中性
  if (indexChange <= -3) panic += 30;
  else if (indexChange <= -2) panic += 20;
  else if (indexChange <= -1) panic += 10;
  else if (indexChange >= 2) panic -= 20;
  else if (indexChange >= 1) panic -= 10;

  if (inst) {
    const instSum = inst.foreign + inst.trust;
    if (instSum <= -100) panic += 30;
    else if (instSum <= -50) panic += 20;
    else if (instSum >= 50) panic -= 15;
  }

  if (margin) {
    if (margin.marginChange <= -50000) panic += 20;
    else if (margin.marginChange >= 50000) panic -= 10;
  }
  panic = Math.max(0, Math.min(100, panic));

  const label =
    panic >= 75
      ? { text: "極度恐慌", color: "text-green-700", bg: "bg-green-100", ring: "ring-green-300" }
      : panic >= 55
        ? { text: "偏空", color: "text-green-700", bg: "bg-green-50", ring: "ring-green-200" }
        : panic >= 45
          ? { text: "中性", color: "text-gray-700", bg: "bg-gray-50", ring: "ring-gray-300" }
          : panic >= 25
            ? { text: "偏多", color: "text-red-700", bg: "bg-red-50", ring: "ring-red-200" }
            : { text: "極度貪婪", color: "text-red-700", bg: "bg-red-100", ring: "ring-red-300" };

  return (
    <section className="rounded-xl border border-red-200 bg-red-50/30 p-4">
      <header className="mb-3 flex items-center gap-2">
        <Activity size={16} className="text-red-700" />
        <h2 className="text-sm font-bold text-gray-900">🇹🇼 台股市場情緒</h2>
        <span className="text-[11px] text-gray-500">大盤 + 法人 + 散戶</span>
      </header>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {/* 恐慌分數 gauge */}
        <div className={`rounded-md border p-3 ${label.bg} ${label.ring} ring-1`}>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700">台股恐慌分數</span>
            <span className={`text-[10px] font-bold ${label.color}`}>
              {label.text}
            </span>
          </div>
          <div className={`text-3xl font-bold tabular-nums ${label.color}`}>
            {panic}
            <span className="ml-1 text-xs text-gray-500">/ 100</span>
          </div>
          <p className="mt-1 text-[9px] text-gray-500">
            合成自大盤 / 法人 / 融資 三軸 · 高 = 恐慌 / 低 = 貪婪
          </p>
        </div>

        {/* 三軸明細 */}
        <div className="space-y-1.5 rounded-md border border-gray-200 bg-white p-3 text-[11px]">
          <SentimentRow
            label="加權指數"
            value={`${indexChange >= 0 ? "+" : ""}${indexChange.toFixed(2)}%`}
            tone={indexChange >= 0 ? "bull" : "bear"}
            hint={indexChange <= -2 ? "恐慌訊號" : indexChange >= 2 ? "貪婪訊號" : "—"}
          />
          {inst && (
            <SentimentRow
              label="外資+投信"
              value={`${inst.foreign + inst.trust >= 0 ? "+" : ""}${(inst.foreign + inst.trust).toFixed(0)} 億`}
              tone={inst.foreign + inst.trust >= 0 ? "bull" : "bear"}
              hint={
                inst.foreign + inst.trust <= -100
                  ? "大幅賣超"
                  : inst.foreign + inst.trust >= 100
                    ? "大幅買超"
                    : "—"
              }
            />
          )}
          {margin && (
            <SentimentRow
              label="融資餘額"
              value={`${margin.marginChange >= 0 ? "+" : ""}${(margin.marginChange / 1000).toFixed(1)} 萬張`}
              tone={margin.marginChange >= 0 ? "warn" : "neutral"}
              hint={
                margin.marginChange >= 50000
                  ? "散戶追價"
                  : margin.marginChange <= -50000
                    ? "散戶縮手"
                    : "—"
              }
            />
          )}
        </div>
      </div>

      <p className="mt-3 text-[10px] text-gray-400">
        資料源：Yahoo Finance（加權指數）+ FinMind v4（三大法人 / 融資融券）。
        合成分數為內部演算法、僅供市場氛圍對照、不構成投資建議。
      </p>
    </section>
  );
}

function SentimentRow({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: string;
  tone: "bull" | "bear" | "warn" | "neutral";
  hint: string;
}) {
  const color =
    tone === "bull"
      ? "text-red-700"
      : tone === "bear"
        ? "text-green-700"
        : tone === "warn"
          ? "text-amber-700"
          : "text-gray-700";
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-gray-600">{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span className={`font-bold tabular-nums ${color}`}>{value}</span>
        {hint !== "—" && (
          <span className="text-[9px] text-gray-400">({hint})</span>
        )}
      </div>
    </div>
  );
}

function FearGreedGauge({ fg }: { fg: NonNullable<MarketSentimentResponse["fearGreed"]> }) {
  const v = Math.max(0, Math.min(100, fg.value));
  // 半圓 gauge
  const w = 240;
  const h = 130;
  const cx = w / 2;
  const cy = h - 15;
  const r = 90;
  const angle = Math.PI * (1 - v / 100); // 180° -> 0°
  const px = cx + r * Math.cos(angle);
  const py = cy - r * Math.sin(angle);

  const ratingCn = RATING_CN[fg.rating] ?? fg.rating;
  const color =
    v <= 25
      ? "#16a34a" // extreme fear: green (買進區)
      : v <= 45
        ? "#65a30d"
        : v <= 55
          ? "#a3a3a3"
          : v <= 75
            ? "#ea580c"
            : "#dc2626"; // extreme greed: red (賣出區)

  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-700">CNN Fear & Greed</span>
        <span
          className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
          style={{ backgroundColor: color }}
        >
          {ratingCn}
        </span>
      </div>

      <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
        {/* 半圓背景帶（4 段顏色） */}
        <path
          d={arcPath(cx, cy, r, Math.PI, Math.PI * 0.75)}
          stroke="#16a34a"
          strokeWidth="14"
          fill="none"
          strokeLinecap="butt"
        />
        <path
          d={arcPath(cx, cy, r, Math.PI * 0.75, Math.PI * 0.45)}
          stroke="#65a30d"
          strokeWidth="14"
          fill="none"
        />
        <path
          d={arcPath(cx, cy, r, Math.PI * 0.55, Math.PI * 0.25)}
          stroke="#ea580c"
          strokeWidth="14"
          fill="none"
        />
        <path
          d={arcPath(cx, cy, r, Math.PI * 0.25, 0)}
          stroke="#dc2626"
          strokeWidth="14"
          fill="none"
        />
        {/* 中段 neutral */}
        <path
          d={arcPath(cx, cy, r, Math.PI * 0.55, Math.PI * 0.45)}
          stroke="#a3a3a3"
          strokeWidth="14"
          fill="none"
        />

        {/* 指針 */}
        <line x1={cx} y1={cy} x2={px} y2={py} stroke="#1f2937" strokeWidth="3" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="5" fill="#1f2937" />

        {/* 數值 */}
        <text x={cx} y={cy - 30} textAnchor="middle" fontSize="32" fontWeight="800" fill={color}>
          {v}
        </text>
        <text x={cx} y={cy - 12} textAnchor="middle" fontSize="9" fill="#6b7280">
          0 = 極度恐懼 / 100 = 極度貪婪
        </text>
      </svg>

      <div className="grid grid-cols-3 gap-2 text-[10px] text-gray-600">
        <Compare label="昨日" value={fg.previousClose} cur={v} />
        <Compare label="一週前" value={fg.weekAgo} cur={v} />
        <Compare label="一月前" value={fg.monthAgo} cur={v} />
      </div>
    </div>
  );
}

function Compare({
  label,
  value,
  cur,
}: {
  label: string;
  value: number | undefined;
  cur: number;
}) {
  if (value === undefined)
    return (
      <div>
        <div className="text-gray-500">{label}</div>
        <div className="text-gray-400">—</div>
      </div>
    );
  const diff = cur - value;
  const arrow = diff > 0 ? "↑" : diff < 0 ? "↓" : "→";
  const color = diff > 0 ? "text-red-600" : diff < 0 ? "text-green-600" : "text-gray-500";
  return (
    <div>
      <div className="text-gray-500">{label}</div>
      <div className="font-semibold tabular-nums">
        {value} <span className={color}>{arrow}</span>
      </div>
    </div>
  );
}

function VixCard({ vix }: { vix: NonNullable<MarketSentimentResponse["vix"]> }) {
  // VIX 解讀：<20 平靜 / 20-30 警戒 / >30 恐慌
  const level =
    vix.current < 20
      ? { label: "市場平靜", color: "text-green-700", bg: "bg-green-50 border-green-200" }
      : vix.current < 30
        ? { label: "市場警戒", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" }
        : { label: "市場恐慌", color: "text-red-700", bg: "bg-red-50 border-red-200" };

  return (
    <div className={`rounded-md border p-3 ${level.bg}`}>
      <div className="mb-1 flex items-center gap-1">
        <Activity size={12} className="text-gray-600" />
        <span className="text-xs font-semibold text-gray-700">VIX 恐慌指數</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`text-3xl font-bold tabular-nums ${level.color}`}>
          {vix.current.toFixed(2)}
        </span>
        <span
          className={`text-sm font-semibold tabular-nums ${
            vix.changePercent >= 0 ? "text-red-600" : "text-green-600"
          }`}
        >
          {vix.change >= 0 ? "+" : ""}
          {vix.change.toFixed(2)} ({formatPercent(vix.changePercent)})
        </span>
      </div>
      <div className={`mt-2 text-xs font-semibold ${level.color}`}>{level.label}</div>
      <div className="mt-1 text-[10px] text-gray-500">
        &lt;20 平靜　20-30 警戒　&gt;30 恐慌
      </div>
    </div>
  );
}

function arcPath(cx: number, cy: number, r: number, startA: number, endA: number) {
  const x1 = cx + r * Math.cos(startA);
  const y1 = cy - r * Math.sin(startA);
  const x2 = cx + r * Math.cos(endA);
  const y2 = cy - r * Math.sin(endA);
  const largeArc = Math.abs(endA - startA) > Math.PI ? 1 : 0;
  const sweep = endA > startA ? 0 : 1;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} ${sweep} ${x2} ${y2}`;
}
