import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
import { searchTwStocks } from "@/lib/twStockNames";
import { searchUsStocks } from "@/lib/usStockNames";

export const dynamic = "force-dynamic";

const yahooFinance = new YahooFinance();

export type SearchResult = {
  symbol: string;
  name: string;
  region: "TW" | "US";
  source: "tw-static" | "us-static" | "yahoo";
  english?: string;
};

// 判斷是否為「主要含中文字」
function isChinese(s: string): boolean {
  return /[一-鿿]/.test(s);
}

// 判斷是否為純美股代號（1-5 個大寫字母）
function looksLikeUsTicker(s: string): boolean {
  return /^[A-Za-z]{1,5}(\.[A-Za-z]+)?$/.test(s) && !/^\d/.test(s);
}

// GET /api/search?q=台積電
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (!q) return NextResponse.json({ results: [] });

  const results: SearchResult[] = [];
  const seen = new Set<string>();

  // 1. 台股靜態表（中文 / 代碼）
  for (const s of searchTwStocks(q, 10)) {
    if (seen.has(s.symbol)) continue;
    seen.add(s.symbol);
    results.push({
      symbol: s.symbol,
      name: s.name,
      region: "TW",
      source: "tw-static",
    });
  }

  // 2. 美股靜態表（中文 / 英文 / 代碼）
  for (const s of searchUsStocks(q, 6)) {
    if (seen.has(s.symbol)) continue;
    seen.add(s.symbol);
    results.push({
      symbol: s.symbol,
      name: s.name,
      region: "US",
      source: "us-static",
      english: s.english,
    });
  }

  // 3. 若是英文/數字字串且靜態表結果不夠，再打 Yahoo
  if (results.length < 5 && !isChinese(q) && (looksLikeUsTicker(q) || /^\d/.test(q))) {
    try {
      const r = (await yahooFinance.search(
        q,
        { quotesCount: 8 },
        { validateResult: false },
      )) as { quotes?: unknown[] };
      for (const item of r.quotes ?? []) {
        const sym = (item as { symbol?: string }).symbol;
        if (!sym || seen.has(sym)) continue;
        // 過濾掉非股票 / ETF 的結果
        if (
          (item as { quoteType?: string }).quoteType &&
          !["EQUITY", "ETF"].includes((item as { quoteType?: string }).quoteType!)
        ) {
          continue;
        }
        const region: "TW" | "US" = /\.(TW|TWO)$/i.test(sym) ? "TW" : "US";
        results.push({
          symbol: sym,
          name:
            (item as { shortname?: string }).shortname ||
            (item as { longname?: string }).longname ||
            sym,
          region,
          source: "yahoo",
        });
        seen.add(sym);
        if (results.length >= 12) break;
      }
    } catch {
      /* 失敗就只用靜態表結果 */
    }
  }

  return NextResponse.json({ results: results.slice(0, 12) });
}
