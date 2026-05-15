// 融資 / 融券 維持率試算
//
// 台股規則：
//   融資：投資人自備 4 成（marginSelfRatio = 0.4），券商借 6 成
//     維持率 = 個股市值 / 融資金額 × 100%
//     130% 以下：通知補繳保證金（「追繳」）
//     120% 以下：強制斷頭
//
//   融券：賣出時券商收 9 成保證金（shortMarginRatio = 0.9）
//     維持率 = (賣出價款 + 保證金) / 個股市值 × 100%
//     130% 以下：追繳
//     120% 以下：強制買回

export const TW_MAINTENANCE_THRESHOLDS = {
  warn: 130, // < 130% 需注意（券商會通知補繳）
  margin_call: 130, // 同上
  liquidation: 120, // < 120% 斷頭
};

export type MaintenanceResult = {
  /** 目前維持率（%）*/
  ratio: number;
  /** 風險狀態 */
  status: "safe" | "warn" | "danger";
  /** 一句話描述 */
  label: string;
  /** 距離斷頭的價格緩衝 */
  liquidationPrice?: number;
};

/**
 * 融資：算維持率
 *  marketValue = currentPrice × shares
 *  borrowedAmount = avgCost × shares × (1 - selfRatio)
 *  ratio = marketValue / borrowedAmount × 100
 */
export function computeMarginMaintenance(
  shares: number,
  avgCost: number,
  currentPrice: number,
  selfRatio = 0.4,
): MaintenanceResult {
  const marketValue = currentPrice * shares;
  const borrowedAmount = avgCost * shares * (1 - selfRatio);
  const ratio = borrowedAmount > 0 ? (marketValue / borrowedAmount) * 100 : 0;

  let status: MaintenanceResult["status"] = "safe";
  let label = "維持率充裕";
  if (ratio < TW_MAINTENANCE_THRESHOLDS.liquidation) {
    status = "danger";
    label = "已低於斷頭線 120%";
  } else if (ratio < TW_MAINTENANCE_THRESHOLDS.warn) {
    status = "warn";
    label = "低於 130%，可能被通知補繳";
  }

  // 維持率 120% 對應的觸發價：
  //   (price × shares) / borrowed = 1.2
  //   price = 1.2 × borrowed / shares
  const liquidationPrice =
    shares > 0
      ? (TW_MAINTENANCE_THRESHOLDS.liquidation * borrowedAmount) / 100 / shares
      : undefined;

  return { ratio, status, label, liquidationPrice };
}

/**
 * 融券：算維持率
 *  marketValue = currentPrice × shares（要買回的成本）
 *  collateral = (avgCost + margin) × shares
 *  ratio = collateral / marketValue × 100
 */
export function computeShortMaintenance(
  shares: number,
  avgCost: number,
  currentPrice: number,
  marginRatio = 0.9,
): MaintenanceResult {
  const marketValue = currentPrice * shares;
  const collateral = avgCost * shares * (1 + marginRatio);
  const ratio = marketValue > 0 ? (collateral / marketValue) * 100 : 0;

  let status: MaintenanceResult["status"] = "safe";
  let label = "維持率充裕";
  if (ratio < TW_MAINTENANCE_THRESHOLDS.liquidation) {
    status = "danger";
    label = "已低於斷頭線 120%";
  } else if (ratio < TW_MAINTENANCE_THRESHOLDS.warn) {
    status = "warn";
    label = "低於 130%，可能被通知補保證金";
  }

  // 融券斷頭價：當 collateral / (price × shares) = 1.2
  //   price = collateral / (1.2 × shares)
  const liquidationPrice =
    shares > 0
      ? collateral / ((TW_MAINTENANCE_THRESHOLDS.liquidation / 100) * shares)
      : undefined;

  return { ratio, status, label, liquidationPrice };
}
