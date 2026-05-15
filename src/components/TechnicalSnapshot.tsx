"use client";

import { useEffect, useState } from "react";
import {
  CandlestickChart,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowDownToLine,
  ArrowUpFromLine,
  Eye,
  AlertTriangle,
  Loader2,
  Target,
} from "lucide-react";
import type { TaSnapshot } from "@/app/api/stock-ta-snapshot/route";
import { formatPercent, formatPrice } from "@/lib/format";
import { PaywallBlur } from "./PaywallBlur";
import { InvestmentDisclaimer } from "./InvestmentDisclaimer";

type Props = { symbol: string };

export function TechnicalSnapshot({ symbol }: Props) {
  const [data, setData] = useState<TaSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stock-ta-snapshot?symbol=${encodeURIComponent(symbol)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.symbol) setData(d as TaSnapshot);
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [symbol]);

  if (loading)
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 text-center text-sm text-gray-500">
        <Loader2 className="mr-1 inline animate-spin" size={14} /> 計算技術快照…
      </div>
    );
  if (!data) return null;

  // 顏色 / icon 依趨勢
  const trendCfg = {
    uptrend: {
      cls: "border-red-300 bg-red-50/60",
      icon: <TrendingUp size={14} className="text-red-700" />,
      text: "text-red-700",
    },
    downtrend: {
      cls: "border-green-300 bg-green-50/60",
      icon: <TrendingDown size={14} className="text-green-700" />,
      text: "text-green-700",
    },
    sideways: {
      cls: "border-amber-300 bg-amber-50/60",
      icon: <Minus size={14} className="text-amber-700" />,
      text: "text-amber-700",
    },
  }[data.trend.direction];

  const supportPct =
    data.price > 0
      ? ((data.support.near - data.price) / data.price) * 100
      : 0;
  const resistancePct =
    data.price > 0
      ? ((data.resistance.near - data.price) / data.price) * 100
      : 0;

  // 計算定位（支撐 - 壓力 之間，現價在哪）
  const range = data.resistance.near - data.support.near;
  const positionPct =
    range > 0
      ? Math.max(
          0,
          Math.min(100, ((data.price - data.support.near) / range) * 100),
        )
      : 50;

  const biasColor =
    data.lastCandle.bias === "bullish"
      ? "text-red-700"
      : data.lastCandle.bias === "bearish"
        ? "text-green-700"
        : "text-gray-600";

  return (
    <section
      className={`rounded-lg border ${trendCfg.cls} p-4`}
    >
      <header className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-center gap-2">
          <CandlestickChart size={16} className="text-gray-700" />
          <h3 className="text-sm font-semibold text-gray-800">技術面快照</h3>
          <span className="text-xs text-gray-500">支撐 / 壓力 + K 棒解讀</span>
        </div>
        <div className="flex items-center gap-1">
          {data.tags.slice(0, 4).map((t, i) => (
            <span
              key={i}
              className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-gray-700 ring-1 ring-gray-200"
            >
              {t}
            </span>
          ))}
        </div>
      </header>

      {/* 主要陳述 — 全用戶可看（不含具體價位）*/}
      <div className="mb-3 flex items-start gap-2 rounded-md border border-gray-200 bg-white p-3 text-sm leading-relaxed text-gray-800">
        <span className="mt-0.5 text-base">→</span>
        <span className="flex-1">{data.narrative}</span>
      </div>

      {/* 第一排：趨勢 + 現價（免費可看）+ 近支撐 + 近壓力（鎖）*/}
      <div className="grid grid-cols-2 gap-3 mb-3 sm:grid-cols-4">
        <div className={`rounded-md bg-white p-2.5 text-center`}>
          <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-gray-700">
            {trendCfg.icon} 趨勢
          </div>
          <div className={`mt-0.5 text-sm font-bold ${trendCfg.text}`}>
            {data.trend.label}
          </div>
        </div>
        <div className="rounded-md bg-white p-2.5 text-center">
          <div className="text-[11px] text-gray-500">現價</div>
          <div className="text-base font-bold tabular-nums text-gray-900">
            {formatPrice(data.price)}
          </div>
          <div
            className={`text-[10px] tabular-nums ${
              data.changePercent >= 0 ? "text-red-600" : "text-green-600"
            }`}
          >
            {formatPercent(data.changePercent)}
          </div>
        </div>
        <PaywallBlur
          requireTier="pro"
          featureLabel="近支撐位"
          intensity="medium"
        >
          <div className="rounded-md bg-white p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-[11px] text-green-700">
              <ArrowDownToLine size={10} /> 近支撐
            </div>
            <div className="text-base font-bold tabular-nums text-green-800">
              {formatPrice(data.support.near)}
            </div>
            <div className="text-[10px] tabular-nums text-gray-500">
              ({supportPct.toFixed(1)}%) · {data.support.basis.split(" / ")[0]}
            </div>
          </div>
        </PaywallBlur>
        <PaywallBlur
          requireTier="pro"
          featureLabel="近壓力位"
          intensity="medium"
        >
          <div className="rounded-md bg-white p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-[11px] text-red-700">
              <ArrowUpFromLine size={10} /> 近壓力
            </div>
            <div className="text-base font-bold tabular-nums text-red-800">
              {formatPrice(data.resistance.near)}
            </div>
            <div className="text-[10px] tabular-nums text-gray-500">
              (+{resistancePct.toFixed(1)}%) ·{" "}
              {data.resistance.basis.split(" / ")[0]}
            </div>
          </div>
        </PaywallBlur>
      </div>

      {/* 支撐 ↔ 壓力 視覺化棒（鎖）*/}
      <PaywallBlur
        requireTier="pro"
        featureLabel="支撐 / 壓力 視覺化"
        hint="升級 Pro 讓 AI 一次彙整支撐壓力位 + 現價區間位置 — 不用自己畫線"
      >
        <div className="mb-3 rounded-md bg-white p-3">
          <div className="mb-1.5 flex items-center justify-between text-[11px]">
            <span className="font-semibold text-green-700">
              支撐 {formatPrice(data.support.near)}
            </span>
            <span className="text-gray-500">
              現價在區間 {positionPct.toFixed(0)}% 位置
            </span>
            <span className="font-semibold text-red-700">
              壓力 {formatPrice(data.resistance.near)}
            </span>
          </div>
          <div className="relative h-7">
            <div className="absolute inset-x-0 top-3 h-1 rounded bg-gradient-to-r from-green-300 via-amber-200 to-red-300" />
            <div
              className="absolute top-0 flex flex-col items-center"
              style={{
                left: `${positionPct}%`,
                transform: "translateX(-50%)",
              }}
            >
              <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
                {data.price.toFixed(2)}
              </span>
              <div className="h-2 w-0.5 bg-blue-600" />
            </div>
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-gray-500">
            <span>次支撐 {formatPrice(data.support.far)}</span>
            <span>次壓力 {formatPrice(data.resistance.far)}</span>
          </div>
        </div>
      </PaywallBlur>

      {/* 🆕 技術指標參考水位（Pro+）— 純數學計算，非進出場建議 */}
      <PaywallBlur
        requireTier="pro"
        featureLabel="技術指標參考水位"
        hint="升級 Pro 讓 AI 一次幫你彙整 5 個關鍵價位 — 省下自己畫線、查均線的時間"
      >
        <SuggestedPriceCard data={data} />
      </PaywallBlur>

      {/* K 棒型態 + 指標（鎖：Pro+）*/}
      <PaywallBlur
        requireTier="pro"
        featureLabel="K 棒型態 + 動能指標"
        hint="升級 Pro 讓 AI 彙整 RSI / KD / MACD / 布林 4 大動能指標 — 一頁看完"
      >
      <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="rounded-md border border-gray-200 bg-white p-2.5">
          <div className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-gray-700">
            🕯️ 最新 K 棒型態
          </div>
          <div className={`text-sm font-bold ${biasColor}`}>
            {data.lastCandle.patternLabel}
          </div>
          <div className="mt-0.5 text-[10px] tabular-nums text-gray-500">
            O {data.lastCandle.open.toFixed(2)} · H {data.lastCandle.high.toFixed(2)} · L {data.lastCandle.low.toFixed(2)} · C {data.lastCandle.close.toFixed(2)}
          </div>
        </div>
        <div className="rounded-md border border-gray-200 bg-white p-2.5">
          <div className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-gray-700">
            📈 動能指標
          </div>
          <div className="grid grid-cols-2 gap-1 text-[11px]">
            {typeof data.indicators.rsi14 === "number" && (
              <Cell
                label="RSI(14)"
                value={data.indicators.rsi14.toFixed(0)}
                hint={
                  data.indicators.rsiSignal === "overbought"
                    ? "超買"
                    : data.indicators.rsiSignal === "oversold"
                      ? "超賣"
                      : "中性"
                }
                tone={
                  data.indicators.rsiSignal === "overbought"
                    ? "red"
                    : data.indicators.rsiSignal === "oversold"
                      ? "green"
                      : "gray"
                }
              />
            )}
            {data.indicators.kd && (
              <Cell
                label="KD"
                value={`${data.indicators.kd.k.toFixed(0)} / ${data.indicators.kd.d.toFixed(0)}`}
                hint={
                  data.indicators.kd.signal === "overbought"
                    ? "高檔"
                    : data.indicators.kd.signal === "oversold"
                      ? "低檔"
                      : "中性"
                }
                tone={
                  data.indicators.kd.signal === "overbought"
                    ? "red"
                    : data.indicators.kd.signal === "oversold"
                      ? "green"
                      : "gray"
                }
              />
            )}
            {data.indicators.macd && (
              <Cell
                label="MACD"
                value={data.indicators.macd.histogram.toFixed(2)}
                hint={
                  data.indicators.macd.cross === "golden"
                    ? "金叉"
                    : data.indicators.macd.cross === "death"
                      ? "死叉"
                      : data.indicators.macd.histogram >= 0
                        ? "多方"
                        : "空方"
                }
                tone={
                  data.indicators.macd.cross === "golden"
                    ? "red"
                    : data.indicators.macd.cross === "death"
                      ? "green"
                      : "gray"
                }
              />
            )}
            {data.indicators.bbPosition && (
              <Cell
                label="布林"
                value={
                  data.indicators.bbPosition === "above-upper"
                    ? "突破上軌"
                    : data.indicators.bbPosition === "below-lower"
                      ? "跌破下軌"
                      : data.indicators.bbPosition === "upper-half"
                        ? "上半部"
                        : "下半部"
                }
                hint={
                  data.indicators.bbPosition === "above-upper"
                    ? "過熱"
                    : data.indicators.bbPosition === "below-lower"
                      ? "超跌"
                      : ""
                }
                tone={
                  data.indicators.bbPosition === "above-upper"
                    ? "red"
                    : data.indicators.bbPosition === "below-lower"
                      ? "green"
                      : "gray"
                }
              />
            )}
          </div>
        </div>
      </div>
      </PaywallBlur>

      {/* 多空指標觀察點（鎖：Pro+）— 純技術指標觸發條件描述 */}
      <PaywallBlur
        requireTier="pro"
        featureLabel="多空指標觸發條件"
        hint="升級 Pro 讓 AI 彙整教科書級的多 / 空指標觸發點 — 不用自己背公式"
      >
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="rounded-md border border-blue-200 bg-blue-50/40 p-2.5">
            <div className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-blue-800">
              <Eye size={11} /> 多頭指標觸發條件
            </div>
            <ul className="space-y-0.5 text-[11px] text-blue-900">
              {data.entryWatch.map((e, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span className="mt-0.5">▸</span>
                  <span className="flex-1">{e.trigger}</span>
                </li>
              ))}
              {data.entryWatch.length === 0 && (
                <li className="text-gray-500">—</li>
              )}
            </ul>
          </div>
          <div className="rounded-md border border-amber-200 bg-amber-50/40 p-2.5">
            <div className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-amber-800">
              <AlertTriangle size={11} /> 空頭指標觸發條件
            </div>
            <ul className="space-y-0.5 text-[11px] text-amber-900">
              {data.exitWatch.map((e, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span className="mt-0.5">▸</span>
                  <span className="flex-1">{e.trigger}</span>
                </li>
              ))}
              {data.exitWatch.length === 0 && (
                <li className="text-gray-500">—</li>
              )}
            </ul>
          </div>
        </div>
      </PaywallBlur>

      {/* 投資警語（所有人都看得到）*/}
      <div className="mt-3">
        <InvestmentDisclaimer variant="compact" />
      </div>

      <p className="mt-2 text-[10px] leading-snug text-gray-500">
        ⚠️ 本內容為「規則式技術指標」自動計算結果（每 30 分鐘快取一次）。所有價位
        為數學試算，<strong>不構成目標價或投資建議</strong>。任何進出場決策由使用者自行判斷。
      </p>
    </section>
  );
}

// ─── 技術指標參考水位（Pro+ 才能看）─────────────────────
// ⚠️ 法律合規：純數學換算的技術水位，**非進出場建議**
function SuggestedPriceCard({ data }: { data: TaSnapshot }) {
  // 純數學計算的水位（描述技術指標位置，非投資建議）：
  //   支撐下沿 = 近支撐 × 0.98（支撐區下方 2%）
  //   支撐上沿 = 近支撐 × 1.01（支撐區上方 1%）
  //   MA20    = 短線均線位置
  //   壓力下沿 = 近壓力 × 0.99（壓力區下方 1%）
  //   壓力上沿 = 近壓力 × 1.02（壓力區上方 2%）
  const supportLower = data.support.near * 0.98;
  const supportUpper = data.support.near * 1.01;
  const watchPrice = data.indicators.ma20 ?? data.price;
  const resistanceLower = data.resistance.near * 0.99;
  const resistanceUpper = data.resistance.near * 1.02;

  return (
    <div className="mb-3 rounded-md border border-emerald-200 bg-emerald-50/60 p-3">
      <div className="mb-2 flex items-center gap-1 text-[11px] font-semibold text-emerald-800">
        <Target size={11} /> 技術指標參考水位（純數學試算，非投資建議）
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <PriceTile
          label="支撐下沿"
          value={supportLower}
          hint="近支撐 -2%"
          tone="green-strong"
        />
        <PriceTile
          label="支撐上沿"
          value={supportUpper}
          hint="近支撐 +1%"
          tone="green"
        />
        <PriceTile
          label="MA20"
          value={watchPrice}
          hint="20 日均線位置"
          tone="gray"
        />
        <PriceTile
          label="壓力下沿"
          value={resistanceLower}
          hint="近壓力 -1%"
          tone="red"
        />
        <PriceTile
          label="壓力上沿"
          value={resistanceUpper}
          hint="近壓力 +2%"
          tone="red-strong"
        />
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-emerald-700">
        ⚠️ 上述價位僅為依技術指標自動推算的「**參考門檻**」，**非進出指示**。
        實際決策應結合基本面、籌碼面、個人風險承受度判斷。
      </p>
    </div>
  );
}

function PriceTile({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: number;
  hint: string;
  tone: "green-strong" | "green" | "gray" | "red" | "red-strong";
}) {
  const styles: Record<typeof tone, string> = {
    "green-strong": "border-green-400 bg-green-50 text-green-800",
    green: "border-green-200 bg-green-50/50 text-green-700",
    gray: "border-gray-300 bg-gray-50 text-gray-700",
    red: "border-red-200 bg-red-50/50 text-red-700",
    "red-strong": "border-red-400 bg-red-50 text-red-800",
  };
  return (
    <div
      className={`rounded border px-1.5 py-1.5 text-center ${styles[tone]}`}
    >
      <div className="text-[10px] font-semibold">{label}</div>
      <div className="text-sm font-bold tabular-nums">
        {formatPrice(value)}
      </div>
      <div className="text-[9px] opacity-80">{hint}</div>
    </div>
  );
}

function Cell({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone: "red" | "green" | "gray";
}) {
  const color =
    tone === "red"
      ? "text-red-700"
      : tone === "green"
        ? "text-green-700"
        : "text-gray-700";
  return (
    <div>
      <div className="text-[10px] text-gray-500">{label}</div>
      <div className={`font-bold tabular-nums ${color}`}>{value}</div>
      <div className={`text-[10px] ${color}`}>{hint}</div>
    </div>
  );
}
