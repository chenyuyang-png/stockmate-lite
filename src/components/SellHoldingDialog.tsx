"use client";

// 「賣出」對話框 — 連動 Holdings + Transactions
//
// 流程：
//   1. 使用者按持股列上的「💸 賣出」
//   2. 跳出 dialog 預填：股數=當前持股、價格=即時報價
//   3. 確認後：
//      - 新增一筆 sell Transaction（自動帶 settlementDate）
//      - 扣減 Holding shares；若清空則刪除 holding
//   4. 已實現損益會自動出現在「交易紀錄」分頁底下（已存在的 computePositions 邏輯）

import { useState, useEffect } from "react";
import { X, TrendingDown, AlertCircle } from "lucide-react";
import type { Holding, TradeKind } from "@/lib/types";
import { displayName } from "@/lib/symbols";
import { computeSettlementDate, tradeKindLabel } from "@/lib/settlement";
import { formatPrice, formatChange } from "@/lib/format";

type Props = {
  holding: Holding | null;
  /** 即時報價 — 用來預填賣出價 + 估算損益 */
  currentPrice?: number;
  onClose: () => void;
  /** 確認賣出時的回呼，由父元件去新增 transaction + 調整 holding */
  onConfirm: (data: {
    shares: number;
    price: number;
    date: string;
    fee: number;
    tax: number;
    kind: TradeKind;
    note?: string;
  }) => void;
};

export function SellHoldingDialog({
  holding,
  currentPrice,
  onClose,
  onConfirm,
}: Props) {
  const [shares, setShares] = useState("");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [fee, setFee] = useState("");
  const [tax, setTax] = useState("");
  const [kind, setKind] = useState<TradeKind>("cash");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (holding) {
      setShares(holding.shares.toString());
      setPrice(currentPrice ? currentPrice.toFixed(2) : "");
      setDate(new Date().toISOString().slice(0, 10));
      setFee("");
      setTax("");
      setKind("cash");
      setNote("");
    }
  }, [holding, currentPrice]);

  if (!holding) return null;

  const cleanCode = holding.symbol.replace(/\.(TW|TWO)$/i, "");
  const name = displayName(holding.symbol);

  const sharesNum = parseFloat(shares) || 0;
  const priceNum = parseFloat(price) || 0;
  const feeNum = parseFloat(fee) || 0;
  const taxNum = parseFloat(tax) || 0;
  const grossProceeds = priceNum * sharesNum;
  const netProceeds = grossProceeds - feeNum - taxNum;
  const costPortion = holding.avgCost * sharesNum;
  const pnl = netProceeds - costPortion;
  const pnlPct = costPortion > 0 ? (pnl / costPortion) * 100 : 0;

  // 預估交割日
  const settlement =
    date && sharesNum > 0 ? computeSettlementDate(holding.symbol, date) : null;

  const isPartial = sharesNum > 0 && sharesNum < holding.shares;
  const isFull = sharesNum >= holding.shares;
  const isInvalid =
    !Number.isFinite(sharesNum) ||
    sharesNum <= 0 ||
    sharesNum > holding.shares ||
    !Number.isFinite(priceNum) ||
    priceNum <= 0 ||
    !date;

  function submit() {
    if (isInvalid) return;
    onConfirm({
      shares: sharesNum,
      price: priceNum,
      date,
      fee: feeNum,
      tax: taxNum,
      kind,
      note: note.trim() || undefined,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
            <TrendingDown size={14} className="text-green-600" />
            賣出持股
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="關閉"
          >
            <X size={16} />
          </button>
        </div>

        {/* 標的 + 現況 */}
        <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="font-semibold text-gray-900">{name}</span>
              <span className="ml-2 text-xs text-gray-500">{cleanCode}</span>
            </div>
            <div className="text-[10px] text-gray-500">
              現有 <span className="font-bold tabular-nums">{holding.shares}</span> 股 @{" "}
              <span className="font-bold tabular-nums">{formatPrice(holding.avgCost)}</span>
            </div>
          </div>
        </div>

        {/* 交易方式 */}
        <div className="mt-3">
          <div className="text-[11px] font-semibold text-gray-700">交易方式</div>
          <div className="mt-1 flex gap-1.5">
            {(["cash", "margin", "short"] as TradeKind[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition ${
                  kind === k
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"
                }`}
              >
                {tradeKindLabel(k)}
              </button>
            ))}
          </div>
        </div>

        {/* 賣出股數 + 價格 */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Field label={`賣出股數（最多 ${holding.shares}）`}>
            <div className="relative">
              <input
                type="number"
                step="any"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                inputMode="decimal"
                className={fieldClass}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShares(holding.shares.toString())}
                className="absolute right-1 top-1 rounded bg-gray-200 px-1.5 py-0.5 text-[10px] text-gray-700 hover:bg-gray-300"
              >
                全部
              </button>
            </div>
          </Field>
          <Field label="賣出單價">
            <input
              type="number"
              step="any"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="decimal"
              className={fieldClass}
            />
          </Field>
        </div>

        {/* 日期 + 手續費 + 證交稅 */}
        <div className="mt-2 grid grid-cols-3 gap-2">
          <Field label="成交日期">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={fieldClass}
            />
          </Field>
          <Field label="手續費">
            <input
              type="number"
              step="any"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              placeholder="0"
              inputMode="decimal"
              className={fieldClass}
            />
          </Field>
          <Field label="證交稅">
            <input
              type="number"
              step="any"
              value={tax}
              onChange={(e) => setTax(e.target.value)}
              placeholder="0"
              inputMode="decimal"
              className={fieldClass}
            />
          </Field>
        </div>

        <Field label="備註（可選）">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="例：停利出場"
            className={fieldClass}
          />
        </Field>

        {/* 損益預覽 */}
        {sharesNum > 0 && priceNum > 0 && (
          <div className="mt-3 space-y-1 rounded-md border border-amber-200 bg-amber-50 p-2.5 text-[11px]">
            <Row label="毛收入" value={`NT$ ${grossProceeds.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
            <Row
              label="手續費 + 證交稅"
              value={`-NT$ ${(feeNum + taxNum).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            />
            <Row label="實收" value={`NT$ ${netProceeds.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} bold />
            <Row label="此次成本" value={`NT$ ${costPortion.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
            <div className="my-1 border-t border-amber-200" />
            <div className="flex items-baseline justify-between font-bold">
              <span className="text-gray-700">已實現損益</span>
              <span
                className={`tabular-nums ${
                  pnl >= 0 ? "text-red-700" : "text-green-700"
                }`}
              >
                {formatChange(pnl)}（{pnlPct >= 0 ? "+" : ""}
                {pnlPct.toFixed(2)}%）
              </span>
            </div>
          </div>
        )}

        {/* 交割提示 */}
        {settlement && (
          <div className="mt-2 rounded-md border border-blue-200 bg-blue-50 p-2 text-[11px] text-blue-900">
            🗓 <strong>預計交割日：{settlement}</strong>
            （{tradeKindLabel(kind)}）
            <span className="ml-1 text-blue-700">
              {kind === "cash"
                ? "／T+2 入帳"
                : kind === "margin"
                  ? "／融資沖回"
                  : "／融券保證金結算"}
            </span>
          </div>
        )}

        {/* 部分 / 全部出場提示 */}
        {sharesNum > 0 && (
          <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 p-2 text-[11px] text-gray-700">
            {isFull
              ? "📤 賣出全部 — 持股將從清單移除、已實現損益自動歸入交易紀錄"
              : isPartial
                ? `📤 部分出場 — 持股剩 ${holding.shares - sharesNum} 股，已實現損益依此次配對計算`
                : ""}
          </div>
        )}

        {sharesNum > holding.shares && (
          <div className="mt-2 flex items-start gap-1.5 rounded-md border border-red-200 bg-red-50 p-2 text-[11px] text-red-800">
            <AlertCircle size={12} className="mt-0.5 shrink-0" />
            <span>賣出股數不能超過持股數（{holding.shares}）</span>
          </div>
        )}

        <div className="mt-3 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
          >
            取消
          </button>
          <button
            onClick={submit}
            disabled={isInvalid}
            className="flex items-center gap-1 rounded-md bg-green-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <TrendingDown size={13} /> 確認賣出
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[11px] text-gray-500">{label}</span>
      {children}
    </label>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between ${
        bold ? "font-bold text-gray-900" : "text-gray-700"
      }`}
    >
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

const fieldClass =
  "mt-0.5 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm tabular-nums text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none";
