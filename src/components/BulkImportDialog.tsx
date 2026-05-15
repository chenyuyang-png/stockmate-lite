"use client";

import { useState } from "react";
import { Upload, X } from "lucide-react";
import { normalizeSymbol } from "@/lib/symbols";

type Mode = "holdings" | "watchlist";

type Props = {
  mode: Mode;
  onImport: (rows: ImportRow[]) => void;
};

export type ImportRow = {
  symbol: string;
  shares?: number;
  avgCost?: number;
  group?: string;
  note?: string;
};

const examples = {
  holdings: `# 格式：股票代碼,股數,均價,備註(可選)
# 台股 4 碼會自動補 .TW；上櫃股請寫完整代碼如 6173.TWO
# 範例：
2327,1000,340.484
6173.TWO,1000,117.166
NVDA,5,205.08
NET,14,214.38
LITE,1,857.14
SNDK,2,1453.175`,
  watchlist: `# 格式：股票代碼,分組(可選)
# 範例：
2330,核心
2454,核心
0050,ETF
NVDA,AI
AAPL,科技`,
};

export function BulkImportDialog({ mode, onImport }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<ImportRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function parse(input: string) {
    const lines = input
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"));

    const rows: ImportRow[] = [];
    for (const line of lines) {
      const cells = line.split(/[,\t]/).map((c) => c.trim());
      const sym = normalizeSymbol(cells[0] ?? "");
      if (!sym) continue;

      if (mode === "holdings") {
        const shares = parseFloat(cells[1] ?? "");
        const avgCost = parseFloat(cells[2] ?? "");
        if (!Number.isFinite(shares) || !Number.isFinite(avgCost)) {
          throw new Error(`第 "${line}" 行：股數或均價無效`);
        }
        rows.push({ symbol: sym, shares, avgCost, note: cells[3] || undefined });
      } else {
        rows.push({ symbol: sym, group: cells[1] || undefined });
      }
    }
    return rows;
  }

  function handlePreview() {
    try {
      const rows = parse(text);
      setParsed(rows);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "解析錯誤");
      setParsed(null);
    }
  }

  function handleConfirm() {
    if (!parsed) return;
    onImport(parsed);
    setText("");
    setParsed(null);
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-md border border-gray-300 bg-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200"
      >
        <Upload size={14} /> 批次匯入
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-lg border border-gray-200 bg-gray-100 p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">
                批次匯入{mode === "holdings" ? "持股" : "自選股"}
              </h3>
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={16} />
              </button>
            </div>

            <p className="mt-2 text-[11px] text-gray-500">
              貼上 CSV 格式（每行一檔）。# 開頭的行會被忽略。
              {mode === "holdings"
                ? "已有的代碼會新增為新的一筆持股紀錄。"
                : "已存在的自選股會自動跳過。"}
            </p>

            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setParsed(null);
                setError(null);
              }}
              placeholder={examples[mode]}
              rows={10}
              className="mt-2 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-xs text-gray-800 placeholder:text-gray-300 focus:border-red-500 focus:outline-none"
            />

            {error && (
              <div className="mt-2 rounded border border-green-200 bg-green-50 px-2 py-1.5 text-xs text-green-500">
                {error}
              </div>
            )}

            {parsed && (
              <div className="mt-2 rounded border border-red-200 bg-red-100 px-2 py-1.5 text-xs text-red-500">
                ✓ 解析成功：共 {parsed.length} 筆。預覽下方按「確認匯入」。
                <div className="mt-1 max-h-32 overflow-auto text-gray-500">
                  {parsed.map((r, i) => (
                    <div key={i} className="font-mono">
                      {r.symbol}
                      {r.shares && ` · ${r.shares} 股`}
                      {r.avgCost && ` @ ${r.avgCost}`}
                      {r.group && ` [${r.group}]`}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
              >
                取消
              </button>
              {!parsed ? (
                <button
                  onClick={handlePreview}
                  disabled={!text.trim()}
                  className="rounded-md bg-zinc-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-600 disabled:opacity-50"
                >
                  預覽
                </button>
              ) : (
                <button
                  onClick={handleConfirm}
                  className="rounded-md bg-red-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500"
                >
                  確認匯入 ({parsed.length})
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
