"use client";

// Lite 版專屬 — 顯示「完整內容請去 Pro 版」的紫色 CTA box
//
// 用法：
//   <LiteUpgradeHint label="完整英文翻譯新聞" hiddenCount={5} />
//
// 在 Lite 的 wrap-up / sector 區塊「砍掉的尾巴」處呼叫此元件，
// 讓使用者清楚「下面還有更多 → 去 Pro 版」。

import { ArrowRight, Lock } from "lucide-react";

const PRO_URL =
  process.env.NEXT_PUBLIC_PRO_URL ?? "https://stockmate-ai-ashen.vercel.app";

type Props = {
  /** 在 CTA 上顯示的功能名稱（例如：「完整英文翻譯新聞」、「Top 2-5 領漲族群催化劑」）*/
  label: string;
  /** 還有幾條被砍掉（可選，顯示在 CTA 上增強說服力）*/
  hiddenCount?: number;
};

export function LiteUpgradeHint({ label, hiddenCount }: Props) {
  return (
    <a
      href={PRO_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 inline-flex items-center gap-1 rounded-md border border-violet-300 bg-gradient-to-r from-violet-50 to-fuchsia-50 px-2.5 py-1.5 text-[11px] font-semibold text-violet-800 transition hover:from-violet-100 hover:to-fuchsia-100"
      title="去 Pro 版看完整內容"
    >
      <Lock size={10} className="text-violet-600" />
      <span>
        {label}
        {hiddenCount && hiddenCount > 0 ? (
          <span className="ml-1 text-[10px] text-violet-600">
            （還有 {hiddenCount} 條）
          </span>
        ) : null}
      </span>
      <span className="ml-1 inline-flex items-center gap-0.5 text-violet-700">
        → Pro 版
        <ArrowRight size={10} />
      </span>
    </a>
  );
}
