"use client";

import { useEffect, useMemo, useRef } from "react";
import { Camera, Snowflake, Trash2 } from "lucide-react";
import { useHoldings, useSnapshots } from "@/lib/storage";
import { useQuotes } from "@/lib/useQuotes";
import { useExchangeRate } from "@/lib/useExchangeRate";
import { detectRegion } from "@/lib/symbols";
import { changeColor, formatChange, formatLargeNumber, formatPercent } from "@/lib/format";
import type { DailySnapshot } from "@/lib/types";

// 取得台北時區的日期字串 (YYYY-MM-DD)
function taipeiDateStr(d = new Date()): string {
  // 台北 = UTC+8
  const ms = d.getTime() + (8 * 60 + d.getTimezoneOffset()) * 60_000;
  const taipei = new Date(ms);
  return `${taipei.getUTCFullYear()}-${String(taipei.getUTCMonth() + 1).padStart(2, "0")}-${String(taipei.getUTCDate()).padStart(2, "0")}`;
}

function taipeiHour(d = new Date()): number {
  const ms = d.getTime() + (8 * 60 + d.getTimezoneOffset()) * 60_000;
  return new Date(ms).getUTCHours();
}

export function PortfolioHistory() {
  const { holdings, hydrated: hHydrated } = useHoldings();
  const { snapshots, hydrated: sHydrated, upsert, remove } = useSnapshots();
  const symbols = holdings.map((h) => h.symbol);
  const { quotes } = useQuotes(symbols, 60_000);
  const { rates, toTwd } = useExchangeRate();

  // 計算當下總計
  const totals = useMemo(() => {
    const byCurrency: Record<string, { market: number; cost: number; pnl: number }> = {};
    for (const h of holdings) {
      const q = quotes[h.symbol];
      const price = q?.price ?? 0;
      const market = price * h.shares;
      const cost = h.avgCost * h.shares;
      const pnl = market - cost;
      const currency = q?.currency ?? (detectRegion(h.symbol) === "TW" ? "TWD" : "USD");
      byCurrency[currency] ??= { market: 0, cost: 0, pnl: 0 };
      byCurrency[currency].market += market;
      byCurrency[currency].cost += cost;
      byCurrency[currency].pnl += pnl;
    }

    let twdMarket = 0;
    let twdCost = 0;
    let twdPnL = 0;
    for (const [cur, t] of Object.entries(byCurrency)) {
      twdMarket += toTwd(t.market, cur);
      twdCost += toTwd(t.cost, cur);
      twdPnL += toTwd(t.pnl, cur);
    }
    const twdPnLPercent = twdCost > 0 ? (twdPnL / twdCost) * 100 : 0;
    return { byCurrency, twdMarket, twdCost, twdPnL, twdPnLPercent };
  }, [holdings, quotes, toTwd]);

  // 自動凍結：今天還沒快照，台北時間 14:00 後 + 有持股 + 有價格資料 → 寫一筆
  const autoCheckRan = useRef(false);
  useEffect(() => {
    if (!hHydrated || !sHydrated) return;
    if (autoCheckRan.current) return;
    if (holdings.length === 0) return;
    if (Object.keys(quotes).length < holdings.length) return; // 等資料齊
    if (totals.twdMarket === 0) return;

    const today = taipeiDateStr();
    if (snapshots.some((s) => s.date === today)) {
      autoCheckRan.current = true;
      return;
    }
    if (taipeiHour() < 14) return; // 台股還沒收盤前不自動凍結

    const snap: DailySnapshot = {
      date: today,
      capturedAt: Date.now(),
      byCurrency: totals.byCurrency,
      twdMarket: totals.twdMarket,
      twdCost: totals.twdCost,
      twdPnL: totals.twdPnL,
      twdPnLPercent: totals.twdPnLPercent,
      usdTwdRate: rates.toTwd.USD ?? 0,
      holdingsCount: holdings.length,
    };
    upsert(snap);
    autoCheckRan.current = true;
  }, [hHydrated, sHydrated, holdings, quotes, totals, snapshots, rates, upsert]);

  function captureNow() {
    const today = taipeiDateStr();
    const snap: DailySnapshot = {
      date: today,
      capturedAt: Date.now(),
      byCurrency: totals.byCurrency,
      twdMarket: totals.twdMarket,
      twdCost: totals.twdCost,
      twdPnL: totals.twdPnL,
      twdPnLPercent: totals.twdPnLPercent,
      usdTwdRate: rates.toTwd.USD ?? 0,
      holdingsCount: holdings.length,
    };
    upsert(snap);
  }

  if (!hHydrated || !sHydrated) return null;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <header className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Snowflake size={16} className="text-cyan-600" />
          <h2 className="text-sm font-semibold text-gray-700">每日資產凍結紀錄</h2>
          <span className="text-xs text-gray-500">{snapshots.length} 天</span>
        </div>
        <button
          onClick={captureNow}
          className="flex items-center gap-1 rounded-md border border-gray-300 bg-gray-200 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-200"
        >
          <Camera size={12} /> 凍結現在
        </button>
      </header>

      {snapshots.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">
          還沒有任何快照。台股收盤後 (14:00) 自動凍結；或現在點右上「凍結現在」手動建立第一筆。
        </p>
      ) : (
        <>
          <PnLChart snapshots={snapshots} />
          <div className="mt-3 max-h-64 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-gray-50">
                <tr className="text-left text-[10px] uppercase text-gray-500">
                  <th className="px-2 py-1.5">日期</th>
                  <th className="px-2 py-1.5 text-right">總市值 (TWD)</th>
                  <th className="px-2 py-1.5 text-right">總成本</th>
                  <th className="px-2 py-1.5 text-right">總損益</th>
                  <th className="px-2 py-1.5 text-right">報酬率</th>
                  <th className="px-2 py-1.5 text-right">日變化</th>
                  <th className="px-2 py-1.5 text-right">匯率</th>
                  <th className="px-2 py-1.5"></th>
                </tr>
              </thead>
              <tbody>
                {[...snapshots].reverse().map((s, i, arr) => {
                  const prev = arr[i + 1];
                  const dayDiff = prev ? s.twdMarket - prev.twdMarket : null;
                  const dayDiffPct =
                    prev && prev.twdMarket > 0 ? (dayDiff! / prev.twdMarket) * 100 : null;
                  return (
                    <tr
                      key={s.date}
                      className="border-t border-gray-200 hover:bg-gray-50"
                    >
                      <td className="px-2 py-1.5 text-gray-600">{s.date}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-gray-800">
                        {formatLargeNumber(s.twdMarket)}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-gray-500">
                        {formatLargeNumber(s.twdCost)}
                      </td>
                      <td
                        className={`px-2 py-1.5 text-right tabular-nums ${changeColor(s.twdPnL)}`}
                      >
                        {formatChange(s.twdPnL)}
                      </td>
                      <td
                        className={`px-2 py-1.5 text-right tabular-nums ${changeColor(s.twdPnL)}`}
                      >
                        {formatPercent(s.twdPnLPercent)}
                      </td>
                      <td
                        className={`px-2 py-1.5 text-right tabular-nums ${dayDiff !== null ? changeColor(dayDiff) : "text-gray-400"}`}
                      >
                        {dayDiff !== null
                          ? `${formatChange(dayDiff)} (${formatPercent(dayDiffPct!)})`
                          : "—"}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-gray-500">
                        {s.usdTwdRate.toFixed(2)}
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <button
                          onClick={() => {
                            if (confirm(`刪除 ${s.date} 的快照？`)) remove(s.date);
                          }}
                          className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-green-600"
                        >
                          <Trash2 size={11} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

// 簡單 SVG 折線圖（總市值走勢）
function PnLChart({ snapshots }: { snapshots: DailySnapshot[] }) {
  if (snapshots.length < 2) {
    return (
      <p className="rounded-md border border-gray-200 bg-gray-50 px-3 py-4 text-center text-xs text-gray-500">
        至少需要 2 筆快照才能畫出走勢圖。
      </p>
    );
  }

  const w = 800;
  const h = 160;
  const padL = 50;
  const padR = 10;
  const padT = 8;
  const padB = 22;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;

  const values = snapshots.map((s) => s.twdMarket);
  const costs = snapshots.map((s) => s.twdCost);
  const minVal = Math.min(...values, ...costs);
  const maxVal = Math.max(...values, ...costs);
  const range = Math.max(1, maxVal - minVal);
  const min = minVal - range * 0.05;
  const max = maxVal + range * 0.05;

  function x(i: number) {
    if (snapshots.length === 1) return padL + innerW / 2;
    return padL + (i / (snapshots.length - 1)) * innerW;
  }
  function y(v: number) {
    return padT + (1 - (v - min) / (max - min)) * innerH;
  }

  const marketPath = values.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(v)}`).join(" ");
  const costPath = costs.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(v)}`).join(" ");

  // 標籤：第一個 + 最後一個 + 中間
  const labelIdx = snapshots.length <= 6
    ? snapshots.map((_, i) => i)
    : [0, Math.floor(snapshots.length / 2), snapshots.length - 1];

  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
      <div className="mb-1 flex items-center gap-3 text-[10px]">
        <span className="flex items-center gap-1 text-gray-600">
          <span className="inline-block h-0.5 w-3 bg-emerald-400" /> 總市值
        </span>
        <span className="flex items-center gap-1 text-gray-500">
          <span className="inline-block h-0.5 w-3 bg-zinc-500" /> 總成本
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
        {/* Grid */}
        <line x1={padL} y1={padT} x2={padL} y2={h - padB} stroke="#d1d5db" strokeWidth="0.5" />
        <line x1={padL} y1={h - padB} x2={w - padR} y2={h - padB} stroke="#d1d5db" strokeWidth="0.5" />
        {/* Cost line */}
        <path d={costPath} fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeDasharray="3 3" />
        {/* Market line */}
        <path d={marketPath} fill="none" stroke="#dc2626" strokeWidth="2" />
        {/* Dots */}
        {values.map((v, i) => (
          <circle key={i} cx={x(i)} cy={y(v)} r="2" fill="#dc2626" />
        ))}
        {/* Date labels */}
        {labelIdx.map((i) => (
          <text
            key={i}
            x={x(i)}
            y={h - padB + 14}
            textAnchor="middle"
            fontSize="9"
            fill="#6b7280"
          >
            {snapshots[i].date.slice(5)}
          </text>
        ))}
        {/* Y-axis labels */}
        <text x={padL - 6} y={padT + 4} textAnchor="end" fontSize="9" fill="#6b7280">
          {formatLargeNumber(max)}
        </text>
        <text x={padL - 6} y={h - padB} textAnchor="end" fontSize="9" fill="#6b7280">
          {formatLargeNumber(min)}
        </text>
      </svg>
    </div>
  );
}
