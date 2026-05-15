// Lite 版 — PaywallBlur shim
//
// stockmate-pro 用 PaywallBlur 包某些「Pro 才看得到」的元件。Lite 版整站
// 完全免費、沒有 paywall，這個 shim 就是 透明 wrapper：所有 children 直接渲染。
//
// 保留 shim 是為了避免大量檔案 import 失敗，sync script 不用全部去刪 import。

import type { ReactNode } from "react";

type Props = {
  /** 原 pro 版的 tier 要求 — Lite 版忽略 */
  requireTier?: string;
  featureLabel?: string;
  hint?: string;
  intensity?: "light" | "medium" | "strong";
  children: ReactNode;
};

export function PaywallBlur({ children }: Props) {
  return <>{children}</>;
}

/** Inline 版 — 同樣 transparent */
export function PaywallInline({
  children,
}: {
  requireTier?: string;
  children: ReactNode;
  placeholder?: string;
}) {
  return <>{children}</>;
}
