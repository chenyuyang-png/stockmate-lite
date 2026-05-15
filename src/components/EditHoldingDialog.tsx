"use client";

import { useState, useEffect } from "react";
import { X, Check, AlertTriangle } from "lucide-react";
import type { Holding } from "@/lib/types";
import { displayName } from "@/lib/symbols";
import {
  computeMarginMaintenance,
  computeShortMaintenance,
} from "@/lib/marginCalc";

type TradeKind = "cash" | "margin" | "short";

type Props = {
  holding: Holding | null;
  /** 即時報價（試算維持率用）*/
  currentPrice?: number;
  onClose: () => void;
  onSave: (patch: Partial<Holding>) => void;
};

export function EditHoldingDialog({ holding, currentPrice, onClose, onSave }: Props) {
  const [shares, setShares] = useState("");
  const [avgCost, setAvgCost] = useState("");
  const [note, setNote] = useState("");
  const [tradeKind, setTradeKind] = useState<TradeKind>("cash");

  // 開啟 / 切換 holding 時帶入現有資料
  useEffect(() => {
    if (holding) {
      setShares(holding.shares.toString());
      setAvgCost(holding.avgCost.toString());
      setNote(holding.note ?? "");
      setTradeKind(holding.tradeKind ?? "cash");
    }
  }, [holding]);

  if (!holding) return null;

  // 試算維持率
  const sharesNum = parseFloat(shares) || 0;
  const avgCostNum = parseFloat(avgCost) || 0;
  const priceNum = currentPrice ?? avgCostNum;
  const maint =
    tradeKind === "margin" && sharesNum > 0 && avgCostNum > 0
      ? computeMarginMaintenance(sharesNum, avgCostNum, priceNum)
      : tradeKind === "short" && sharesNum > 0 && avgCostNum > 0
        ? computeShortMaintenance(sharesNum, avgCostNum, priceNum)
        : null;

  const cleanCode = holding.symbol.replace(/\.(TW|TWO)$/i, "");
  const name = displayName(holding.symbol);

  function submit() {
    const s = parseFloat(shares);
    const c = parseFloat(avgCost);
    if (!Number.isFinite(s) || s <= 0) return;
    if (!Number.isFinite(c) || c <= 0) return;
    onSave({
      shares: s,
      avgCost: c,
      note: note.trim() || undefined,
      tradeKind: tradeKind !== "cash" ? tradeKind : undefined,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">
            ✏️ 編輯持股
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="關閉"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-2 rounded-md bg-blue-50 px-3 py-2">
          <div className="text-xs text-gray-500">標的（不可修改）</div>
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-gray-900">{name}</span>
            <span className="text-xs text-gray-500">{cleanCode}</span>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          {/* 交易方式 */}
          <div>
            <span className="text-[11px] text-gray-500">交易方式</span>
            <div className="mt-0.5 flex gap-1">
              {(["cash", "margin", "short"] as TradeKind[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setTradeKind(k)}
                  className={`flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition ${
                    tradeKind === k
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"
                  }`}
                >
                  {k === "cash" ? "現股" : k === "margin" ? "融資" : "融券"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Field label="股數">
              <input
                type="number"
                step="any"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                placeholder="100"
                inputMode="decimal"
                className={fieldClass}
                autoFocus
              />
            </Field>
            <Field label="平均成本">
              <input
                type="number"
                step="any"
                value={avgCost}
                onChange={(e) => setAvgCost(e.target.value)}
                placeholder="900"
                inputMode="decimal"
                className={fieldClass}
              />
            </Field>
          </div>

          {/* 維持率試算 */}
          {maint && (
            <div
              className={`rounded-md border p-2.5 text-[11px] ${
                maint.status === "danger"
                  ? "border-red-300 bg-red-50 text-red-900"
                  : maint.status === "warn"
                    ? "border-amber-300 bg-amber-50 text-amber-900"
                    : "border-emerald-200 bg-emerald-50 text-emerald-900"
              }`}
            >
              <div className="mb-1 flex items-center gap-1 font-semibold">
                {maint.status !== "safe" && <AlertTriangle size={12} />}
                🧮 {tradeKind === "margin" ? "融資" : "融券"}維持率（依現價 {priceNum.toFixed(2)}）
              </div>
              <div className="flex flex-wrap items-baseline gap-x-3">
                <span>
                  維持率：
                  <strong className="tabular-nums">
                    {maint.ratio.toFixed(1)}%
                  </strong>
                </span>
                <span className="text-[10px]">→ {maint.label}</span>
              </div>
              {maint.liquidationPrice && (
                <div className="mt-1 text-[10px] opacity-90">
                  斷頭觸發價約{" "}
                  <strong className="tabular-nums">
                    NT$ {maint.liquidationPrice.toFixed(2)}
                  </strong>
                </div>
              )}
            </div>
          )}
          <Field label="備註（可選）">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="例：2024 Q3 加碼到 100 股"
              className={fieldClass}
            />
          </Field>
        </div>

        <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-800">
          💡 修改持股不會清掉預期加碼設定。如要把加碼計畫實際反映進來，建議直接把
          shares 改成加碼後股數、avgCost 改成加碼後均價。
        </div>

        <div className="mt-3 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
          >
            取消
          </button>
          <button
            onClick={submit}
            className="flex items-center gap-1 rounded-md bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Check size={14} /> 儲存修改
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

const fieldClass =
  "mt-0.5 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm tabular-nums text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none";
