"use client";

// ShowcaseContext — 示範模式
// 包在 <ShowcaseProvider> 內的所有 PaywallBlur 都會自動「假裝已訂閱」顯示完整內容
// 用於 /showcase 頁面：讓潛在客戶看到 Pro 完整功能

import { createContext, useContext } from "react";

export const ShowcaseContext = createContext<boolean>(false);

export function useShowcase(): boolean {
  return useContext(ShowcaseContext);
}

export function ShowcaseProvider({ children }: { children: React.ReactNode }) {
  return (
    <ShowcaseContext.Provider value={true}>{children}</ShowcaseContext.Provider>
  );
}
