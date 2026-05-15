// 技術指標計算（純函式，無外部相依）
// 輸入用 number[]，索引與時間軸一致；結果同長度，前置 NaN 直到指標可計算

export function sma(values: number[], period: number): number[] {
  const out: number[] = new Array(values.length).fill(NaN);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

export function ema(values: number[], period: number): number[] {
  const out: number[] = new Array(values.length).fill(NaN);
  const k = 2 / (period + 1);
  let prev: number | null = null;
  let seedSum = 0;
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      seedSum += values[i];
      continue;
    }
    if (i === period - 1) {
      seedSum += values[i];
      prev = seedSum / period;
      out[i] = prev;
      continue;
    }
    prev = values[i] * k + (prev as number) * (1 - k);
    out[i] = prev;
  }
  return out;
}

export function rsi(values: number[], period = 14): number[] {
  const out: number[] = new Array(values.length).fill(NaN);
  if (values.length <= period) return out;
  let avgGain = 0;
  let avgLoss = 0;
  // 第一個 period 的平均
  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) avgGain += diff;
    else avgLoss -= diff;
  }
  avgGain /= period;
  avgLoss /= period;
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return out;
}

export function macd(values: number[], fast = 12, slow = 26, signalPeriod = 9) {
  const emaFast = ema(values, fast);
  const emaSlow = ema(values, slow);
  const macdLine = values.map((_, i) =>
    Number.isFinite(emaFast[i]) && Number.isFinite(emaSlow[i]) ? emaFast[i] - emaSlow[i] : NaN,
  );
  const signal = ema(
    macdLine.map((v) => (Number.isFinite(v) ? v : 0)),
    signalPeriod,
  ).map((v, i) => (Number.isFinite(macdLine[i]) ? v : NaN));
  const histogram = macdLine.map((v, i) =>
    Number.isFinite(v) && Number.isFinite(signal[i]) ? v - signal[i] : NaN,
  );
  return { macd: macdLine, signal, histogram };
}

export function kd(
  highs: number[],
  lows: number[],
  closes: number[],
  period = 9,
  smoothK = 3,
  smoothD = 3,
) {
  // 台股慣用的 KD：先算 RSV，再做平滑（指數平滑：K = 2/3*前K + 1/3*RSV）
  const rsv: number[] = new Array(closes.length).fill(NaN);
  for (let i = period - 1; i < closes.length; i++) {
    let hi = -Infinity;
    let lo = Infinity;
    for (let j = i - period + 1; j <= i; j++) {
      if (highs[j] > hi) hi = highs[j];
      if (lows[j] < lo) lo = lows[j];
    }
    rsv[i] = hi === lo ? 50 : ((closes[i] - lo) / (hi - lo)) * 100;
  }
  const k: number[] = new Array(closes.length).fill(NaN);
  const d: number[] = new Array(closes.length).fill(NaN);
  let prevK = 50;
  let prevD = 50;
  const alphaK = 1 / smoothK;
  const alphaD = 1 / smoothD;
  for (let i = 0; i < closes.length; i++) {
    if (!Number.isFinite(rsv[i])) continue;
    prevK = prevK * (1 - alphaK) + rsv[i] * alphaK;
    prevD = prevD * (1 - alphaD) + prevK * alphaD;
    k[i] = prevK;
    d[i] = prevD;
  }
  return { k, d };
}

export function bbands(values: number[], period = 20, stdMult = 2) {
  const mid = sma(values, period);
  const upper: number[] = new Array(values.length).fill(NaN);
  const lower: number[] = new Array(values.length).fill(NaN);
  for (let i = period - 1; i < values.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += (values[j] - mid[i]) ** 2;
    const sd = Math.sqrt(sum / period);
    upper[i] = mid[i] + stdMult * sd;
    lower[i] = mid[i] - stdMult * sd;
  }
  return { upper, middle: mid, lower };
}
