// 報價資料（由 API 回傳）
export type Quote = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  marketCap?: number;
  currency?: string;
  /** Yahoo marketState 值：REGULAR / CLOSED / PRE / POST / PREPRE 等 */
  marketState?: string;
  /** 報價最後成交時間（ms epoch） */
  marketTime?: number;
  /** 盤前 / 盤後 / 延長交易 變動（讓使用者看到「美股已收盤但盤後仍在動」）*/
  preMarketPrice?: number;
  preMarketChange?: number;
  preMarketChangePercent?: number;
  postMarketPrice?: number;
  postMarketChange?: number;
  postMarketChangePercent?: number;
  // 基本財務指標（之後可以擴充）
  eps?: number;
  pe?: number;
  dividendYield?: number;
  // Yahoo Finance 自動分類
  sector?: string;
  industry?: string;
};

// 歷史 K 線資料
export type OHLC = {
  time: string; // YYYY-MM-DD or unix timestamp string
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

// 交易方式（影響交割流程）
//  - cash：現股
//  - margin：融資（買時 4 成自備、賣時 6 成沖回）
//  - short：融券（賣時保證金）
export type TradeKind = "cash" | "margin" | "short";

// 交易紀錄
export type Transaction = {
  id: string;
  symbol: string;
  type: "buy" | "sell";
  date: string; // YYYY-MM-DD 成交日
  shares: number;
  price: number;
  fee?: number;
  tax?: number;
  /** 交易方式（預設 cash 現股，舊資料沒這欄會 fallback）*/
  kind?: TradeKind;
  /** 交割日 YYYY-MM-DD（成交日 + 2 工作日；台股美股都是 T+2 / T+1） */
  settlementDate?: string;
  /** 交割是否已完成（手動標記，或 settlementDate < today 自動算過）*/
  settled?: boolean;
  note?: string;
  createdAt: number;
};

// 每日資產組合快照（收盤凍結用）
export type DailySnapshot = {
  date: string; // YYYY-MM-DD (台灣時區)
  capturedAt: number; // ms timestamp
  byCurrency: Record<string, { market: number; cost: number; pnl: number }>;
  twdMarket: number;
  twdCost: number;
  twdPnL: number;
  twdPnLPercent: number;
  usdTwdRate: number;
  holdingsCount: number;
};

// 由交易紀錄計算的部位
export type ComputedPosition = {
  symbol: string;
  currentShares: number;
  avgCost: number;
  totalCost: number;
  realizedPnL: number;
  trades: number; // 完整完成的交易（買進+賣出配對）
  wins: number; // 賺錢的完成交易
};

// 自選股
export type WatchlistItem = {
  symbol: string; // 已正規化的 Yahoo Finance 代碼
  group?: string; // 分組標籤（例如：核心、觀察、ETF）
  note?: string;
  addedAt: number;
};

// 持股
export type Holding = {
  id: string; // uuid
  symbol: string;
  shares: number;
  avgCost: number;
  currency?: string;
  note?: string;
  addedAt: number;
  // 「預期加碼」計畫（不影響實際持股，只做試算用）
  plannedShares?: number; // 預計加碼股數
  plannedPrice?: number; // 預計加碼價（不填則用目前股價試算）
  // 融資 / 融券資料（用於維持率試算 + 風險警示）
  /** 交易方式 — 影響維持率計算與顯示 */
  tradeKind?: "cash" | "margin" | "short";
  /** 融資自備款比例（預設 4 成 = 0.4，即融資 6 成）*/
  marginSelfRatio?: number;
  /** 融券保證金比例（預設 9 成 = 0.9）*/
  shortMarginRatio?: number;
};

// 損益計算結果
export type HoldingWithPnL = Holding & {
  quote?: Quote;
  marketValue: number;
  costBasis: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
};
