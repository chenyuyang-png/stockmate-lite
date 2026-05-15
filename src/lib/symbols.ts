import { lookupTwSymbol, getTwStockName } from "./twStockNames";
import { getUsStockName } from "./usStockNames";

// 大盤指數定義 — Yahoo Finance ticker symbols
export type IndexDef = {
  symbol: string;
  label: string;
  region: "TW" | "US";
};

export const MARKET_INDICES: IndexDef[] = [
  { symbol: "^TWII", label: "台股加權", region: "TW" },
  { symbol: "^TWOII", label: "櫃買指數", region: "TW" },
  { symbol: "^GSPC", label: "S&P 500", region: "US" },
  { symbol: "^IXIC", label: "NASDAQ", region: "US" },
  { symbol: "^SOX", label: "費城半導體", region: "US" },
  { symbol: "^DJI", label: "道瓊", region: "US" },
];

// 偵測股票代碼地區（簡易版）
export function detectRegion(symbol: string): "TW" | "US" {
  return /\.(TW|TWO)$/i.test(symbol) ? "TW" : "US";
}

// 將使用者輸入正規化為 Yahoo Finance 格式
// "2330" -> "2330.TW" (查表)
// "6173" -> "6173.TWO" (查表，自動辨識上櫃)
// "AAPL" -> "AAPL"
// "2330.TW" -> "2330.TW"
export function normalizeSymbol(input: string): string {
  const s = input.trim().toUpperCase();
  if (!s) return s;
  // 已經有 . 後綴
  if (s.includes(".")) return s;
  // 純數字 → 查台股代碼表決定 .TW 或 .TWO
  if (/^\d{4,6}$/.test(s)) {
    const looked = lookupTwSymbol(s);
    if (looked) return looked;
    // 表內沒有，預設 .TW（個股若是上櫃會抓不到，使用者要手動加 .TWO）
    return `${s}.TW`;
  }
  // 其他當美股
  return s;
}

// 取得個股顯示名稱優先順序：中文 > 英文 > 代碼
export function displayName(symbol: string, fallback?: string): string {
  return getTwStockName(symbol) ?? getUsStockName(symbol) ?? fallback ?? symbol;
}
