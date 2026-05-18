// NVIDIA 完整供應鏈資料庫 — 公開資料整理
//
// 範圍：
//   1. 產品時間軸（Hopper / Blackwell / Rubin / Feynman）
//   2. 9 大類零組件供應鏈
//   3. 每類別下台股 tier 1-3 對應 + 說明
//
// 法律：純公開資料整理、不構成投資建議。資料來源：NVIDIA 公告 + 法說會 +
//      TSMC / 各家廠商公開資訊 + 多家券商研究報告整理（僅引用研究觀點、非本工具觀點）。

// ─── 產品時間軸 ──────────────────────────────────────────

export type NvdaProductFamily = "Hopper" | "Blackwell" | "Rubin" | "Feynman";

export type NvdaProductStatus =
  | "shipping" // 量產出貨中
  | "ramping" // 剛量產 / 拉貨中
  | "upcoming" // 已發表、即將出貨
  | "roadmap"; // 路線圖中、未發表細節

export type NvdaProduct = {
  id: string;
  family: NvdaProductFamily;
  name: string;
  /** 產品類型 */
  kind: "GPU" | "Platform" | "Networking" | "DPU";
  status: NvdaProductStatus;
  /** 預計 / 實際出貨時間（人類可讀）*/
  timeline: string;
  /** 一句話描述 */
  brief: string;
  /** 關鍵規格 */
  specs?: {
    process?: string;
    transistors?: string;
    hbm?: string;
    tdp?: string;
    interconnect?: string;
    fp4Perf?: string;
  };
  /** 此產品用到的關鍵零組件 ID（reference component.id）*/
  components: string[];
  /** 是否為當下市場焦點 */
  highlighted?: boolean;
};

export const NVDA_PRODUCTS: NvdaProduct[] = [
  // ─── Hopper（已大量出貨）───
  {
    id: "h100",
    family: "Hopper",
    name: "H100 / H200",
    kind: "GPU",
    status: "shipping",
    timeline: "2022 Q4 量產 / 2024 持續出貨",
    brief: "資料中心訓練 + 推論 GPU。H200 升 HBM3e 141GB（vs H100 的 80GB）。",
    specs: {
      process: "TSMC N4",
      transistors: "80B",
      hbm: "H100: 80GB HBM3 / H200: 141GB HBM3e",
      tdp: "700W (SXM5)",
      interconnect: "NVLink 4.0 (900GB/s)",
      fp4Perf: "N/A（無 FP4）",
    },
    components: [
      "hbm",
      "cowos",
      "abf-substrate",
      "thermal-3dvc",
      "power-psu",
      "odm-hgx",
      "asic-ip",
    ],
  },

  // ─── Blackwell（2025 主力）───
  {
    id: "b200",
    family: "Blackwell",
    name: "B100 / B200",
    kind: "GPU",
    status: "shipping",
    timeline: "2025 Q1 拉貨 / 全年主力",
    brief: "兩顆 GPU die 用 NV-HBI 技術接成一顆超大 GPU、HBM3e 192GB。",
    specs: {
      process: "TSMC N4P",
      transistors: "208B（雙 die）",
      hbm: "192GB HBM3e（8-Hi stack）",
      tdp: "B100: 700W / B200: 1000W",
      interconnect: "NVLink 5.0 (1.8TB/s)",
      fp4Perf: "20 PFLOPS",
    },
    components: [
      "hbm",
      "cowos-l",
      "abf-substrate",
      "thermal-liquid",
      "power-semi",
      "power-psu",
      "odm-hgx",
      "asic-ip",
      "connector",
    ],
    highlighted: true,
  },
  {
    id: "gb200-nvl72",
    family: "Blackwell",
    name: "GB200 NVL72",
    kind: "Platform",
    status: "ramping",
    timeline: "2025 Q1-Q3 大量出貨",
    brief: "整機櫃 AI 工廠 — 72 顆 B200 GPU + 36 顆 Grace CPU + NVLink Switch、單櫃 120kW、必須液冷。",
    specs: {
      process: "（同 B200）",
      hbm: "13.5TB HBM3e per rack",
      tdp: "120kW / rack",
      interconnect: "NVLink Switch 全互連 130TB/s",
      fp4Perf: "1.4 EFLOPS per rack",
    },
    components: [
      "hbm",
      "cowos-l",
      "abf-substrate",
      "thermal-liquid",
      "thermal-cdu",
      "power-semi",
      "power-psu",
      "odm-rack",
      "networking-nvlink",
      "networking-optical",
      "connector",
      "cable",
    ],
    highlighted: true,
  },

  // ─── Blackwell Ultra（2025 H2 - 2026）───
  {
    id: "gb300",
    family: "Blackwell",
    name: "GB300 / Blackwell Ultra",
    kind: "Platform",
    status: "upcoming",
    timeline: "2025 Q4 試產 / 2026 H1 量產",
    brief: "Blackwell 升級版、HBM3e 容量增加到 288GB、單櫃功耗 ~140kW。",
    specs: {
      process: "TSMC N4P（同 B200）",
      hbm: "288GB HBM3e（12-Hi stack）",
      tdp: "1.4kW / GPU",
      interconnect: "NVLink 5.0",
      fp4Perf: "1.5x B200",
    },
    components: [
      "hbm",
      "cowos-l",
      "abf-substrate",
      "thermal-liquid",
      "thermal-cdu",
      "power-semi",
      "power-psu",
      "odm-rack",
      "networking-nvlink",
      "connector",
    ],
    highlighted: true,
  },

  // ─── Rubin（2026 - 2027）───
  {
    id: "r100",
    family: "Rubin",
    name: "R100 (Rubin)",
    kind: "GPU",
    status: "roadmap",
    timeline: "2026 H2 試產 / 2027 量產",
    brief: "Blackwell 接班、首次採 TSMC N3 製程 + HBM4。",
    specs: {
      process: "TSMC N3P",
      hbm: "HBM4（容量未公布、推測 384GB+）",
      tdp: "推測 1.5-2kW",
      interconnect: "NVLink 6.0（推測）",
      fp4Perf: "推測 50+ PFLOPS",
    },
    components: [
      "hbm",
      "cowos-l",
      "thermal-liquid",
      "thermal-cdu",
      "power-semi",
      "power-psu",
      "odm-rack",
      "networking-nvlink",
      "networking-optical",
    ],
  },
  {
    id: "vera-rubin-nvl144",
    family: "Rubin",
    name: "Vera Rubin NVL144",
    kind: "Platform",
    status: "roadmap",
    timeline: "2027 量產",
    brief: "整機櫃 144 顆 Rubin GPU、單櫃 ~600kW（推測）、CPO 光通訊整合。",
    components: [
      "hbm",
      "cowos-l",
      "thermal-liquid",
      "thermal-cdu",
      "power-semi",
      "power-psu",
      "odm-rack",
      "networking-cpo",
      "networking-optical",
    ],
  },
  {
    id: "rubin-ultra",
    family: "Rubin",
    name: "Rubin Ultra",
    kind: "GPU",
    status: "roadmap",
    timeline: "2028（NVIDIA 路線圖公告）",
    brief: "Rubin 升級版、4 顆 die、HBM4e。",
    components: ["hbm", "cowos-l", "thermal-liquid", "power-semi"],
  },

  // ─── Feynman（2029 + 路線圖）───
  {
    id: "feynman",
    family: "Feynman",
    name: "Feynman",
    kind: "GPU",
    status: "roadmap",
    timeline: "2029（路線圖、細節未公布）",
    brief: "Rubin 接班、推測使用 TSMC N2 / A14 製程 + HBM4e or HBM5。",
    components: ["hbm", "cowos-l", "thermal-liquid", "power-semi"],
  },

  // ─── Networking 補充 ───
  {
    id: "spectrum-x",
    family: "Blackwell",
    name: "Spectrum-X Ethernet",
    kind: "Networking",
    status: "shipping",
    timeline: "2024 量產 / 2025 採用增加",
    brief: "AI 專屬乙太網路、跨資料中心 800G ↗ 1.6T、競 InfiniBand。",
    components: ["networking-optical", "connector"],
  },
  {
    id: "quantum-x800",
    family: "Blackwell",
    name: "Quantum-X800 InfiniBand",
    kind: "Networking",
    status: "shipping",
    timeline: "2025 開始出貨",
    brief: "InfiniBand 800G、配合 GB200 NVL72 機櫃間互連。",
    components: ["networking-optical", "connector"],
  },
];

// ─── 零組件供應鏈分類 ──────────────────────────────────

export type ComponentCategory =
  | "memory"
  | "packaging"
  | "pcb"
  | "power-semi"
  | "passive"
  | "power-psu"
  | "thermal"
  | "networking"
  | "asic-ip"
  | "odm"
  | "connector";

export type TwSupplier = {
  symbol: string;
  name: string;
  /** 在供應鏈中扮演的角色（一句話）*/
  role: string;
  /** Tier 1 = 主力供應、Tier 2 = 中等規模、Tier 3 = 邊緣 / 觀察 */
  tier: 1 | 2 | 3;
};

export type NvdaComponent = {
  id: string;
  category: ComponentCategory;
  label: string;
  /** 中文短描述（這是什麼、為什麼 NVDA GPU 需要它） */
  description: string;
  /** 規格 / 數量級（HBM4、CoWoS-L、12kW 等）*/
  specHint?: string;
  /** 國際主要供應商（NVDA 用的） */
  globalSuppliers?: string[];
  /** 台股對應 */
  twSuppliers: TwSupplier[];
  /** 對應到哪些 NVDA 產品（reference NvdaProduct.id）*/
  usedIn: string[];
};

export const NVDA_COMPONENTS: NvdaComponent[] = [
  // ─── 記憶體 ───
  {
    id: "hbm",
    category: "memory",
    label: "HBM3 / HBM3e / HBM4 高頻寬記憶體",
    description:
      "AI GPU 的「記憶體高速通道」— 3D 堆疊 DRAM die，貼在 GPU 旁邊用 TSV + 矽中介層連接。每顆 H100/B200 GPU 配 6-8 顆 HBM stack，是限制 AI 推論速度的關鍵。",
    specHint: "B200: 192GB HBM3e (8-Hi) / GB300: 288GB HBM3e (12-Hi) / Rubin: HBM4",
    globalSuppliers: ["SK Hynix (主力)", "Samsung", "Micron"],
    twSuppliers: [
      // 台股沒有直接做 HBM 的廠（國際巨頭壟斷）、但有相關 substrate / 測試 / 設備代理
      {
        symbol: "2454.TW",
        name: "聯發科",
        role: "Wisper SoC 配 HBM、間接需求",
        tier: 3,
      },
    ],
    usedIn: ["h100", "b200", "gb200-nvl72", "gb300", "r100", "rubin-ultra", "feynman"],
  },

  // ─── 先進封裝 ───
  {
    id: "cowos",
    category: "packaging",
    label: "CoWoS-S 先進封裝（H100/H200）",
    description:
      "Chip-on-Wafer-on-Substrate — 把 GPU die + HBM stacks 整合在矽中介層 (Silicon Interposer) 上。CoWoS 產能是 NVIDIA H100 出貨的最大瓶頸。",
    specHint: "矽中介層尺寸：~100mm² (H100)",
    globalSuppliers: ["TSMC（唯一）"],
    twSuppliers: [
      {
        symbol: "2330.TW",
        name: "台積電",
        role: "CoWoS-S 唯一供應商（NVDA 100% 仰賴）",
        tier: 1,
      },
      {
        symbol: "2449.TW",
        name: "京元電子",
        role: "CoWoS 封裝後測試",
        tier: 2,
      },
      {
        symbol: "3711.TW",
        name: "日月光投控",
        role: "後段封裝測試合作",
        tier: 2,
      },
    ],
    usedIn: ["h100"],
  },
  {
    id: "cowos-l",
    category: "packaging",
    label: "CoWoS-L 局部矽中介層（Blackwell/Rubin）",
    description:
      "新世代 CoWoS — 用 LSI (Local Silicon Interconnect) 取代整片矽中介層，可做更大尺寸（雙 die GPU）。B200 用 CoWoS-L 把兩顆 GPU 合成一顆。產能仍由 TSMC 主導。",
    specHint: "支援尺寸：~3.3x reticle（vs CoWoS-S 1.5x）",
    globalSuppliers: ["TSMC（唯一）"],
    twSuppliers: [
      {
        symbol: "2330.TW",
        name: "台積電",
        role: "CoWoS-L 唯一供應商 + 持續擴 CoWoS 產能（2025 月產 70K 片→2026 翻倍）",
        tier: 1,
      },
      {
        symbol: "2449.TW",
        name: "京元電子",
        role: "CoWoS-L 後段測試",
        tier: 2,
      },
      {
        symbol: "1560.TW",
        name: "中砂",
        role: "CMP 拋光研磨料（半導體製程必需）",
        tier: 3,
      },
    ],
    usedIn: ["b200", "gb200-nvl72", "gb300", "r100", "vera-rubin-nvl144", "rubin-ultra", "feynman"],
  },

  // ─── ABF 載板 ───
  {
    id: "abf-substrate",
    category: "pcb",
    label: "ABF 載板（先進 IC 基板）",
    description:
      "Ajinomoto Build-up Film 載板 — 把封裝好的 GPU 接到主機板的「轉接層」。AI GPU 用的高層數 ABF 載板（20+ 層）是高毛利特殊品，全球供應吃緊。",
    specHint: "AI GPU 用 16-30 層、面積 ~70mm x 70mm",
    globalSuppliers: ["Ibiden (日)", "Shinko (日)", "Unimicron (台)"],
    twSuppliers: [
      {
        symbol: "3037.TW",
        name: "欣興",
        role: "全球 ABF 第三大、AI GPU 載板主力，Q3 2025 起進入 GB200 NVL72 供應鏈",
        tier: 1,
      },
      {
        symbol: "8046.TW",
        name: "南電",
        role: "ABF 第二大、台積電合作密切",
        tier: 1,
      },
      {
        symbol: "3189.TW",
        name: "景碩",
        role: "ABF 載板 + IC 基板，受惠 Blackwell 出貨",
        tier: 2,
      },
    ],
    usedIn: ["h100", "b200", "gb200-nvl72", "gb300"],
  },

  // ─── 功率半導體（user 點名要的）───
  {
    id: "power-semi",
    category: "power-semi",
    label: "功率半導體（MOSFET / GaN / SiC）",
    description:
      "AI 伺服器電源轉換鏈：AC 480V → DC 48V → 12V → 0.8V 給 GPU。GB200 NVL72 單櫃 120kW，**轉換效率每差 1% = 多 1.2kW 熱**。GaN 高頻轉換、SiC 高壓耐熱、Si MOSFET 多相 VRM — 每一階都要功率半導體，數量遠超傳統伺服器。",
    specHint:
      "AC/DC: SiC MOSFET 1200V / DC-DC: GaN HEMT 100-650V / VRM: Si Multi-phase",
    globalSuppliers: [
      "Infineon (歐)",
      "Texas Instruments (美)",
      "ON Semi / STMicro / Renesas",
    ],
    twSuppliers: [
      {
        symbol: "8255.TW",
        name: "朋程",
        role: "車用 + 伺服器整流 / 二極體模組，AI PSU 整流模組受惠",
        tier: 1,
      },
      {
        symbol: "2481.TW",
        name: "強茂",
        role: "MOSFET + 二極體大廠、跨足 AI 伺服器電源市場",
        tier: 1,
      },
      {
        symbol: "3707.TW",
        name: "漢磊",
        role:
          "8 吋 SiC / GaN 晶圓代工 IDM，全球少數能量產 SiC MOSFET 的台廠",
        tier: 1,
      },
      {
        symbol: "3016.TWO",
        name: "嘉晶",
        role: "矽磊晶片廠商 — SiC / GaN 製程上游基材",
        tier: 2,
      },
      {
        symbol: "2342.TW",
        name: "茂矽",
        role: "功率元件 IDM (TVS / MOSFET / IGBT)",
        tier: 2,
      },
      {
        symbol: "8261.TW",
        name: "富鼎",
        role: "Power MOSFET 設計，伺服器電源市場切入",
        tier: 2,
      },
      {
        symbol: "4148.TWO",
        name: "全宇生技 (全宇)",
        role: "功率 IC / 電源管理 PMIC",
        tier: 3,
      },
      {
        symbol: "6286.TW",
        name: "立錡",
        role: "電源管理 IC 大廠、多相 VRM 控制器",
        tier: 1,
      },
      {
        symbol: "6415.TW",
        name: "矽力*-KY",
        role: "高效能類比 IC、DC-DC 控制器",
        tier: 1,
      },
      {
        symbol: "8081.TW",
        name: "致新",
        role: "電源 IC（POL 多相 VRM）",
        tier: 2,
      },
      {
        symbol: "6138.TW",
        name: "茂達",
        role: "電源管理 IC，伺服器類比 IC 供應",
        tier: 2,
      },
    ],
    usedIn: ["b200", "gb200-nvl72", "gb300", "r100", "vera-rubin-nvl144", "rubin-ultra"],
  },

  // ─── 被動元件 — 整鏈每塊主板都用、AI server 用量爆炸 ───
  {
    id: "passive-mlcc",
    category: "passive",
    label: "MLCC 多層陶瓷電容（高容量 / 車規 / 高頻）",
    description:
      "AI 伺服器一塊 GPU 主板用 MLCC 4,000-5,000 顆（傳統 server 1,000 顆）、GB200 NVL72 整櫃用約 25 萬顆 MLCC。Blackwell / Rubin 需求更高容量 (X7R 22µF) + 高頻特性。國巨 / 華新科吃下日廠 Murata / TDK 留下的中高階訂單。",
    specHint:
      "0402 / 0603 / 1206 高容量 X5R/X7R/X8R / 22µF-100µF / 車規 AEC-Q200",
    globalSuppliers: [
      "Murata (日，全球第一)",
      "Samsung Electro-Mechanics (韓)",
      "TDK (日)",
      "Taiyo Yuden (日)",
    ],
    twSuppliers: [
      {
        symbol: "2327.TW",
        name: "國巨",
        role: "MLCC 全球前三、車規 + 高容量領導、AI server 主力供應",
        tier: 1,
      },
      {
        symbol: "2492.TW",
        name: "華新科",
        role: "MLCC 全球前五、AI server + 工控 MLCC 供應",
        tier: 1,
      },
      {
        symbol: "6173.TWO",
        name: "信昌電",
        role: "MLCC 上游介電粉、為國巨 / 華新科供料",
        tier: 2,
      },
      {
        symbol: "2347.TW",
        name: "聯強",
        role: "電子元件通路，MLCC 配套",
        tier: 3,
      },
    ],
    usedIn: ["h100", "b200", "gb200-nvl72", "gb300", "r100", "vera-rubin-nvl144", "rubin-ultra"],
  },

  {
    id: "passive-inductor",
    category: "passive",
    label: "Power 電感（合金粉芯 / Molded Choke）",
    description:
      "GPU VRM 供電用 — Hopper 一張卡 20 顆 power inductor、Blackwell 升級到 30 顆、Rubin 預估 40 顆。需高飽和電流（80A+）、低 DCR、極低 EMI。奇力新是全球 metal-alloy power inductor 第二大、AI server 用量最猛。",
    specHint:
      "合金粉芯 0.22µH-1µH / 80-150A 飽和 / 低 DCR ~0.5mΩ / 一體成型 Molded",
    globalSuppliers: ["TDK", "Vishay", "Coilcraft (美)"],
    twSuppliers: [
      {
        symbol: "2456.TW",
        name: "奇力新",
        role: "Power 電感全球前二、AI server VRM 主力供應、漲幅最猛",
        tier: 1,
      },
      {
        symbol: "5285.TWO",
        name: "界霖",
        role: "Power 電感 + 共模扼流圈，AI server 周邊磁性元件",
        tier: 2,
      },
      {
        symbol: "8064.TWO",
        name: "東捷",
        role: "電感 + 高頻磁性元件代工",
        tier: 3,
      },
    ],
    usedIn: ["h100", "b200", "gb200-nvl72", "gb300", "r100", "vera-rubin-nvl144", "rubin-ultra"],
  },

  {
    id: "passive-cap-alum",
    category: "passive",
    label: "鋁電解 / 固態 / 鉭電容（PSU 用）",
    description:
      "Server PSU 大電解電容 — 5500W Titanium 級 PSU 用 8-12 顆 470µF / 450V 鋁電解 + 數十顆固態電容濾波。Hyperscaler 也要求軍規鉭電容（高可靠度）。立隆電 / 鈺邦受惠 GB200 NVL72 每櫃 33 顆 PSU 帶來的爆量。",
    specHint:
      "鋁電解 470µF-1500µF / 400-500V / 固態高分子 / 鉭電容 100µF / 50V 軍規",
    globalSuppliers: ["Nichicon (日)", "Rubycon (日)", "KEMET (美)"],
    twSuppliers: [
      {
        symbol: "2472.TW",
        name: "立隆電",
        role: "鋁電解電容、Server PSU 配套主力，AI server 受惠最大",
        tier: 1,
      },
      {
        symbol: "2375.TW",
        name: "智寶",
        role: "鋁電解電容、車用 + 工控雙腳",
        tier: 1,
      },
      {
        symbol: "6449.TWO",
        name: "鈺邦",
        role: "固態 + 鉭電容、軍規 / 高可靠度市場",
        tier: 1,
      },
      {
        symbol: "2308.TW",
        name: "台達電",
        role: "PSU 一體化、部分被動元件自製",
        tier: 2,
      },
    ],
    usedIn: ["b200", "gb200-nvl72", "gb300", "r100", "vera-rubin-nvl144", "rubin-ultra"],
  },

  // ─── 電源供應器 PSU ───
  {
    id: "power-psu",
    category: "power-psu",
    label: "AI 伺服器電源供應器 PSU（5.5kW / 8kW / 12kW+）",
    description:
      "GB200 NVL72 單櫃配 ~9-10 顆 PSU、每顆 5.5-12kW。Rubin NVL144 估計每櫃 ~50 顆 PSU。台達電 / 光寶 在 NVDA AI PSU 是 Tier 1 寡占。",
    specHint: "5.5kW (Hopper rack) / 8kW (Blackwell) / 12kW+ (Rubin)",
    globalSuppliers: ["Delta", "Lite-On", "Flex"],
    twSuppliers: [
      {
        symbol: "2308.TW",
        name: "台達電",
        role:
          "NVDA AI PSU 全球最大供應、跨入 800V HVDC 直流供電架構",
        tier: 1,
      },
      {
        symbol: "2301.TW",
        name: "光寶",
        role: "NVDA AI PSU Tier 1 + Power Shelf 整合",
        tier: 1,
      },
      {
        symbol: "6412.TW",
        name: "群電",
        role: "AI 伺服器 PSU + 機櫃級電源整合",
        tier: 2,
      },
    ],
    usedIn: ["h100", "b200", "gb200-nvl72", "gb300", "r100", "vera-rubin-nvl144"],
  },

  // ─── 散熱（3D VC / 液冷板）───
  {
    id: "thermal-3dvc",
    category: "thermal",
    label: "3D Vapor Chamber 均熱板",
    description:
      "Hopper / 部分 Blackwell 用的氣冷散熱方案 — 銅製腔體內部抽真空充工作液，靠相變化導熱效率比純銅鰭片高 5-10 倍。",
    twSuppliers: [
      {
        symbol: "3324.TWO",
        name: "雙鴻",
        role: "3D VC + 液冷板雙領域龍頭、NVDA 直接合作",
        tier: 1,
      },
      {
        symbol: "3017.TW",
        name: "奇鋐",
        role: "3D VC + 風扇模組、AI 伺服器散熱大宗",
        tier: 1,
      },
      {
        symbol: "3653.TW",
        name: "健策",
        role: "3D VC 中堅、散熱模組整合",
        tier: 2,
      },
    ],
    usedIn: ["h100"],
  },
  {
    id: "thermal-liquid",
    category: "thermal",
    label: "液冷板 + 冷板模組 (Direct-to-Chip Liquid Cooling)",
    description:
      "GB200 NVL72 強制液冷 — 銅冷板貼 GPU 直接帶走熱。每張 GPU 配 1-2 個冷板，每櫃 ~150 個冷板。Rubin 之後液冷成標配。",
    specHint: "單片冷板熱密度 800-1500W、整櫃水流量 ~50L/min",
    twSuppliers: [
      {
        symbol: "3324.TWO",
        name: "雙鴻",
        role: "液冷板 + Quick Disconnect 整合，GB200 主力",
        tier: 1,
      },
      {
        symbol: "8996.TW",
        name: "高力",
        role: "板式熱交換器 + 液冷模組，鴻海合作緊密",
        tier: 1,
      },
      {
        symbol: "3017.TW",
        name: "奇鋐",
        role: "液冷板 + CDU 整合方案",
        tier: 1,
      },
      {
        symbol: "3653.TW",
        name: "健策",
        role: "液冷板 + 模組",
        tier: 2,
      },
      {
        symbol: "2421.TW",
        name: "建準",
        role: "風扇 + 液冷 hybrid 模組",
        tier: 2,
      },
      {
        symbol: "3483.TW",
        name: "力致",
        role: "散熱模組 + 風扇",
        tier: 3,
      },
    ],
    usedIn: ["b200", "gb200-nvl72", "gb300", "r100", "vera-rubin-nvl144", "rubin-ultra"],
  },
  {
    id: "thermal-cdu",
    category: "thermal",
    label: "CDU 冷卻液分配單元 (Coolant Distribution Unit)",
    description:
      "整機櫃液冷的「心臟」— 把冷水送到每張 GPU 的冷板再回收。CDU 失靈整櫃 GPU 就熱當機。一個 CDU 約 NT$ 60-100 萬。",
    twSuppliers: [
      {
        symbol: "3324.TWO",
        name: "雙鴻",
        role: "CDU + 整套液冷方案",
        tier: 1,
      },
      {
        symbol: "3017.TW",
        name: "奇鋐",
        role: "CDU + 模組整合",
        tier: 1,
      },
      {
        symbol: "3653.TW",
        name: "健策",
        role: "CDU 中堅",
        tier: 2,
      },
      {
        symbol: "3402.TW",
        name: "漢科",
        role: "Quick Disconnect 接頭 + 管線",
        tier: 3,
      },
    ],
    usedIn: ["gb200-nvl72", "gb300", "vera-rubin-nvl144"],
  },

  // ─── 網路（NVLink Switch / 光通訊 / CPO）───
  {
    id: "networking-nvlink",
    category: "networking",
    label: "NVLink Switch / NVSwitch ASIC",
    description:
      "GPU 互連的高速交換器 — NVLink 5.0 一對一頻寬 1.8TB/s。NVSwitch ASIC 由 NVIDIA 自家設計、TSMC 代工。",
    globalSuppliers: ["NVIDIA 自家設計"],
    twSuppliers: [
      {
        symbol: "2330.TW",
        name: "台積電",
        role: "NVSwitch ASIC 代工",
        tier: 1,
      },
    ],
    usedIn: ["gb200-nvl72", "gb300", "vera-rubin-nvl144"],
  },
  {
    id: "networking-optical",
    category: "networking",
    label: "光收發模組 800G / 1.6T",
    description:
      "資料中心跨機架互連 — 把電訊號轉光訊號 + 反向。AI 訓練流量翻 100 倍、800G ↗ 1.6T 模組需求暴增。每個 NVDA AI 機櫃外接 ~32-64 個光模組。",
    specHint: "QSFP-DD 800G / OSFP 1.6T",
    globalSuppliers: ["Coherent (美)", "Lumentum (美)", "Innolight (中)"],
    twSuppliers: [
      {
        symbol: "3081.TW",
        name: "聯亞",
        role: "雷射晶粒 + 高速光模組",
        tier: 1,
      },
      {
        symbol: "4979.TWO",
        name: "華星光通",
        role: "800G 光模組 + 光收發整合",
        tier: 1,
      },
      {
        symbol: "4977.TW",
        name: "眾達-KY",
        role: "矽光子模組 + AOC 主動光纖線",
        tier: 1,
      },
      {
        symbol: "3163.TWO",
        name: "波若威",
        role: "光被動元件",
        tier: 2,
      },
      {
        symbol: "3450.TWO",
        name: "聯鈞",
        role: "光收發模組",
        tier: 2,
      },
      {
        symbol: "3363.TWO",
        name: "上詮",
        role: "光收發 / 矽光子模組",
        tier: 2,
      },
    ],
    usedIn: ["gb200-nvl72", "gb300", "spectrum-x", "quantum-x800", "vera-rubin-nvl144"],
  },
  {
    id: "networking-cpo",
    category: "networking",
    label: "CPO 共封裝光學 (Co-Packaged Optics)",
    description:
      "把光引擎直接封裝到交換器 ASIC 旁、省下傳統 PCB pluggable 光模組的功耗 + 延遲。Rubin 時代成標配。",
    specHint: "整合 1.6T 光引擎、單模 200G/通道",
    twSuppliers: [
      {
        symbol: "2330.TW",
        name: "台積電",
        role: "CPO 光引擎 ASIC 製造、矽光子整合",
        tier: 1,
      },
      {
        symbol: "3450.TWO",
        name: "聯鈞",
        role: "CPO 光引擎合作開發",
        tier: 2,
      },
      {
        symbol: "4977.TW",
        name: "眾達-KY",
        role: "矽光子 CPO 整合",
        tier: 2,
      },
    ],
    usedIn: ["vera-rubin-nvl144", "rubin-ultra"],
  },

  // ─── ASIC IP 設計服務 ───
  {
    id: "asic-ip",
    category: "asic-ip",
    label: "ASIC 設計服務 + 矽智財 IP",
    description:
      "NVIDIA 自家設計大部分 GPU 晶片，但旁邊的 NVSwitch、Bluefield DPU、自研 ASIC 會用台廠 IP / 設計服務。AVGO 的客製 AI ASIC（給 Google TPU）就是世芯-KY 設計。",
    twSuppliers: [
      {
        symbol: "3661.TWO",
        name: "世芯-KY",
        role:
          "Broadcom AI ASIC + AMD MI300 設計服務領頭羊、間接受惠 AI 軍備競賽",
        tier: 1,
      },
      {
        symbol: "3443.TW",
        name: "創意電子",
        role: "TSMC 旗下設計服務、AI ASIC 第二大",
        tier: 1,
      },
      {
        symbol: "3035.TW",
        name: "智原",
        role: "聯電旗下 IP / 設計服務",
        tier: 2,
      },
      {
        symbol: "3529.TW",
        name: "力旺",
        role: "embedded NVM IP",
        tier: 2,
      },
      {
        symbol: "6643.TWO",
        name: "M31",
        role: "Foundation IP",
        tier: 3,
      },
    ],
    usedIn: ["h100", "b200", "gb200-nvl72"],
  },

  // ─── ODM 整機 ───
  {
    id: "odm-hgx",
    category: "odm",
    label: "HGX 主機板 ODM / 8 GPU 伺服器整機",
    description:
      "把 GPU + CPU + 記憶體 + 散熱整合成可上架的 server。NVDA 把 HGX 設計圖授權給 ODM、ODM 接 OEM (Dell / HPE / Supermicro) 訂單代工。",
    twSuppliers: [
      {
        symbol: "2382.TW",
        name: "廣達",
        role: "HGX 主板 + GB200 NVL72 整機櫃最大 ODM",
        tier: 1,
      },
      {
        symbol: "3231.TW",
        name: "緯創",
        role: "HGX 主板 ODM Tier 1（也做 GB200）",
        tier: 1,
      },
      {
        symbol: "6669.TW",
        name: "緯穎",
        role: "Meta / Microsoft 客製 AI 伺服器主供應",
        tier: 1,
      },
      {
        symbol: "2317.TW",
        name: "鴻海",
        role: "GB200 整機櫃大單 + Bluefield DPU 組裝",
        tier: 1,
      },
      {
        symbol: "2356.TW",
        name: "英業達",
        role: "AI 伺服器代工 Tier 2",
        tier: 2,
      },
    ],
    usedIn: ["h100", "b200"],
  },
  {
    id: "odm-rack",
    category: "odm",
    label: "GB200 NVL72 整機櫃 ODM",
    description:
      "整機櫃級組裝 — 不只放 GPU 板，還含 NVLink Switch、CDU、PSU、機箱、佈線。技術複雜度高、單櫃售價 ~NT$ 9000 萬。",
    twSuppliers: [
      {
        symbol: "2382.TW",
        name: "廣達",
        role: "GB200 NVL72 全球最大 ODM（最早接 NVDA 訂單）",
        tier: 1,
      },
      {
        symbol: "2317.TW",
        name: "鴻海",
        role: "GB200 NVL72 ODM 第二大（含子公司鴻佰）",
        tier: 1,
      },
      {
        symbol: "3231.TW",
        name: "緯創",
        role: "GB200 NVL72 ODM Tier 1（拿到 AI Diamond 大單）",
        tier: 1,
      },
      {
        symbol: "6669.TW",
        name: "緯穎",
        role: "AI 整機櫃 + Meta Microsoft 客製化",
        tier: 1,
      },
      {
        symbol: "8210.TW",
        name: "勤誠",
        role: "機箱 + 滑軌、Dell HPE 機架主供應",
        tier: 2,
      },
      {
        symbol: "2059.TW",
        name: "川湖",
        role: "伺服器機架滑軌全球領導廠",
        tier: 2,
      },
    ],
    usedIn: ["gb200-nvl72", "gb300", "vera-rubin-nvl144"],
  },

  // ─── 連接器 / 線材 ───
  {
    id: "connector",
    category: "connector",
    label: "高速連接器（PCIe 5/6 / NVLink / CXL）",
    description:
      "AI 伺服器內部訊號傳輸 — 主板對主板、CPU 對 GPU 高速連接器。GB200 NVL72 用 backplane 大量 NVLink 連接器。",
    twSuppliers: [
      {
        symbol: "3533.TWO",
        name: "嘉澤",
        role: "高速連接器（CPU socket + AI 板對板）",
        tier: 1,
      },
      {
        symbol: "3023.TW",
        name: "信邦",
        role: "伺服器 cable + 連接器整合",
        tier: 1,
      },
      {
        symbol: "3003.TW",
        name: "健和興",
        role: "電源 + 訊號連接器",
        tier: 2,
      },
    ],
    usedIn: ["b200", "gb200-nvl72", "gb300", "spectrum-x", "quantum-x800"],
  },
  {
    id: "cable",
    category: "connector",
    label: "DAC 高速銅線 + AOC 主動光纖線",
    description:
      "短距 GPU 互連用 DAC (Direct Attach Copper) 銅纜、長距用 AOC 主動光纖線。GB200 NVL72 內部 NVLink 全用銅纜（5184 條）。",
    twSuppliers: [
      {
        symbol: "3665.TW",
        name: "貿聯-KY",
        role: "全球高速 cable 龍頭、NVDA DGX / GB200 主力供應、Tesla 充電樁也是大客戶",
        tier: 1,
      },
      {
        symbol: "3653.TW",
        name: "健和興",
        role: "高速連接器 + cable 整套、AI server 內部互連主力",
        tier: 1,
      },
      {
        symbol: "3023.TW",
        name: "信邦",
        role: "工業 + 醫療 + AI server cable、多腳發展",
        tier: 1,
      },
      {
        symbol: "6153.TW",
        name: "嘉聯益",
        role: "DAC 高速銅纜 + 軟板",
        tier: 2,
      },
      {
        symbol: "4977.TW",
        name: "眾達-KY",
        role: "AOC 主動光纖線",
        tier: 1,
      },
      {
        symbol: "8183.TWO",
        name: "精星",
        role: "高速線材",
        tier: 3,
      },
    ],
    usedIn: ["gb200-nvl72", "gb300", "vera-rubin-nvl144", "rubin-ultra"],
  },

  // ─── BMC + 介面 IC（伺服器主板必備）───
  {
    id: "bmc-controller",
    category: "asic-ip",
    label: "BMC + PCIe Retimer + Server 介面 IC",
    description:
      "BMC (Baseboard Management Controller) 是伺服器主板的「小型管理電腦」 — 負責遠端管理、開關機、監測。每塊伺服器主板必備一顆。AI server 用「升級版 BMC」 — ASP 從 USD 8 拉到 USD 25-40。另外 PCIe Retimer 為 PCIe 6 標配、信驊 + 譜瑞-KY 雙雄。",
    specHint:
      "BMC: ASPEED AST2700 / 信驊 自研 / PCIe Retimer: PCIe 5/6 64GT/s",
    globalSuppliers: ["Microchip / Marvell (Retimer)"],
    twSuppliers: [
      {
        symbol: "5274.TW",
        name: "信驊",
        role: "BMC 全球第一 (70%+ 市佔)、AI server 必備",
        tier: 1,
      },
      {
        symbol: "4966.TWO",
        name: "譜瑞-KY",
        role: "PCIe Retimer 全球前三、PCIe 6 為 AI server 標配",
        tier: 1,
      },
      {
        symbol: "5269.TW",
        name: "祥碩",
        role: "ASMedia controller、USB / SATA / PCIe IC",
        tier: 2,
      },
      {
        symbol: "5471.TWO",
        name: "松翰",
        role: "IPMI 子卡 + 邊緣管理 IC",
        tier: 3,
      },
    ],
    usedIn: ["h100", "b200", "gb200-nvl72", "gb300", "r100", "vera-rubin-nvl144", "rubin-ultra"],
  },
];

// ─── 分類顯示輔助 ──────────────────────────────────────

export const CATEGORY_META: Record<
  ComponentCategory,
  { label: string; emoji: string; color: string; order: number }
> = {
  memory: {
    label: "記憶體",
    emoji: "🧠",
    color: "border-cyan-300 bg-cyan-50",
    order: 1,
  },
  packaging: {
    label: "先進封裝",
    emoji: "📦",
    color: "border-blue-300 bg-blue-50",
    order: 2,
  },
  pcb: {
    label: "ABF 載板 / PCB",
    emoji: "🟫",
    color: "border-amber-300 bg-amber-50",
    order: 3,
  },
  "power-semi": {
    label: "功率半導體",
    emoji: "⚡",
    color: "border-red-300 bg-red-50",
    order: 4,
  },
  passive: {
    label: "被動元件（MLCC / 電感 / 鋁電容）",
    emoji: "🪙",
    color: "border-yellow-300 bg-yellow-50",
    order: 5,
  },
  "power-psu": {
    label: "電源供應器 PSU",
    emoji: "🔌",
    color: "border-orange-300 bg-orange-50",
    order: 6,
  },
  thermal: {
    label: "散熱（3D VC / 液冷）",
    emoji: "❄️",
    color: "border-sky-300 bg-sky-50",
    order: 7,
  },
  networking: {
    label: "網路 / 光通訊",
    emoji: "🌐",
    color: "border-violet-300 bg-violet-50",
    order: 8,
  },
  "asic-ip": {
    label: "ASIC IP / 設計服務",
    emoji: "🔬",
    color: "border-fuchsia-300 bg-fuchsia-50",
    order: 9,
  },
  odm: {
    label: "整機 ODM",
    emoji: "🏭",
    color: "border-emerald-300 bg-emerald-50",
    order: 10,
  },
  connector: {
    label: "連接器 / 線材",
    emoji: "🔗",
    color: "border-slate-300 bg-slate-50",
    order: 11,
  },
};

export const FAMILY_META: Record<
  NvdaProductFamily,
  { label: string; period: string; color: string }
> = {
  Hopper: {
    label: "Hopper 世代",
    period: "2022-2024 主力",
    color: "border-amber-300 bg-amber-50",
  },
  Blackwell: {
    label: "Blackwell 世代",
    period: "2025-2026 主力",
    color: "border-red-300 bg-red-50",
  },
  Rubin: {
    label: "Rubin 世代",
    period: "2026 H2 - 2028",
    color: "border-violet-300 bg-violet-50",
  },
  Feynman: {
    label: "Feynman 世代",
    period: "2029+（路線圖）",
    color: "border-fuchsia-300 bg-fuchsia-50",
  },
};

export const STATUS_META: Record<
  NvdaProductStatus,
  { label: string; color: string }
> = {
  shipping: {
    label: "✅ 量產出貨",
    color: "bg-green-100 text-green-800",
  },
  ramping: {
    label: "🔥 拉貨中",
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

/** 依分類取得元件清單 */
export function getComponentsByCategory(
  category: ComponentCategory,
): NvdaComponent[] {
  return NVDA_COMPONENTS.filter((c) => c.category === category);
}

/** 依產品 id 取得用到的元件 */
export function getComponentsForProduct(productId: string): NvdaComponent[] {
  return NVDA_COMPONENTS.filter((c) => c.usedIn.includes(productId));
}

/** 取出所有有 quotes 需要的台股 symbols（去重）*/
export function allNvdaTwSymbols(): string[] {
  const set = new Set<string>();
  for (const c of NVDA_COMPONENTS) {
    for (const s of c.twSuppliers) set.add(s.symbol);
  }
  return Array.from(set);
}
