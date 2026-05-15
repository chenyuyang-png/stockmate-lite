import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
import { sma, ema, rsi, kd, bbands, macd } from "@/lib/indicators";
import { appendTodayBarIfMissing } from "@/lib/yahooChartSync";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const yahooFinance = new YahooFinance();

export type TaPattern =
  | "shooting-star"
  | "hammer"
  | "doji"
  | "bullish-engulfing"
  | "bearish-engulfing"
  | "three-white-soldiers"
  | "three-black-crows"
  | "long-bullish"
  | "long-bearish"
  | "small-body"
  | null;

export type TaSnapshot = {
  symbol: string;
  price: number;
  changePercent: number;
  asOf: number;

  trend: {
    direction: "uptrend" | "downtrend" | "sideways";
    label: string;
    strength: "strong" | "moderate" | "weak";
    rationale: string;
  };

  support: { near: number; far: number; basis: string };
  resistance: { near: number; far: number; basis: string };

  lastCandle: {
    open: number;
    high: number;
    low: number;
    close: number;
    pattern: TaPattern;
    patternLabel: string;
    bias: "bullish" | "bearish" | "neutral";
  };

  indicators: {
    rsi14?: number;
    rsiSignal: "oversold" | "neutral" | "overbought";
    macd?: { line: number; signal: number; histogram: number; cross?: "golden" | "death" };
    kd?: { k: number; d: number; signal: "oversold" | "neutral" | "overbought" };
    ma20?: number;
    ma50?: number;
    ma200?: number;
    bb?: { upper: number; middle: number; lower: number };
    bbPosition?: "above-upper" | "upper-half" | "lower-half" | "below-lower";
  };

  /** 進場觀察 / 退場警示 */
  entryWatch: { trigger: string; level?: number }[];
  exitWatch: { trigger: string; level?: number }[];

  narrative: string;
  tags: string[];

  message?: string;
};

// ─── 工具 ──────────────────────────────────────────────────
function pctChange(curr: number, prev: number): number {
  return ((curr - prev) / prev) * 100;
}

function classifyPattern(
  o: number,
  h: number,
  l: number,
  c: number,
  prevO?: number,
  prevC?: number,
  prevPrevC?: number,
  pos?: "top" | "bottom" | "middle",
): { pattern: TaPattern; label: string; bias: "bullish" | "bearish" | "neutral" } {
  const range = h - l;
  if (range <= 0) return { pattern: null, label: "—", bias: "neutral" };
  const body = Math.abs(c - o);
  const upperWick = h - Math.max(o, c);
  const lowerWick = Math.min(o, c) - l;
  const bodyRatio = body / range;
  const isBull = c > o;

  // Doji
  if (bodyRatio < 0.1) {
    return { pattern: "doji", label: "十字線（猶豫）", bias: "neutral" };
  }

  // Three soldiers / crows (use prev candles)
  if (
    typeof prevO === "number" &&
    typeof prevC === "number" &&
    typeof prevPrevC === "number"
  ) {
    if (isBull && prevC > prevO && prevPrevC > 0) {
      // simplified — not full pattern
    }
  }

  // Shooting Star — long upper wick, small body, near top
  if (upperWick > body * 2 && lowerWick < body * 0.5 && bodyRatio < 0.4) {
    if (pos === "top" || pos === "middle") {
      return {
        pattern: "shooting-star",
        label: "制壓之星（頂部反轉訊號）",
        bias: "bearish",
      };
    }
  }

  // Hammer — long lower wick, small body, near bottom
  if (lowerWick > body * 2 && upperWick < body * 0.5 && bodyRatio < 0.4) {
    if (pos === "bottom" || pos === "middle") {
      return {
        pattern: "hammer",
        label: "鎚子線（底部反轉訊號）",
        bias: "bullish",
      };
    }
  }

  // Long body
  if (bodyRatio > 0.7) {
    return isBull
      ? { pattern: "long-bullish", label: "長紅 K（強勢攻擊）", bias: "bullish" }
      : { pattern: "long-bearish", label: "長黑 K（強勢殺盤）", bias: "bearish" };
  }

  // Bullish engulfing
  if (
    typeof prevO === "number" &&
    typeof prevC === "number" &&
    prevC < prevO && // prev bearish
    isBull &&
    c > prevO &&
    o < prevC
  ) {
    return {
      pattern: "bullish-engulfing",
      label: "多方吞噬（底部反轉）",
      bias: "bullish",
    };
  }
  if (
    typeof prevO === "number" &&
    typeof prevC === "number" &&
    prevC > prevO && // prev bullish
    !isBull &&
    c < prevO &&
    o > prevC
  ) {
    return {
      pattern: "bearish-engulfing",
      label: "空方吞噬（頂部反轉）",
      bias: "bearish",
    };
  }

  // Small body otherwise
  return {
    pattern: "small-body",
    label: isBull ? "小紅 K" : "小黑 K",
    bias: isBull ? "bullish" : "bearish",
  };
}

// ─── Cache ─────────────────────────────────────────────────
const cache = new Map<string, { data: TaSnapshot; at: number }>();
const TTL = 30 * 60_000; // 30 分鐘

// ─── Handler ──────────────────────────────────────────────
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") ?? "";
  if (!symbol)
    return NextResponse.json({ error: "missing symbol" }, { status: 400 });

  const cached = cache.get(symbol);
  if (cached && Date.now() - cached.at < TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    // 拉 1 年日 K + 即時報價（補今日 bar，避免收盤後 1-2h 內缺當天 K）
    const [chart, quoteRaw] = await Promise.all([
      yahooFinance.chart(symbol, {
        period1: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        interval: "1d",
        includePrePost: false,
      }),
      yahooFinance.quote(symbol, {}, { validateResult: false }).catch(() => null),
    ]);
    type CandleBar = {
      time: string;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    };
    let candles: CandleBar[] = (chart?.quotes ?? [])
      .filter(
        (q) =>
          typeof q.open === "number" &&
          typeof q.high === "number" &&
          typeof q.low === "number" &&
          typeof q.close === "number" &&
          q.date,
      )
      .map((q) => ({
        time: new Date(q.date as unknown as string | number | Date)
          .toISOString()
          .slice(0, 10),
        open: q.open as number,
        high: q.high as number,
        low: q.low as number,
        close: q.close as number,
        volume: (q.volume as number | null) ?? 0,
      }));

    if (quoteRaw && !Array.isArray(quoteRaw)) {
      candles = appendTodayBarIfMissing(symbol, candles, quoteRaw);
    }

    if (candles.length < 30) {
      return NextResponse.json(
        {
          error: "資料不足",
          symbol,
        },
        { status: 404 },
      );
    }

    const opens = candles.map((c) => c.open);
    const highs = candles.map((c) => c.high);
    const lows = candles.map((c) => c.low);
    const closes = candles.map((c) => c.close);
    const volumes = candles.map((c) => c.volume);

    const N = closes.length;
    const last = N - 1;
    const price = closes[last];
    const changePercent =
      N >= 2 ? pctChange(closes[last], closes[last - 1]) : 0;

    // 指標
    const ma20Arr = sma(closes, 20);
    const ma50Arr = sma(closes, 50);
    const ma200Arr = N >= 200 ? sma(closes, 200) : [];
    const rsiArr = rsi(closes, 14);
    const kdR = kd(highs, lows, closes, 9, 3, 3);
    const bbR = bbands(closes, 20, 2);
    const macdR = macd(closes, 12, 26, 9);

    const ma20 = ma20Arr[last];
    const ma50 = ma50Arr[last];
    const ma200 = ma200Arr[last];
    const rsi14 = rsiArr[last];
    const kVal = kdR.k[last];
    const dVal = kdR.d[last];
    const bbUpper = bbR.upper[last];
    const bbMiddle = bbR.middle[last];
    const bbLower = bbR.lower[last];
    const macdLine = macdR.macd[last];
    const macdSignal = macdR.signal[last];
    const macdHist = macdR.histogram[last];

    // 趨勢判讀
    let direction: "uptrend" | "downtrend" | "sideways";
    let strength: "strong" | "moderate" | "weak";
    let trendLabel: string;
    let trendRationale: string;
    {
      const above20 = price > ma20;
      const above50 = price > ma50;
      const above200 = typeof ma200 === "number" ? price > ma200 : true;
      const goldArr =
        ma20 > ma50 && (typeof ma200 === "number" ? ma50 > ma200 : true);
      const deathArr =
        ma20 < ma50 && (typeof ma200 === "number" ? ma50 < ma200 : true);

      if (above20 && above50 && above200 && goldArr) {
        direction = "uptrend";
        strength = "strong";
        trendLabel = "上升趨勢（強）";
        trendRationale = "站上 20/50/200 MA，均線多頭排列";
      } else if (above20 && above50) {
        direction = "uptrend";
        strength = "moderate";
        trendLabel = "上升趨勢";
        trendRationale = "站上 20/50 MA";
      } else if (!above20 && !above50 && !above200 && deathArr) {
        direction = "downtrend";
        strength = "strong";
        trendLabel = "下降趨勢（強）";
        trendRationale = "跌破 20/50/200 MA，均線空頭排列";
      } else if (!above20 && !above50) {
        direction = "downtrend";
        strength = "moderate";
        trendLabel = "下降趨勢";
        trendRationale = "跌破 20/50 MA";
      } else {
        direction = "sideways";
        strength = "weak";
        trendLabel = "區間整理";
        trendRationale = "均線糾結 / 多空訊號分歧";
      }
    }

    // 支撐 / 壓力
    // 近 20 日高低點
    const last20 = closes.slice(-20);
    const highs20 = highs.slice(-20);
    const lows20 = lows.slice(-20);
    const high20 = Math.max(...highs20);
    const low20 = Math.min(...lows20);
    // 近 60 日（中期）
    const high60 =
      N >= 60 ? Math.max(...highs.slice(-60)) : Math.max(...highs);
    const low60 = N >= 60 ? Math.min(...lows.slice(-60)) : Math.min(...lows);

    // 標準 Pivot Points（H+L+C of prior day）
    const prevH = highs[last];
    const prevL = lows[last];
    const prevC = closes[last];
    const pivot = (prevH + prevL + prevC) / 3;
    const r1 = 2 * pivot - prevL;
    const s1 = 2 * pivot - prevH;

    // 取「近支撐」 = max of (MA20 if below price, recent 5d low, s1)
    const candidatesS: { v: number; basis: string }[] = [];
    if (ma20 < price) candidatesS.push({ v: ma20, basis: "MA20" });
    if (ma50 < price) candidatesS.push({ v: ma50, basis: "MA50" });
    candidatesS.push({ v: low20, basis: "20 日低點" });
    candidatesS.push({ v: s1, basis: "Pivot S1" });
    candidatesS.push({ v: bbLower, basis: "BB 下軌" });
    candidatesS.sort((a, b) => b.v - a.v); // 從高到低（最近的支撐先）
    const nearSupport = candidatesS.find((x) => x.v < price) ?? candidatesS[0];
    const farSupport =
      candidatesS.find((x) => x.v < nearSupport.v * 0.98) ??
      { v: low60, basis: "60 日低點" };

    const candidatesR: { v: number; basis: string }[] = [];
    if (ma20 > price) candidatesR.push({ v: ma20, basis: "MA20" });
    if (ma50 > price) candidatesR.push({ v: ma50, basis: "MA50" });
    candidatesR.push({ v: high20, basis: "20 日高點" });
    candidatesR.push({ v: r1, basis: "Pivot R1" });
    candidatesR.push({ v: bbUpper, basis: "BB 上軌" });
    candidatesR.sort((a, b) => a.v - b.v); // 由低到高
    const nearResistance =
      candidatesR.find((x) => x.v > price) ?? candidatesR[0];
    const farResistance =
      candidatesR.find((x) => x.v > nearResistance.v * 1.02) ??
      { v: high60, basis: "60 日高點" };

    // K 線型態（最新一根）— 判斷處於頂部/底部/中段
    const range20 = high20 - low20;
    let pos: "top" | "bottom" | "middle" = "middle";
    if (price > high20 - range20 * 0.2) pos = "top";
    else if (price < low20 + range20 * 0.2) pos = "bottom";

    const lastCandlePattern = classifyPattern(
      opens[last],
      highs[last],
      lows[last],
      closes[last],
      opens[last - 1],
      closes[last - 1],
      closes[last - 2],
      pos,
    );

    // RSI / KD signals
    const rsiSignal: "oversold" | "neutral" | "overbought" =
      typeof rsi14 === "number"
        ? rsi14 > 70
          ? "overbought"
          : rsi14 < 30
            ? "oversold"
            : "neutral"
        : "neutral";
    const kdSignal: "oversold" | "neutral" | "overbought" =
      typeof kVal === "number" && typeof dVal === "number"
        ? kVal > 80 && dVal > 80
          ? "overbought"
          : kVal < 20 && dVal < 20
            ? "oversold"
            : "neutral"
        : "neutral";

    // MACD 交叉
    let macdCross: "golden" | "death" | undefined;
    if (
      typeof macdR.macd[last - 1] === "number" &&
      typeof macdR.signal[last - 1] === "number" &&
      typeof macdLine === "number" &&
      typeof macdSignal === "number"
    ) {
      const wasBelow = macdR.macd[last - 1] < macdR.signal[last - 1];
      const nowAbove = macdLine > macdSignal;
      if (wasBelow && nowAbove) macdCross = "golden";
      else if (!wasBelow && !nowAbove) macdCross = "death";
    }

    // 布林位置
    let bbPosition: "above-upper" | "upper-half" | "lower-half" | "below-lower";
    if (price > bbUpper) bbPosition = "above-upper";
    else if (price >= bbMiddle) bbPosition = "upper-half";
    else if (price > bbLower) bbPosition = "lower-half";
    else bbPosition = "below-lower";

    // 多空指標觸發條件（純技術指標狀態描述，無進出場建議字眼）
    const entryWatch: TaSnapshot["entryWatch"] = [];
    const exitWatch: TaSnapshot["exitWatch"] = [];

    // 多頭指標觸發條件
    if (direction === "downtrend") {
      entryWatch.push({
        trigger: `若 ${nearSupport.v.toFixed(2)} 支撐守住 — 多頭觸發條件`,
        level: nearSupport.v,
      });
    } else if (direction === "uptrend") {
      entryWatch.push({
        trigger: `若 MA20 ${ma20?.toFixed(2)} 未跌破 — 多頭排列維持條件`,
        level: ma20,
      });
    } else {
      entryWatch.push({
        trigger: `若突破 ${nearResistance.v.toFixed(2)} 壓力 — 多頭突破條件`,
        level: nearResistance.v,
      });
    }
    if (rsiSignal === "oversold") {
      entryWatch.push({
        trigger: `RSI ${rsi14?.toFixed(0)} — 教科書定義超賣區`,
      });
    }

    // 空頭指標觸發條件
    if (direction === "uptrend") {
      exitWatch.push({
        trigger: `若跌破 ${nearSupport.v.toFixed(2)}（${nearSupport.basis}）— 多頭排列破壞條件`,
        level: nearSupport.v,
      });
    } else {
      exitWatch.push({
        trigger: `若無法突破 ${nearResistance.v.toFixed(2)} — 多頭動能受阻條件`,
        level: nearResistance.v,
      });
    }
    if (rsiSignal === "overbought") {
      exitWatch.push({
        trigger: `RSI ${rsi14?.toFixed(0)} — 教科書定義超買區`,
      });
    }
    if (lastCandlePattern.bias === "bearish" && direction !== "downtrend") {
      exitWatch.push({
        trigger: `今日 K 線為 ${lastCandlePattern.label} — 教科書定義反轉型態`,
      });
    }

    // Narrative 模板
    const narrativeParts: string[] = [];
    narrativeParts.push(`${trendLabel}（${trendRationale}）`);
    if (lastCandlePattern.pattern !== null) {
      narrativeParts.push(`最新 K 線為「${lastCandlePattern.label}」`);
    }
    if (rsiSignal !== "neutral") {
      narrativeParts.push(
        `RSI ${rsi14?.toFixed(0)} 進入${rsiSignal === "overbought" ? "超買" : "超賣"}區`,
      );
    }
    if (bbPosition === "above-upper") {
      narrativeParts.push("股價突破布林上軌（強勢但留意過熱）");
    } else if (bbPosition === "below-lower") {
      narrativeParts.push("股價跌破布林下軌（弱勢但留意超跌反彈）");
    }
    if (macdCross === "golden") {
      narrativeParts.push("MACD 金叉（多方訊號）");
    } else if (macdCross === "death") {
      narrativeParts.push("MACD 死叉（空方訊號）");
    }
    narrativeParts.push(
      `近支撐 ${nearSupport.v.toFixed(2)} (${nearSupport.basis})、近壓力 ${nearResistance.v.toFixed(2)} (${nearResistance.basis})`,
    );
    const narrative = narrativeParts.join("。") + "。";

    // 標籤
    const tags: string[] = [];
    tags.push(trendLabel);
    if (lastCandlePattern.bias === "bullish") tags.push("K 線偏多");
    else if (lastCandlePattern.bias === "bearish") tags.push("K 線偏空");
    if (rsiSignal === "overbought") tags.push("RSI 過熱");
    else if (rsiSignal === "oversold") tags.push("RSI 超賣");
    if (bbPosition === "above-upper") tags.push("突破布林");
    else if (bbPosition === "below-lower") tags.push("跌破布林");
    if (macdCross === "golden") tags.push("MACD 金叉");
    else if (macdCross === "death") tags.push("MACD 死叉");

    const result: TaSnapshot = {
      symbol,
      price,
      changePercent,
      asOf: Date.now(),
      trend: {
        direction,
        label: trendLabel,
        strength,
        rationale: trendRationale,
      },
      support: {
        near: nearSupport.v,
        far: farSupport.v,
        basis: `${nearSupport.basis} / ${farSupport.basis}`,
      },
      resistance: {
        near: nearResistance.v,
        far: farResistance.v,
        basis: `${nearResistance.basis} / ${farResistance.basis}`,
      },
      lastCandle: {
        open: opens[last],
        high: highs[last],
        low: lows[last],
        close: closes[last],
        pattern: lastCandlePattern.pattern,
        patternLabel: lastCandlePattern.label,
        bias: lastCandlePattern.bias,
      },
      indicators: {
        rsi14,
        rsiSignal,
        macd:
          typeof macdLine === "number" && typeof macdSignal === "number"
            ? {
                line: macdLine,
                signal: macdSignal,
                histogram: macdHist,
                cross: macdCross,
              }
            : undefined,
        kd:
          typeof kVal === "number" && typeof dVal === "number"
            ? { k: kVal, d: dVal, signal: kdSignal }
            : undefined,
        ma20,
        ma50,
        ma200,
        bb: { upper: bbUpper, middle: bbMiddle, lower: bbLower },
        bbPosition,
      },
      entryWatch,
      exitWatch,
      narrative,
      tags,
    };

    // Volume info (silence unused warning)
    void volumes;

    cache.set(symbol, { data: result, at: Date.now() });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      {
        error: `計算失敗：${e instanceof Error ? e.message : "未知"}`,
        symbol,
      },
      { status: 500 },
    );
  }
}
