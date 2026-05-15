// 交割日 / 交割提醒計算
//
// 台股：T+2 工作日交割（成交日後第 2 個工作日 09:00 前帳上要有錢）
// 美股：T+1 工作日（SEC 2024/05/28 起改 T+1）
//
// 注意：本邏輯**只跳過週六日，不處理台灣 / 美國國定假日**。
// 對個人本機用途夠用；如要做產品級可整合 holiday API。

import type { Transaction, TradeKind } from "./types";
import { detectRegion } from "./symbols";

/** 該標的的交割天數 */
export function settlementDaysFor(symbol: string): number {
  // 台股 T+2、美股 T+1
  return detectRegion(symbol) === "TW" ? 2 : 1;
}

/** 加 N 個工作日（跳過六日），回傳 YYYY-MM-DD */
export function addBusinessDays(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  let added = 0;
  while (added < n) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay(); // 0=日 6=六
    if (dow !== 0 && dow !== 6) added++;
  }
  return d.toISOString().slice(0, 10);
}

/** 主入口：交易資料 + 標的 → 交割日 */
export function computeSettlementDate(
  symbol: string,
  tradeDate: string,
): string {
  return addBusinessDays(tradeDate, settlementDaysFor(symbol));
}

/** 計算「離交割日還幾天」（正：未來，0：今天，負：過期） */
export function daysUntilSettlement(settlementDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const s = new Date(`${settlementDate}T00:00:00`);
  return Math.round((s.getTime() - today.getTime()) / 86_400_000);
}

/** 交易方式中文 */
export function tradeKindLabel(kind?: TradeKind): string {
  if (kind === "margin") return "融資";
  if (kind === "short") return "融券";
  return "現股";
}

/** 估算交割現金影響（買 = 出，賣 = 入）*/
export function settlementCashImpact(tx: Transaction): {
  amount: number;
  direction: "out" | "in";
} {
  const gross = tx.price * tx.shares;
  // 融資買進只需自備 4 成；融券賣出需保證金 9 成
  let factor = 1;
  if (tx.type === "buy" && tx.kind === "margin") factor = 0.4;
  if (tx.type === "sell" && tx.kind === "short") factor = 0.9;
  const cash = gross * factor;
  const direction: "out" | "in" = tx.type === "buy" ? "out" : "in";
  return { amount: cash, direction };
}

/**
 * 取出「需要關注交割」的交易
 *  - 規則：交割日 >= 今天（沒過）且 settled !== true
 *  - 同時保留「今天」與未來 3 個工作日內的
 */
export function pendingSettlements(transactions: Transaction[]): Transaction[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return transactions
    .map((tx) => {
      // 對舊資料（沒 settlementDate）即時補算
      const settlementDate =
        tx.settlementDate ?? computeSettlementDate(tx.symbol, tx.date);
      return { ...tx, settlementDate };
    })
    .filter((tx) => {
      if (tx.settled) return false;
      const days = daysUntilSettlement(tx.settlementDate!);
      // 顯示：今天 0 天到 +3 天內的（已過交割超過 1 天就視為自動完成）
      return days >= -1 && days <= 5;
    })
    .sort((a, b) =>
      a.settlementDate!.localeCompare(b.settlementDate!) ||
      a.createdAt - b.createdAt,
    );
}
