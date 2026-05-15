"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Briefcase, Trash2, Target, X, Check, Edit3, TrendingDown, Coins } from "lucide-react";
import { useHoldings, useTransactions } from "@/lib/storage";
import { useQuotes } from "@/lib/useQuotes";
import { useExchangeRate } from "@/lib/useExchangeRate";
import { AddHoldingDialog } from "./AddHoldingDialog";
import { EditHoldingDialog } from "./EditHoldingDialog";
import { SellHoldingDialog } from "./SellHoldingDialog";
import { BulkImportDialog } from "./BulkImportDialog";
import { computeSettlementDate } from "@/lib/settlement";
import {
  changeColor,
  formatChange,
  formatLargeNumber,
  formatPercent,
  formatPrice,
} from "@/lib/format";
import { detectRegion, displayName } from "@/lib/symbols";
import type { Holding } from "@/lib/types";
import type { Quote } from "@/lib/types";

// 顯示貨幣模式 — 持久化於 localStorage
// "twd"：所有金額換算為台幣（用 USDTWD 即期匯率）
// "original"：原幣別（美股顯示 USD、台股顯示 TWD）
type DisplayMode = "twd" | "original";
const DISPLAY_MODE_KEY = "holdings-display-currency";

export function Holdings() {
  const { holdings, hydrated, add, remove, update } = useHoldings();
  const { add: addTransaction } = useTransactions();
  const symbols = holdings.map((h) => h.symbol);
  const { quotes } = useQuotes(symbols);
  const { rates, toTwd } = useExchangeRate();
  const [planningId, setPlanningId] = useState<string | null>(null);
  const [editingHoldingId, setEditingHoldingId] = useState<string | null>(null);
  const [sellingHoldingId, setSellingHoldingId] = useState<string | null>(null);
  // 預設 TWD（台灣消費者最想看到的）
  const [displayMode, setDisplayMode] = useState<DisplayMode>("twd");

  // 從 localStorage 還原偏好
  useEffect(() => {
    try {
      const stored = localStorage.getItem(DISPLAY_MODE_KEY);
      if (stored === "twd" || stored === "original") {
        setDisplayMode(stored);
      }
    } catch {
      /* SSR 等情境略過 */
    }
  }, []);

  function toggleDisplayMode() {
    const next: DisplayMode = displayMode === "twd" ? "original" : "twd";
    setDisplayMode(next);
    try {
      localStorage.setItem(DISPLAY_MODE_KEY, next);
    } catch {
      /* ignore */
    }
  }

  if (!hydrated) return null;

  // 計算每檔損益 + 總計（依幣別分開計算）
  const rows = holdings.map((h) => {
    const q = quotes[h.symbol];
    const rawPrice = q?.price ?? 0;
    const rawMarketValue = rawPrice * h.shares;
    const rawCostBasis = h.avgCost * h.shares;
    const rawUnrealizedPnL = rawMarketValue - rawCostBasis;
    const unrealizedPnLPercent =
      rawCostBasis > 0 ? (rawUnrealizedPnL / rawCostBasis) * 100 : 0;
    const currency = q?.currency ?? (detectRegion(h.symbol) === "TW" ? "TWD" : "USD");

    // TWD 顯示模式 → 用即期匯率轉所有金額（報酬率 % 不變）
    const wantTwd = displayMode === "twd" && currency !== "TWD";
    const fxRate = wantTwd ? rates.toTwd[currency.toUpperCase()] ?? 1 : 1;
    const displayCurrency = wantTwd ? "TWD" : currency;
    const price = wantTwd ? rawPrice * fxRate : rawPrice;
    const avgCost = wantTwd ? h.avgCost * fxRate : h.avgCost;
    const marketValue = wantTwd ? rawMarketValue * fxRate : rawMarketValue;
    const unrealizedPnL = wantTwd ? rawUnrealizedPnL * fxRate : rawUnrealizedPnL;

    // 加碼後試算用原始幣別計算（換算邏輯一致就好）
    const planning = computePlanning(h, rawPrice);

    return {
      h,
      q,
      price,
      avgCost,
      marketValue,
      costBasis: wantTwd ? rawCostBasis * fxRate : rawCostBasis,
      unrealizedPnL,
      unrealizedPnLPercent,
      currency: displayCurrency,
      originalCurrency: currency,
      fxRate,
      isConverted: wantTwd,
      rawPrice,
      planning,
    };
  });

  const totals = rows.reduce<
    Record<string, { market: number; cost: number; pnl: number }>
  >((acc, r) => {
    const k = r.currency;
    acc[k] ??= { market: 0, cost: 0, pnl: 0 };
    acc[k].market += r.marketValue;
    acc[k].cost += r.costBasis;
    acc[k].pnl += r.unrealizedPnL;
    return acc;
  }, {});

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Briefcase size={16} className="text-red-600" />
          <h2 className="text-sm font-semibold text-gray-800">我的持股</h2>
          <span className="text-xs text-gray-500">{holdings.length} 檔</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* 顯示貨幣切換 — 預設 TWD */}
          <button
            onClick={toggleDisplayMode}
            className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-700 hover:border-amber-400 hover:bg-amber-50"
            title={
              displayMode === "twd"
                ? `目前以 TWD 顯示（USD/TWD ${rates.toTwd.USD?.toFixed(3) ?? "—"} 即期匯率）。點一下切換回原幣別。`
                : "目前以原幣別顯示。點一下換成 TWD（用即期匯率換算）。"
            }
          >
            <Coins size={11} className="text-amber-600" />
            {displayMode === "twd" ? "顯示：TWD" : "顯示：原幣"}
            {displayMode === "twd" && rates.toTwd.USD && (
              <span className="text-[10px] text-gray-500">
                @ {rates.toTwd.USD.toFixed(2)}
              </span>
            )}
          </button>
          <BulkImportDialog
            mode="holdings"
            onImport={(rows) => {
              for (const r of rows) {
                if (r.shares !== undefined && r.avgCost !== undefined) {
                  add({
                    symbol: r.symbol,
                    shares: r.shares,
                    avgCost: r.avgCost,
                    note: r.note,
                  });
                }
              }
            }}
          />
          <AddHoldingDialog onAdd={(d) => add(d)} />
        </div>
      </header>

      {holdings.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-gray-500">還沒有持股紀錄</p>
          <p className="mt-1 text-[11px] text-gray-400">
            點右上「新增持股」加入第一筆
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase text-gray-500">
                  <th className="px-2 py-2">股票</th>
                  <th className="px-2 py-2 text-right">股數</th>
                  <th className="px-2 py-2 text-right">均價</th>
                  <th className="px-2 py-2 text-right">現價</th>
                  <th className="px-2 py-2 text-right">市值</th>
                  <th className="px-2 py-2 text-right">未實現損益</th>
                  <th className="px-2 py-2 text-right">報酬率</th>
                  <th className="px-2 py-2 text-center">操作</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <HoldingRow
                    key={row.h.id}
                    row={row}
                    editing={planningId === row.h.id}
                    onStartEdit={() => setPlanningId(row.h.id)}
                    onCancelEdit={() => setPlanningId(null)}
                    onEditHolding={() => setEditingHoldingId(row.h.id)}
                    onSavePlanning={(shares, price) => {
                      update(row.h.id, {
                        plannedShares: shares,
                        plannedPrice: price,
                      });
                      setPlanningId(null);
                    }}
                    onClearPlanning={() => {
                      update(row.h.id, {
                        plannedShares: undefined,
                        plannedPrice: undefined,
                      });
                      setPlanningId(null);
                    }}
                    onRemove={() => {
                      const cleanCode = row.h.symbol.replace(/\.(TW|TWO)$/i, "");
                      if (confirm(`移除 ${cleanCode}？`)) remove(row.h.id);
                    }}
                    onSell={() => setSellingHoldingId(row.h.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* 各幣別合計 */}
          <div className="mt-3 flex flex-wrap gap-3 border-t border-gray-200 pt-3">
            {Object.entries(totals).map(([currency, t]) => {
              const pnlPct = t.cost > 0 ? (t.pnl / t.cost) * 100 : 0;
              const color = changeColor(t.pnl);
              return (
                <div
                  key={currency}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
                >
                  <div className="text-[10px] uppercase text-gray-500">
                    {currency} 合計
                  </div>
                  <div className="mt-1 flex items-baseline gap-3 text-xs">
                    <div>
                      <span className="text-gray-500">市值 </span>
                      <span className="font-semibold tabular-nums text-gray-800">
                        {formatLargeNumber(t.market)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">成本 </span>
                      <span className="tabular-nums text-gray-500">
                        {formatLargeNumber(t.cost)}
                      </span>
                    </div>
                    <div className={color}>
                      <span className="text-gray-500">損益 </span>
                      <span className="font-semibold tabular-nums">
                        {formatChange(t.pnl)} ({formatPercent(pnlPct)})
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 跨幣別 TWD 總計 */}
          {Object.keys(totals).length > 1 &&
            (() => {
              const grand = Object.entries(totals).reduce(
                (acc, [cur, t]) => {
                  acc.market += toTwd(t.market, cur);
                  acc.cost += toTwd(t.cost, cur);
                  acc.pnl += toTwd(t.pnl, cur);
                  return acc;
                },
                { market: 0, cost: 0, pnl: 0 },
              );
              const pct = grand.cost > 0 ? (grand.pnl / grand.cost) * 100 : 0;
              const color = changeColor(grand.pnl);
              return (
                <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                  <div className="flex items-baseline justify-between">
                    <div className="text-[10px] uppercase text-red-600">
                      🌐 全部換算為 TWD · 匯率 USD/TWD ={" "}
                      {rates.toTwd.USD?.toFixed(3) ?? "—"}
                    </div>
                    <div className={`text-sm font-bold tabular-nums ${color}`}>
                      {formatPercent(pct)}
                    </div>
                  </div>
                  <div className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs">
                    <div>
                      <span className="text-gray-500">總市值 </span>
                      <span className="font-bold tabular-nums text-gray-900">
                        {formatLargeNumber(grand.market)} 元
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">總成本 </span>
                      <span className="tabular-nums text-gray-600">
                        {formatLargeNumber(grand.cost)} 元
                      </span>
                    </div>
                    <div className={color}>
                      <span className="text-gray-500">總損益 </span>
                      <span className="font-bold tabular-nums">
                        {formatChange(grand.pnl)} 元
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

          <p className="mt-3 text-[10px] text-gray-400">
            🎯 加碼 = 預期加碼試算　💸 賣出 = 自動寫交易紀錄 + 已實現損益　✏️ 編輯 = 改股數 / 均價　🗑 = 刪除
          </p>
        </>
      )}

      {/* 編輯持股 modal */}
      <EditHoldingDialog
        holding={
          editingHoldingId
            ? holdings.find((h) => h.id === editingHoldingId) ?? null
            : null
        }
        currentPrice={
          editingHoldingId
            ? quotes[holdings.find((h) => h.id === editingHoldingId)?.symbol ?? ""]?.price
            : undefined
        }
        onClose={() => setEditingHoldingId(null)}
        onSave={(patch) => {
          if (editingHoldingId) update(editingHoldingId, patch);
        }}
      />

      {/* 賣出 modal — 連動交易紀錄 + 自動計算實現損益 */}
      <SellHoldingDialog
        holding={
          sellingHoldingId
            ? holdings.find((h) => h.id === sellingHoldingId) ?? null
            : null
        }
        currentPrice={
          sellingHoldingId
            ? quotes[holdings.find((h) => h.id === sellingHoldingId)?.symbol ?? ""]?.price
            : undefined
        }
        onClose={() => setSellingHoldingId(null)}
        onConfirm={(data) => {
          if (!sellingHoldingId) return;
          const holding = holdings.find((h) => h.id === sellingHoldingId);
          if (!holding) return;

          // 1) 新增一筆 sell transaction（含交割日）
          addTransaction({
            symbol: holding.symbol,
            type: "sell",
            date: data.date,
            shares: data.shares,
            price: data.price,
            fee: data.fee || undefined,
            tax: data.tax || undefined,
            kind: data.kind,
            settlementDate: computeSettlementDate(holding.symbol, data.date),
            settled: false,
            note: data.note,
          });

          // 2) 扣減 / 移除持股
          const remainingShares = holding.shares - data.shares;
          if (remainingShares <= 0.0001) {
            remove(sellingHoldingId);
          } else {
            update(sellingHoldingId, { shares: remainingShares });
          }

          // 3) 通知下方 Transactions 元件：展開 + 滾動 + 高亮
          // 給 react 一個 tick 寫進 localStorage 後再 dispatch（不然滾動可能滾錯位置）
          setTimeout(() => {
            window.dispatchEvent(
              new CustomEvent("holdings:sold", {
                detail: { symbol: holding.symbol, shares: data.shares },
              }),
            );
          }, 50);
        }}
      />
    </section>
  );
}

// ─── 單筆持股 row（含加碼編輯）────────────────────────────
type Row = {
  h: Holding;
  q?: Quote;
  /** 顯示用 — 已套用 displayMode 的換算 */
  price: number;
  avgCost: number;
  marketValue: number;
  costBasis: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  /** 顯示貨幣（如果 wantTwd 為 true、會是 "TWD"，否則為原幣）*/
  currency: string;
  /** 原始幣別 */
  originalCurrency: string;
  /** 套用的 FX rate（1 = 不換算）*/
  fxRate: number;
  /** 是否已從原幣換算成 TWD */
  isConverted: boolean;
  /** 原始幣別的現價（給加碼計畫表單用）*/
  rawPrice: number;
  planning: ReturnType<typeof computePlanning>;
};

function HoldingRow({
  row,
  editing,
  onStartEdit,
  onCancelEdit,
  onEditHolding,
  onSavePlanning,
  onClearPlanning,
  onRemove,
  onSell,
}: {
  row: Row;
  editing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onEditHolding: () => void;
  onSavePlanning: (shares: number, price: number) => void;
  onClearPlanning: () => void;
  onRemove: () => void;
  onSell: () => void;
}) {
  const {
    h,
    q,
    price,
    avgCost,
    marketValue,
    unrealizedPnL,
    unrealizedPnLPercent,
    isConverted,
    originalCurrency,
    planning,
  } = row;
  const color = changeColor(unrealizedPnL);
  const cleanCode = h.symbol.replace(/\.(TW|TWO)$/i, "");

  // edit form state
  const [editShares, setEditShares] = useState<string>(
    h.plannedShares?.toString() ?? "",
  );
  const [editPrice, setEditPrice] = useState<string>(
    h.plannedPrice?.toString() ?? (row.rawPrice > 0 ? row.rawPrice.toFixed(2) : ""),
  );

  function startEdit() {
    setEditShares(h.plannedShares?.toString() ?? "");
    setEditPrice(
      h.plannedPrice?.toString() ?? (row.rawPrice > 0 ? row.rawPrice.toFixed(2) : ""),
    );
    onStartEdit();
  }

  function save() {
    const s = parseFloat(editShares);
    const p = parseFloat(editPrice);
    if (!Number.isFinite(s) || s <= 0) return;
    if (!Number.isFinite(p) || p <= 0) return;
    onSavePlanning(s, p);
  }

  return (
    <>
      <tr className="border-t border-gray-200 hover:bg-gray-50">
        <td className="px-2 py-2">
          <Link
            href={`/stock/${encodeURIComponent(h.symbol)}`}
            className="block hover:opacity-80"
          >
            <div className="font-medium text-gray-800 hover:text-red-600">
              {displayName(h.symbol, q?.name)}
            </div>
            <div className="text-[10px] text-gray-500">{cleanCode}</div>
          </Link>
        </td>
        <td className="px-2 py-2 text-right tabular-nums text-gray-700">
          {h.shares.toLocaleString()}
        </td>
        <td className="px-2 py-2 text-right tabular-nums text-gray-600">
          {formatPrice(avgCost)}
          {isConverted && (
            <div className="text-[9px] text-gray-400">
              原 {originalCurrency} {formatPrice(h.avgCost)}
            </div>
          )}
        </td>
        <td className="px-2 py-2 text-right tabular-nums text-gray-900">
          {formatPrice(price)}
          {isConverted && q?.price && (
            <div className="text-[9px] text-gray-400">
              原 {originalCurrency} {formatPrice(q.price)}
            </div>
          )}
        </td>
        <td className="px-2 py-2 text-right tabular-nums text-gray-700">
          {formatLargeNumber(marketValue)}
        </td>
        <td className={`px-2 py-2 text-right tabular-nums ${color}`}>
          {formatChange(unrealizedPnL)}
        </td>
        <td className={`px-2 py-2 text-right tabular-nums ${color}`}>
          {formatPercent(unrealizedPnLPercent)}
        </td>

        <td className="px-2 py-2">
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={onSell}
              className="flex items-center gap-0.5 rounded bg-green-50 px-1.5 py-1 text-[11px] font-medium text-green-700 hover:bg-green-100"
              title="賣出（自動寫交易紀錄 + 已實現損益）"
            >
              <TrendingDown size={11} />
              賣出
            </button>
            <button
              onClick={startEdit}
              className={`flex items-center gap-0.5 rounded px-1.5 py-1 text-[11px] font-medium transition ${
                h.plannedShares && h.plannedShares > 0
                  ? "bg-cyan-100 text-cyan-800 ring-1 ring-cyan-300 hover:bg-cyan-200"
                  : "text-cyan-700 hover:bg-cyan-50"
              }`}
              title={
                h.plannedShares
                  ? `編輯加碼計畫（+${h.plannedShares} 股 @ ${h.plannedPrice}）`
                  : "規劃加碼"
              }
            >
              <Target size={11} />
              {h.plannedShares && h.plannedShares > 0 ? "已設" : "加碼"}
            </button>
            <button
              onClick={onEditHolding}
              className="rounded p-1 text-gray-400 hover:bg-blue-50 hover:text-blue-700"
              aria-label="編輯"
              title="修改股數 / 均價 / 備註"
            >
              <Edit3 size={13} />
            </button>
            <button
              onClick={onRemove}
              className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
              aria-label="刪除"
              title="刪除這筆持股"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </td>
      </tr>

      {/* 編輯加碼計畫的展開列 */}
      {editing && (
        <tr className="border-t border-cyan-200 bg-cyan-50/60">
          <td colSpan={8} className="px-3 py-3">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <div className="text-[11px] font-semibold text-cyan-800">
                  🎯 預期加碼計畫 — {displayName(h.symbol, q?.name)}
                </div>
                <div className="text-[10px] text-gray-500">
                  目前 {h.shares} 股 @ 均價 {formatPrice(h.avgCost)}　|　現價{" "}
                  {formatPrice(price)}
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-cyan-700">
                  加碼股數
                </label>
                <input
                  type="number"
                  step="any"
                  value={editShares}
                  onChange={(e) => setEditShares(e.target.value)}
                  placeholder="例：100"
                  className="w-28 rounded border border-cyan-300 bg-white px-2 py-1 text-sm tabular-nums focus:border-cyan-600 focus:outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-[10px] text-cyan-700">
                  預計成交價
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="any"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    placeholder={row.rawPrice.toFixed(2)}
                    className="w-28 rounded border border-cyan-300 bg-white px-2 py-1 text-sm tabular-nums focus:border-cyan-600 focus:outline-none"
                  />
                  <button
                    onClick={() => setEditPrice(row.rawPrice.toFixed(2))}
                    className="rounded border border-gray-300 bg-white px-2 py-1 text-[10px] text-gray-600 hover:bg-gray-100"
                    title={`填入現價（${row.originalCurrency}）`}
                  >
                    用現價
                  </button>
                </div>
              </div>

              {/* 即時試算預覽（在編輯狀態也要看得到） */}
              {(() => {
                const s = parseFloat(editShares);
                const p = parseFloat(editPrice);
                if (Number.isFinite(s) && Number.isFinite(p) && s > 0 && p > 0) {
                  // 加碼預覽用原幣別計算 — 與 plannedPrice 一致
                  const preview = computePlanning(
                    { ...h, plannedShares: s, plannedPrice: p },
                    row.rawPrice,
                  );
                  if (preview) {
                    return (
                      <div className="ml-auto flex flex-wrap gap-3 rounded-md border border-cyan-200 bg-white px-3 py-2 text-xs">
                        <Metric
                          label="加碼後均價"
                          value={formatPrice(preview.newAvgCost)}
                          highlight={
                            preview.newAvgCost < h.avgCost
                              ? "green"
                              : preview.newAvgCost > h.avgCost
                                ? "red"
                                : "neutral"
                          }
                        />
                        <Metric
                          label="總投入"
                          value={formatLargeNumber(preview.newTotalCost)}
                          highlight="neutral"
                        />
                        <Metric
                          label="總股數"
                          value={preview.newTotalShares.toLocaleString()}
                          highlight="neutral"
                        />
                        <Metric
                          label="預期損益"
                          value={formatChange(preview.projPnL)}
                          highlight={preview.projPnL >= 0 ? "red" : "green"}
                        />
                        <Metric
                          label="預期報酬率"
                          value={formatPercent(preview.projPnLPercent)}
                          highlight={preview.projPnLPercent >= 0 ? "red" : "green"}
                        />
                      </div>
                    );
                  }
                }
                return null;
              })()}

              {/* Actions */}
              <div className="flex items-center gap-1">
                {(h.plannedShares ?? 0) > 0 && (
                  <button
                    onClick={onClearPlanning}
                    className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
                    title="清除加碼計畫"
                  >
                    清除
                  </button>
                )}
                <button
                  onClick={onCancelEdit}
                  className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  title="取消"
                >
                  <X size={14} />
                </button>
                <button
                  onClick={save}
                  className="flex items-center gap-1 rounded bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-700"
                >
                  <Check size={12} /> 儲存
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function Metric({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight: "red" | "green" | "neutral";
}) {
  const color =
    highlight === "red"
      ? "text-red-700"
      : highlight === "green"
        ? "text-green-700"
        : "text-gray-800";
  return (
    <div>
      <div className="text-[10px] text-gray-500">{label}</div>
      <div className={`font-bold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}

// ─── 加碼試算 ──────────────────────────────────────────
function computePlanning(h: Holding, currentPrice: number) {
  const ps = h.plannedShares ?? 0;
  const pp = h.plannedPrice ?? currentPrice;
  if (ps <= 0 || !Number.isFinite(pp) || pp <= 0) return null;

  const newTotalShares = h.shares + ps;
  const newTotalCost = h.shares * h.avgCost + ps * pp;
  const newAvgCost = newTotalShares > 0 ? newTotalCost / newTotalShares : 0;

  // 以目前股價試算市值與損益
  const projMarketValue = newTotalShares * currentPrice;
  const projPnL = projMarketValue - newTotalCost;
  const projPnLPercent = newTotalCost > 0 ? (projPnL / newTotalCost) * 100 : 0;

  return {
    newTotalShares,
    newTotalCost,
    newAvgCost,
    projMarketValue,
    projPnL,
    projPnLPercent,
  };
}
