"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { History, Trash2, ChevronDown, ChevronRight, ArrowDown, ArrowUp } from "lucide-react";
import { useTransactions } from "@/lib/storage";
import { computePositions, realizedByMonth, type RealizedTrade } from "@/lib/positions";
import { AddTransactionDialog } from "./AddTransactionDialog";
import { changeColor, formatChange, formatPercent, formatPrice } from "@/lib/format";

// 賣出觸發事件名稱（由 Holdings 在賣出後 dispatch）
// Transactions 監聽到 → 展開 + 滾動 + 高亮
const SELL_EVENT = "holdings:sold";

export function Transactions() {
  const { transactions, hydrated, add, remove } = useTransactions();
  const [expanded, setExpanded] = useState(false);
  const [highlight, setHighlight] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // 監聽「剛剛賣出」事件：展開 + 滾動到此區 + 高亮 2 秒
  useEffect(() => {
    function handleSold() {
      setExpanded(true);
      // 等 React 重新 render 後再滾，避免滾到摺疊狀態時的位置
      requestAnimationFrame(() => {
        sectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
      setHighlight(true);
      setTimeout(() => setHighlight(false), 2400);
    }
    window.addEventListener(SELL_EVENT, handleSold);
    return () => window.removeEventListener(SELL_EVENT, handleSold);
  }, []);

  const stats = useMemo(() => computePositions(transactions), [transactions]);
  const monthly = useMemo(() => realizedByMonth(stats.realized), [stats.realized]);

  if (!hydrated) return null;

  const totalsColor = changeColor(stats.totals.totalRealizedPnL);

  return (
    <section
      ref={sectionRef}
      className={`scroll-mt-20 rounded-xl border bg-white p-4 transition-all duration-500 ${
        highlight
          ? "border-green-400 shadow-lg ring-2 ring-green-300"
          : "border-gray-200"
      }`}
    >
      <header className="mb-3 flex items-center justify-between">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 hover:opacity-80"
        >
          {expanded ? <ChevronDown size={14} className="text-gray-500" /> : <ChevronRight size={14} className="text-gray-500" />}
          <History size={16} className="text-violet-600" />
          <h2 className="text-sm font-semibold text-gray-700">交易紀錄與已實現損益</h2>
          <span className="text-xs text-gray-500">{transactions.length} 筆</span>
        </button>
        <AddTransactionDialog onAdd={(d) => add(d)} />
      </header>

      {/* 統計摘要列（永遠顯示） */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
        <StatCard
          label="已實現損益"
          value={formatChange(stats.totals.totalRealizedPnL)}
          valueClass={totalsColor + " font-semibold"}
        />
        <StatCard
          label="完成交易"
          value={`${stats.totals.totalCompletedTrades} 筆`}
        />
        <StatCard
          label="勝率"
          value={
            stats.totals.totalCompletedTrades > 0
              ? `${stats.totals.winRate.toFixed(1)}%`
              : "—"
          }
          valueClass={stats.totals.winRate >= 50 ? "text-red-600" : "text-green-600"}
        />
        <StatCard
          label="平均獲利"
          value={stats.totals.avgWin > 0 ? formatChange(stats.totals.avgWin) : "—"}
          valueClass="text-red-600"
        />
        <StatCard
          label="平均虧損"
          value={stats.totals.avgLoss < 0 ? formatChange(stats.totals.avgLoss) : "—"}
          valueClass="text-green-600"
        />
      </div>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* 月度績效長條 */}
          {monthly.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                月度已實現損益
              </h3>
              <MonthlyChart data={monthly} />
            </div>
          )}

          {/* 完成交易明細 */}
          {stats.realized.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                完成交易明細（FIFO 配對）
              </h3>
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-gray-50">
                    <tr className="text-left text-[10px] uppercase text-gray-500">
                      <th className="px-2 py-1.5">股票</th>
                      <th className="px-2 py-1.5">買進日</th>
                      <th className="px-2 py-1.5">賣出日</th>
                      <th className="px-2 py-1.5 text-right">股數</th>
                      <th className="px-2 py-1.5 text-right">買價</th>
                      <th className="px-2 py-1.5 text-right">賣價</th>
                      <th className="px-2 py-1.5 text-right">損益</th>
                      <th className="px-2 py-1.5 text-right">持有</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.realized.map((r, i) => (
                      <RealizedRow key={i} trade={r} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 原始交易紀錄 */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              原始交易紀錄
            </h3>
            {transactions.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-500">
                還沒有交易紀錄，點右上「新增交易」開始追蹤。
              </p>
            ) : (
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-gray-50">
                    <tr className="text-left text-[10px] uppercase text-gray-500">
                      <th className="px-2 py-1.5">日期</th>
                      <th className="px-2 py-1.5">類型</th>
                      <th className="px-2 py-1.5">股票</th>
                      <th className="px-2 py-1.5 text-right">股數</th>
                      <th className="px-2 py-1.5 text-right">價格</th>
                      <th className="px-2 py-1.5 text-right">金額</th>
                      <th className="px-2 py-1.5">備註</th>
                      <th className="px-2 py-1.5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => {
                      const cleanCode = tx.symbol.replace(/\.(TW|TWO)$/i, "");
                      const total = tx.shares * tx.price;
                      return (
                        <tr key={tx.id} className="border-t border-gray-200 hover:bg-gray-50">
                          <td className="px-2 py-1.5 text-gray-500">{tx.date}</td>
                          <td className="px-2 py-1.5">
                            {tx.type === "buy" ? (
                              <span className="inline-flex items-center gap-0.5 rounded bg-red-50 px-1.5 py-0.5 text-red-500">
                                <ArrowDown size={9} /> 買
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 rounded bg-green-50 px-1.5 py-0.5 text-green-500">
                                <ArrowUp size={9} /> 賣
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-1.5 text-gray-700">{cleanCode}</td>
                          <td className="px-2 py-1.5 text-right tabular-nums text-gray-600">
                            {tx.shares.toLocaleString()}
                          </td>
                          <td className="px-2 py-1.5 text-right tabular-nums text-gray-600">
                            {formatPrice(tx.price)}
                          </td>
                          <td className="px-2 py-1.5 text-right tabular-nums text-gray-500">
                            {formatPrice(total)}
                          </td>
                          <td className="px-2 py-1.5 max-w-[160px] truncate text-gray-500">
                            {tx.note ?? ""}
                          </td>
                          <td className="px-2 py-1.5 text-right">
                            <button
                              onClick={() => {
                                if (confirm(`刪除 ${tx.date} ${cleanCode} 的交易紀錄？`)) {
                                  remove(tx.id);
                                }
                              }}
                              className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-green-600"
                            >
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function StatCard({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
      <div className="text-[10px] uppercase text-gray-500">{label}</div>
      <div className={`mt-0.5 text-sm tabular-nums text-gray-800 ${valueClass ?? ""}`}>{value}</div>
    </div>
  );
}

function RealizedRow({ trade }: { trade: RealizedTrade }) {
  const color = changeColor(trade.pnl);
  const cleanCode = trade.symbol.replace(/\.(TW|TWO)$/i, "");
  const pct = trade.buyPrice > 0 ? ((trade.sellPrice - trade.buyPrice) / trade.buyPrice) * 100 : 0;
  return (
    <tr className="border-t border-gray-200 hover:bg-gray-50">
      <td className="px-2 py-1.5 text-gray-700">{cleanCode}</td>
      <td className="px-2 py-1.5 text-gray-500">{trade.buyDate}</td>
      <td className="px-2 py-1.5 text-gray-500">{trade.sellDate}</td>
      <td className="px-2 py-1.5 text-right tabular-nums text-gray-600">{trade.shares.toLocaleString()}</td>
      <td className="px-2 py-1.5 text-right tabular-nums text-gray-500">{formatPrice(trade.buyPrice)}</td>
      <td className="px-2 py-1.5 text-right tabular-nums text-gray-600">{formatPrice(trade.sellPrice)}</td>
      <td className={`px-2 py-1.5 text-right tabular-nums ${color}`}>
        {formatChange(trade.pnl)} <span className="text-[10px]">({formatPercent(pct)})</span>
      </td>
      <td className="px-2 py-1.5 text-right text-gray-500">{trade.holdingDays}d</td>
    </tr>
  );
}

function MonthlyChart({ data }: { data: { month: string; pnl: number; trades: number }[] }) {
  const max = Math.max(1, ...data.map((d) => Math.abs(d.pnl)));
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
      <div className="flex items-end gap-1 overflow-x-auto">
        {data.map((d) => {
          const heightPct = (Math.abs(d.pnl) / max) * 80;
          const isPositive = d.pnl >= 0;
          return (
            <div key={d.month} className="flex min-w-[44px] flex-col items-center">
              <div className="flex h-24 items-end">
                <div
                  className={`w-6 rounded-t ${isPositive ? "bg-red-500" : "bg-green-500"}`}
                  style={{ height: `${Math.max(2, heightPct)}%` }}
                  title={`${d.month}: ${formatChange(d.pnl)} (${d.trades} 筆)`}
                />
              </div>
              <div className="mt-1 text-[10px] text-gray-500">{d.month.slice(5)}</div>
              <div
                className={`text-[10px] tabular-nums ${
                  isPositive ? "text-red-600" : "text-green-600"
                }`}
              >
                {d.pnl >= 0 ? "+" : ""}
                {Math.round(d.pnl / 1000)}k
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
