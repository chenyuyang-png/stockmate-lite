// 台股 ↔ 美股 對應關係
// 用於：
//   1. 收盤速報內顯示「相關美股」
//   2. 個股頁顯示「對應美股 / ADR」
//   3. 美股夜盤異動時提示「明日台股影響族群」
//
// 配對邏輯：
//   - direct: 同公司 ADR（台積電 ↔ TSM）
//   - supplier: 供應鏈（鴻海 ↔ AAPL、台積電 ↔ NVDA）
//   - peer: 同業比較（聯發科 ↔ QCOM）
//   - theme: 同題材（雙鴻散熱 ↔ NVDA AI GPU）

export type PairRelation = "direct" | "supplier" | "peer" | "theme";

export type StockPair = {
  /** 來源股 */
  from: string;
  /** 對應股 */
  to: string;
  /** 關係類型 */
  relation: PairRelation;
  /** 一句話說明關聯性 */
  note: string;
};

export const TW_US_PAIRS: StockPair[] = [
  // ─── 直接對應（ADR / 同公司）──────────
  {
    from: "2330.TW",
    to: "TSM",
    relation: "direct",
    note: "同公司 ADR — 美國發行的台積電存託憑證",
  },
  {
    from: "2317.TW",
    to: "AAPL",
    relation: "supplier",
    note: "鴻海是蘋果最大代工廠（iPhone 60%+ 出貨）",
  },
  {
    from: "2317.TW",
    to: "NVDA",
    relation: "supplier",
    note: "鴻海拿到 NVDA AI 伺服器 GB200 整機 ODM 大單",
  },
  // ─── AI / 半導體鏈 ─────────────────
  {
    from: "2330.TW",
    to: "NVDA",
    relation: "supplier",
    note: "台積電是 NVDA H100 / B100 GPU 唯一晶圓代工廠",
  },
  {
    from: "2330.TW",
    to: "AVGO",
    relation: "supplier",
    note: "Broadcom 客製化 AI 晶片由台積電代工",
  },
  {
    from: "2330.TW",
    to: "AMD",
    relation: "supplier",
    note: "AMD MI300 GPU + EPYC CPU 全部台積電代工",
  },
  {
    from: "2454.TW",
    to: "QCOM",
    relation: "peer",
    note: "聯發科 vs 高通 — 手機 / 車用 SoC 直接競爭",
  },
  {
    from: "3711.TW",
    to: "ASML",
    relation: "supplier",
    note: "日月光 / 日月控 ASML EUV 光刻機後段封測夥伴",
  },
  // ─── AI 伺服器 ─────────────────────
  {
    from: "6669.TW",
    to: "META",
    relation: "supplier",
    note: "緯穎是 Meta 主要 ODM（Open Compute Project 主供應商）",
  },
  {
    from: "6669.TW",
    to: "MSFT",
    relation: "supplier",
    note: "緯穎是微軟 Azure 雲端伺服器主要 ODM",
  },
  {
    from: "2382.TW",
    to: "NVDA",
    relation: "supplier",
    note: "廣達是 NVDA GB200 NVL72 機櫃主要 ODM",
  },
  {
    from: "3231.TW",
    to: "NVDA",
    relation: "supplier",
    note: "緯創拿到 NVDA AI 伺服器大單（含 HGX 模組）",
  },
  {
    from: "8210.TW",
    to: "DELL",
    relation: "supplier",
    note: "勤誠是 Dell / HPE 機箱滑軌主要供應商",
  },
  // ─── 散熱 / 電源 ───────────────────
  {
    from: "3324.TWO",
    to: "NVDA",
    relation: "theme",
    note: "雙鴻 3D VC + 液冷板 — AI GPU 1000W+ 必備散熱方案",
  },
  {
    from: "3017.TW",
    to: "NVDA",
    relation: "theme",
    note: "奇鋐 AI 伺服器散熱模組龍頭",
  },
  {
    from: "2308.TW",
    to: "NVDA",
    relation: "theme",
    note: "台達電 AI 伺服器電源供應龍頭（單機 12kW+）",
  },
  // ─── 記憶體 ─────────────────────────
  {
    from: "2408.TW",
    to: "MU",
    relation: "peer",
    note: "南亞科 vs Micron — DRAM 標準型同業",
  },
  {
    from: "2454.TW",
    to: "ARM",
    relation: "supplier",
    note: "聯發科是 ARM IP 授權前三大客戶",
  },
  // ─── 電動車 / 蘋果鏈 ────────────────
  {
    from: "2317.TW",
    to: "TSLA",
    relation: "theme",
    note: "鴻海切入特斯拉電動車組裝（MIH 平台）",
  },
  {
    from: "2308.TW",
    to: "TSLA",
    relation: "supplier",
    note: "台達電是 TSLA 充電樁主要供應商",
  },
];

/** 取出某檔股票相關的對應股（雙向）*/
export function findPairsFor(symbol: string): StockPair[] {
  return TW_US_PAIRS.filter((p) => p.from === symbol || p.to === symbol);
}

/** 取出某檔台股的對應美股 */
export function findUsPairsForTw(twSymbol: string): StockPair[] {
  return TW_US_PAIRS.filter((p) => p.from === twSymbol);
}

/** 取出某檔美股對應的台股（反向）*/
export function findTwPairsForUs(usSymbol: string): StockPair[] {
  return TW_US_PAIRS.filter((p) => p.to === usSymbol);
}

/** 取出本表所有「熱門對應」（直接 ADR + AI 鏈核心 + 蘋果鏈核心）*/
export function getFeaturedPairs(limit = 6): StockPair[] {
  const featured = [
    "2330.TW", // 台積電
    "2317.TW", // 鴻海
    "6669.TW", // 緯穎
    "2382.TW", // 廣達
    "2308.TW", // 台達電
    "3324.TWO", // 雙鴻
  ];
  const result: StockPair[] = [];
  for (const tw of featured) {
    const pair = TW_US_PAIRS.find((p) => p.from === tw);
    if (pair && result.length < limit) result.push(pair);
  }
  return result;
}

/** 中文關係標籤 */
export function relationLabel(r: PairRelation): string {
  switch (r) {
    case "direct":
      return "同公司 ADR";
    case "supplier":
      return "供應鏈";
    case "peer":
      return "同業競爭";
    case "theme":
      return "同題材";
  }
}
