"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { StockSearch } from "./StockSearch";
import type { SearchResult } from "@/app/api/search/route";
import type { TradeKind } from "@/lib/types";
import { computeSettlementDate, tradeKindLabel } from "@/lib/settlement";

type Props = {
  onAdd: (data: {
    symbol: string;
    type: "buy" | "sell";
    date: string;
    shares: number;
    price: number;
    fee?: number;
    tax?: number;
    kind?: TradeKind;
    settlementDate?: string;
    note?: string;
  }) => void;
};

export function AddTransactionDialog({ onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"buy" | "sell">("buy");
  const [kind, setKind] = useState<TradeKind>("cash");
  const [picked, setPicked] = useState<SearchResult | null>(null);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [shares, setShares] = useState("");
  const [price, setPrice] = useState("");
  const [fee, setFee] = useState("");
  const [tax, setTax] = useState("");
  const [note, setNote] = useState("");

  // 預估交割日（拿來顯示提示）
  const settlement =
    picked && date ? computeSettlementDate(picked.symbol, date) : null;

  function reset() {
    setPicked(null);
    setShares("");
    setPrice("");
    setFee("");
    setTax("");
    setNote("");
    setKind("cash");
  }

  function submit() {
    if (!picked) return;
    const s = parseFloat(shares);
    const p = parseFloat(price);
    if (!Number.isFinite(s) || !Number.isFinite(p) || !date) return;
    onAdd({
      symbol: picked.symbol,
      type,
      date,
      shares: s,
      price: p,
      fee: fee ? parseFloat(fee) : undefined,
      tax: tax ? parseFloat(tax) : undefined,
      kind,
      settlementDate: computeSettlementDate(picked.symbol, date),
      note: note || undefined,
    });
    reset();
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-md border border-gray-300 bg-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200"
      >
        <Plus size={14} /> 新增交易
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-gray-100 p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">新增交易紀錄</h3>
              <button
                onClick={() => {
                  reset();
                  setOpen(false);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-3 flex rounded-md border border-gray-200 bg-gray-50 p-0.5">
              <button
                onClick={() => setType("buy")}
                className={`flex-1 rounded px-3 py-1.5 text-sm font-medium ${
                  type === "buy" ? "bg-red-500 text-white" : "text-gray-500"
                }`}
              >
                買進
              </button>
              <button
                onClick={() => setType("sell")}
                className={`flex-1 rounded px-3 py-1.5 text-sm font-medium ${
                  type === "sell" ? "bg-green-500 text-white" : "text-gray-500"
                }`}
              >
                賣出
              </button>
            </div>

            {/* 交易方式 — 現股 / 融資 / 融券 */}
            <div className="mt-2">
              <span className="text-[11px] text-gray-500">交易方式</span>
              <div className="mt-0.5 flex gap-1">
                {(["cash", "margin", "short"] as TradeKind[]).map((k) => (
                  <button
                    key={k}
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

            <div className="mt-3 space-y-2">
              <div>
                <span className="text-[11px] text-gray-500">股票</span>
                {picked ? (
                  <div className="mt-0.5 flex items-center justify-between rounded-md border border-red-300 bg-red-100 px-3 py-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-800">{picked.name}</span>
                      <span className="ml-2 text-xs text-gray-500">
                        {picked.symbol.replace(/\.(TW|TWO)$/i, "")}
                      </span>
                    </div>
                    <button
                      onClick={() => setPicked(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="mt-0.5">
                    <StockSearch autoFocus onSelect={setPicked} />
                  </div>
                )}
              </div>

              <Field label="日期">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={fieldClass}
                />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="股數">
                  <input
                    value={shares}
                    onChange={(e) => setShares(e.target.value)}
                    placeholder="100"
                    inputMode="decimal"
                    className={fieldClass}
                  />
                </Field>
                <Field label="價格">
                  <input
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="900"
                    inputMode="decimal"
                    className={fieldClass}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="手續費（可選）">
                  <input
                    value={fee}
                    onChange={(e) => setFee(e.target.value)}
                    placeholder="20"
                    inputMode="decimal"
                    className={fieldClass}
                  />
                </Field>
                <Field label="證交稅（可選）">
                  <input
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
                  placeholder="例：突破 60 日均線進場"
                  className={fieldClass}
                />
              </Field>
            </div>

            {/* 交割日預覽 */}
            {settlement && shares && price && (
              <div className="mt-2 rounded-md border border-blue-200 bg-blue-50 p-2 text-[11px] text-blue-900">
                🗓 預計交割日：<strong>{settlement}</strong>（{tradeKindLabel(kind)}）
                <br />
                <span className="text-blue-700">
                  {type === "buy" && kind === "cash"
                    ? "現股買進 — 交割日前帳戶要有錢"
                    : type === "buy" && kind === "margin"
                      ? "融資買進 — 只需 4 成自備款"
                      : type === "sell" && kind === "cash"
                        ? "現股賣出 — 交割日入帳"
                        : type === "sell" && kind === "short"
                          ? "融券賣出 — 需 9 成保證金"
                          : "確認交割流程"}
                </span>
              </div>
            )}

            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => {
                  reset();
                  setOpen(false);
                }}
                className="rounded-md px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
              >
                取消
              </button>
              <button
                onClick={submit}
                disabled={!picked}
                className={`rounded-md px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 ${
                  type === "buy"
                    ? "bg-red-500 hover:bg-red-500"
                    : "bg-green-500 hover:bg-green-500"
                }`}
              >
                {type === "buy" ? "確認買進" : "確認賣出"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] text-gray-500">{label}</span>
      {children}
    </label>
  );
}

const fieldClass =
  "mt-0.5 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-red-500 focus:outline-none";
