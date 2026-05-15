"use client";

import { useRef, useState } from "react";
import { Cloud, Download, Upload, X, Copy, Check } from "lucide-react";
import { STORAGE_KEYS } from "@/lib/storage";

type Backup = {
  app: "yoyo-stocks";
  version: 1;
  exportedAt: string;
  data: {
    watchlist: unknown;
    holdings: unknown;
    transactions: unknown;
    snapshots: unknown;
    seeded?: string;
  };
};

function readBackup(): Backup {
  const ls = window.localStorage;
  return {
    app: "yoyo-stocks",
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      watchlist: JSON.parse(ls.getItem(STORAGE_KEYS.WATCHLIST_KEY) ?? "[]"),
      holdings: JSON.parse(ls.getItem(STORAGE_KEYS.HOLDINGS_KEY) ?? "[]"),
      transactions: JSON.parse(ls.getItem(STORAGE_KEYS.TRANSACTIONS_KEY) ?? "[]"),
      snapshots: JSON.parse(ls.getItem(STORAGE_KEYS.SNAPSHOTS_KEY) ?? "[]"),
      seeded: ls.getItem(STORAGE_KEYS.SEEDED_KEY) ?? undefined,
    },
  };
}

function writeBackup(b: Backup) {
  const ls = window.localStorage;
  ls.setItem(STORAGE_KEYS.WATCHLIST_KEY, JSON.stringify(b.data.watchlist ?? []));
  ls.setItem(STORAGE_KEYS.HOLDINGS_KEY, JSON.stringify(b.data.holdings ?? []));
  ls.setItem(STORAGE_KEYS.TRANSACTIONS_KEY, JSON.stringify(b.data.transactions ?? []));
  ls.setItem(STORAGE_KEYS.SNAPSHOTS_KEY, JSON.stringify(b.data.snapshots ?? []));
  ls.setItem(STORAGE_KEYS.SEEDED_KEY, b.data.seeded ?? "1"); // 防止匯入後又被 seed 覆蓋
}

export function BackupDialog() {
  const [open, setOpen] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<Backup | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleExportFile() {
    const backup = readBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `yoyo-stocks-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function handleCopyJson() {
    const text = JSON.stringify(readBackup(), null, 2);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        validateAndPreview(parsed);
      } catch (err) {
        setImportError(err instanceof Error ? err.message : "JSON 格式錯誤");
      }
    };
    reader.readAsText(file);
  }

  function handleParseText() {
    try {
      const parsed = JSON.parse(importText);
      validateAndPreview(parsed);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "JSON 格式錯誤");
    }
  }

  function validateAndPreview(parsed: unknown) {
    if (
      !parsed ||
      typeof parsed !== "object" ||
      (parsed as Backup).app !== "yoyo-stocks"
    ) {
      setImportError("這不是 yoyo-stocks 的備份檔");
      setImportPreview(null);
      return;
    }
    setImportError(null);
    setImportPreview(parsed as Backup);
  }

  function confirmImport() {
    if (!importPreview) return;
    writeBackup(importPreview);
    alert("匯入完成！頁面將重新整理。");
    location.reload();
  }

  const current = typeof window !== "undefined" ? readBackup() : null;
  const summarize = (b: Backup | null) =>
    b
      ? {
          holdings: Array.isArray(b.data.holdings) ? b.data.holdings.length : 0,
          watchlist: Array.isArray(b.data.watchlist) ? b.data.watchlist.length : 0,
          transactions: Array.isArray(b.data.transactions) ? b.data.transactions.length : 0,
          snapshots: Array.isArray(b.data.snapshots) ? b.data.snapshots.length : 0,
        }
      : { holdings: 0, watchlist: 0, transactions: 0, snapshots: 0 };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-md border border-gray-300 bg-gray-200 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-200"
        title="備份 / 還原（手機同步用）"
      >
        <Cloud size={12} /> 備份 / 同步
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-lg border border-gray-200 bg-gray-100 p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">備份 / 還原資料</h3>
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={16} />
              </button>
            </div>

            <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 p-3 text-xs text-gray-500">
              <div className="mb-1 font-semibold text-gray-600">📦 目前資料量</div>
              {(() => {
                const s = summarize(current);
                return (
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
                    <span>持股 {s.holdings} 筆</span>
                    <span>自選 {s.watchlist} 檔</span>
                    <span>交易 {s.transactions} 筆</span>
                    <span>快照 {s.snapshots} 天</span>
                  </div>
                );
              })()}
            </div>

            {/* 匯出 */}
            <div className="mt-3 space-y-2">
              <div className="text-xs font-semibold uppercase text-gray-500">📤 匯出（電腦 → 手機）</div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleExportFile}
                  className="flex items-center gap-1 rounded-md bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500"
                >
                  <Download size={12} /> 下載 JSON 檔
                </button>
                <button
                  onClick={() => setShowJson(!showJson)}
                  className="flex items-center gap-1 rounded-md border border-gray-300 bg-gray-200 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-300"
                >
                  {showJson ? "隱藏" : "顯示"} JSON 文字
                </button>
                {showJson && (
                  <button
                    onClick={handleCopyJson}
                    className="flex items-center gap-1 rounded-md border border-gray-300 bg-gray-200 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-300"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? "已複製" : "複製"}
                  </button>
                )}
              </div>
              {showJson && current && (
                <textarea
                  readOnly
                  value={JSON.stringify(current, null, 2)}
                  rows={6}
                  className="w-full rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5 font-mono text-[10px] text-gray-600"
                />
              )}
            </div>

            {/* 匯入 */}
            <div className="mt-4 space-y-2 border-t border-gray-200 pt-3">
              <div className="text-xs font-semibold uppercase text-gray-500">
                📥 匯入（手機 ← 電腦）
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1 rounded-md border border-gray-300 bg-gray-200 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-300"
                >
                  <Upload size={12} /> 選 JSON 檔
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={handleFile}
                />
              </div>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="或直接貼上 JSON 文字…"
                rows={4}
                className="w-full rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5 font-mono text-[10px] text-gray-800"
              />
              {importText.trim() && !importPreview && (
                <button
                  onClick={handleParseText}
                  className="rounded-md bg-zinc-700 px-3 py-1.5 text-xs text-white hover:bg-zinc-600"
                >
                  解析貼上的內容
                </button>
              )}
              {importError && (
                <div className="rounded border border-green-200 bg-green-50 px-2 py-1.5 text-xs text-green-500">
                  ❌ {importError}
                </div>
              )}
              {importPreview && (
                <div className="rounded border border-amber-300 bg-amber-50 px-2 py-1.5 text-xs text-amber-700">
                  <div className="mb-1 font-semibold">⚠️ 確認匯入（會覆蓋現有資料）</div>
                  {(() => {
                    const s = summarize(importPreview);
                    return (
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
                        <span>持股 {s.holdings} 筆</span>
                        <span>自選 {s.watchlist} 檔</span>
                        <span>交易 {s.transactions} 筆</span>
                        <span>快照 {s.snapshots} 天</span>
                      </div>
                    );
                  })()}
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={confirmImport}
                      className="rounded-md bg-amber-500 px-3 py-1 text-xs font-medium text-white hover:bg-amber-400"
                    >
                      確認覆蓋
                    </button>
                    <button
                      onClick={() => {
                        setImportPreview(null);
                        setImportText("");
                      }}
                      className="rounded-md px-3 py-1 text-xs text-amber-700 hover:text-amber-800"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 rounded-md border border-sky-200 bg-sky-50 p-3 text-[11px] text-sky-700">
              <div className="mb-1 font-semibold">📱 手機同步教學</div>
              <ol className="list-inside list-decimal space-y-0.5">
                <li>電腦這裡按「下載 JSON 檔」</li>
                <li>用 AirDrop / Line / Email 把檔案傳到手機</li>
                <li>手機開瀏覽器到 yoyo-stocks.vercel.app</li>
                <li>點「備份 / 同步」→「選 JSON 檔」→「確認覆蓋」</li>
              </ol>
              <div className="mt-1 text-sky-700/70">
                ⚡ 之後如果要真正即時雙向同步，再告訴我，我幫你接 Vercel KV 雲端 DB。
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
