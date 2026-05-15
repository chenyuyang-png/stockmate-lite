// 公開版 — 不預載任何個人持股，使用者自行加入
// 自選股則預載一些「人氣標的」作為入門範例（使用者可隨時刪除）

import type { Holding, WatchlistItem } from "./types";

export const SEED_HOLDINGS: Omit<Holding, "id" | "addedAt">[] = [
  // 不預載任何持股 — 公開版讓使用者自己建立部位
];

export const SEED_WATCHLIST: Omit<WatchlistItem, "addedAt">[] = [
  // 台股核心
  { symbol: "2330.TW", group: "核心" },
  { symbol: "2454.TW", group: "核心" },
  { symbol: "2317.TW", group: "核心" },
  { symbol: "0050.TW", group: "ETF" },
  { symbol: "00878.TW", group: "ETF" },
  { symbol: "00929.TW", group: "ETF" },
  // 美股 Magnificent 7
  { symbol: "AAPL", group: "Mag7" },
  { symbol: "MSFT", group: "Mag7" },
  { symbol: "GOOGL", group: "Mag7" },
  { symbol: "AMZN", group: "Mag7" },
  { symbol: "META", group: "Mag7" },
  { symbol: "TSLA", group: "Mag7" },
  // AI / 半導體
  { symbol: "NVDA", group: "AI半導體" },
  { symbol: "AVGO", group: "AI半導體" },
  { symbol: "TSM", group: "AI半導體" },
];
