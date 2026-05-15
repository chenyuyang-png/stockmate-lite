"use client";

// 註冊同意條款 — 用戶首次使用 AI 工具時跳出，要求明確閱讀 + 勾選同意
//
// 法律目的：
//   留下「用戶確實在使用本工具前看過免責聲明、勾選同意」的證據
//   即使是 localStorage 也能在「用戶聲稱不知情」時提供基本舉證
//
// UX：
//   - 模態彈窗，覆蓋全頁
//   - 必須勾選「我已閱讀並同意」才能點「我同意，繼續使用」
//   - 同意後存 localStorage（含 timestamp + version）
//   - 之後不再彈出（直到 version bump）

import { useState, useEffect } from "react";
import { Shield, CheckCircle2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { BRAND } from "@/lib/brand";

const STORAGE_KEY = "disclaimer-accepted";
const CURRENT_VERSION = "1.1"; // bump 後已同意的用戶會看到新版一次（內容已從 5 點精簡為 4 點）

type AcceptedRecord = {
  version: string;
  acceptedAt: number; // ms
};

function hasAccepted(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const r = JSON.parse(raw) as AcceptedRecord;
    return r.version === CURRENT_VERSION;
  } catch {
    return false;
  }
}

function markAccepted(): void {
  if (typeof window === "undefined") return;
  try {
    const r: AcceptedRecord = {
      version: CURRENT_VERSION,
      acceptedAt: Date.now(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(r));
  } catch {
    // ignore
  }
}

export function DisclaimerModal() {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // 第一次掛載時檢查；未同意才跳
    if (!hasAccepted()) setOpen(true);
  }, []);

  if (!open) return null;

  function handleAccept() {
    markAccepted();
    setOpen(false);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center gap-2 border-b border-gray-200 bg-amber-50 px-5 py-3">
          <div className="rounded-lg bg-amber-600 p-1.5 text-white">
            <Shield size={16} />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-gray-900">
              使用前請閱讀 — 服務性質聲明
            </h2>
            <p className="text-[11px] text-gray-600">
              法律合規必要程序 · 一次性確認
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-3 px-5 py-4 text-sm leading-relaxed text-gray-800">
          <p className="text-xs leading-relaxed text-gray-600">
            歡迎使用 <strong>{BRAND.name}</strong>。為符合台灣《證券投資信託及顧問法》規範，
            請務必確認以下事項後再使用 AI 功能：
          </p>

          <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-amber-900">
              <AlertTriangle size={13} /> 四大重點
            </p>
            <ul className="space-y-1.5 text-[12px] text-gray-800">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 font-bold text-amber-700">1.</span>
                <span>
                  本服務為<strong className="text-red-700">「純資料整理工具」</strong> —
                  整理公開市場數據、新聞、財報、技術指標，<strong>不提供個股推薦、不提供投資建議</strong>。
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 font-bold text-amber-700">2.</span>
                <span>
                  所有 AI 輸出（個股報告、技術指標、PE 試算、集中度健檢等）
                  <strong>僅為公開資料整理結果，不構成任何投資建議</strong>。
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 font-bold text-amber-700">3.</span>
                <span>
                  任何買賣、加減碼、進出場決策<strong>由使用者自行判斷與承擔風險</strong>。
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 font-bold text-amber-700">4.</span>
                <span>
                  報價可能有 15 分鐘延遲、AI 整理之資料可能有遺漏或錯誤。
                </span>
              </li>
            </ul>
          </div>

          <div className="rounded-md border-l-4 border-red-500 bg-red-50 px-3 py-2 text-[12px] font-medium text-red-900">
            ⚠️ <strong>投資有風險，自行負擔。</strong>本網站僅供個人記錄與分析參考，
            不構成任何購買建議。
          </div>

          <p className="text-[11px] leading-relaxed text-gray-500">
            完整法律聲明請見{" "}
            <Link
              href="/pricing#disclaimer"
              className="text-blue-600 underline hover:text-blue-800"
              target="_blank"
            >
              訂閱頁底部之完整聲明
            </Link>
            。
          </p>

          {/* Consent checkbox */}
          <label className="flex cursor-pointer items-start gap-2 rounded-lg border-2 border-gray-300 bg-gray-50 px-3 py-2.5 transition hover:border-blue-400 hover:bg-blue-50/50">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-0.5 h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="flex-1 text-[13px] leading-snug text-gray-900">
              我已閱讀並理解上述五大重點，<strong>同意</strong>本服務為資料整理工具、
              非投資顧問服務，所有投資決策由我自行判斷並承擔風險。
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3">
          <Link
            href="/"
            className="text-xs text-gray-500 hover:text-gray-700 hover:underline"
          >
            不同意 · 返回首頁
          </Link>
          <button
            onClick={handleAccept}
            disabled={!checked}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-red-600 to-orange-600 px-4 py-2 text-sm font-bold text-white shadow-md transition hover:shadow-lg hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            <CheckCircle2 size={14} />
            我同意，繼續使用
          </button>
        </div>
      </div>
    </div>
  );
}
