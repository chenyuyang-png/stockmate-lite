// 低軌衛星 (LEO) 完整供應鏈資料庫 — 公開資料整理
//
// 範圍：
//   1. 主要衛星星系時間軸（Starlink / Kuiper / OneWeb / 中國低軌）
//   2. 10 大類零組件供應鏈
//   3. 每類別下台股 tier 1-3 對應 + 角色說明
//
// 法律：純公開資料整理、不構成投資建議。
//      資料源：SpaceX / Amazon Kuiper / OneWeb 公開資訊 +
//             台灣太空中心 (TASA) + 各廠商法說 / IR 整理。

// ─── 星系時間軸 ──────────────────────────────────────────

export type LeoConstellation =
  | "Starlink"
  | "Kuiper"
  | "OneWeb"
  | "China-LEO"
  | "Taiwan-FORMOSAT"
  | "Direct-to-Cell";

export type LeoStatus = "shipping" | "ramping" | "upcoming" | "roadmap";

export type LeoProgram = {
  id: string;
  constellation: LeoConstellation;
  name: string;
  status: LeoStatus;
  /** 預計 / 實際時間 */
  timeline: string;
  /** 一句話描述 */
  brief: string;
  /** 規格 / 數量 */
  specs?: {
    operator?: string;
    satellites?: string;
    coverage?: string;
    keyTech?: string;
    launchVehicle?: string;
  };
  /** 此 program 用到的零組件 ID */
  components: string[];
  highlighted?: boolean;
};

export const LEO_PROGRAMS: LeoProgram[] = [
  // ─── Starlink（已大量發射）───
  {
    id: "starlink-v2-mini",
    constellation: "Starlink",
    name: "Starlink V2 Mini",
    status: "shipping",
    timeline: "2023-2025 大量發射、目前在軌 ~7000 顆",
    brief: "Starlink 第二代縮小版、配 Falcon 9 一次 21 顆、全球佈設主力",
    specs: {
      operator: "SpaceX",
      satellites: "在軌 ~7,000 顆 / 目標 12,000+",
      coverage: "全球 70+ 國",
      keyTech: "Inter-satellite Laser、E-band 高頻",
      launchVehicle: "Falcon 9（21 顆 / 次）",
    },
    components: [
      "rf-microwave",
      "high-freq-pcb",
      "ground-cpe",
      "rf-connector",
      "sat-payload",
    ],
    highlighted: true,
  },
  {
    id: "starlink-v3",
    constellation: "Starlink",
    name: "Starlink V3",
    status: "ramping",
    timeline: "2025 H2 開始發射 / 2026 量產",
    brief: "第三代衛星、單顆 throughput ~1Tbps、需 Starship 發射",
    specs: {
      operator: "SpaceX",
      satellites: "目標 30,000 顆",
      keyTech: "1Tbps / 衛星、Direct-to-Cell 支援",
      launchVehicle: "Starship（一次 60+ 顆）",
    },
    components: [
      "rf-microwave",
      "high-freq-pcb",
      "ground-cpe",
      "sat-payload",
      "direct-to-cell-ic",
    ],
    highlighted: true,
  },
  {
    id: "starlink-direct-cell",
    constellation: "Direct-to-Cell",
    name: "Starlink Direct-to-Cell",
    status: "ramping",
    timeline: "2024 試運 / 2025-2026 商用擴大",
    brief: "衛星直連手機、跟全球電信商合作（T-Mobile US、Optus 等），不需 Starlink dish",
    specs: {
      operator: "SpaceX + 多家電信商",
      keyTech: "LTE/5G NTN（Non-Terrestrial Network）",
      coverage: "2025 涵蓋美國 / 2026 全球",
    },
    components: [
      "direct-to-cell-ic",
      "rf-microwave",
      "sat-payload",
      "carrier-service",
    ],
    highlighted: true,
  },

  // ─── Amazon Kuiper（剛開始）───
  {
    id: "kuiper",
    constellation: "Kuiper",
    name: "Amazon Project Kuiper",
    status: "ramping",
    timeline: "2024 Q4 首批發射 / 2026-2027 大量",
    brief: "Amazon 對標 Starlink、預計 2027 商用、配 KA1/KA2 衛星",
    specs: {
      operator: "Amazon",
      satellites: "目標 3,236 顆（FCC 核准）",
      keyTech: "Ka 波段 + Phased Array Antenna",
      launchVehicle: "Atlas V / Vulcan / New Glenn",
    },
    components: [
      "rf-microwave",
      "high-freq-pcb",
      "ground-cpe",
      "phased-array",
      "sat-payload",
    ],
    highlighted: true,
  },

  // ─── OneWeb（重組後）───
  {
    id: "oneweb-gen2",
    constellation: "OneWeb",
    name: "OneWeb Gen 2",
    status: "upcoming",
    timeline: "2026-2027 發射",
    brief: "OneWeb 與 Eutelsat 合併後的第二代、企業 + 政府客戶為主",
    specs: {
      operator: "Eutelsat OneWeb",
      satellites: "目標 6,372 顆（Gen 2）",
      keyTech: "Ku 波段 + Phased Array",
    },
    components: [
      "rf-microwave",
      "high-freq-pcb",
      "ground-cpe",
      "phased-array",
    ],
  },

  // ─── 中國低軌（國家隊）───
  {
    id: "china-guowang",
    constellation: "China-LEO",
    name: "中國國網 (Guowang) + 千帆星座",
    status: "ramping",
    timeline: "2024 開始密集發射 / 目標 2030 完成 13,000 顆",
    brief: "中國國家隊兩大低軌計劃、對抗 Starlink 軍事用途",
    specs: {
      operator: "中國衛星網路集團 / 上海垣信",
      satellites: "目標 13,000+ 顆",
      keyTech: "Ka/Ku 波段",
      launchVehicle: "長征 5/6/8 系列、可重複使用火箭",
    },
    components: ["rf-microwave", "ground-cpe", "phased-array"],
  },

  // ─── 台灣 / 國防 ───
  {
    id: "taiwan-leo",
    constellation: "Taiwan-FORMOSAT",
    name: "B5G 低軌通訊衛星 + 國防自主衛星",
    status: "upcoming",
    timeline: "2026-2028 預計發射首批 2 顆",
    brief:
      "太空中心 TASA + 中科院主導、6G 通訊 + 國防應用、可能跟中信通訊 / 美韓合作",
    specs: {
      operator: "TASA + 中科院 + 民間（漢翔等）",
      satellites: "首批 2 顆 + 後續 4-6 顆",
      keyTech: "Ka 波段 + 國產相位陣列天線",
    },
    components: ["sat-structure", "rf-microwave", "phased-array", "sat-payload"],
  },

  // ─── Apple / 蘋果 Globalstar ───
  {
    id: "apple-globalstar",
    constellation: "Direct-to-Cell",
    name: "iPhone Emergency SOS（Globalstar）",
    status: "shipping",
    timeline: "2022 上線 / 2024 擴大支援",
    brief:
      "蘋果 iPhone 14+ 內建衛星 SOS + iMessage、用 Globalstar 衛星，付給 Globalstar $4.5 億升級網路",
    specs: {
      operator: "Apple + Globalstar",
      keyTech: "L 波段 + Globalstar 自主衛星",
      coverage: "美/加 + 部分歐洲",
    },
    components: ["direct-to-cell-ic", "rf-microwave"],
  },
];

// ─── 零組件供應鏈分類 ───────────────────────────────────

export type LeoCategory =
  | "sat-payload"
  | "sat-structure"
  | "rf-microwave"
  | "high-freq-pcb"
  | "phased-array"
  | "ground-cpe"
  | "direct-to-cell-ic"
  | "rf-connector"
  | "carrier-service"
  | "test-integration";

export type LeoTwSupplier = {
  symbol: string;
  name: string;
  role: string;
  tier: 1 | 2 | 3;
};

export type LeoComponent = {
  id: string;
  category: LeoCategory;
  label: string;
  description: string;
  specHint?: string;
  globalSuppliers?: string[];
  twSuppliers: LeoTwSupplier[];
  usedIn: string[];
};

export const LEO_COMPONENTS: LeoComponent[] = [
  // ─── 衛星載荷 ───
  {
    id: "sat-payload",
    category: "sat-payload",
    label: "衛星通訊載荷（Transponder + 高頻晶片）",
    description:
      "衛星上把訊號收進來、放大、轉發回地面的核心模組。包含放大器、混頻器、濾波器、控制 IC。早期都進口、近年台廠開始切入特定模組。",
    specHint: "Ku/Ka/E 波段、單機 100W-1kW 功率輸出",
    globalSuppliers: ["Airbus DS", "L3Harris (美)", "Thales Alenia (歐)"],
    twSuppliers: [
      {
        symbol: "3491.TW",
        name: "昇達科",
        role: "微波元件 + 波導模組（衛星載荷上游、Starlink 供應鏈確認）",
        tier: 1,
      },
      {
        symbol: "3178.TWO",
        name: "公準",
        role: "微波 RF 元件（衛星 + 雷達雙領域）",
        tier: 2,
      },
      {
        symbol: "8064.TWO",
        name: "東捷",
        role: "衛星地面站 + 載荷模組測試",
        tier: 2,
      },
    ],
    usedIn: ["starlink-v2-mini", "starlink-v3", "kuiper", "taiwan-leo"],
  },

  // ─── 衛星本體結構 ───
  {
    id: "sat-structure",
    category: "sat-structure",
    label: "衛星本體 / 結構件 / 太陽能板",
    description:
      "衛星本身的「骨架」+ 推進系統 + 電源（太陽能板）。輕量化複合材料是關鍵。",
    globalSuppliers: ["Northrop Grumman", "Lockheed", "Airbus DS"],
    twSuppliers: [
      {
        symbol: "2634.TW",
        name: "漢翔",
        role:
          "衛星結構件 + 國防航太 IDM、跟 TASA 合作開發台灣自主衛星",
        tier: 1,
      },
      {
        symbol: "8033.TWO",
        name: "雷虎科技",
        role: "無人機 + 衛星整合系統",
        tier: 2,
      },
      {
        symbol: "8466.TW",
        name: "經緯航太",
        role: "衛星測試 + 無人機系統",
        tier: 3,
      },
    ],
    usedIn: ["taiwan-leo"],
  },

  // ─── 高頻 RF / 微波元件 ───
  {
    id: "rf-microwave",
    category: "rf-microwave",
    label: "高頻 RF / 微波元件（衛星核心）",
    description:
      "衛星 + 地面終端用的高頻訊號處理元件：功率放大器（PA）、低雜訊放大器（LNA）、濾波器、混頻器。Ku/Ka/E 波段越高頻、技術門檻越高。",
    specHint: "工作頻段 Ku（12-18GHz）/ Ka（26-40GHz）/ E（71-76GHz）",
    globalSuppliers: ["Qorvo", "Skyworks", "Analog Devices"],
    twSuppliers: [
      {
        symbol: "3491.TW",
        name: "昇達科",
        role: "微波元件龍頭、Starlink 供應鏈確認",
        tier: 1,
      },
      {
        symbol: "4968.TWO",
        name: "立積",
        role:
          "RF 功率放大器 + 切換 IC（衛星終端 + Wi-Fi）",
        tier: 1,
      },
      {
        symbol: "3178.TWO",
        name: "公準",
        role: "微波 RF 元件（衛星 + 雷達）",
        tier: 2,
      },
      {
        symbol: "3556.TWO",
        name: "禾瑞亞",
        role: "高頻 RF IC 設計",
        tier: 3,
      },
    ],
    usedIn: [
      "starlink-v2-mini",
      "starlink-v3",
      "kuiper",
      "oneweb-gen2",
      "china-guowang",
      "taiwan-leo",
      "apple-globalstar",
      "starlink-direct-cell",
    ],
  },

  // ─── 高頻 PCB / CCL ───
  {
    id: "high-freq-pcb",
    category: "high-freq-pcb",
    label: "高頻 PCB / 低介電損耗 CCL",
    description:
      "衛星 + 地面 CPE / 相位陣列天線用的特殊 PCB — 介電常數低 + 損耗小、能在 Ka 波段 26GHz+ 工作。台廠在這段是全球供應鏈重要角色。",
    specHint: "介電常數 Dk < 3.5、Df < 0.003、材料：PTFE / 改質環氧",
    globalSuppliers: ["Rogers (美)", "Panasonic (日)", "Isola (美)"],
    twSuppliers: [
      {
        symbol: "6274.TWO",
        name: "台燿",
        role: "高頻 CCL 銅箔基板（衛星 + 5G + AI 三領域）",
        tier: 1,
      },
      {
        symbol: "2383.TW",
        name: "台光電",
        role: "高頻 CCL（5G + 衛星）",
        tier: 1,
      },
      {
        symbol: "6153.TW",
        name: "嘉聯益",
        role: "高頻軟板 + PCB（衛星終端 + AI 銅纜）",
        tier: 1,
      },
      {
        symbol: "3037.TW",
        name: "欣興",
        role: "高密度 PCB（衛星 + AI 載板）",
        tier: 2,
      },
    ],
    usedIn: [
      "starlink-v2-mini",
      "starlink-v3",
      "kuiper",
      "oneweb-gen2",
      "china-guowang",
    ],
  },

  // ─── 相位陣列天線 ───
  {
    id: "phased-array",
    category: "phased-array",
    label: "相位陣列天線（Phased Array Antenna）",
    description:
      "可電子掃描 / 跟踪衛星的平板天線 — 不像傳統碟形需要機械轉動。Starlink dish、Kuiper terminal、OneWeb 終端都用相位陣列。設計需 PCB + RFIC + Beamforming 整合。",
    specHint: "每個 dish 含 1280+ 個 antenna element、整合 RFIC + PCB",
    globalSuppliers: ["Kymeta (美)", "ALCAN (英)", "Anokiwave (美)"],
    twSuppliers: [
      {
        symbol: "6980.TWO",
        name: "鐳洋",
        role:
          "衛星天線 + 5G 天線整合（台廠相位陣列代表）",
        tier: 1,
      },
      {
        symbol: "2392.TW",
        name: "正崴",
        role: "LEO 天線 + 連接器整合（Starlink dish 供應鏈）",
        tier: 1,
      },
      {
        symbol: "3491.TW",
        name: "昇達科",
        role: "相位陣列天線微波元件供應",
        tier: 2,
      },
    ],
    usedIn: ["starlink-v2-mini", "starlink-v3", "kuiper", "oneweb-gen2", "china-guowang"],
  },

  // ─── 地面 CPE 終端 ───
  {
    id: "ground-cpe",
    category: "ground-cpe",
    label: "地面用戶終端 CPE（Customer Premises Equipment）",
    description:
      "使用者家裡 / 企業裝的衛星接收終端 — Starlink dish、Kuiper terminal。整合天線、modem、Wi-Fi router、電源管理。台廠在 CPE 是全球大宗供應。",
    specHint: "Starlink dish ~600 USD、Kuiper terminal ~400 USD（規模化後）",
    globalSuppliers: ["—（多為台廠代工）"],
    twSuppliers: [
      {
        symbol: "6285.TW",
        name: "啟碁科技",
        role:
          "衛星 CPE 終端 + 5G/Wi-Fi 整合（Starlink dish + Kuiper 主力供應）",
        tier: 1,
      },
      {
        symbol: "2314.TW",
        name: "台揚",
        role: "衛星 CPE 終端 + Ku/Ka 波段 RF",
        tier: 1,
      },
      {
        symbol: "5388.TW",
        name: "中磊",
        role: "通訊網路設備 + 衛星終端",
        tier: 2,
      },
      {
        symbol: "3596.TW",
        name: "智易",
        role: "CPE 終端 + 路由器",
        tier: 2,
      },
      {
        symbol: "2419.TW",
        name: "仲琦",
        role: "通訊終端代工",
        tier: 3,
      },
    ],
    usedIn: [
      "starlink-v2-mini",
      "starlink-v3",
      "kuiper",
      "oneweb-gen2",
      "china-guowang",
    ],
  },

  // ─── 衛星直連手機 IC ───
  {
    id: "direct-to-cell-ic",
    category: "direct-to-cell-ic",
    label: "衛星直連手機晶片（NTN modem / Satellite SoC）",
    description:
      "讓一般手機透過 LTE / 5G NTN（Non-Terrestrial Network）直接連衛星、不需要 dish。聯發科是全球 NTN 晶片領頭羊、跟 SpaceX / Iridium 都合作。",
    specHint: "5G NR NTN（3GPP Release 17/18 標準）+ L 波段",
    globalSuppliers: ["Qualcomm（部分）", "MediaTek（領頭）", "Iridium"],
    twSuppliers: [
      {
        symbol: "2454.TW",
        name: "聯發科",
        role:
          "全球 NTN 衛星直連手機晶片領頭羊、與 SpaceX/Inmarsat 合作",
        tier: 1,
      },
      {
        symbol: "3094.TWO",
        name: "聯傑",
        role: "電源 IC + 衛星模組 IC",
        tier: 3,
      },
    ],
    usedIn: ["starlink-direct-cell", "apple-globalstar", "starlink-v3"],
  },

  // ─── RF 連接器 ───
  {
    id: "rf-connector",
    category: "rf-connector",
    label: "RF 連接器 / 波導連接",
    description:
      "高頻訊號傳輸 — 衛星 / 地面站 / CPE 之間的 RF 訊號 + 波導連接。Ku/Ka 波段不能用一般同軸線、需特殊連接器。",
    twSuppliers: [
      {
        symbol: "2392.TW",
        name: "正崴",
        role: "RF 連接器 + LEO 天線整合",
        tier: 1,
      },
      {
        symbol: "3533.TWO",
        name: "嘉澤",
        role: "高頻連接器（衛星 + AI 共用）",
        tier: 1,
      },
      {
        symbol: "3023.TW",
        name: "信邦",
        role: "通訊 cable + 連接器整合",
        tier: 2,
      },
      {
        symbol: "3003.TW",
        name: "健和興",
        role: "電源 + 訊號連接器",
        tier: 3,
      },
    ],
    usedIn: ["starlink-v2-mini", "starlink-v3", "kuiper", "oneweb-gen2"],
  },

  // ─── 衛星電信服務商 ───
  {
    id: "carrier-service",
    category: "carrier-service",
    label: "衛星電信服務商（轉售 / 自有方案）",
    description:
      "台灣電信商與 SpaceX / 中華電 自有方案合作 — 提供衛星電話服務 + 海事 + 偏遠地區。",
    twSuppliers: [
      {
        symbol: "2412.TW",
        name: "中華電",
        role:
          "OneWeb + SpaceX 衛星電信轉售、自有 LEO 計畫（2026 兩顆衛星）",
        tier: 1,
      },
      {
        symbol: "4904.TW",
        name: "遠傳",
        role: "OneWeb 合作 + 5G NTN 試運",
        tier: 2,
      },
      {
        symbol: "3045.TW",
        name: "台灣大",
        role: "與 SpaceX Direct-to-Cell 合作試運",
        tier: 2,
      },
    ],
    usedIn: ["starlink-direct-cell", "apple-globalstar", "taiwan-leo"],
  },

  // ─── 衛星測試 / 系統整合 ───
  {
    id: "test-integration",
    category: "test-integration",
    label: "衛星測試 / 系統整合 / 半導體封測",
    description:
      "衛星上電子元件需經過 vacuum、輻射、震動測試。台廠半導體後段測試廠切入衛星級元件測試。",
    twSuppliers: [
      {
        symbol: "6271.TW",
        name: "同欣電",
        role: "衛星級半導體封測（CMOS image sensor + RF）",
        tier: 1,
      },
      {
        symbol: "8064.TWO",
        name: "東捷",
        role: "衛星測試 + 地面站整合",
        tier: 2,
      },
      {
        symbol: "8466.TW",
        name: "經緯航太",
        role: "衛星測試 + 無人機系統測試",
        tier: 3,
      },
    ],
    usedIn: ["starlink-v2-mini", "taiwan-leo"],
  },
];

// ─── 分類顯示輔助 ────────────────────────────────

export const LEO_CATEGORY_META: Record<
  LeoCategory,
  { label: string; emoji: string; color: string; order: number }
> = {
  "sat-payload": {
    label: "衛星通訊載荷",
    emoji: "🛰️",
    color: "border-violet-300 bg-violet-50",
    order: 1,
  },
  "sat-structure": {
    label: "衛星本體 / 結構",
    emoji: "🚀",
    color: "border-purple-300 bg-purple-50",
    order: 2,
  },
  "rf-microwave": {
    label: "高頻 RF / 微波元件",
    emoji: "📡",
    color: "border-blue-300 bg-blue-50",
    order: 3,
  },
  "high-freq-pcb": {
    label: "高頻 PCB / CCL",
    emoji: "🟫",
    color: "border-amber-300 bg-amber-50",
    order: 4,
  },
  "phased-array": {
    label: "相位陣列天線",
    emoji: "📶",
    color: "border-cyan-300 bg-cyan-50",
    order: 5,
  },
  "ground-cpe": {
    label: "地面用戶終端 CPE",
    emoji: "📱",
    color: "border-emerald-300 bg-emerald-50",
    order: 6,
  },
  "direct-to-cell-ic": {
    label: "衛星直連手機晶片",
    emoji: "📲",
    color: "border-rose-300 bg-rose-50",
    order: 7,
  },
  "rf-connector": {
    label: "RF 連接器 / 波導",
    emoji: "🔗",
    color: "border-slate-300 bg-slate-50",
    order: 8,
  },
  "carrier-service": {
    label: "電信服務商",
    emoji: "📞",
    color: "border-teal-300 bg-teal-50",
    order: 9,
  },
  "test-integration": {
    label: "測試 / 系統整合",
    emoji: "🔬",
    color: "border-fuchsia-300 bg-fuchsia-50",
    order: 10,
  },
};

export const LEO_CONSTELLATION_META: Record<
  LeoConstellation,
  { label: string; period: string; color: string }
> = {
  Starlink: {
    label: "Starlink（SpaceX）",
    period: "2019-現在｜在軌 ~7,000 顆",
    color: "border-red-300 bg-red-50",
  },
  Kuiper: {
    label: "Kuiper（Amazon）",
    period: "2024 開始發射",
    color: "border-amber-300 bg-amber-50",
  },
  OneWeb: {
    label: "OneWeb / Eutelsat",
    period: "2026-2027 Gen 2",
    color: "border-blue-300 bg-blue-50",
  },
  "China-LEO": {
    label: "中國國網 + 千帆",
    period: "2024-2030 國家隊",
    color: "border-rose-300 bg-rose-50",
  },
  "Taiwan-FORMOSAT": {
    label: "台灣 B5G 低軌衛星",
    period: "2026-2028 自主發射",
    color: "border-emerald-300 bg-emerald-50",
  },
  "Direct-to-Cell": {
    label: "衛星直連手機",
    period: "2024 商用 / 2026 全球",
    color: "border-fuchsia-300 bg-fuchsia-50",
  },
};

export const LEO_STATUS_META: Record<
  LeoStatus,
  { label: string; color: string }
> = {
  shipping: {
    label: "✅ 量產 / 在軌",
    color: "bg-green-100 text-green-800",
  },
  ramping: {
    label: "🔥 拉貨中 / 擴張中",
    color: "bg-red-100 text-red-800",
  },
  upcoming: {
    label: "🟡 即將推出",
    color: "bg-amber-100 text-amber-800",
  },
  roadmap: {
    label: "📅 路線圖",
    color: "bg-gray-100 text-gray-700",
  },
};

/** 取出所有 LEO 涉及的台股 symbols（去重）*/
export function allLeoTwSymbols(): string[] {
  const set = new Set<string>();
  for (const c of LEO_COMPONENTS) {
    for (const s of c.twSuppliers) set.add(s.symbol);
  }
  return Array.from(set);
}
