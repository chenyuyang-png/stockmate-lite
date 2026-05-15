// Yahoo daily chart 同步補丁 — 解決「收盤後當天 K 線消失 1-2 小時」的問題
//
// Yahoo 的 chart API 對 1d interval 有個怪癖：
//   - 收盤後要等 1-2 小時才把當天 daily bar 加進來
//   - 盤中 chart 也可能只到昨天那根
//
// 修法：拉 chart 同時拉 quote，比較最後一根 bar 的日期 vs 報價的當天日期，
// 如果缺今天那根 → 用 quote 的 open/high/low/price/volume 合成一根補上去。

/**
 * 取得「市場當地」的今日日期字串（YYYY-MM-DD）
 * - 台股 (.TW / .TWO / ^TWII)：用 Asia/Taipei
 * - 其餘（美股等）：用 America/New_York
 */
export function marketLocalToday(symbol: string): string {
  const isTwMarket = /\.(TW|TWO)$/i.test(symbol) || symbol === "^TWII";
  const tz = isTwMarket ? "Asia/Taipei" : "America/New_York";
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * 把任意「時間值」（epoch sec/ms、Date、ISO 字串）轉成市場本地的 YYYY-MM-DD
 */
export function toMarketLocalDate(symbol: string, value: unknown): string {
  let ms: number;
  if (value instanceof Date) ms = value.getTime();
  else if (typeof value === "number") ms = value > 1e12 ? value : value * 1000;
  else if (typeof value === "string") ms = new Date(value).getTime();
  else ms = Date.now();
  if (!Number.isFinite(ms)) ms = Date.now();

  const isTwMarket = /\.(TW|TWO)$/i.test(symbol) || symbol === "^TWII";
  const tz = isTwMarket ? "Asia/Taipei" : "America/New_York";
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ms));
}

/** Yahoo 報價的相關欄位（鬆散 type）*/
type LooseQuote = {
  regularMarketPrice?: number;
  regularMarketOpen?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketVolume?: number;
  regularMarketTime?: number | Date;
};

/** OHLC bar — 通用結構，volume 可選跟 OHLC type 對齊 */
export type SyncOHLC = {
  time: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

/**
 * 把 chart 拉回來的 daily bars 跟 quote 比對，缺今天那根就合成一根補上去。
 *
 * @param symbol      Yahoo symbol（如 "2330.TW" / "AAPL"）
 * @param bars        已轉好格式的 daily bars（由舊到新）
 * @param quote       Yahoo quote 物件（可為 null，null 就不補）
 * @returns           原 bars + 可能多一根「今日合成 bar」
 */
export function appendTodayBarIfMissing<T extends SyncOHLC>(
  symbol: string,
  bars: T[],
  quote: LooseQuote | null,
): T[] {
  if (!quote) return bars;
  const price = quote.regularMarketPrice;
  if (typeof price !== "number" || !Number.isFinite(price)) return bars;

  const open =
    typeof quote.regularMarketOpen === "number" ? quote.regularMarketOpen : price;
  const high =
    typeof quote.regularMarketDayHigh === "number"
      ? quote.regularMarketDayHigh
      : price;
  const low =
    typeof quote.regularMarketDayLow === "number"
      ? quote.regularMarketDayLow
      : price;
  const volume =
    typeof quote.regularMarketVolume === "number"
      ? quote.regularMarketVolume
      : 0;

  // 用「報價時間」算市場當天日期，避免時區邊界誤判
  const quoteDate = toMarketLocalDate(
    symbol,
    quote.regularMarketTime ?? Date.now(),
  );
  const lastBarDate = bars.length > 0 ? bars[bars.length - 1].time : "";

  // 只有當最後一根 bar 嚴格早於報價當天 → 補一根
  // 避免「Yahoo 已經放今天的 bar 進來」時重複
  if (lastBarDate >= quoteDate) return bars;

  const synthetic = {
    time: quoteDate,
    open,
    high,
    low,
    close: price,
    volume,
  } as T;
  return [...bars, synthetic];
}
