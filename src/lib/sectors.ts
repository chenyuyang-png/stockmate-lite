// 台股 / 美股 題材分類（仿照 aistockmap.com 的 16 大產業 × 多子題材 結構）
//
// 兩層結構：
//   Category (16 大分類) → SubTheme (多個子題材)
//
// 每個子題材包含：
//   - 策展的代表性個股清單 (8-15 檔)
//   - Tier 1/2/3 分層
//   - description: 供應鏈定位描述
//
// 涵蓋 ~280 檔台股 + ~60 檔美股

export type Tier = 1 | 2 | 3;

export type Category =
  | "ic-design"
  | "semi-manufacture"
  | "advanced-packaging"
  | "memory"
  | "ai-server"
  | "cooling"
  | "network-satellite"
  | "passive"
  | "electronics"
  | "optics-display"
  | "ev"
  | "green-energy"
  | "robotics"
  | "software-security"
  | "consumer"
  | "diverse";

export const CATEGORY_LABELS: Record<Category, string> = {
  "ic-design": "IC 設計",
  "semi-manufacture": "半導體製造",
  "advanced-packaging": "先進封測",
  memory: "記憶體",
  "ai-server": "AI 伺服器",
  cooling: "散熱冷卻",
  "network-satellite": "網通衛星",
  passive: "被動元件",
  electronics: "電子零組件",
  "optics-display": "光學顯示",
  ev: "電動車",
  "green-energy": "綠能環保",
  robotics: "智慧機器人",
  "software-security": "軟體資安",
  consumer: "消費終端",
  diverse: "多元產業",
};

export const CATEGORY_ORDER: Category[] = [
  "ic-design",
  "semi-manufacture",
  "advanced-packaging",
  "memory",
  "ai-server",
  "cooling",
  "network-satellite",
  "passive",
  "electronics",
  "optics-display",
  "ev",
  "green-energy",
  "robotics",
  "software-security",
  "consumer",
  "diverse",
];

export type SectorGroup = {
  id: string;
  label: string;
  category: Category;
  market: "TW" | "US";
  symbols: string[];
  description?: string;
  tiers?: {
    1?: string[];
    2?: string[];
    3?: string[];
  };
};

export function getTierOf(sector: SectorGroup, symbol: string): Tier | null {
  if (!sector.tiers) return null;
  if (sector.tiers[1]?.includes(symbol)) return 1;
  if (sector.tiers[2]?.includes(symbol)) return 2;
  if (sector.tiers[3]?.includes(symbol)) return 3;
  return null;
}

export function getTierSymbols(sector: SectorGroup, tier: Tier): string[] {
  return sector.tiers?.[tier] ?? [];
}

// ═══════════════════════════════════════════════════════════════
// 台股題材
// ═══════════════════════════════════════════════════════════════

export const TW_SECTORS: SectorGroup[] = [
  // ─── 1. IC 設計 ─────────────────────────────────────
  {
    id: "tw-ic-asic-ip",
    label: "IC 設計｜IP 授權與客製 ASIC 設計",
    category: "ic-design",
    market: "TW",
    symbols: ["3661.TW", "3443.TW", "3035.TW", "6643.TWO", "3529.TWO", "5269.TW", "6533.TWO", "8261.TW"],
    description: "雲端服務商 (CSP) 自研晶片潮帶動，台灣 IP 授權與客製 ASIC 設計公司是這波核心受惠族群。世芯-KY 領頭 AWS Trainium 設計，創意是 TSMC 旗下，智原、力旺、M31 提供 SIP 授權。",
    tiers: {
      1: ["3661.TW", "3443.TW"],
      2: ["3035.TW", "3529.TWO", "5269.TW"],
      3: ["6643.TWO", "6533.TWO", "8261.TW"],
    },
  },
  {
    id: "tw-ic-hpc-network",
    label: "IC 設計｜HPC 與網通 IC",
    category: "ic-design",
    market: "TW",
    symbols: ["2454.TW", "3034.TW", "4966.TW", "5285.TWO", "6125.TWO", "6679.TW", "8086.TW"],
    description: "AI 資料中心、高效能運算、5G / WiFi 7 網通核心晶片設計。聯發科旗艦 SoC + 衛星晶片，瑞昱主攻乙太網路 / WiFi，譜瑞-KY 切入 USB / DP / HDMI 介面。",
    tiers: {
      1: ["2454.TW", "3034.TW"],
      2: ["4966.TW", "5285.TWO"],
      3: ["6125.TWO", "6679.TW", "8086.TW"],
    },
  },
  {
    id: "tw-ic-analog-power",
    label: "IC 設計｜類比與功率管理 IC",
    category: "ic-design",
    market: "TW",
    symbols: ["6202.TWO", "6286.TW", "8016.TW", "8081.TW", "3530.TW", "8261.TW", "3014.TW", "5471.TWO"],
    description: "電源管理 IC、訊號感測、嵌入式控制等核心類比晶片。電動車與 AI 伺服器對高精度功率管理需求結構性升級，是長期受惠主軸。",
    tiers: {
      1: ["6202.TWO", "6286.TW"],
      2: ["8016.TW", "8081.TW", "8261.TW"],
      3: ["3530.TW", "3014.TW", "5471.TWO"],
    },
  },
  {
    id: "tw-ic-display-driver",
    label: "IC 設計｜顯示驅動與觸控 IC",
    category: "ic-design",
    market: "TW",
    symbols: ["3034.TW", "8016.TW", "3686.TWO", "4961.TW", "3536.TWO", "5471.TWO"],
    description: "面板驅動 IC、TDDI、觸控 IC 等顯示鏈核心晶片。受惠面板報價回穩 + OLED / 車用顯示滲透率提升。",
    tiers: {
      1: ["3034.TW"],
      2: ["8016.TW", "4961.TW"],
      3: ["3686.TWO", "3536.TWO", "5471.TWO"],
    },
  },
  {
    id: "tw-ic-mcu",
    label: "IC 設計｜微控制器 / 工控 IC",
    category: "ic-design",
    market: "TW",
    symbols: ["6202.TWO", "8081.TW", "8131.TW", "4961.TW", "6235.TWO", "5471.TWO"],
    description: "MCU / 工業用控制晶片。電動車 / 工業 4.0 / IoT 推升結構性需求，且國產替代潮持續。",
    tiers: {
      1: ["6202.TWO"],
      2: ["8081.TW", "4961.TW"],
      3: ["8131.TW", "6235.TWO", "5471.TWO"],
    },
  },

  // ─── 2. 半導體製造 ──────────────────────────────────
  {
    id: "tw-semi-foundry",
    label: "半導體製造｜晶圓代工",
    category: "semi-manufacture",
    market: "TW",
    symbols: ["2330.TW", "2303.TW", "5347.TWO", "6770.TW"],
    description: "全球晶圓代工霸主在台灣。台積電獨佔 3nm/2nm 先進製程；聯電 / 世界先進專攻成熟製程；力積電承接記憶體 / Driver IC 代工。",
    tiers: {
      1: ["2330.TW"],
      2: ["2303.TW", "5347.TWO"],
      3: ["6770.TW"],
    },
  },
  {
    id: "tw-semi-wafer",
    label: "半導體製造｜矽晶圓與材料",
    category: "semi-manufacture",
    market: "TW",
    symbols: ["6488.TWO", "5483.TWO", "6182.TW", "3105.TWO", "8110.TW"],
    description: "矽晶圓三大廠之一在台。環球晶為全球第三大矽晶圓供應商，中美晶是母公司，合晶切入 12 吋拋光晶圓。",
    tiers: {
      1: ["6488.TWO"],
      2: ["5483.TWO", "6182.TW"],
      3: ["3105.TWO", "8110.TW"],
    },
  },
  {
    id: "tw-semi-equipment",
    label: "半導體製造｜設備與耗材",
    category: "semi-manufacture",
    market: "TW",
    symbols: ["3680.TW", "3563.TW", "3324.TWO", "6147.TWO", "6510.TW", "6243.TW", "3171.TWO"],
    description: "前段製程設備、晶圓廠耗材、特殊氣體。家登為 EUV 光罩盒龍頭，辛耘做晶圓再生，京鼎做半導體真空腔體。",
    tiers: {
      1: ["3680.TW"],
      2: ["3563.TW", "6147.TWO"],
      3: ["3324.TWO", "6510.TW", "6243.TW", "3171.TWO"],
    },
  },
  {
    id: "tw-semi-third-gen",
    label: "半導體製造｜第三代半導體",
    category: "semi-manufacture",
    market: "TW",
    symbols: ["3105.TWO", "3016.TW", "6243.TW", "8086.TW", "3105.TWO"],
    description: "SiC 碳化矽 + GaN 氮化鎵第三代半導體。電動車主驅 inverter、AI 伺服器電源、快充等高功率場景的核心。",
    tiers: {
      1: ["3105.TWO"],
      2: ["3016.TW"],
      3: ["6243.TW", "8086.TW"],
    },
  },

  // ─── 3. 先進封測 ────────────────────────────────────
  {
    id: "tw-pkg-osat",
    label: "先進封測｜封裝測試 OSAT",
    category: "advanced-packaging",
    market: "TW",
    symbols: ["3711.TW", "2449.TW", "2363.TW", "6271.TW", "3527.TWO", "8131.TW"],
    description: "全球前段 OSAT 龍頭。日月光投控全球市佔第一，京元電是 IC 測試霸主，欣銓主攻邏輯 / 記憶體測試。",
    tiers: {
      1: ["3711.TW"],
      2: ["2449.TW", "6271.TW"],
      3: ["2363.TW", "3527.TWO", "8131.TW"],
    },
  },
  {
    id: "tw-pkg-cowos",
    label: "先進封測｜CoWoS 與先進封裝",
    category: "advanced-packaging",
    market: "TW",
    symbols: ["2330.TW", "3711.TW", "2449.TW", "3017.TW", "6271.TW", "3324.TWO"],
    description: "CoWoS (Chip-on-Wafer-on-Substrate) 是 NVIDIA H100 / B200 等 AI GPU 必經之路。TSMC 主導、日月光 / 京元電承接後段。",
    tiers: {
      1: ["2330.TW", "3711.TW"],
      2: ["2449.TW", "3017.TW"],
      3: ["6271.TW", "3324.TWO"],
    },
  },
  {
    id: "tw-pkg-probe",
    label: "先進封測｜探針卡與測試介面",
    category: "advanced-packaging",
    market: "TW",
    symbols: ["6223.TWO", "6515.TW", "3658.TW", "6125.TWO"],
    description: "晶圓 / 晶片測試介面。穎崴主攻 Test Socket、旺矽做 MEMS 探針卡。AI 晶片高 IO 密度推升測試介面複雜度。",
    tiers: {
      1: ["6515.TW", "6223.TWO"],
      2: ["3658.TW"],
      3: ["6125.TWO"],
    },
  },
  {
    id: "tw-pkg-substrate",
    label: "先進封測｜IC 載板 / ABF",
    category: "advanced-packaging",
    market: "TW",
    symbols: ["3037.TW", "8046.TW", "3189.TW", "6173.TWO", "8358.TWO"],
    description: "ABF 載板是高階晶片承載核心。欣興 / 南電 / 景碩三大寡占。AI 晶片出貨增加 → ABF 結構性升級。",
    tiers: {
      1: ["3037.TW", "8046.TW"],
      2: ["3189.TW"],
      3: ["6173.TWO", "8358.TWO"],
    },
  },

  // ─── 4. 記憶體 ──────────────────────────────────────
  {
    id: "tw-mem-dram",
    label: "記憶體｜DRAM 與利基型記憶體",
    category: "memory",
    market: "TW",
    symbols: ["2408.TW", "2344.TW", "2337.TW", "5288.TWO", "5351.TWO", "8104.TW"],
    description: "南亞科切入 standard DRAM，華邦電做利基型 + Flash，旺宏主攻 NOR Flash / ROM 程式碼儲存。受惠 AI 伺服器與車用記憶體需求結構性升級。",
    tiers: {
      1: ["2408.TW", "2344.TW", "2337.TW"],
      2: ["5351.TWO"],
      3: ["5288.TWO", "8104.TW"],
    },
  },
  {
    id: "tw-mem-nand",
    label: "記憶體｜NAND 與 SSD 模組",
    category: "memory",
    market: "TW",
    symbols: ["8299.TWO", "4967.TW", "8086.TW", "2451.TW", "3260.TW"],
    description: "群聯主攻 SSD 控制 IC + 模組，宇瞻 / 創見 / 十銓做 NAND 模組品牌。AI 伺服器 + 車用儲存推升結構性需求。",
    tiers: {
      1: ["8299.TWO"],
      2: ["4967.TW", "2451.TW"],
      3: ["8086.TW", "3260.TW"],
    },
  },
  {
    id: "tw-mem-hbm-concept",
    label: "記憶體｜HBM 概念股",
    category: "memory",
    market: "TW",
    symbols: ["3105.TWO", "3680.TW", "8131.TW", "6531.TW", "2449.TW"],
    description: "HBM 由 SK Hynix / 三星 / 美光主導，但台廠在 HBM 測試、封裝、設備與耗材有關鍵切入。穩懋做 SiC / GaN，家登做光罩盒，京元電做測試。",
    tiers: {
      1: ["3105.TWO", "3680.TW"],
      2: ["2449.TW"],
      3: ["8131.TW", "6531.TW"],
    },
  },

  // ─── 5. AI 伺服器 ────────────────────────────────────
  {
    id: "tw-ai-odm",
    label: "AI 伺服器｜整機 ODM 代工",
    category: "ai-server",
    market: "TW",
    symbols: ["6669.TW", "2382.TW", "3231.TW", "2356.TW", "2324.TW", "2376.TW"],
    description: "NVDA / AMD AI GPU 的整機組裝服務。緯穎是 Meta / Microsoft 主要 ODM；廣達 / 緯創拿 GB200 大單；英業達 + 仁寶補位。",
    tiers: {
      1: ["6669.TW", "2382.TW"],
      2: ["3231.TW", "2356.TW"],
      3: ["2324.TW", "2376.TW"],
    },
  },
  {
    id: "tw-ai-power-bbu",
    label: "AI 伺服器｜電源與 BBU",
    category: "ai-server",
    market: "TW",
    symbols: ["2308.TW", "2301.TW", "6196.TW", "5443.TWO", "2417.TW"],
    description: "AI 機櫃功率從 15kW 飆到 100kW+，電源轉換 + 備援電池 (BBU) 需求暴增。台達電是電源霸主，光寶 / 康舒 / 群電補位。",
    tiers: {
      1: ["2308.TW"],
      2: ["2301.TW", "6196.TW"],
      3: ["5443.TWO", "2417.TW"],
    },
  },
  {
    id: "tw-ai-server-component",
    label: "AI 伺服器｜機構與連接器",
    category: "ai-server",
    market: "TW",
    symbols: ["2354.TW", "8210.TW", "3017.TW", "3711.TW", "3023.TW", "3653.TW"],
    description: "AI 伺服器機殼、滑軌、連接器、線材。鴻準切入散熱模組，勤誠做機箱，嘉澤 / 信邦做高速連接器。",
    tiers: {
      1: ["2354.TW", "8210.TW"],
      2: ["3017.TW", "3023.TW"],
      3: ["3711.TW", "3653.TW"],
    },
  },

  // ─── 6. 散熱冷卻 ────────────────────────────────────
  {
    id: "tw-cooling-liquid",
    label: "散熱冷卻｜液冷與 3D VC",
    category: "cooling",
    market: "TW",
    symbols: ["3324.TWO", "3017.TW", "3653.TW", "6230.TW", "8131.TW"],
    description: "AI GPU 從 700W 飆到 1500W+，氣冷已不夠用。雙鴻 / 奇鋐主攻 3D VC + 液冷板，健策做散熱模組。",
    tiers: {
      1: ["3324.TWO", "3017.TW"],
      2: ["3653.TW", "6230.TW"],
      3: ["8131.TW"],
    },
  },
  {
    id: "tw-cooling-fan",
    label: "散熱冷卻｜風扇與氣冷",
    category: "cooling",
    market: "TW",
    symbols: ["2059.TW", "2391.TW", "6133.TW", "3324.TWO"],
    description: "風扇、散熱模組、CPU cooler。AI Server 風量 / 風壓需求倍增。建準是直流風扇龍頭，超眾做 heat pipe。",
    tiers: {
      1: ["2059.TW", "2391.TW"],
      2: ["6133.TW"],
      3: ["3324.TWO"],
    },
  },

  // ─── 7. 網通衛星 ────────────────────────────────────
  {
    id: "tw-network-switch",
    label: "網通衛星｜Switch 與 Router",
    category: "network-satellite",
    market: "TW",
    symbols: ["2345.TW", "3380.TW", "6285.TW", "3596.TW", "2419.TW"],
    description: "高速網通設備（800G / 1.6T switch）。智邦是 Arista 主力代工廠，明泰做 ODM，啟碁 / 智易切入 WiFi 7 路由器。",
    tiers: {
      1: ["2345.TW"],
      2: ["3380.TW", "6285.TW"],
      3: ["3596.TW", "2419.TW"],
    },
  },
  {
    id: "tw-network-optical",
    label: "網通衛星｜光通訊與矽光子",
    category: "network-satellite",
    market: "TW",
    symbols: ["4977.TWO", "3081.TWO", "3363.TW", "4979.TW", "3163.TWO"],
    description: "資料中心高速光收發模組、PIC（光子積體電路）。眾達-KY 切入 800G/1.6T 模組，聯亞 / 上詮做光通訊元件，CPO 是下一波結構性升級。",
    tiers: {
      1: ["4977.TWO", "4979.TW"],
      2: ["3081.TWO", "3363.TW"],
      3: ["3163.TWO"],
    },
  },
  {
    id: "tw-network-satellite",
    label: "網通衛星｜低軌衛星與衛星終端",
    category: "network-satellite",
    market: "TW",
    symbols: ["3491.TW", "2314.TW", "4938.TW", "2312.TW", "3023.TW"],
    description: "Starlink / OneWeb / 國產低軌衛星地面接收站、終端設備、衛星本體零組件。昇達科做射頻，台揚做衛星終端，和碩切入 Starlink 代工。",
    tiers: {
      1: ["3491.TW", "4938.TW"],
      2: ["2314.TW"],
      3: ["2312.TW", "3023.TW"],
    },
  },

  // ─── 8. 被動元件 ────────────────────────────────────
  {
    id: "tw-passive-mlcc",
    label: "被動元件｜MLCC 電容",
    category: "passive",
    market: "TW",
    symbols: ["2327.TW", "2492.TW", "6173.TWO", "8042.TWO", "3026.TW"],
    description: "MLCC（積層陶瓷電容）是電子系統儲能、濾波核心。AI 伺服器與電動車對高壓 / 高容值 MLCC 需求結構性升級。國巨全球前三大。",
    tiers: {
      1: ["2327.TW"],
      2: ["2492.TW", "6173.TWO"],
      3: ["8042.TWO", "3026.TW"],
    },
  },
  {
    id: "tw-passive-inductor",
    label: "被動元件｜功率電感",
    category: "passive",
    market: "TW",
    symbols: ["2456.TW", "5388.TWO", "3017.TW", "6121.TWO", "6224.TW"],
    description: "電源管理 + EMI 抑制核心元件。AI 伺服器電源、電動車動力系統推升結構性需求。奇力新 / 千如 / 美磊主導。",
    tiers: {
      1: ["2456.TW"],
      2: ["5388.TWO"],
      3: ["6121.TWO", "3017.TW", "6224.TW"],
    },
  },
  {
    id: "tw-passive-resistor",
    label: "被動元件｜電阻與被動保護",
    category: "passive",
    market: "TW",
    symbols: ["2327.TW", "3026.TW", "2375.TW", "3033.TW", "3044.TW"],
    description: "晶片電阻、精密薄膜電阻、過電流保護元件。電動車與 AI 伺服器對高精度電阻需求結構性升級。",
    tiers: {
      1: ["2327.TW"],
      2: ["3026.TW", "2375.TW"],
      3: ["3033.TW", "3044.TW"],
    },
  },
  {
    id: "tw-passive-crystal",
    label: "被動元件｜石英頻率控制",
    category: "passive",
    market: "TW",
    symbols: ["3042.TW", "6243.TW", "8016.TW"],
    description: "石英諧振器、TCXO/VCXO/OCXO 振盪器、SAW/BAW 濾波器。AI 伺服器時鐘升級、車用 ADAS 用量倍增。",
    tiers: {
      1: ["3042.TW"],
      2: ["6243.TW"],
      3: ["8016.TW"],
    },
  },
  {
    id: "tw-passive-aluminum-cap",
    label: "被動元件｜鋁質電解電容 / 固態電容",
    category: "passive",
    market: "TW",
    symbols: ["2472.TW", "6225.TWO", "5317.TWO"],
    description: "鋁質電解電容 + 固態電容 — 伺服器電源、AI GPU 高功率電源不可缺。立隆電是台灣最大鋁電解電容廠，受惠 AI 伺服器電源規格升級。",
    tiers: {
      1: ["2472.TW"],
      2: ["6225.TWO"],
      3: ["5317.TWO"],
    },
  },

  // ─── 9. 電子零組件 ──────────────────────────────────
  {
    id: "tw-elec-connector",
    label: "電子零組件｜連接器與線材",
    category: "electronics",
    market: "TW",
    symbols: ["3023.TW", "3653.TW", "3665.TW", "8086.TW", "1605.TW", "3679.TW"],
    description: "連接器、銅箔基板、銅箔片等基礎元件。AI 伺服器中內外部連接器用量遠高於一般 server。信邦 / 健和興 / 貿聯-KY 為核心。",
    tiers: {
      1: ["3023.TW", "3665.TW"],
      2: ["3653.TW", "3679.TW"],
      3: ["1605.TW", "8086.TW"],
    },
  },
  {
    id: "tw-elec-pcb",
    label: "電子零組件｜PCB",
    category: "electronics",
    market: "TW",
    symbols: ["3044.TW", "2383.TW", "6213.TW", "8112.TW", "8046.TW", "2316.TW"],
    description: "印刷電路板 — 所有電子產品的基礎。台光電是 CCL（銅箔基板）龍頭，健鼎 / 欣興 / 聯茂分屬不同應用。AI 伺服器板用量比一般 server 多 5-10 倍。",
    tiers: {
      1: ["2383.TW", "3044.TW"],
      2: ["6213.TW", "8046.TW"],
      3: ["8112.TW", "2316.TW"],
    },
  },

  // ─── 10. 光學顯示 ───────────────────────────────────
  {
    id: "tw-optics-lens",
    label: "光學顯示｜鏡頭模組",
    category: "optics-display",
    market: "TW",
    symbols: ["3008.TW", "3406.TW", "3530.TW", "8016.TW", "3105.TWO"],
    description: "iPhone 主鏡頭 + AR/VR + 車用感測器三大應用。大立光長期是 iPhone 主鏡頭龍頭，玉晶光做廣角，晶相光主攻車用。",
    tiers: {
      1: ["3008.TW"],
      2: ["3406.TW", "3530.TW"],
      3: ["8016.TW", "3105.TWO"],
    },
  },
  {
    id: "tw-optics-panel",
    label: "光學顯示｜面板與背光",
    category: "optics-display",
    market: "TW",
    symbols: ["2409.TW", "3481.TW", "6116.TW", "8081.TW"],
    description: "面板雙雄 + 彩晶。受惠 AI PC / 車用顯示 / OLED 滲透率提升。",
    tiers: {
      1: ["2409.TW", "3481.TW"],
      2: ["6116.TW"],
      3: ["8081.TW"],
    },
  },
  {
    id: "tw-optics-touch-oled",
    label: "光學顯示｜觸控 / OLED",
    category: "optics-display",
    market: "TW",
    symbols: ["6456.TW", "3673.TW", "2448.TW", "3514.TW"],
    description: "觸控感測 + OLED / Micro LED 顯示技術。GIS-KY、TPK-KY 切入觸控，晶電 / 隆達做 LED。",
    tiers: {
      1: ["6456.TW"],
      2: ["3673.TW"],
      3: ["2448.TW", "3514.TW"],
    },
  },

  // ─── 11. 電動車 ─────────────────────────────────────
  {
    id: "tw-ev-vehicle",
    label: "電動車｜整車與系統整合",
    category: "ev",
    market: "TW",
    symbols: ["2207.TW", "2201.TW", "2227.TW", "2228.TW"],
    description: "Toyota 在台代理 + 國產車品牌。電動車轉型過渡期受惠 ADAS 滲透率提升。",
    tiers: {
      1: ["2207.TW"],
      2: ["2201.TW"],
      3: ["2227.TW", "2228.TW"],
    },
  },
  {
    id: "tw-ev-powertrain",
    label: "電動車｜三電系統與動力總成",
    category: "ev",
    market: "TW",
    symbols: ["1504.TW", "1503.TW", "1536.TW", "8255.TWO", "8261.TW"],
    description: "馬達、電控、減速機等動力總成核心。東元 / 士電做馬達，和大切入特斯拉齒輪，朋程做車用功率半導體。",
    tiers: {
      1: ["1504.TW", "1536.TW"],
      2: ["1503.TW", "8255.TWO"],
      3: ["8261.TW"],
    },
  },
  {
    id: "tw-ev-charging",
    label: "電動車｜充電樁與基礎建設",
    category: "ev",
    market: "TW",
    symbols: ["1519.TW", "2308.TW", "1503.TW", "8403.TWO"],
    description: "充電樁、變壓器、儲能配套。華城 + 士電是重電雙雄，台達電做車用 OBC + 充電樁。",
    tiers: {
      1: ["1519.TW", "2308.TW"],
      2: ["1503.TW"],
      3: ["8403.TWO"],
    },
  },
  {
    id: "tw-ev-auto-semi",
    label: "電動車｜車用半導體",
    category: "ev",
    market: "TW",
    symbols: ["8255.TWO", "3105.TWO", "8261.TW", "8081.TW", "5483.TWO"],
    description: "車用 MCU、SiC 功率半導體、車用 IC。電動車單車半導體含量是傳統車的 4-10 倍。朋程做 SiC，穩懋切第三代半導體。",
    tiers: {
      1: ["8255.TWO", "3105.TWO"],
      2: ["8261.TW", "8081.TW"],
      3: ["5483.TWO"],
    },
  },

  // ─── 12. 綠能環保 ───────────────────────────────────
  {
    id: "tw-green-solar",
    label: "綠能環保｜太陽能",
    category: "green-energy",
    market: "TW",
    symbols: ["6443.TW", "3576.TW", "3438.TW"],
    description: "矽晶太陽能電池與模組。聯合再生為國內最大整合廠，元晶切入 N 型 TOPCon 高效電池。",
    tiers: {
      1: ["3576.TW"],
      2: ["6443.TW"],
      3: ["3438.TW"],
    },
  },
  {
    id: "tw-green-wind",
    label: "綠能環保｜風電",
    category: "green-energy",
    market: "TW",
    symbols: ["1513.TW", "9958.TW", "3712.TW"],
    description: "離岸風電水下基礎 + 風機零組件 + 海事工程。世紀鋼是水下基礎龍頭，永冠-KY 做風機鑄件。",
    tiers: {
      1: ["1513.TW"],
      2: ["9958.TW"],
      3: ["3712.TW"],
    },
  },
  {
    id: "tw-green-storage",
    label: "綠能環保｜儲能與電池材料",
    category: "green-energy",
    market: "TW",
    symbols: ["2308.TW", "4739.TW", "4721.TW", "8038.TWO", "5234.TWO"],
    description: "儲能系統 + 鋰電池正負極材料。台達電做儲能逆變器 + 系統，康普 / 美琪瑪做正極材料前驅體，長園科做正極材料。",
    tiers: {
      1: ["2308.TW"],
      2: ["4739.TW", "4721.TW"],
      3: ["8038.TWO", "5234.TWO"],
    },
  },

  // ─── 13. 智慧機器人 ─────────────────────────────────
  {
    id: "tw-robot-industrial",
    label: "智慧機器人｜工業機器人與自動化",
    category: "robotics",
    market: "TW",
    symbols: ["2049.TW", "1590.TW", "4942.TWO", "1597.TW", "7416.TWO"],
    description: "工業機器人 + 線性傳動 + 減速機。上銀做減速機 + 滾珠螺桿，亞德客-KY 主攻氣動，新代切入工具機控制器。",
    tiers: {
      1: ["2049.TW", "1590.TW"],
      2: ["4942.TWO"],
      3: ["1597.TW", "7416.TWO"],
    },
  },
  {
    id: "tw-robot-humanoid",
    label: "智慧機器人｜人形機器人零組件",
    category: "robotics",
    market: "TW",
    symbols: ["1536.TW", "2049.TW", "1597.TW", "8255.TWO", "4942.TWO"],
    description: "Tesla Optimus / 中國人形機器人浪潮。和大做減速機 + 齒輪，上銀提供關節傳動，朋程做車規功率半導體。",
    tiers: {
      1: ["1536.TW", "2049.TW"],
      2: ["1597.TW"],
      3: ["8255.TWO", "4942.TWO"],
    },
  },
  {
    id: "tw-robot-cnc",
    label: "智慧機器人｜CNC 工具機",
    category: "robotics",
    market: "TW",
    symbols: ["1597.TW", "4526.TW", "1530.TW", "6609.TW", "1582.TW"],
    description: "電腦數控工具機。中國設備換新潮 + 全球製造業回流是兩大動能。直得 / 東台 / 亞崴主導完整 CNC 機台。",
    tiers: {
      1: ["1597.TW", "1530.TW"],
      2: ["4526.TW"],
      3: ["6609.TW", "1582.TW"],
    },
  },

  // ─── 14. 軟體資安 ──────────────────────────────────
  {
    id: "tw-software-cyber",
    label: "軟體資安｜資訊安全",
    category: "software-security",
    market: "TW",
    symbols: ["6160.TWO", "3664.TWO", "6195.TWO", "5530.TWO"],
    description: "資安服務 + 端點防護 + 零信任架構。安碁資訊 (宏碁集團)、安瑞-KY 主攻網路安全。",
    tiers: {
      1: ["6160.TWO", "3664.TWO"],
      2: ["6195.TWO"],
      3: ["5530.TWO"],
    },
  },
  {
    id: "tw-software-cloud",
    label: "軟體資安｜雲端軟體與系統整合",
    category: "software-security",
    market: "TW",
    symbols: ["6112.TWO", "2453.TW", "2722.TW", "3289.TWO"],
    description: "企業軟體 + ERP + 系統整合。叡揚、敦陽科、宏全為主要玩家。AI 推動企業數位轉型新一波需求。",
    tiers: {
      1: ["6112.TWO", "2453.TW"],
      2: ["2722.TW"],
      3: ["3289.TWO"],
    },
  },

  // ─── 15. 消費終端 ───────────────────────────────────
  {
    id: "tw-consumer-apple",
    label: "消費終端｜蘋果鏈",
    category: "consumer",
    market: "TW",
    symbols: ["2317.TW", "2354.TW", "4958.TW", "3008.TW", "3037.TW", "3406.TW"],
    description: "Apple iPhone / Mac / Vision Pro 供應鏈。鴻海組裝、大立光鏡頭、臻鼎-KY 軟板、欣興載板。",
    tiers: {
      1: ["2317.TW", "3008.TW"],
      2: ["2354.TW", "4958.TW", "3037.TW"],
      3: ["3406.TW"],
    },
  },
  {
    id: "tw-consumer-pc",
    label: "消費終端｜PC / NB 與週邊",
    category: "consumer",
    market: "TW",
    symbols: ["2376.TW", "2377.TW", "2353.TW", "2357.TW", "2324.TW"],
    description: "PC / NB 品牌 + 主板顯卡 + 週邊。技嘉 / 微星雙頭吃主板 + 顯卡 + AI Server，宏碁 / 華碩做品牌 NB。",
    tiers: {
      1: ["2376.TW", "2377.TW"],
      2: ["2357.TW", "2353.TW"],
      3: ["2324.TW"],
    },
  },
  {
    id: "tw-consumer-aiot",
    label: "消費終端｜AIoT 與工業電腦",
    category: "consumer",
    market: "TW",
    symbols: ["2395.TW", "3706.TW", "3592.TW", "8131.TW", "6285.TW"],
    description: "工業電腦 + AIoT 應用。研華是工業電腦霸主，神達切入 IoT 邊緣運算。",
    tiers: {
      1: ["2395.TW"],
      2: ["3706.TW", "3592.TW"],
      3: ["8131.TW", "6285.TW"],
    },
  },

  // ─── 16. 多元產業 ───────────────────────────────────
  {
    id: "tw-diverse-finance",
    label: "多元產業｜金融",
    category: "diverse",
    market: "TW",
    symbols: ["2882.TW", "2881.TW", "2891.TW", "2884.TW", "2886.TW", "5880.TW", "2890.TW"],
    description: "金控股。國泰金 / 富邦金為兩大龍頭，業務以壽險為主，受利率與台幣匯率波動影響大。",
    tiers: {
      1: ["2882.TW", "2881.TW"],
      2: ["2891.TW", "2886.TW", "2884.TW"],
      3: ["5880.TW", "2890.TW"],
    },
  },
  {
    id: "tw-diverse-shipping",
    label: "多元產業｜航運（貨櫃 / 散裝）",
    category: "diverse",
    market: "TW",
    symbols: ["2603.TW", "2609.TW", "2615.TW", "2606.TW", "2605.TW", "5608.TW"],
    description: "貨櫃三雄 + 散裝。受全球貿易、運價（SCFI/BDI）、油價、地緣風險影響。",
    tiers: {
      1: ["2603.TW", "2609.TW"],
      2: ["2615.TW", "2606.TW"],
      3: ["2605.TW", "5608.TW"],
    },
  },
  {
    id: "tw-diverse-aviation",
    label: "多元產業｜航空與觀光",
    category: "diverse",
    market: "TW",
    symbols: ["2610.TW", "2618.TW", "2727.TW", "2731.TW"],
    description: "兩大航空 + 觀光餐飲。受油價、匯率、國際旅遊復甦影響。",
    tiers: {
      1: ["2618.TW", "2610.TW"],
      2: ["2727.TW"],
      3: ["2731.TW"],
    },
  },
  {
    id: "tw-diverse-traditional",
    label: "多元產業｜傳產（化工 / 鋼鐵 / 水泥）",
    category: "diverse",
    market: "TW",
    symbols: ["1301.TW", "1303.TW", "1326.TW", "2002.TW", "1101.TW", "1102.TW"],
    description: "石化 + 鋼鐵 + 水泥三大循環產業。受全球景氣、原物料價格影響。",
    tiers: {
      1: ["1301.TW", "1303.TW", "2002.TW"],
      2: ["1326.TW", "1101.TW"],
      3: ["1102.TW"],
    },
  },
  {
    id: "tw-diverse-defense",
    label: "多元產業｜軍工與國防",
    category: "diverse",
    market: "TW",
    symbols: ["2634.TW", "8033.TW", "8222.TW", "2462.TW", "5483.TWO"],
    description: "國防自主政策受惠族群。漢翔做國機國造，雷虎做無人機，寶一做精密機械加工。地緣風險升溫 = 直接受惠。",
    tiers: {
      1: ["2634.TW"],
      2: ["8033.TW", "2462.TW"],
      3: ["8222.TW", "5483.TWO"],
    },
  },
  {
    id: "tw-diverse-food",
    label: "多元產業｜食品與民生消費",
    category: "diverse",
    market: "TW",
    symbols: ["1216.TW", "2912.TW", "1227.TW", "1234.TW", "1455.TW"],
    description: "食品 + 通路品牌。統一 + 統一超 為龍頭。防禦型配置，受惠通膨轉嫁。",
    tiers: {
      1: ["1216.TW", "2912.TW"],
      2: ["1227.TW"],
      3: ["1234.TW", "1455.TW"],
    },
  },
  {
    id: "tw-diverse-textile",
    label: "多元產業｜紡織與成衣",
    category: "diverse",
    market: "TW",
    symbols: ["1476.TW", "1474.TW", "9910.TW", "1402.TW"],
    description: "成衣代工 + 機能紡織。儒鴻 / 聚陽切入 Nike / Lulu 機能服飾代工，受惠運動服飾品牌成長。",
    tiers: {
      1: ["1476.TW", "1474.TW"],
      2: ["9910.TW"],
      3: ["1402.TW"],
    },
  },
  {
    id: "tw-diverse-telecom",
    label: "多元產業｜電信",
    category: "diverse",
    market: "TW",
    symbols: ["2412.TW", "3045.TW", "4904.TW"],
    description: "三大電信業者。穩定現金流配置，受惠 5G 滲透率提升 + 衛星通訊新業務。",
    tiers: {
      1: ["2412.TW"],
      2: ["3045.TW", "4904.TW"],
    },
  },
];

// ═══════════════════════════════════════════════════════════════
// 美股題材（簡化版，user 重點在台股）
// ═══════════════════════════════════════════════════════════════

export const US_SECTORS: SectorGroup[] = [
  {
    id: "us-ic-design-ai",
    label: "IC 設計｜AI 半導體",
    category: "ic-design",
    market: "US",
    symbols: ["NVDA", "AVGO", "AMD", "MRVL", "ARM"],
    description: "AI GPU 與定制 AI ASIC 龍頭。NVDA 獨佔資料中心 GPU，AVGO 切入 Google TPU 設計服務。",
    tiers: { 1: ["NVDA", "AVGO"], 2: ["AMD"], 3: ["MRVL", "ARM"] },
  },
  {
    id: "us-semi-foundry-equip",
    label: "半導體製造｜代工與設備",
    category: "semi-manufacture",
    market: "US",
    symbols: ["TSM", "ASML", "AMAT", "LRCX", "KLAC"],
    description: "晶圓代工 + EUV / 製程設備供應商。TSM (ADR) + ASML 為兩大核心。",
    tiers: { 1: ["TSM", "ASML"], 2: ["AMAT", "LRCX"], 3: ["KLAC"] },
  },
  {
    id: "us-memory",
    label: "記憶體｜DRAM / NAND / HBM",
    category: "memory",
    market: "US",
    symbols: ["MU", "SNDK", "WDC", "STX"],
    description: "DRAM / NAND / HBM 與儲存。MU 是 HBM3 主要供應商之一。",
    tiers: { 1: ["MU"], 2: ["WDC", "SNDK"], 3: ["STX"] },
  },
  {
    id: "us-ai-server",
    label: "AI 伺服器｜整機與資料中心",
    category: "ai-server",
    market: "US",
    symbols: ["DELL", "SMCI", "HPE", "ORCL"],
    description: "AI 整機品牌 + 資料中心建構商。DELL / SMCI 大量採用 NVDA GPU 出貨。",
    tiers: { 1: ["DELL", "SMCI"], 2: ["HPE"], 3: ["ORCL"] },
  },
  {
    id: "us-network-optical",
    label: "網通衛星｜光通訊與網通",
    category: "network-satellite",
    market: "US",
    symbols: ["ANET", "CIEN", "COHR", "LITE", "AAOI"],
    description: "資料中心高速光通訊、800G/1.6T 光收發、矽光子。LITE / COHR 為核心光元件。",
    tiers: { 1: ["ANET", "COHR"], 2: ["LITE", "CIEN"], 3: ["AAOI"] },
  },
  {
    id: "us-software-cloud",
    label: "軟體資安｜雲端 / SaaS",
    category: "software-security",
    market: "US",
    symbols: ["MSFT", "GOOGL", "AMZN", "CRM", "NOW", "NET", "SNOW", "DDOG", "PLTR"],
    description: "雲端三巨頭 + 企業 SaaS。AI Agent、企業數位化推動下一波結構性成長。",
    tiers: { 1: ["MSFT", "GOOGL", "AMZN"], 2: ["CRM", "NOW", "PLTR"], 3: ["NET", "SNOW", "DDOG"] },
  },
  {
    id: "us-software-cyber",
    label: "軟體資安｜資安",
    category: "software-security",
    market: "US",
    symbols: ["CRWD", "PANW", "ZS", "OKTA", "S"],
    description: "雲端資安、身分驗證、端點防護。",
    tiers: { 1: ["CRWD", "PANW"], 2: ["ZS", "OKTA"], 3: ["S"] },
  },
  {
    id: "us-consumer-mag7",
    label: "消費終端｜Magnificent 7",
    category: "consumer",
    market: "US",
    symbols: ["AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA", "TSLA"],
    description: "美股大型科技七巨頭，占 S&P 500 約 30% 權重。",
    tiers: { 1: ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA"], 2: ["META", "TSLA"] },
  },
  {
    id: "us-ev-tesla",
    label: "電動車｜Tesla 與電動車",
    category: "ev",
    market: "US",
    symbols: ["TSLA", "NIO", "XPEV", "LI", "RIVN"],
    description: "Tesla 引領自駕、機器人、儲能多領域，中國造車三傑次之。",
    tiers: { 1: ["TSLA"], 2: ["LI", "NIO"], 3: ["XPEV", "RIVN"] },
  },
  {
    id: "us-diverse-finance",
    label: "多元產業｜金融與銀行",
    category: "diverse",
    market: "US",
    symbols: ["JPM", "BAC", "GS", "MS", "WFC", "C"],
    description: "大型投資銀行與商業銀行。",
    tiers: { 1: ["JPM", "BAC", "GS"], 2: ["MS", "WFC"], 3: ["C"] },
  },
  {
    id: "us-diverse-healthcare",
    label: "多元產業｜醫療 / 製藥",
    category: "diverse",
    market: "US",
    symbols: ["LLY", "UNH", "JNJ", "PFE", "MRK", "ABBV", "NVO"],
    description: "大型藥廠 + 健康保險。GLP-1 減重藥、AI 藥物開發為新趨勢。",
    tiers: { 1: ["LLY", "UNH", "NVO"], 2: ["JNJ", "MRK", "ABBV"], 3: ["PFE"] },
  },
  {
    id: "us-diverse-energy",
    label: "多元產業｜能源",
    category: "diverse",
    market: "US",
    symbols: ["XOM", "CVX", "OXY", "COP"],
    description: "綜合石油公司。受油價、地緣政治影響大。",
    tiers: { 1: ["XOM", "CVX"], 2: ["COP"], 3: ["OXY"] },
  },
  {
    id: "us-diverse-china-adr",
    label: "多元產業｜中概股 ADR",
    category: "diverse",
    market: "US",
    symbols: ["BABA", "PDD", "JD", "BIDU"],
    description: "在美上市的中國互聯網平台。受中國消費景氣、地緣政治雙重影響。",
    tiers: { 1: ["BABA", "PDD"], 2: ["JD"], 3: ["BIDU"] },
  },
];

export function allSectorSymbols(market?: "TW" | "US"): string[] {
  const groups =
    market === "TW" ? TW_SECTORS : market === "US" ? US_SECTORS : [...TW_SECTORS, ...US_SECTORS];
  const set = new Set<string>();
  for (const g of groups) for (const s of g.symbols) set.add(s);
  return Array.from(set);
}

export function getSectorsOfSymbol(symbol: string): SectorGroup[] {
  return [...TW_SECTORS, ...US_SECTORS].filter((s) => s.symbols.includes(symbol));
}

export function getSectorById(id: string): SectorGroup | null {
  return [...TW_SECTORS, ...US_SECTORS].find((s) => s.id === id) ?? null;
}

export function getSectorsOfCategory(category: Category, market?: "TW" | "US"): SectorGroup[] {
  const groups =
    market === "TW" ? TW_SECTORS : market === "US" ? US_SECTORS : [...TW_SECTORS, ...US_SECTORS];
  return groups.filter((s) => s.category === category);
}
