"use client";

import { useState } from "react";
import { Plus, X, AlertTriangle } from "lucide-react";
import { StockSearch } from "./StockSearch";
import type { SearchResult } from "@/app/api/search/route";
import {
  computeMarginMaintenance,
  computeShortMaintenance,
} from "@/lib/marginCalc";

type TradeKind = "cash" | "margin" | "short";

type Props = {
  onAdd: (data: {
    symbol: string;
    shares: number;
    avgCost: number;
    note?: string;
    tradeKind?: TradeKind;
  }) => void;
};

export function AddHoldingDialog({ onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<SearchResult | null>(null);
  const [shares, setShares] = useState("");
  const [avgCost, setAvgCost] = useState("");
  const [currentPrice, setCurrentPrice] = useState("");
  const [tradeKind, setTradeKind] = useState<TradeKind>("cash");
  const [note, setNote] = useState("");

  // 試算維持率（僅融資 / 融券）
  const sharesNum = parseFloat(shares) || 0;
  const avgCostNum = parseFloat(avgCost) || 0;
  const priceNum = parseFloat(currentPrice) || avgCostNum; // 沒填現價就用成本
  const maint =
    tradeKind === "margin" && sharesNum > 0 && avgCostNum > 0
      ? computeMarginMaintenance(sharesNum, avgCostNum, priceNum)
      : tradeKind === "short" && sharesNum > 0 && avgCostNum > 0
        ? computeShortMaintenance(sharesNum, avgCostNum, priceNum)
        : null;

  function reset() {
    setPicked(null);
    setShares("");
    setAvgCost("");
    setCurrentPrice("");
    setTradeKind("cash");
    setNote("");
  }

  function submit() {
    if (!picked) return;
    const s = parseFloat(shares);
    const c = parseFloat(avgCost);
    if (!Number.isFinite(s) || !Number.isFinite(c)) return;
    onAdd({
      symbol: picked.symbol,
      shares: s,
      avgCost: c,
      note: note || undefined,
      tradeKind: tradeKind !== "cash" ? tradeKind : undefined,
    });
    reset();
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 hover:shadow"
      >
        <Plus size={16} strokeWidth={2.5} /> 新增持股
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg border border-gray-200 bg-gray-100 p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">新增持股</h3>
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
                    value={shares}
                    onChange={(e) => setShares(e.target.value)}
                    placeholder="100"
                    inputMode="decimal"
                    className={fieldClass}
                  />
                </Field>
                <Field label="平均成本">
                  <input
                    value={avgCost}
                    onChange={(e) => setAvgCost(e.target.value)}
                    placeholder="900"
                    inputMode="decimal"
                    className={fieldClass}
                  />
                </Field>
              </div>

              {/* 融資 / 融券 才顯示「現價」欄位用來試算維持率 */}
              {tradeKind !== "cash" && (
                <Field label="目前股價（試算維持率用）">
                  <input
                    value={currentPrice}
                    onChange={(e) => setCurrentPrice(e.target.value)}
                    placeholder="留空則用成本價試算"
                    inputMode="decimal"
                    className={fieldClass}
                  />
                </Field>
              )}

              {/* 維持率警示 */}
              {maint && (
                <MaintenancePanel
                  result={maint}
                  kind={tradeKind as "margin" | "short"}
                />
              )}

              <Field label="備註（可選）">
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="例：2024 Q3 進場"
                  className={fieldClass}
                />
              </Field>
            </div>

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
                className="rounded-md bg-red-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
              >
                新增
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── 維持率試算面板 ──────────────────────────────────────
function MaintenancePanel({
  result,
  kind,
}: {
  result: ReturnType<typeof computeMarginMaintenance>;
  kind: "margin" | "short";
}) {
  const toneCls =
    result.status === "danger"
      ? "border-red-300 bg-red-50 text-red-900"
      : result.status === "warn"
        ? "border-amber-300 bg-amber-50 text-amber-900"
        : "border-emerald-200 bg-emerald-50 text-emerald-900";

  return (
    <div className={`rounded-md border p-2.5 text-[11px] ${toneCls}`}>
      <div className="mb-1 flex items-center gap-1 font-semibold">
        {result.status !== "safe" && <AlertTriangle size={12} />}
        🧮 {kind === "margin" ? "融資" : "融券"}維持率試算
      </div>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <span>
          目前維持率：
          <strong className="tabular-nums">{result.ratio.toFixed(1)}%</strong>
        </span>
        <span className="text-[10px]">→ {result.label}</span>
      </div>
      {result.liquidationPrice && (
        <div className="mt-1 text-[10px] opacity-90">
          當價格 {kind === "margin" ? "跌至" : "漲至"}{" "}
          <strong className="tabular-nums">
            ≈ NT$ {result.liquidationPrice.toFixed(2)}
          </strong>{" "}
          時觸發斷頭門檻（120%）
        </div>
      )}
      <p className="mt-1.5 text-[9px] leading-snug opacity-75">
        ⚠️ 試算僅供參考，實際維持率以券商計算為準。120% 為強制平倉門檻、130% 通常會被通知補繳。
      </p>
    </div>
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
