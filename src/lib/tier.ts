// 訂閱方案 (tier) 設定 + 配額
// 從 Clerk publicMetadata.tier 讀取（綠界 notify 寫入）
// 月票模式：tier 有效期到 publicMetadata.tierExpiresAt

export type Tier = "free" | "pro" | "premium";

export type TierConfig = {
  /** 顯示名稱 */
  label: string;
  /** 月費（TWD） */
  priceTwd: number;
  /** AI 快速統整個股線上公開資料（每月次數）*/
  aiStockPerMonth: number;
  /** 題材深度解讀（每月次數） */
  aiTopicPerMonth: number;
  /** AI 持股健檢（每月次數，改為月配以利成本控管）*/
  aiPortfolioPerMonth: number;
  /** AI K 線多空判讀（每日次數，保留日配以維持回訪習慣）*/
  aiKlinePerDay: number;
  /**
   * Free tier 專用：AI K 線判讀每月次數
   * - 為什麼有這個欄位：Pro 用 perDay 配額（高頻），但 free 給 perDay 沒意義（每天 1 次太多）
   * - 給 free 每月 1 次體驗，由 kline-verdict route 特殊處理
   * - 其他 tier（pro / premium）可省略此欄位、用 aiKlinePerDay
   */
  aiKlineFreeMonthly?: number;
  /** AI 持股集中度健檢（每月次數，Pro 專屬）*/
  aiRebalancePerMonth: number;
  /** 自選股上限 */
  watchlistLimit: number;
  /** 持股上限 */
  holdingsLimit: number;
  /** 價格警示上限 */
  alertsLimit: number;
  /** 加碼計畫上限 */
  planningLimit: number;
  /** 是否能用 web search */
  webSearch: boolean;
  /** 是否能用 Opus（否 = 用 Sonnet） */
  opusModel: boolean;
  /** 是否能 CSV / Excel 匯出 */
  exportEnabled: boolean;
  /** 是否能雲端同步（多裝置） */
  cloudSync: boolean;
};

// 配額設計：以「100% 用滿仍維持 45-70% 毛利率」為原則
// 實際用戶平均用量 ~25%，cache 命中 ~60%，realistic 毛利率 ~86-93%
export const TIERS: Record<Tier, TierConfig> = {
  free: {
    label: "免費版",
    priceTwd: 0,
    // Freemium funnel 升級：給足夠的體驗讓使用者上鉤
    // 全部用滿單一用戶月成本 ~NT$ 6.4 — 1000 用戶滿載也只 NT$ 6,400
    aiStockPerMonth: 3, // 1 → 3（過去 1 次太少、卡關就跑）
    aiTopicPerMonth: 1, // 0 → 1（給體驗 AI 題材整理長什麼樣）
    aiPortfolioPerMonth: 1, // 0 → 1（把持股丟進去有 sticky 效果）
    // K 線判讀：原本是 perDay，但 free 給「每月 1 次」更合理
    // 由 kline-verdict route 特別處理（看 perMonth field if perDay = 0）
    aiKlinePerDay: 0,
    aiKlineFreeMonthly: 1, // 額外欄位：free 每月 1 次（其他 tier 用 perDay）
    aiRebalancePerMonth: 0, // 再平衡 keep locked（Pro 才有）
    watchlistLimit: 30, // 10 → 30（散戶平均自選 15-20 檔）
    holdingsLimit: 10, // 5 → 10（散戶平均 5-8 檔）
    alertsLimit: 10, // 5 → 10（用過警示的最 sticky）
    planningLimit: 8, // 3 → 8（鼓勵長期追蹤）
    webSearch: false,
    opusModel: false, // 用 Haiku
    exportEnabled: false,
    cloudSync: false,
  },
  pro: {
    label: "Pro 訂閱",
    priceTwd: 399, // 方案 D：399 — 對標財報狗 199 略 premium、毛利仍 70-92%
    // 配額升級邏輯：web_search 從 3 → 1、output 從 6000 → 4500、portfolio 不搜尋
    // 單次成本壓到 NT$ 1.0-1.4，配額放大讓使用者更爽
    aiStockPerMonth: 25, // AI 個股線上資料統整（用滿 NT$ 35）
    aiTopicPerMonth: 20, // 題材深度（用滿 NT$ 20）
    aiPortfolioPerMonth: 20, // 持股健檢（用滿 NT$ 20）
    aiKlinePerDay: 2, // 從 Premium 移下來，2/天 = 60/月（用滿 NT$ 12）
    aiRebalancePerMonth: 3, // 從 Premium 移下來（用滿 NT$ 4）
    watchlistLimit: 9999,
    holdingsLimit: 9999,
    alertsLimit: 9999,
    planningLimit: 9999,
    webSearch: true,
    opusModel: false, // 用 Sonnet 4.6
    exportEnabled: true,
    cloudSync: true,
  },
  // legacy：Premium 已停售（從 pricing page 隱藏），但保留 tier 以維持現有付費用戶的權益
  // 任何 publicMetadata.tier === "premium" 的舊用戶會繼續使用此設定直到到期
  premium: {
    label: "Premium 訂閱（停售）",
    priceTwd: 699,
    aiStockPerMonth: 70,
    aiTopicPerMonth: 40,
    aiPortfolioPerMonth: 40,
    aiKlinePerDay: 3,
    aiRebalancePerMonth: 5,
    watchlistLimit: 9999,
    holdingsLimit: 9999,
    alertsLimit: 9999,
    planningLimit: 9999,
    webSearch: true,
    opusModel: false,
    exportEnabled: true,
    cloudSync: true,
  },
};

/**
 * 從 Clerk publicMetadata 讀取 tier
 * 月票模式：若 tierExpiresAt < now 則自動降回 free
 */
export function getTierFromMetadata(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: any,
): Tier {
  const t = metadata?.tier;
  if (t !== "pro" && t !== "premium") return "free";

  // 檢查到期日
  const expiresAt = metadata?.tierExpiresAt;
  if (typeof expiresAt === "number" && Date.now() > expiresAt) {
    return "free"; // 過期
  }
  if (typeof expiresAt === "string") {
    const t2 = new Date(expiresAt).getTime();
    if (Number.isFinite(t2) && Date.now() > t2) return "free";
  }
  return t;
}

/**
 * 取得 tier 的到期日（給帳戶頁顯示）
 */
export function getTierExpiry(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: any,
): Date | null {
  const expiresAt = metadata?.tierExpiresAt;
  if (typeof expiresAt === "number") return new Date(expiresAt);
  if (typeof expiresAt === "string") {
    const d = new Date(expiresAt);
    if (Number.isFinite(d.getTime())) return d;
  }
  return null;
}

/** 該 tier 用哪個 Claude model */
// 2026/5 全面升級到最新：
// - Premium → Opus 4.7（adaptive thinking、頂級智能）
// - Pro     → Sonnet 4.6（最新 Sonnet、性價比平衡）
// - Free    → Sonnet 4.6（從 Haiku 升級、提升 free funnel 體驗）
export function modelForTier(tier: Tier): string {
  if (tier === "premium") return "claude-opus-4-7";
  if (tier === "pro") return "claude-sonnet-4-6";
  return "claude-sonnet-4-6"; // free tier 從 haiku-4-5 升級
}

// ─── 訂閱時長：月 / 半年 / 年（適用於 Pro & Premium）─────
// 半年折 20%（vs 月費 × 6）；年折 28%（vs 月費 × 12）
export type Duration = "month" | "halfYear" | "year";

export type DurationConfig = {
  days: number;
  priceTwd: number;
  label: string;
  perMonth: number;
  saveLabel?: string;
};

// 方案 D：Pro 月費 399；半年 2,199（366/月，省 8%）；年 3,890（324/月，省 19%）
// 對標：財報狗 199 / 富果 419 / CMoney 588 / 玩股 599+
// 399 略 premium 但有 AI + 多市場 + 5 大區塊財務分析，性價比領先
export const PRO_DURATIONS: Record<Duration, DurationConfig> = {
  month: {
    days: 30,
    priceTwd: 399,
    label: "月票",
    perMonth: 399,
  },
  halfYear: {
    days: 180,
    priceTwd: 2199,
    label: "半年票",
    perMonth: Math.round(2199 / 6),
    saveLabel: "省 8%",
  },
  year: {
    days: 365,
    priceTwd: 3890,
    label: "年票",
    perMonth: Math.round(3890 / 12),
    saveLabel: "省 19%（最划算）",
  },
};

// 方案 B：Premium 月費 699；半年 3,799（633/月，省 9%）；年 6,999（583/月，省 17%）
export const PREMIUM_DURATIONS: Record<Duration, DurationConfig> = {
  month: {
    days: 30,
    priceTwd: 699,
    label: "月票",
    perMonth: 699,
  },
  halfYear: {
    days: 180,
    priceTwd: 3799,
    label: "半年票",
    perMonth: Math.round(3799 / 6),
    saveLabel: "省 9%",
  },
  year: {
    days: 365,
    priceTwd: 6999,
    label: "年票",
    perMonth: Math.round(6999 / 12),
    saveLabel: "省 17%（最划算）",
  },
};

/** 依 tier 取對應 duration 表 */
export function durationsForTier(tier: Tier): Record<Duration, DurationConfig> | null {
  if (tier === "pro") return PRO_DURATIONS;
  if (tier === "premium") return PREMIUM_DURATIONS;
  return null;
}

// ─── 加值次數包（Top-up packs）─────────────────────────────
// 用戶月配額用完還想用？可單獨買「次數包」，credits 永不過期
// feature key 對應 quota.ts 裡的 feature 名稱
export type TopupFeature =
  | "ai-stock"
  | "ai-topic"
  | "ai-portfolio"
  | "ai-kline"
  | "ai-rebalance";

export type TopupProduct = {
  /** 產品代號（給 ECPay CustomField3 用）*/
  code: string;
  /** 對應的 feature key（決定加哪桶 credits）*/
  feature: TopupFeature;
  /** 顯示名稱 */
  label: string;
  /** 加幾次 */
  credits: number;
  /** 售價 TWD */
  priceTwd: number;
  /** 預估單位成本 NT$（用來算毛利顯示給內部）*/
  estCostTwd: number;
  /** 適合誰 */
  hint: string;
};

export const TOPUP_PRODUCTS: Record<string, TopupProduct> = {
  // AI 個股線上資料統整：1 次 NT$ 2.62 成本 → 賣 1 次 NT$ 5
  "stock-10": {
    code: "stock-10",
    feature: "ai-stock",
    label: "AI 個股線上資料統整 × 10",
    credits: 10,
    priceTwd: 49,
    estCostTwd: 26,
    hint: "再多挖 10 檔潛力股",
  },
  "stock-30": {
    code: "stock-30",
    feature: "ai-stock",
    label: "AI 個股線上資料統整 × 30",
    credits: 30,
    priceTwd: 129,
    estCostTwd: 79,
    hint: "整月隨便挖（最划算）",
  },
  // 題材：1 次 NT$ 2 成本 → 賣 1 次 NT$ 4
  "topic-10": {
    code: "topic-10",
    feature: "ai-topic",
    label: "題材深度解讀 × 10",
    credits: 10,
    priceTwd: 39,
    estCostTwd: 20,
    hint: "盯緊 10 大產業熱度",
  },
  // 持股健檢：1 次 NT$ 1.46 → 賣 1 次 NT$ 3.5
  "portfolio-15": {
    code: "portfolio-15",
    feature: "ai-portfolio",
    label: "持股 AI 健檢 × 15",
    credits: 15,
    priceTwd: 49,
    estCostTwd: 22,
    hint: "波段調倉前做幾次測試",
  },
  // K 線判讀：1 次 NT$ 0.11 → 賣 1 次 NT$ 0.5
  "kline-100": {
    code: "kline-100",
    feature: "ai-kline",
    label: "AI K 線判讀 × 100",
    credits: 100,
    priceTwd: 49,
    estCostTwd: 11,
    hint: "短線一天用得完 5 次的人",
  },
  // 再平衡：1 次 NT$ 1.08 → 賣 1 次 NT$ 12.5
  "rebalance-4": {
    code: "rebalance-4",
    feature: "ai-rebalance",
    label: "AI 再平衡 × 4",
    credits: 4,
    priceTwd: 49,
    estCostTwd: 4.3,
    hint: "月底加開幾次調倉檢視",
  },
};

/** 從 code 反查產品 */
export function getTopupProduct(code: string): TopupProduct | null {
  return TOPUP_PRODUCTS[code] ?? null;
}

/** 整理一份「方案比較」清單給 pricing page */
export const TIER_COMPARISON: {
  key: Tier;
  highlights: string[];
}[] = [
  {
    key: "free",
    highlights: [
      "🎁 免費可試 4 種 AI（不綁卡、不自動扣款）",
      "✨ AI 快速統整個股線上公開資料 3 次 / 月",
      "✨ AI 題材深度解讀 1 次 / 月",
      "✨ AI 持股健檢 1 次 / 月",
      "✨ AI K 線多空判讀 1 次 / 月",
      "✓ 大盤指數 / 全球期貨 / VIX",
      "✓ 16 大題材免登入瀏覽",
      "✓ 基本個股頁（K 線 + 財報 + 籌碼）",
      "✓ 自選股 30 檔 / 持股 10 檔 / 警示 10 個",
      "✗ AI 整理每日盤後 10 大事件（鎖）",
      "✗ AI 持股集中度健檢（鎖）",
      "✗ AI Web 搜尋催化劑（鎖）",
    ],
  },
  {
    key: "pro",
    highlights: [
      "✨ 全部免費功能 +",
      "✓ 技術快照支撐 / 壓力 + 進出場觀察區",
      "✓ AI 快速統整個股線上公開資料 25 次 / 月（Sonnet 4.6）",
      "✓ 題材深度解讀 20 次 / 月",
      "✓ 持股 AI 健檢 20 次 / 月",
      "🔥 AI K 線多空判讀 2 次 / 天 — 整理 RSI / MACD / KD / 均線狀態",
      "🔥 AI 持股集中度健檢 3 次 / 月 — 完整描述配置 vs 業界分散標準",
      "✓ AI Web 搜尋（即時催化劑 + 同業比較）",
      "✓ 三情境 Bull / Base / Bear 完整報告",
      "✓ 自選 / 持股 / 警示 無上限",
      "✓ 雲端同步（跨裝置）+ CSV 匯出",
    ],
  },
];
