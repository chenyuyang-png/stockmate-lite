// 從交易紀錄 FIFO 計算每檔個股的部位、已實現損益、勝率
// 假設每檔股票獨立計算，幣別由報價決定（不在這裡換匯）

import type { Transaction, ComputedPosition } from "./types";

export type RealizedTrade = {
  symbol: string;
  buyDate: string;
  sellDate: string;
  shares: number;
  buyPrice: number;
  sellPrice: number;
  pnl: number; // 含手續費稅
  fees: number;
  holdingDays: number;
};

export type PositionStats = {
  positions: ComputedPosition[];
  realized: RealizedTrade[];
  totals: {
    totalRealizedPnL: number;
    totalCompletedTrades: number;
    winningTrades: number;
    winRate: number; // 0-100
    avgWin: number;
    avgLoss: number;
  };
};

type Lot = {
  date: string;
  shares: number;
  price: number;
  feePerShare: number;
};

export function computePositions(transactions: Transaction[]): PositionStats {
  // 依股票分組
  const bySymbol = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    const arr = bySymbol.get(tx.symbol) ?? [];
    arr.push(tx);
    bySymbol.set(tx.symbol, arr);
  }

  const positions: ComputedPosition[] = [];
  const realizedAll: RealizedTrade[] = [];

  for (const [symbol, txs] of bySymbol) {
    // 依日期升冪
    txs.sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);

    const queue: Lot[] = [];
    let realized = 0;
    let trades = 0;
    let wins = 0;

    for (const tx of txs) {
      const feePerShare = ((tx.fee ?? 0) + (tx.tax ?? 0)) / Math.max(tx.shares, 1);
      if (tx.type === "buy") {
        queue.push({
          date: tx.date,
          shares: tx.shares,
          price: tx.price,
          feePerShare,
        });
      } else {
        // 賣出：FIFO 配對
        let remaining = tx.shares;
        while (remaining > 0 && queue.length > 0) {
          const lot = queue[0];
          const match = Math.min(lot.shares, remaining);
          const lotPnL =
            (tx.price - lot.price) * match - (lot.feePerShare + feePerShare) * match;
          realized += lotPnL;
          trades += 1;
          if (lotPnL > 0) wins += 1;

          realizedAll.push({
            symbol,
            buyDate: lot.date,
            sellDate: tx.date,
            shares: match,
            buyPrice: lot.price,
            sellPrice: tx.price,
            pnl: lotPnL,
            fees: (lot.feePerShare + feePerShare) * match,
            holdingDays: daysBetween(lot.date, tx.date),
          });

          lot.shares -= match;
          remaining -= match;
          if (lot.shares === 0) queue.shift();
        }
      }
    }

    // 計算剩餘持倉
    const currentShares = queue.reduce((s, l) => s + l.shares, 0);
    const totalCost = queue.reduce((s, l) => s + l.shares * (l.price + l.feePerShare), 0);
    const avgCost = currentShares > 0 ? totalCost / currentShares : 0;

    positions.push({
      symbol,
      currentShares,
      avgCost,
      totalCost,
      realizedPnL: realized,
      trades,
      wins,
    });
  }

  const totalRealizedPnL = realizedAll.reduce((s, r) => s + r.pnl, 0);
  const winningTrades = realizedAll.filter((r) => r.pnl > 0).length;
  const totalCompletedTrades = realizedAll.length;
  const wins = realizedAll.filter((r) => r.pnl > 0);
  const losses = realizedAll.filter((r) => r.pnl <= 0);
  const avgWin = wins.length > 0 ? wins.reduce((s, r) => s + r.pnl, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((s, r) => s + r.pnl, 0) / losses.length : 0;

  return {
    positions,
    realized: realizedAll,
    totals: {
      totalRealizedPnL,
      totalCompletedTrades,
      winningTrades,
      winRate: totalCompletedTrades > 0 ? (winningTrades / totalCompletedTrades) * 100 : 0,
      avgWin,
      avgLoss,
    },
  };
}

function daysBetween(a: string, b: string): number {
  const ta = new Date(a).getTime();
  const tb = new Date(b).getTime();
  return Math.round((tb - ta) / (24 * 60 * 60 * 1000));
}

// 依月份分組已實現損益（用於月績效圖）
export function realizedByMonth(realized: RealizedTrade[]): { month: string; pnl: number; trades: number }[] {
  const map = new Map<string, { pnl: number; trades: number }>();
  for (const r of realized) {
    const month = r.sellDate.slice(0, 7); // YYYY-MM
    const cur = map.get(month) ?? { pnl: 0, trades: 0 };
    cur.pnl += r.pnl;
    cur.trades += 1;
    map.set(month, cur);
  }
  return Array.from(map.entries())
    .map(([month, v]) => ({ month, ...v }))
    .sort((a, b) => a.month.localeCompare(b.month));
}
