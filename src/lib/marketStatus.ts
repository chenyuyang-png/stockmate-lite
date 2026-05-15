// 美股市場狀態判讀 + 顯示資訊
//
// Yahoo marketState 字段可能值：
//   - REGULAR：盤中
//   - CLOSED：完全收盤
//   - PRE / PREPRE：盤前
//   - POST / POSTPOST：盤後
//   - PREPOST / POSTREGULAR / etc.（部分時段過渡）

export type MarketStatus = {
  state: "regular" | "pre" | "post" | "closed";
  label: string;
  /** Tailwind background + text color */
  badgeClass: string;
  /** Emoji（給徽章左側）*/
  emoji: string;
  /** 為什麼指數現在不動 */
  hint: string;
};

/**
 * 從 Yahoo 的 marketState 字串歸納成簡單狀態。
 * 預設認 US 市場（PRE / POST 對應美股盤前盤後）。
 */
export function classifyMarketState(state?: string): MarketStatus {
  const s = (state ?? "").toUpperCase();
  if (s === "REGULAR") {
    return {
      state: "regular",
      label: "美股盤中",
      badgeClass: "bg-green-100 text-green-800 ring-green-300",
      emoji: "🟢",
      hint: "美股交易中，指數每分鐘會跳動",
    };
  }
  if (s.startsWith("PRE")) {
    return {
      state: "pre",
      label: "美股盤前",
      badgeClass: "bg-amber-100 text-amber-800 ring-amber-300",
      emoji: "🟡",
      hint: "美股盤前交易中（流動性較低）",
    };
  }
  if (s.startsWith("POST")) {
    return {
      state: "post",
      label: "美股盤後",
      badgeClass: "bg-blue-100 text-blue-800 ring-blue-300",
      emoji: "🔵",
      hint: "美股盤後交易中（流動性較低）",
    };
  }
  // CLOSED 或其他未知狀態
  return {
    state: "closed",
    label: "美股已收盤",
    badgeClass: "bg-gray-200 text-gray-700 ring-gray-300",
    emoji: "⚪",
    hint: "美股已完全收盤，指數會停留在收盤價直到下一次開盤",
  };
}
