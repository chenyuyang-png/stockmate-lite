// 美股族群 → 台股族群影響對照
// 用於「夜盤美股 → 明日台股」簡報
//
// rationale 寫對應邏輯（為什麼這檔美股漲跌會影響哪些台股）
// 這份對照是策展、可主觀。之後可改為 user-editable。

export type InfluenceGroup = {
  id: string;
  label: string;
  usSymbols: string[];
  twSymbols: string[];
  rationale: string;
};

export const INFLUENCE_GROUPS: InfluenceGroup[] = [
  {
    id: "ai-foundry",
    label: "AI 半導體 — 晶圓代工鏈",
    usSymbols: ["NVDA", "AVGO", "AMD", "TSM", "MRVL", "ARM"],
    twSymbols: ["2330.TW", "2454.TW", "3661.TW", "5269.TW", "3034.TW", "8261.TW"],
    rationale: "NVDA / AVGO / AMD 訂單流向台積電（先進製程）+ 聯發科 / 世芯 / 創意 IC 設計",
  },
  {
    id: "ai-server",
    label: "AI 伺服器 ODM",
    usSymbols: ["NVDA", "AVGO", "DELL", "SMCI", "HPE"],
    twSymbols: ["2382.TW", "2356.TW", "3231.TW", "2308.TW", "3017.TW", "6669.TW"],
    rationale: "NVDA H100/B200 出貨 → 廣達 / 緯創 / 緯穎 ODM；台達電 + 奇鋐負責電源散熱",
  },
  {
    id: "optical-comm",
    label: "光通訊 / 光收發模組",
    usSymbols: ["LITE", "CIEN", "COHR", "ANET"],
    twSymbols: ["3324.TWO", "8261.TW", "3596.TW", "8210.TW"],
    rationale: "LITE / COHR 光收發模組需求 → 雙鴻散熱、智易、勤誠等上游供應鏈",
  },
  {
    id: "memory",
    label: "記憶體 / 儲存",
    usSymbols: ["MU", "SNDK", "WDC", "STX"],
    twSymbols: ["8104.TW", "2344.TW", "2408.TW"],
    rationale: "MU / SNDK 報價漲 → 元太 / 華邦電 / 南亞科",
  },
  {
    id: "cloud-saas",
    label: "雲端 SaaS",
    usSymbols: ["NET", "SNOW", "CRM", "NOW", "DDOG", "MDB", "PLTR"],
    twSymbols: ["3653.TW", "4977.TWO", "2308.TW"],
    rationale: "雲服務 capex 增 → 健策散熱、眾達-KY 光通訊、台達電電源",
  },
  {
    id: "ev",
    label: "電動車",
    usSymbols: ["TSLA", "NIO", "XPEV", "LI"],
    twSymbols: ["1536.TW", "1605.TW", "2207.TW"],
    rationale: "TSLA 出貨 → 和大齒輪、華新銅箔、和泰車",
  },
  {
    id: "passive",
    label: "被動元件 / 連接器",
    usSymbols: ["AAPL", "NVDA", "TSLA"],
    twSymbols: ["2327.TW", "2492.TW", "6121.TWO", "2308.TW"],
    rationale: "消費電子＋伺服器拉貨 → 國巨 / 華新科 MLCC、台達電連接器",
  },
  {
    id: "pcb-substrate",
    label: "PCB / IC 載板",
    usSymbols: ["NVDA", "AVGO", "AAPL"],
    twSymbols: ["3037.TW", "8046.TW", "6173.TWO", "3044.TW", "6213.TW"],
    rationale: "AI 加速器 + 高階手機 → 欣興 / 南電 / 信昌電（ABF 載板鏈）",
  },
  {
    id: "optics-lens",
    label: "光學 / 鏡頭",
    usSymbols: ["AAPL", "META"],
    twSymbols: ["3008.TW", "3406.TW", "3530.TW"],
    rationale: "iPhone + AR/VR 需求 → 大立光、玉晶光、晶相光",
  },
  {
    id: "consumer-china",
    label: "中國消費 / ADR",
    usSymbols: ["BABA", "PDD", "JD", "BIDU"],
    twSymbols: ["2317.TW", "2354.TW"],
    rationale: "中國電商需求 → 鴻海集團代工",
  },
];

// 給定 US Quote map，計算每個影響族群的「美股平均漲跌」+ 排序
export function computeInfluenceStats<T extends { changePercent: number; name?: string }>(
  quotesMap: Record<string, T>,
): {
  group: InfluenceGroup;
  usAvg: number;
  usQuotes: { symbol: string; q: T }[];
}[] {
  return INFLUENCE_GROUPS.map((group) => {
    const usQuotes = group.usSymbols
      .map((s) => ({ symbol: s, q: quotesMap[s] }))
      .filter((x): x is { symbol: string; q: T } => Boolean(x.q));
    const usAvg =
      usQuotes.length > 0
        ? usQuotes.reduce((s, x) => s + x.q.changePercent, 0) / usQuotes.length
        : 0;
    return { group, usAvg, usQuotes };
  })
    .filter((x) => x.usQuotes.length > 0)
    .sort((a, b) => Math.abs(b.usAvg) - Math.abs(a.usAvg));
}

// 收集所有需要查詢的代碼
export function allInfluenceSymbols(): string[] {
  const set = new Set<string>();
  for (const g of INFLUENCE_GROUPS) {
    for (const s of g.usSymbols) set.add(s);
    for (const s of g.twSymbols) set.add(s);
  }
  return Array.from(set);
}

// 把「美股 influence group → 個股」展開成「美股 influence group → 台股 sector」
// 一個美股 group 的 twSymbols 可能分布在多個 TW sector，所以 edges 多對多
// 回傳 edges: { fromUs, toTwSector, sharedSymbols }
import type { SectorGroup } from "./sectors";
export function computeSectorEdges(twSectors: SectorGroup[]): {
  fromUs: string;
  toTwSector: string;
  sharedSymbols: string[];
}[] {
  const edges: { fromUs: string; toTwSector: string; sharedSymbols: string[] }[] = [];
  for (const us of INFLUENCE_GROUPS) {
    const twSet = new Set(us.twSymbols);
    for (const sec of twSectors) {
      const shared = sec.symbols.filter((s) => twSet.has(s));
      if (shared.length > 0) {
        edges.push({ fromUs: us.id, toTwSector: sec.id, sharedSymbols: shared });
      }
    }
  }
  return edges;
}
