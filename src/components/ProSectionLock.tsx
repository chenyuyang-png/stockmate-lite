"use client";

// 簡化包裝：用 PaywallBlur 把整個 section 鎖起來
// 直接用 <ProSectionLock> 包整個 section，free 看不到內容

import { PaywallBlur } from "./PaywallBlur";

type Props = {
  label: string;
  hint?: string;
  children: React.ReactNode;
};

export function ProSectionLock({ label, hint, children }: Props) {
  return (
    <PaywallBlur
      requireTier="pro"
      featureLabel={label}
      hint={hint}
      intensity="medium"
    >
      {children}
    </PaywallBlur>
  );
}
