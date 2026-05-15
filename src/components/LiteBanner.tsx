"use client";

// Lite 版頂部廣告條 — 提示「想看 AI 解讀？升 Pro 版」
// 每次 mount 都顯示，使用者點 X 後 sessionStorage 記住此頁不再顯示
//
// 設計：
//   - 紫色 gradient 配色（區隔 Lite 版的 red theme）
//   - 中央寫 hook 文案 + 右側「去 Pro 版 →」按鈕
//   - 右邊有 X 可關閉

import { useEffect, useState } from "react";
import { Sparkles, ArrowRight, X } from "lucide-react";

const DISMISS_KEY = "lite-banner-dismissed";
const PRO_URL =
  process.env.NEXT_PUBLIC_PRO_URL ?? "https://stockmate-ai-ashen.vercel.app";

export function LiteBanner() {
  const [hidden, setHidden] = useState(true); // SSR 時預設藏，避免閃爍

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const dismissed = sessionStorage.getItem(DISMISS_KEY) === "1";
      setHidden(dismissed);
    } catch {
      setHidden(false);
    }
  }, []);

  if (hidden) return null;

  function dismiss() {
    setHidden(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="border-b border-violet-300 bg-gradient-to-r from-violet-50 via-fuchsia-50 to-rose-50">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-1.5">
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] leading-snug text-gray-800">
          <Sparkles size={11} className="shrink-0 text-violet-700" />
          <span>
            <strong className="text-violet-800">Stockmate Lite</strong> · 100% 免費、不登入、純資料整理
          </span>
          <span className="hidden text-gray-500 sm:inline">
            · 想要 AI 解讀（個股 / 題材 / 持股健檢）？
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={PRO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md bg-violet-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-violet-700"
          >
            <Sparkles size={10} />
            去 Pro 版
            <ArrowRight size={10} />
          </a>
          <button
            onClick={dismiss}
            className="rounded p-1 text-gray-400 hover:bg-white hover:text-gray-700"
            aria-label="關閉"
            title="本次工作階段不再顯示"
          >
            <X size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
