import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
import { sma, rsi, macd } from "@/lib/indicators";
import { appendTodayBarIfMissing } from "@/lib/yahooChartSync";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const yahooFinance = new YahooFinance();

export type SignalItem = {
  label: string;
  score: number; // -2 to +2
  tone: "bull" | "bear" | "neutral";
  detail?: string;
};

export type HoldingSignal = {
  symbol: string;
  price?: number;
  changePercent?: number;
  // 警示
  isDisposition: boolean;
  isNotice: boolean;
  warningReason?: string;
  // 各面向訊號
  technical: SignalItem[];
  institutional: SignalItem[];
  fundamental: SignalItem[];
  warnings: SignalItem[];
  news: SignalItem[];
  // 整體
  totalScore: number;
  overall: "強多" | "偏多" | "中性" | "偏空" | "強空";
};

// 抓 TWSE 處置/注意股（內部呼叫，會被 cache）
async function fetchWarnings(reqUrl: URL): Promise<{
  disposition: { code: string; name: string; reason: string; period: string; measure: string }[];
  notice: { code: string; name: string; reason: string }[];
}> {
  try {
    const res = await fetch(`${reqUrl.origin}/api/twse-warnings`, { cache: "no-store" });
    return await res.json();
  } catch {
    return { disposition: [], notice: [] };
  }
}

// 抓近 90 天 K 線 + 計算技術指標
async function getTechnicalSignals(symbol: string): Promise<{
  signals: SignalItem[];
  price?: number;
  changePercent?: number;
}> {
  try {
    const period1 = new Date();
    period1.setDate(period1.getDate() - 100);
    // 並行抓歷史 K + 即時報價 — 收盤後 1-2 小時內 Yahoo 還沒把當天 bar 加進來，
    // 用 quote 合成一根補上，避免技術訊號用「昨天」的收盤算
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [chart, quoteRaw]: [any, any] = await Promise.all([
      yahooFinance.chart(
        symbol,
        { period1, interval: "1d", includePrePost: false },
        { validateResult: false },
      ),
      yahooFinance.quote(symbol, {}, { validateResult: false }).catch(() => null),
    ]);

    type SignalBar = {
      time: string;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    };
    let bars: SignalBar[] = (chart.quotes ?? [])
      .filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (q: any) =>
          typeof q.close === "number" &&
          typeof q.open === "number" &&
          typeof q.high === "number" &&
          typeof q.low === "number" &&
          q.date,
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((q: any) => ({
        time: new Date(q.date).toISOString().slice(0, 10),
        open: q.open as number,
        high: q.high as number,
        low: q.low as number,
        close: q.close as number,
        volume: (q.volume as number | null) ?? 0,
      }));

    if (quoteRaw && !Array.isArray(quoteRaw)) {
      bars = appendTodayBarIfMissing(symbol, bars, quoteRaw);
    }

    if (bars.length < 30) return { signals: [] };

    const closes: number[] = bars.map((b) => b.close);
    const volumes: number[] = bars.map((b) => b.volume);
    const latest = closes[closes.length - 1];
    const prev = closes[closes.length - 2];
    const changePercent = prev ? ((latest - prev) / prev) * 100 : 0;

    const ma5 = sma(closes, 5);
    const ma20 = sma(closes, 20);
    const ma60 = sma(closes, 60);
    const rsiVals = rsi(closes, 14);
    const macdVals = macd(closes);

    const signals: SignalItem[] = [];

    // RSI（教科書定義描述）
    const lastRsi = rsiVals[rsiVals.length - 1];
    if (Number.isFinite(lastRsi)) {
      if (lastRsi > 70) {
        signals.push({
          label: "RSI 超買區",
          score: -1,
          tone: "bear",
          detail: `RSI ${lastRsi.toFixed(1)} — 教科書定義 70 以上為超買區`,
        });
      } else if (lastRsi < 30) {
        signals.push({
          label: "RSI 超賣區",
          score: 1,
          tone: "bull",
          detail: `RSI ${lastRsi.toFixed(1)} — 教科書定義 30 以下為超賣區`,
        });
      }
    }

    // MA 站上/跌破 20MA
    const lastMa20 = ma20[ma20.length - 1];
    if (Number.isFinite(lastMa20)) {
      if (latest > lastMa20 * 1.02) {
        signals.push({
          label: "站上月線",
          score: 1,
          tone: "bull",
          detail: `現價高於 20MA ${(((latest - lastMa20) / lastMa20) * 100).toFixed(1)}%`,
        });
      } else if (latest < lastMa20 * 0.98) {
        signals.push({
          label: "跌破月線",
          score: -1,
          tone: "bear",
          detail: `現價低於 20MA ${(((lastMa20 - latest) / lastMa20) * 100).toFixed(1)}%`,
        });
      }
    }

    // MA5 vs MA20 黃金/死亡交叉（最近 3 天）
    const lastMa5 = ma5[ma5.length - 1];
    const prevMa5 = ma5[ma5.length - 4];
    const prevMa20 = ma20[ma20.length - 4];
    if (Number.isFinite(lastMa5) && Number.isFinite(lastMa20) && Number.isFinite(prevMa5) && Number.isFinite(prevMa20)) {
      if (prevMa5 < prevMa20 && lastMa5 > lastMa20) {
        signals.push({
          label: "黃金交叉",
          score: 2,
          tone: "bull",
          detail: "5MA 由下向上穿越 20MA — 教科書定義之多頭排列轉折",
        });
      } else if (prevMa5 > prevMa20 && lastMa5 < lastMa20) {
        signals.push({
          label: "死亡交叉",
          score: -2,
          tone: "bear",
          detail: "5MA 由上向下穿越 20MA — 教科書定義之空頭排列轉折",
        });
      }
    }

    // MACD 訊號
    const lastMacd = macdVals.macd[macdVals.macd.length - 1];
    const lastSignal = macdVals.signal[macdVals.signal.length - 1];
    const prevMacd = macdVals.macd[macdVals.macd.length - 3];
    const prevSignal = macdVals.signal[macdVals.signal.length - 3];
    if (Number.isFinite(lastMacd) && Number.isFinite(lastSignal) && Number.isFinite(prevMacd) && Number.isFinite(prevSignal)) {
      if (prevMacd < prevSignal && lastMacd > lastSignal) {
        signals.push({
          label: "MACD 翻多",
          score: 1,
          tone: "bull",
          detail: "MACD 線向上穿越訊號線",
        });
      } else if (prevMacd > prevSignal && lastMacd < lastSignal) {
        signals.push({
          label: "MACD 翻空",
          score: -1,
          tone: "bear",
          detail: "MACD 線向下穿越訊號線",
        });
      }
    }

    // 量能異常
    const last5Vol = volumes.slice(-5);
    const last20Vol = volumes.slice(-20, -5);
    const avg5 = last5Vol.reduce((s, v) => s + v, 0) / Math.max(1, last5Vol.length);
    const avg20 = last20Vol.reduce((s, v) => s + v, 0) / Math.max(1, last20Vol.length);
    if (avg20 > 0 && avg5 > avg20 * 1.5) {
      signals.push({
        label: "近期爆量",
        score: changePercent > 0 ? 1 : -1,
        tone: changePercent > 0 ? "bull" : "bear",
        detail: `近 5 日均量是前 20 日的 ${(avg5 / avg20).toFixed(1)} 倍`,
      });
    }

    // 接近 52 週高/低
    const high52 = Math.max(...closes);
    const low52 = Math.min(...closes);
    if (latest >= high52 * 0.97) {
      signals.push({
        label: "創波段新高",
        score: 1,
        tone: "bull",
        detail: `距 ${closes.length} 日高點 ${(((latest - high52) / high52) * 100).toFixed(1)}%`,
      });
    } else if (latest <= low52 * 1.03) {
      signals.push({
        label: "創波段新低",
        score: -1,
        tone: "bear",
        detail: `距 ${closes.length} 日低點 ${(((latest - low52) / low52) * 100).toFixed(1)}%`,
      });
    }

    return { signals, price: latest, changePercent };
  } catch {
    return { signals: [] };
  }
}

// 籌碼面：法人連續買賣超
async function getInstitutionalSignals(reqUrl: URL, symbol: string): Promise<SignalItem[]> {
  if (!/\.(TW|TWO)$/i.test(symbol)) return [];
  try {
    const res = await fetch(
      `${reqUrl.origin}/api/stock-institutional?symbol=${encodeURIComponent(symbol)}&days=15`,
      { cache: "no-store" },
    );
    const data = (await res.json()) as { rows?: { date: string; foreign: number; trust: number }[] };
    const rows = data.rows ?? [];
    if (rows.length < 5) return [];

    const signals: SignalItem[] = [];

    // 外資連續買/賣超
    let foreignBuyStreak = 0;
    let foreignSellStreak = 0;
    for (let i = rows.length - 1; i >= 0; i--) {
      if (rows[i].foreign > 0 && foreignSellStreak === 0) foreignBuyStreak++;
      else if (rows[i].foreign < 0 && foreignBuyStreak === 0) foreignSellStreak++;
      else break;
    }
    if (foreignBuyStreak >= 3) {
      signals.push({
        label: `外資連 ${foreignBuyStreak} 買`,
        score: foreignBuyStreak >= 5 ? 2 : 1,
        tone: "bull",
        detail: `外資已連續 ${foreignBuyStreak} 個交易日買超`,
      });
    } else if (foreignSellStreak >= 3) {
      signals.push({
        label: `外資連 ${foreignSellStreak} 賣`,
        score: foreignSellStreak >= 5 ? -2 : -1,
        tone: "bear",
        detail: `外資已連續 ${foreignSellStreak} 個交易日賣超`,
      });
    }

    // 投信連續買/賣超
    let trustBuyStreak = 0;
    let trustSellStreak = 0;
    for (let i = rows.length - 1; i >= 0; i--) {
      if (rows[i].trust > 0 && trustSellStreak === 0) trustBuyStreak++;
      else if (rows[i].trust < 0 && trustBuyStreak === 0) trustSellStreak++;
      else break;
    }
    if (trustBuyStreak >= 3) {
      signals.push({
        label: `投信連 ${trustBuyStreak} 買`,
        score: 1,
        tone: "bull",
        detail: `投信已連續 ${trustBuyStreak} 個交易日買超`,
      });
    } else if (trustSellStreak >= 3) {
      signals.push({
        label: `投信連 ${trustSellStreak} 賣`,
        score: -1,
        tone: "bear",
        detail: `投信已連續 ${trustSellStreak} 個交易日賣超`,
      });
    }

    return signals;
  } catch {
    return [];
  }
}

// 新聞情緒：用關鍵字計算近期新聞中的利多/利空比重
async function getNewsSentiment(reqUrl: URL, symbol: string): Promise<SignalItem[]> {
  try {
    const res = await fetch(
      `${reqUrl.origin}/api/stock-news?symbol=${encodeURIComponent(symbol)}`,
      { cache: "no-store" },
    );
    const data = (await res.json()) as { items?: { title: string }[] };
    const items = data.items ?? [];
    if (items.length === 0) return [];

    const bullKw = [
      "創新高", "新高", "漲", "看好", "成長", "強勁", "優於預期", "超預期",
      "突破", "大單", "上修", "利多", "受惠", "加碼", "拉貨", "暢旺", "搶手",
      "領漲", "翻多", "亮眼", "再寫", "最強", "高峰", "獨家", "重押", "+",
      "高速成長", "供不應求", "看俏", "升評", "升價", "獲利", "新訂單", "復甦",
    ];
    const bearKw = [
      "創新低", "跌", "重挫", "看壞", "衰退", "不如預期", "下修", "利空",
      "罷工", "警訊", "回檔", "虧損", "認列", "下調", "目標價", "調降",
      "賣超", "出走", "減產", "庫存", "降評", "風險", "疑慮", "下跌",
      "領跌", "翻空", "弱勢", "失守", "破底", "悲觀", "縮減", "停產",
      "處置", "注意", "違規",
    ];

    // 取近 15 則
    const recent = items.slice(0, 15);
    let bullCount = 0;
    let bearCount = 0;
    for (const item of recent) {
      for (const kw of bullKw) if (item.title.includes(kw)) bullCount++;
      for (const kw of bearKw) if (item.title.includes(kw)) bearCount++;
    }

    const signals: SignalItem[] = [];
    if (bullCount >= 3 && bullCount > bearCount * 2) {
      signals.push({
        label: `利多新聞 ${bullCount} 篇`,
        score: bullCount >= 8 ? 2 : 1,
        tone: "bull",
        detail: `近 15 篇新聞含 ${bullCount} 個利多關鍵字、${bearCount} 個利空`,
      });
    } else if (bearCount >= 3 && bearCount > bullCount * 2) {
      signals.push({
        label: `利空新聞 ${bearCount} 篇`,
        score: bearCount >= 8 ? -2 : -1,
        tone: "bear",
        detail: `近 15 篇新聞含 ${bearCount} 個利空關鍵字、${bullCount} 個利多`,
      });
    } else if (bullCount >= 2 || bearCount >= 2) {
      const net = bullCount - bearCount;
      if (Math.abs(net) >= 2) {
        signals.push({
          label: net > 0 ? `新聞偏多` : `新聞偏空`,
          score: net > 0 ? 1 : -1,
          tone: net > 0 ? "bull" : "bear",
          detail: `近期新聞利多 ${bullCount} 篇 vs 利空 ${bearCount} 篇`,
        });
      }
    }
    return signals;
  } catch {
    return [];
  }
}

// 基本面：EPS / 營收 YoY
async function getFundamentalSignals(reqUrl: URL, symbol: string): Promise<SignalItem[]> {
  try {
    const res = await fetch(
      `${reqUrl.origin}/api/stock-history?symbol=${encodeURIComponent(symbol)}&years=2`,
      { cache: "no-store" },
    );
    const data = (await res.json()) as {
      quarters?: { date: string; eps?: number; revenue?: number; netIncome?: number }[];
    };
    const quarters = data.quarters ?? [];
    if (quarters.length < 5) return [];

    const latest = quarters[quarters.length - 1];
    const yoy = quarters[quarters.length - 5];
    const signals: SignalItem[] = [];

    function pct(curr?: number, prior?: number) {
      if (!Number.isFinite(curr) || !Number.isFinite(prior) || prior === 0) return null;
      return (((curr as number) - (prior as number)) / Math.abs(prior as number)) * 100;
    }

    const epsYoY = pct(latest.eps, yoy?.eps);
    if (epsYoY !== null) {
      if (epsYoY >= 30) {
        signals.push({
          label: "EPS 年增 >30%",
          score: 2,
          tone: "bull",
          detail: `EPS YoY +${epsYoY.toFixed(0)}%`,
        });
      } else if (epsYoY >= 10) {
        signals.push({
          label: "EPS 年增 >10%",
          score: 1,
          tone: "bull",
          detail: `EPS YoY +${epsYoY.toFixed(0)}%`,
        });
      } else if (epsYoY < -10) {
        signals.push({
          label: "EPS 年減",
          score: -1,
          tone: "bear",
          detail: `EPS YoY ${epsYoY.toFixed(0)}%`,
        });
      }
    }

    const revYoY = pct(latest.revenue, yoy?.revenue);
    if (revYoY !== null) {
      if (revYoY >= 20) {
        signals.push({
          label: "營收年增 >20%",
          score: 1,
          tone: "bull",
          detail: `營收 YoY +${revYoY.toFixed(0)}%`,
        });
      } else if (revYoY < -10) {
        signals.push({
          label: "營收衰退",
          score: -1,
          tone: "bear",
          detail: `營收 YoY ${revYoY.toFixed(0)}%`,
        });
      }
    }

    return signals;
  } catch {
    return [];
  }
}

// GET /api/holding-signals?symbol=2327.TW
export async function GET(request: Request) {
  const reqUrl = new URL(request.url);
  const symbol = reqUrl.searchParams.get("symbol") ?? "";
  if (!symbol) return NextResponse.json({ error: "missing symbol" }, { status: 400 });

  const cleanCode = symbol.replace(/\.(TW|TWO)$/i, "");

  const [warnings, technical, institutional, fundamental, news] = await Promise.all([
    fetchWarnings(reqUrl),
    getTechnicalSignals(symbol),
    getInstitutionalSignals(reqUrl, symbol),
    getFundamentalSignals(reqUrl, symbol),
    getNewsSentiment(reqUrl, symbol),
  ]);

  const dispEntry = warnings.disposition.find((d) => d.code === cleanCode);
  const noticeEntry = warnings.notice.find((n) => n.code === cleanCode);

  const warningSignals: SignalItem[] = [];
  if (dispEntry) {
    warningSignals.push({
      label: "⚠️ 處置股",
      score: -2,
      tone: "bear",
      detail: `${dispEntry.reason}｜${dispEntry.period}｜${dispEntry.measure}`,
    });
  }
  if (noticeEntry) {
    warningSignals.push({
      label: "⚠️ 注意股",
      score: -1,
      tone: "bear",
      detail: noticeEntry.reason || "達公布注意交易資訊標準",
    });
  }

  // 加總所有分數
  const allSignals = [
    ...warningSignals,
    ...technical.signals,
    ...institutional,
    ...fundamental,
    ...news,
  ];
  const totalScore = allSignals.reduce((s, x) => s + x.score, 0);

  let overall: HoldingSignal["overall"];
  if (totalScore >= 4) overall = "強多";
  else if (totalScore >= 1) overall = "偏多";
  else if (totalScore >= -1) overall = "中性";
  else if (totalScore >= -3) overall = "偏空";
  else overall = "強空";

  return NextResponse.json({
    symbol,
    price: technical.price,
    changePercent: technical.changePercent,
    isDisposition: Boolean(dispEntry),
    isNotice: Boolean(noticeEntry),
    warningReason: dispEntry?.reason ?? noticeEntry?.reason,
    technical: technical.signals,
    institutional,
    fundamental,
    warnings: warningSignals,
    news,
    totalScore,
    overall,
  } satisfies HoldingSignal);
}
