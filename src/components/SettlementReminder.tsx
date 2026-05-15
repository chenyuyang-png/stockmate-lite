"use client";

// 交割提醒 — 顯示「最近 5 個工作日內要交割」的交易清單
//
// 規則：
//   - 取 transactions 裡 settlementDate 介於「-1 天 ~ +5 天」內
//   - 未標 settled 的
//   - 依交割日 ASC 排序，第一筆會醒目顯示
//   - 顯示金額影響：買 = 出（紅）、賣 = 入（綠）

import { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertTriangle,
  Clock,
  X,
} from "lucide-react";
import { useTransactions } from "@/lib/storage";
import {
  pendingSettlements,
  daysUntilSettlement,
  tradeKindLabel,
  settlementCashImpact,
  computeSettlementDate,
} from "@/lib/settlement";
import { displayName } from "@/lib/symbols";

export function SettlementReminder() {
  const { transactions, hydrated, update } = useTransactions();
  const [dismissed, setDismissed] = useState(false);

  if (!hydrated) return null;
  if (dismissed) return null;

  const pending = pendingSettlements(transactions);
  if (pending.length === 0) return null;

  // 算當日 / 明日 / 後續 group
  const today = pending.filter((t) => daysUntilSettlement(t.settlementDate!) === 0);
  const tomorrow = pending.filter((t) => daysUntilSettlement(t.settlementDate!) === 1);
  const later = pending.filter((t) => daysUntilSettlement(t.settlementDate!) > 1);
  const overdue = pending.filter((t) => daysUntilSettlement(t.settlementDate!) < 0);

  // 總金額（買出 + 賣入）
  let outAmount = 0;
  let inAmount = 0;
  for (const tx of pending) {
    const { amount, direction } = settlementCashImpact(tx);
    if (direction === "out") outAmount += amount;
    else inAmount += amount;
  }

  // 最緊急的那筆（今天 > 過期 > 明天 > 未來）
  const mostUrgent = today[0] ?? overdue[0] ?? tomorrow[0] ?? later[0];

  const tone = (() => {
    if (today.length > 0 || overdue.length > 0) {
      return {
        border: "border-red-400",
        bg: "from-red-50 via-orange-50 to-amber-50",
        Icon: AlertTriangle,
        iconColor: "text-red-600",
        title:
          overdue.length > 0
            ? `⚠️ 有 ${overdue.length} 筆已過交割日`
            : `📅 今日 ${today.length} 筆交易要交割`,
      };
    }
    if (tomorrow.length > 0) {
      return {
        border: "border-amber-300",
        bg: "from-amber-50 to-yellow-50",
        Icon: Clock,
        iconColor: "text-amber-600",
        title: `⏰ 明天 ${tomorrow.length} 筆交易要交割`,
      };
    }
    return {
      border: "border-blue-300",
      bg: "from-blue-50 to-sky-50",
      Icon: Calendar,
      iconColor: "text-blue-600",
      title: `📅 接下來 ${pending.length} 筆交易待交割`,
    };
  })();

  return (
    <section
      className={`overflow-hidden rounded-xl border-2 ${tone.border} bg-gradient-to-br ${tone.bg} shadow-sm`}
    >
      <header className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <tone.Icon size={18} className={tone.iconColor} />
          <h3 className="text-sm font-bold text-gray-900">{tone.title}</h3>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="rounded-full p-1 text-gray-500 hover:bg-white"
          aria-label="關閉提醒"
          title="今天先收起來（重新整理後再出現）"
        >
          <X size={14} />
        </button>
      </header>

      {/* 金額總覽 */}
      {(outAmount > 0 || inAmount > 0) && (
        <div className="grid grid-cols-2 gap-2 border-y border-white/60 bg-white/50 px-4 py-2 text-xs">
          {outAmount > 0 && (
            <div className="flex items-center gap-1.5">
              <ArrowDownCircle size={14} className="text-red-600" />
              <span className="text-gray-700">需付款</span>
              <span className="font-bold tabular-nums text-red-700">
                NT$ {Math.round(outAmount).toLocaleString()}
              </span>
            </div>
          )}
          {inAmount > 0 && (
            <div className="flex items-center gap-1.5">
              <ArrowUpCircle size={14} className="text-green-600" />
              <span className="text-gray-700">入帳</span>
              <span className="font-bold tabular-nums text-green-700">
                NT$ {Math.round(inAmount).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      )}

      {/* 最緊急那筆 — 大字 */}
      {mostUrgent && (
        <div className="bg-white/70 px-4 py-2.5 backdrop-blur">
          <div className="text-[10px] uppercase tracking-wide text-gray-500">
            最緊急
          </div>
          <PendingRow
            tx={mostUrgent}
            highlighted
            onSettle={() => update(mostUrgent.id, { settled: true })}
          />
        </div>
      )}

      {/* 其他待交割 */}
      {pending.length > 1 && (
        <details className="border-t border-white/60 bg-white/40 px-4 py-2">
          <summary className="cursor-pointer text-[11px] font-semibold text-gray-700 [&::-webkit-details-marker]:hidden">
            還有 {pending.length - 1} 筆交割 — 展開查看
          </summary>
          <ul className="mt-2 space-y-1">
            {pending
              .filter((t) => t.id !== mostUrgent?.id)
              .map((tx) => (
                <li key={tx.id}>
                  <PendingRow
                    tx={tx}
                    onSettle={() => update(tx.id, { settled: true })}
                  />
                </li>
              ))}
          </ul>
        </details>
      )}

      {/* footer */}
      <p className="border-t border-white/60 bg-white/30 px-4 py-1.5 text-[10px] leading-relaxed text-gray-600">
        💡 台股 T+2、美股 T+1 交割。買進需在交割日前備好款項；融資只需 4 成自備款。確認入帳 / 扣款後按「✓ 已交割」標記。
      </p>
    </section>
  );
}

function PendingRow({
  tx,
  highlighted,
  onSettle,
}: {
  tx: ReturnType<typeof pendingSettlements>[number];
  highlighted?: boolean;
  onSettle: () => void;
}) {
  const settlementDate =
    tx.settlementDate ?? computeSettlementDate(tx.symbol, tx.date);
  const days = daysUntilSettlement(settlementDate);
  const { amount, direction } = settlementCashImpact(tx);

  const daysLabel =
    days < 0
      ? `逾期 ${Math.abs(days)} 天`
      : days === 0
        ? "今天到期"
        : days === 1
          ? "明天"
          : `${days} 天後`;
  const daysColor =
    days < 0
      ? "text-red-700 bg-red-100"
      : days === 0
        ? "text-red-700 bg-red-100"
        : days === 1
          ? "text-amber-700 bg-amber-100"
          : "text-blue-700 bg-blue-100";

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 rounded-md ${
        highlighted ? "py-1" : "border border-gray-200 bg-white px-2 py-1.5"
      }`}
    >
      <div className="flex flex-wrap items-baseline gap-2 min-w-0">
        <span
          className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${
            tx.type === "buy"
              ? "bg-red-100 text-red-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          {tx.type === "buy" ? "買進" : "賣出"} · {tradeKindLabel(tx.kind)}
        </span>
        <span
          className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${daysColor}`}
        >
          {daysLabel}
        </span>
        <span
          className={`shrink-0 ${highlighted ? "text-sm font-bold" : "text-xs"} text-gray-900`}
        >
          {displayName(tx.symbol)}
        </span>
        <span className="text-[10px] text-gray-500 tabular-nums">
          {tx.shares.toLocaleString()} 股 @ {tx.price.toFixed(2)}
        </span>
        <span className="text-[10px] text-gray-500">
          交割 {settlementDate}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span
          className={`text-xs font-bold tabular-nums ${
            direction === "out" ? "text-red-700" : "text-green-700"
          }`}
        >
          {direction === "out" ? "出 " : "入 "}NT${" "}
          {Math.round(amount).toLocaleString()}
        </span>
        <button
          onClick={onSettle}
          className="flex items-center gap-0.5 rounded bg-green-600 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-green-700"
          title="標記為已交割"
        >
          <CheckCircle2 size={10} /> 已交割
        </button>
      </div>
    </div>
  );
}
