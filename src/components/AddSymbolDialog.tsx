"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { StockSearch } from "./StockSearch";

type Props = {
  onAdd: (symbol: string) => void;
  label?: string;
};

export function AddSymbolDialog({ onAdd, label = "新增" }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 hover:shadow"
      >
        <Plus size={16} strokeWidth={2.5} /> {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-gray-100 p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">新增股票到自選</h3>
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={16} />
              </button>
            </div>
            <div className="mt-3">
              <StockSearch
                autoFocus
                onSelect={(r) => {
                  onAdd(r.symbol);
                  setOpen(false);
                }}
              />
            </div>
            <p className="mt-2 text-[11px] text-gray-500">
              可用中文（台積電、輝達）、代碼（2330、AAPL）、英文（NVIDIA）搜尋。
              上下鍵選擇、Enter 確認。
            </p>
          </div>
        </div>
      )}
    </>
  );
}
