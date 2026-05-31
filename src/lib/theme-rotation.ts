// 台股題材輪動史 — 2024 Jan 到 2026 May
//
// 涵蓋 4 種狀態：
//   peaked       — 漲過了，現在高基期 / 拉回整理
//   declined     — 漲過後跌深、退潮
//   active       — 仍在漲、結構性強勢
//   anticipated  — 預期下一波會漲（依零組件邏輯推測）
//
// 法律：純公開資料整理、不構成投資建議。
// 資料源：TWSE 公開資訊、各家券商研究報告、外電科技新聞、PTT/Threads 散戶討論彙整。

export type ThemeStatus = "peaked" | "declined" | "active" | "anticipated";

export type ThemeStock = {
  symbol: string;
  name: string;
  /** 在這個題材中扮演的角色（一句話）*/
  role: string;
  /** @deprecated 改用 useQuotes 即時報價、不再寫死漲幅 */
  perfHint?: string;
};

export type ThemeEntry = {
  id: string;
  name: string;
  status: ThemeStatus;
  /** 一句話本題材是什麼 */
  brief: string;
  /** 完整漲價邏輯敘事（2-4 段、解釋 why） */
  narrative: string;
  /** 時間軸 */
  timeline: {
    /** 起漲時點 例 "2024 Q1" */
    start: string;
    /** 高點時點 例 "2025 Q3" 或 "進行中" */
    peak?: string;
    /** 現況 (status="active" 才有意義) */
    nowStatus: string;
  };
  /** 受惠台股 — tiered by role */
  twStocks: ThemeStock[];
  /** 對應 NVDA 零組件分類 ID (reference nvda-supply-chain.ts) */
  relatedNvdaComponents?: string[];
  /** 深度頁連結 (可選 — 例如 /topics/leo-satellite, /companies/nvda) */
  deepDiveHref?: string;
  /** 深度頁連結標籤 (例如 "🛰️ 進入 LEO 衛星完整供應鏈頁") */
  deepDiveLabel?: string;
  /** 觸發催化劑（事件 / 數據 / 政策）*/
  catalysts: string[];
  /** 觀察點 / 風險（你要看什麼數據確認趨勢續強 vs 反轉）*/
  watchPoints: string[];
  /** 高峰漲幅描述（中位數股票、約值）*/
  peakReturn?: string;
};

export const THEMES: ThemeEntry[] = [
  // ═════════════════════════════════════════════════
  // 🟡 仍在漲 (ACTIVE) — 2026 H1 進行中
  // ═════════════════════════════════════════════════

  {
    id: "passive-components",
    name: "被動元件｜MLCC + 電感 + 鋁電容 全面缺貨",
    status: "active",
    brief: "AI 伺服器單機被動元件用量 4-8x、車用 EV 化 10x、國巨 / 華新科 / 奇力新 / 立隆電 整鏈創高",
    narrative: `
被動元件是「沒人注意但實際漲最猛」的一波。AI 伺服器一塊 GPU 主板用 MLCC 4,000-5,000 顆（傳統 server 1,000 顆）、
GB200 NVL72 整櫃用約 25 萬顆 MLCC。電感方面 Hopper 一張卡 20 顆、Blackwell 升級到 30 顆 power inductor。
鋁電解電容用在 PSU、單顆 5500W PSU 用 8-12 顆大顆鋁電解。

3 重邏輯交疊：
1. **AI 需求爆炸** — 單機被動元件用量 vs 傳統 server 4-8x
2. **EV 滲透率** — 一台 EV 用 MLCC 10,000+ 顆、燃油車 3,000 顆
3. **中國供應品質還沒到位** — 車規 / AI 等級 MLCC 還是台廠 + 日廠寡佔

📈 兩年漲幅：
- **國巨 (2327)** — 2024 初 270 元 → 2026/5 約 600+ 元 **+120%**
- **華新科 (2492)** — 130 → 280 **+115%**
- **奇力新 (2456)** — 35 → 130 **+270%**（power inductor 在 AI server 用量最大、漲幅最猛）
- **立隆電 (2472)** — 18 → 65 **+260%**（鋁電解 + PSU 配套）

2026 Q1 起 MLCC 報價第二波上修（國巨 1206 高容量加價 8-15%）、業界預估缺貨延續到 2027。
`.trim(),
    timeline: {
      start: "2024 Q1",
      peak: "2025 Q4 第一波 / 2026 H2 預期第二波",
      nowStatus: "2026/5 整鏈仍強勢、MLCC 報價二度上修、電感缺貨加劇",
    },
    twStocks: [
      { symbol: "2327.TW", name: "國巨", role: "MLCC 全球前三、車規 + 高容量領導 (T1)" },
      { symbol: "2492.TW", name: "華新科", role: "MLCC 全球前五 (T1)" },
      { symbol: "2456.TW", name: "奇力新", role: "Power 電感全球前二、AI server 主力 (T1)" },
      { symbol: "2472.TW", name: "立隆電", role: "鋁電解電容、PSU 配套 (T1)" },
      { symbol: "2375.TW", name: "智寶", role: "鋁電解電容、車用 (T2)" },
      { symbol: "6449.TWO", name: "鈺邦", role: "固態 + 鉭電容、軍規 (T2)" },
      { symbol: "6173.TWO", name: "信昌電", role: "MLCC 介電粉上游 (T2)" },
      { symbol: "2308.TW", name: "台達電", role: "PSU 一體化 + 部分被動元件自製 (T2)" },
    ],
    relatedNvdaComponents: ["passive-mlcc", "passive-inductor", "passive-cap-alum"],
    catalysts: [
      "國巨 / 華新科月營收 YoY 變化",
      "MLCC 報價月變動（聯傳 / 國巨報價公告）",
      "AI server 出貨量（廣達 / 緯創月營收）",
      "EV 銷量（車用 MLCC 需求）",
    ],
    watchPoints: [
      "中國 MLCC 廠（風華高科 / 三環）品質追上的速度",
      "Murata / TDK 是否擴產（傳統日廠寡占被打破中）",
      "AI server 滲透率天花板（目前約佔全球 server 35%）",
    ],
    peakReturn: "—（請以即時報價為準）",
  },

  {
    id: "power-semi",
    name: "功率半導體｜AI 伺服器電源轉換鏈",
    status: "active",
    brief: "AI GPU 用電爆炸增長，48V→12V→0.8V 轉換每一階都需 MOSFET / GaN / SiC，台廠功率元件廠加速放量",
    narrative: `
GB200 NVL72 單櫃功耗 ~120kW、是傳統伺服器的 5-8 倍。電源轉換每多一道效率損失，整櫃多 1-2kW 熱負荷，於是
NVDA 強制要求供應鏈把 PSU 轉換效率拉到 96.5%+、且引入 800V HVDC 直流供電架構。每一階轉換器都需要高品質
功率元件（SiC MOSFET、GaN HEMT、多相 VRM）。

過去 Si 功率元件給汽車電動化用、消費電子用，伺服器佔比小。但 AI Data Center 蓋廠速度遠超預期（OpenAI Stargate
$5000 億、Meta Hyperion 等大案）、估算 2026-2028 全球 AI Data Center 用電翻 5 倍，功率元件廠營收結構性轉向
高毛利伺服器 SKU。

漢磊 (3707) 是台廠少數能量產 SiC MOSFET 的 IDM、被 STMicro 委託代工。立錡 (6286) / 矽力*-KY (6415) 是
多相 VRM controller 主力，朋程 / 強茂 / 富鼎在 MOSFET 段佔位。
`.trim(),
    timeline: {
      start: "2025 Q4",
      peak: "進行中（2026 H1 暴噴）",
      nowStatus: "2026/5 仍在飆漲，個股股價已創高",
    },
    twStocks: [
      { symbol: "3707.TWO", name: "漢磊", role: "SiC / GaN 晶圓代工 IDM" },
      { symbol: "6286.TW", name: "立錡", role: "多相 VRM controller 主力" },
      { symbol: "6415.TW", name: "矽力*-KY", role: "DC-DC controller 大廠" },
      { symbol: "8255.TW", name: "朋程", role: "整流 / 二極體模組（PSU）" },
      { symbol: "2481.TW", name: "強茂", role: "MOSFET + 二極體" },
      { symbol: "8261.TW", name: "富鼎", role: "Power MOSFET 設計" },
      { symbol: "3016.TWO", name: "嘉晶", role: "SiC / GaN 上游磊晶" },
      { symbol: "8081.TW", name: "致新", role: "POL 多相 VRM" },
      { symbol: "6138.TW", name: "茂達", role: "電源管理類比 IC" },
    ],
    relatedNvdaComponents: ["power-semi", "power-psu"],
    catalysts: [
      "GB300 / Blackwell Ultra 量產時程（2026 H1）",
      "Rubin 路線圖確認 800V HVDC 標配",
      "OpenAI Stargate / Meta Hyperion Data Center 建廠進度",
      "歐美關稅 / CHIPS Act 補貼確認車用功率元件持續強勢",
    ],
    watchPoints: [
      "Infineon / TI / STMicro 法說對 AI server 訂單能見度",
      "漢磊 SiC 月營收 YoY（2025 Q4 起加速）",
      "立錡 / 矽力*-KY 毛利率走勢（高毛利伺服器佔比）",
      "美國對 SiC 出口管制變動",
    ],
    peakReturn: "—（請以即時報價為準）",
  },

  {
    id: "thermal-liquid",
    name: "液冷散熱｜GB200 / Rubin 強制液冷",
    status: "active",
    brief: "AI 機櫃從氣冷轉液冷已是定局、雙鴻 / 高力 / 奇鋐持續超預期",
    narrative: `
2024 開始市場就在預期液冷取代氣冷、但真正 explode 是 2025 Q2 GB200 NVL72 量產後 — 機櫃 120kW 已遠超氣冷
極限。Cold plate、CDU、Quick Disconnect 接頭、液冷管路、整套液冷迴路 — 都是新增市場。

雙鴻 (3324) 從早期 3D VC（氣冷時代）就跟 NVDA 合作、現在無縫切到液冷板 + CDU 雙領域龍頭。高力 (8996) 透過鴻海
進入 GB200 機櫃液冷供應鏈、用既有板式熱交換器技術擴張。奇鋐 (3017) 是散熱模組通才、量級最大。

Rubin NVL144（2027）預估每櫃 ~600kW、液冷需求量再翻倍。CPO 共封裝光學落地後光引擎也要散熱，散熱題材
不會在 2026 結束。
`.trim(),
    timeline: {
      start: "2024 Q2（預期）",
      peak: "2025 Q3-Q4（實際放量）",
      nowStatus: "2026/5 維持高基期、靠 Rubin 預期延伸",
    },
    twStocks: [
      { symbol: "3324.TWO", name: "雙鴻", role: "液冷板 + CDU 雙領域龍頭" },
      { symbol: "8996.TW", name: "高力", role: "板式熱交換器 + 液冷模組" },
      { symbol: "3017.TW", name: "奇鋐", role: "散熱模組 + CDU 整合" },
      { symbol: "3653.TW", name: "健策", role: "液冷板 + 模組中堅" },
      { symbol: "2421.TW", name: "建準", role: "風扇 + 液冷 hybrid" },
      { symbol: "3402.TW", name: "漢科", role: "Quick Disconnect 接頭" },
    ],
    relatedNvdaComponents: ["thermal-liquid", "thermal-cdu"],
    catalysts: [
      "Rubin NVL144 規格公告（2026 GTC）",
      "微軟 / Google / Meta 自建 AI Data Center 採用液冷比例",
      "CDU 全球供應吃緊（缺貨利多）",
      "ASHRAE 液冷標準推進",
    ],
    watchPoints: [
      "雙鴻 / 高力月營收 YoY 是否維持 50%+",
      "GB300 / Rubin 出貨時程",
      "中國液冷對手（中興、英維克）出口能力",
    ],
    peakReturn: "—（請以即時報價為準）",
  },

  {
    id: "asic-custom",
    name: "客製化 AI ASIC｜Broadcom / Google / Meta",
    status: "active",
    brief: "雲端大廠不滿 NVDA GPU 毛利、自研 ASIC 拉動世芯 / 創意",
    narrative: `
NVDA GPU 毛利 70%+、雲端大廠（Google / Meta / Amazon）想削成本，紛紛找 Broadcom / Marvell 做客製化 ASIC。
Broadcom 的 AI ASIC 設計大量委託世芯-KY (3661) 做後段 IP 整合 + 流片，年營收從幾億跳到幾十億規模。

創意電子 (3443) 是 TSMC 旗下、跟 AVGO 同樣承接客製化 AI ASIC，2025 接到 Meta MTIA 2/3 大單。
智原 (3035) 在 IP 段切入較小。

題材主軸是「**AI 不只是 NVDA 一家通吃**」、客製化 ASIC 佔 AI 加速器市場比例從 2024 的 5% 預估到 2027 的 25%。
2026 Q1 已經因 Broadcom 法說會強烈展望，世芯 / 創意股價持續創高。
`.trim(),
    timeline: {
      start: "2024 Q3",
      peak: "2026 Q1（仍持續）",
      nowStatus: "2026/5 強勢、新客戶（OpenAI / TikTok）放話自研 ASIC 帶來想像空間",
    },
    twStocks: [
      { symbol: "3661.TWO", name: "世芯-KY", role: "Broadcom + AMD ASIC 設計主力" },
      { symbol: "3443.TW", name: "創意電子", role: "TSMC 設計服務、Meta MTIA 主供" },
      { symbol: "3035.TW", name: "智原", role: "聯電旗下、IP / 設計服務" },
      { symbol: "3529.TW", name: "力旺", role: "embedded NVM IP" },
      { symbol: "6643.TWO", name: "M31", role: "Foundation IP" },
    ],
    relatedNvdaComponents: ["asic-ip"],
    catalysts: [
      "Broadcom 季度法說 AI 營收指引",
      "OpenAI 確認自研 ASIC 合作對象",
      "Meta MTIA v2/v3 量產時程",
      "TikTok / 字節跳動 AI 晶片產量",
    ],
    watchPoints: [
      "世芯 2026 EPS（市場已給高估值，需 EPS 跟上）",
      "創意 Meta MTIA 訂單續單",
      "NVDA 對 ASIC 反擊（推出更小晶片或降毛利）",
    ],
    peakReturn: "—（請以即時報價為準）",
  },

  {
    id: "robotics",
    name: "人形機器人｜NVDA Isaac + 特斯拉 Optimus",
    status: "active",
    brief: "Optimus 2025 H2 試量產、NVDA Isaac 平台、機器人零組件題材熱起來",
    narrative: `
特斯拉 Optimus 在 2024 GTC 後預期 2025 試量產 + 2026 部分商用、NVDA 同步推 Isaac GR00T 機器人開發平台。
最大瓶頸是高扭矩諧波減速機、力矩感測器、伺服馬達 — 這些日歐廠（Harmonic Drive / Nabtesco）卡規格 + 產能。

台廠切入機器人零組件 — 鴻海集團（鴻海 2317 + 鴻海科技 2354）已啟動 Optimus 組裝代工試產線、上銀 (2049)
是台灣諧波減速機代表、所羅門 (2359) 在工業機器手臂 vision system 有切入。

風險：機器人量產時間表多次跳票、實際 2026 出貨數可能不到 1 萬台（特斯拉原口號 1000 萬台 / 年）。
但「機器人 = 下一波 AI 應用」narrative 太強、本益比拉到天高。
`.trim(),
    timeline: {
      start: "2024 Q4（特斯拉 Robotaxi day 後）",
      peak: "2026 Q1-Q2（試量產 narrative 高峰）",
      nowStatus: "2026/5 進行中、Optimus 試量產時程是關鍵",
    },
    twStocks: [
      { symbol: "2049.TW", name: "上銀", role: "諧波減速機 + 線性傳動" },
      { symbol: "2317.TW", name: "鴻海", role: "Optimus 代工試產 + MIH 平台" },
      { symbol: "2359.TW", name: "所羅門", role: "工業機器手臂 vision system" },
      { symbol: "4763.TW", name: "材料-KY", role: "機器人複合材料 + 結構件" },
      { symbol: "1597.TW", name: "直得", role: "線性滑軌" },
    ],
    catalysts: [
      "特斯拉 Q4 Optimus 試量產數量公告",
      "NVDA GTC 機器人專題（每年 3 月、10 月）",
      "中國宇樹 / Figure AI 商用機器人銷售數",
      "日歐諧波減速機 / 馬達廠擴產或缺貨",
    ],
    watchPoints: [
      "Optimus 實際量產 vs 馬斯克口號（過去多次跳票）",
      "上銀月營收 YoY（諧波減速機佔比變化）",
      "中國機器人廠進口替代速度",
    ],
    peakReturn: "—（請以即時報價為準）",
  },

  {
    id: "thermal-fan",
    name: "散熱風扇｜AI server 高轉速 DC fan 結構性需求",
    status: "active",
    brief: "AI 機架雙倍風扇用量、高轉速 + 高靜壓設計、建準 / 奇鋐 / 元山 受惠",
    narrative: `
雖然液冷是 GB200 主流敘事、但實際 AI server 仍有 50%+ 機架用「全氣冷」(H100 / L40S / 部分 B200)、
加上液冷機架也需「輔助風扇」（給 CPU / DIMM / 周邊散熱）、整體 AI server 風扇用量 vs 傳統 server
反而是「同步成長」、單價 +30%。

GB200 NVL72 整櫃用 32 顆高轉速 DC fan、單顆 ASP 從 USD 12 上升到 USD 25-30
（高轉速 + 高靜壓 + 雙滾珠軸承）。建準 (2421) 是全球 server fan 出貨量第二（僅次於 Delta）、
奇鋐 (3017) 從散熱模組廠跨入 fan 整合、元山 (6275) 主攻車用 + 工控 fan。

2026 預期 fan ASP 再上一階（NVDA Rubin 採用 PWM 4-pin 智慧調速 + 雙轉子）。
`.trim(),
    timeline: {
      start: "2024 Q2",
      peak: "進行中",
      nowStatus: "2026/5 仍強勢、Rubin 規格升級驅動 ASP 再上修",
    },
    twStocks: [
      { symbol: "2421.TW", name: "建準", role: "Server DC Fan 全球第二 (T1)" },
      { symbol: "3017.TW", name: "奇鋐", role: "散熱模組 + Fan 整合 (T1)" },
      { symbol: "6275.TWO", name: "元山", role: "車用 + 工控 fan (T2)" },
      { symbol: "1614.TW", name: "三洋電", role: "散熱風扇 + 馬達 (T3)" },
    ],
    relatedNvdaComponents: ["thermal-3dvc"],
    catalysts: [
      "Rubin 風扇規格揭曉時點",
      "GB300 出貨量爬升",
      "NVDA / Hyperscaler 機房擴張節奏",
    ],
    watchPoints: [
      "液冷滲透率（過快會稀釋風扇單機用量）",
      "中國風扇廠（Sunon / 三巨）價格戰",
    ],
    peakReturn: "—（請以即時報價為準）",
  },

  {
    id: "ccl-substrate-upstream",
    name: "CCL 高頻銅箔基板｜HBM / CoWoS / 800G Switch 上游原物料",
    status: "active",
    brief: "AI / 高速網路用高頻 CCL (Low Dk/Df) 結構性放量、台光電 / 聯茂 / 台燿 受惠",
    narrative: `
CCL（Copper Clad Laminate、銅箔基板）是所有 PCB 的「上游原物料」。AI server 用「高頻 CCL」 — 介電常數 Dk 要低、
損耗 Df 要小 — 因為 224G PAM4 訊號在 PCB 上跑、過去一般 FR4 已經不行、要用 Megtron 6/7 / Megtron Plus / Rogers
等高頻料。這些料價格是 FR4 的 5-10 倍、毛利率也高 30-40%。

**台光電 (2383)** 是全球高頻 CCL 第三大（僅次於日本 Panasonic、Isola）、近 70% 營收來自 AI server。
**聯茂 (6213)** 主攻 networking switch + ABF substrate 用 CCL。**台燿 (6274)** 主攻網通 + 高頻 5G CCL。

2026 H1 看到台光電 Megtron 7 等級 CCL 進入 NVDA Spectrum-X 主板 / Quantum-X800 InfiniBand 主板、第二波加單。
`.trim(),
    timeline: {
      start: "2024 Q3",
      peak: "進行中",
      nowStatus: "2026/5 仍強勢、台光電 H2 高頻 CCL 訂單能見度看到 2027",
    },
    twStocks: [
      { symbol: "2383.TW", name: "台光電", role: "高頻 CCL 全球第三、AI server 主力 (T1)" },
      { symbol: "6213.TW", name: "聯茂", role: "ABF + networking CCL (T2)" },
      { symbol: "6274.TW", name: "台燿", role: "高頻網通 CCL (T2)" },
      { symbol: "1303.TW", name: "南亞", role: "玻纖布 + 基礎 CCL 上游 (T3)" },
    ],
    relatedNvdaComponents: ["abf-substrate", "networking-optical"],
    catalysts: [
      "台光電月營收 + 客戶集中度揭露",
      "Broadcom Tomahawk 6 / NVDA Spectrum-X 量產",
      "Megtron 7 / Megtron Plus 採用率",
    ],
    watchPoints: [
      "日本 Panasonic Megtron 7 擴產情況",
      "傳統 PCB 廠（金像 / 健鼎）能否吃到高頻訂單",
    ],
    peakReturn: "—（請以即時報價為準）",
  },

  {
    id: "ai-networking-switch",
    name: "AI 網路交換器｜800G / 1.6T 白牌 Switch",
    status: "active",
    brief: "Hyperscaler 採用白牌 800G / 1.6T Switch、智邦 / 明泰 / 中磊 ODM 卡位",
    narrative: `
AI Data Center 內網從 400G → 800G → 2026 H2 拉到 1.6T。GB200 NVL72 內部用 InfiniBand NDR 400G、
跨機架 / 跨機房用 Ethernet 800G。Hyperscaler（Google / Meta / Microsoft）不買 Cisco / Arista 整機、
直接買「白牌 switch」(ODM 設計 + 自己刷 Linux OS、SONiC)、剛好台灣 ODM 是這領域龍頭。

**智邦 (2345)** 是 Meta / Microsoft 800G switch ODM 主力、近 50% 營收來自 AI switch。
**明泰 (3380)** 是 Google 自研 TPU pod 配套 networking ODM。**中磊 (5388)** 主攻 5G + AI 邊緣 networking。

2026 H1 看到 1.6T switch 開始出貨（Broadcom Tomahawk 6）、智邦先吃到第一波樣品 + 量產訂單。
`.trim(),
    timeline: {
      start: "2024 Q2",
      peak: "進行中",
      nowStatus: "2026/5 仍強勢、1.6T 量產拉動第二波",
    },
    twStocks: [
      { symbol: "2345.TW", name: "智邦", role: "Meta / MS 白牌 switch ODM 主力 (T1)" },
      { symbol: "3380.TW", name: "明泰", role: "Google TPU pod 配套 networking (T2)" },
      { symbol: "5388.TW", name: "中磊", role: "5G + AI 邊緣 networking (T2)" },
      { symbol: "6285.TW", name: "啟碁", role: "AI Server NIC + switch SoC (T3)" },
    ],
    relatedNvdaComponents: ["networking-optical", "networking-cpo"],
    catalysts: [
      "Broadcom Tomahawk 6 量產時程",
      "Hyperscaler 800G → 1.6T 升級節奏",
      "智邦月營收（AI switch 比重）",
    ],
    watchPoints: [
      "Cisco / Arista 反擊白牌（價格戰）",
      "CPO 取代純電 switch 的時程（會吃掉部分 ASIC switch 需求）",
    ],
    peakReturn: "—（請以即時報價為準）",
  },

  // ═════════════════════════════════════════════════
  // 🟢 已漲過高峰、現在高基期 (PEAKED)
  // ═════════════════════════════════════════════════

  {
    id: "ai-server-odm",
    name: "AI 伺服器整機 ODM｜廣達 / 緯創 / 緯穎",
    status: "peaked",
    brief: "2024-2025 的主漲標的、Q4 2025 後高基期、進入消化期",
    narrative: `
AI 伺服器代工是 2024-2025 最強族群、廣達 (2382) 從股價 50 漲到最高 320+，緯創 / 緯穎也是 5-7 倍。
GB200 NVL72 整機櫃單櫃售價 ~NT$ 9000 萬、毛利率 9-12%（比傳統伺服器高一倍）— 業績放量 + 毛利擴張雙效。

但到 2025 Q4 開始市場擔心兩件事：
1. 微軟 / Google / Meta 自建 ASIC（見上一題材）→ NVDA GPU 採購可能縮減
2. 廣達 / 鴻海競爭白熱化 → GB200 整機 ODM 拆單給更多人 → 毛利壓縮

2026 Q1 雖然營收還在 YoY +50%、但股價提前反映、進入「漲不動 / 拉回整理」狀態。
2026 H2 看 Rubin 規格 + Vera Rubin NVL144 訂單分配重啟動能。
`.trim(),
    timeline: {
      start: "2023 Q4",
      peak: "2024 Q3 + 2025 Q3 雙峰",
      nowStatus: "2026/5 高基期橫盤、等下一個 catalyst（Rubin）",
    },
    twStocks: [
      { symbol: "2382.TW", name: "廣達", role: "GB200 NVL72 最大 ODM" },
      { symbol: "2317.TW", name: "鴻海", role: "GB200 ODM + Bluefield 組裝" },
      { symbol: "3231.TW", name: "緯創", role: "GB200 ODM + AI Diamond 大單" },
      { symbol: "6669.TW", name: "緯穎", role: "Meta / Microsoft 客製 AI 伺服器" },
      { symbol: "2356.TW", name: "英業達", role: "AI 伺服器代工 Tier 2" },
      { symbol: "2376.TW", name: "技嘉", role: "HGX 主機板 + 整機" },
    ],
    relatedNvdaComponents: ["odm-hgx", "odm-rack"],
    catalysts: [
      "Rubin NVL144 訂單分配（2026 H2 預期公布）",
      "雲端資本支出指引（Microsoft / Google / Meta / Amazon 法說）",
      "客製 ASIC 對 NVDA GPU 採購排擠程度",
    ],
    watchPoints: [
      "廣達 / 緯創 GB200 毛利率走勢",
      "Rubin 試產時 ODM 重新洗牌",
      "中國禁令對 NVDA 出口（影響台廠代工）",
    ],
    peakReturn: "—（請以即時報價為準）",
  },

  {
    id: "cowos-packaging",
    name: "CoWoS 先進封裝｜TSMC + 後段測試（含三層蛋糕升級路徑）",
    status: "peaked",
    brief: "TSMC 持續擴 CoWoS 產能、後段測試廠營收創高、2026 H2 升級到「三層蛋糕 SoIC-X」",
    narrative: `
CoWoS（Chip-on-Wafer-on-Substrate）是 NVDA H100 / B200 量產的最大瓶頸。TSMC (2330) 從 2024 月產 ~20K 片擴到
2026 預期 ~150K 片、CapEx 數百億美元。CoWoS 後段測試（京元電 2449）也跟著大成長。

但 TSMC 本身股價在 2024-2025 已大漲到 1300+ NT$，2026 進入「業績仍 OK 但股價已反映」階段。京元電 / 日月光投控 / 力成
等後段廠也類似。

要再有大行情、需要 N2 製程量產或 CPO 大單帶動 — 但這些都要等 2026 H2 之後。
`.trim(),
    timeline: {
      start: "2023 Q1",
      peak: "2024 Q3 + 2025 Q4 雙峰",
      nowStatus: "2026/5 高基期、靜待 N2 + Rubin 落地",
    },
    twStocks: [
      { symbol: "2330.TW", name: "台積電", role: "CoWoS 唯一供應商" },
      { symbol: "2449.TW", name: "京元電子", role: "CoWoS 後段測試" },
      { symbol: "3711.TW", name: "日月光投控", role: "後段封裝測試" },
      { symbol: "6239.TW", name: "力成", role: "DRAM / NAND 後段" },
      { symbol: "1560.TW", name: "中砂", role: "CMP 拋光研磨料" },
    ],
    relatedNvdaComponents: ["cowos", "cowos-l"],
    catalysts: [
      "TSMC N2 試產 / 量產時程（2026 H2）",
      "TSMC 月產能再次上修（每季法說會）",
      "Rubin / Feynman 規格公告",
    ],
    watchPoints: [
      "CoWoS 供需是否轉鬆（影響毛利率）",
      "Intel / Samsung 先進封裝追趕進度",
      "美國 CHIPS Act 補貼台廠美國設廠進度",
    ],
    peakReturn: "—（請以即時報價為準）",
  },

  {
    id: "abf-substrate",
    name: "ABF 載板｜欣興 / 南電 / 景碩",
    status: "peaked",
    brief: "2023-2024 高基期、2025 H1 拉回整理、Q4 因 Blackwell 補貨重啟",
    narrative: `
2023 ABF 一度供不應求、欣興 / 南電股價飆漲 4-5 倍。但 2024 H2 PC / 手機需求疲軟拉低庫存、欣興從高點 270 跌回 130。
2025 Q3 開始 Blackwell GB300 + 客製 ASIC 板用量增加、欣興 / 南電季度營收逐月回升。

跟「液冷散熱」/「功率半導體」相比、ABF 屬於波動更大、依賴 PC + AI 雙引擎、目前處於從低基期復甦、但還沒回到 2024 高點。
`.trim(),
    timeline: {
      start: "2023 Q1",
      peak: "2024 Q3（高點後拉回 50%）",
      nowStatus: "2026/5 從谷底回升中、但離前高還有 20%",
    },
    twStocks: [
      { symbol: "3037.TW", name: "欣興", role: "全球 ABF 第三大" },
      { symbol: "8046.TW", name: "南電", role: "ABF 第二大" },
      { symbol: "3189.TW", name: "景碩", role: "ABF 第三家 + IC 基板" },
    ],
    relatedNvdaComponents: ["abf-substrate"],
    catalysts: [
      "Blackwell Ultra GB300 載板拉貨（2026 Q2-Q3）",
      "客製 ASIC（Broadcom / Marvell）板用量",
      "PC / Server CPU 換代週期",
    ],
    watchPoints: [
      "欣興月營收 YoY 是否轉正",
      "AI ASIC 板用量 vs 傳統 CPU 板",
      "日廠 Ibiden 擴產進度（價格戰風險）",
    ],
    peakReturn: "—（請以即時報價為準）",
  },

  // ═════════════════════════════════════════════════
  // 🔴 漲過後跌深 (DECLINED)
  // ═════════════════════════════════════════════════

  {
    id: "apple-supply-chain",
    name: "蘋果供應鏈｜iPhone 出貨疲弱",
    status: "declined",
    brief: "iPhone 銷量結構性放緩、Apple Intelligence 跳票、台廠蘋果鏈表現平淡",
    narrative: `
2024 H1 蘋果發表 Apple Intelligence、市場一度大炒「iPhone 16 大換機潮」、大立光 / 玉晶光 / 鴻海跟著漲。
但 2024 Q4-2025 H1 實際出貨數讓人失望（iPhone 16 銷量 YoY 持平）、Apple Intelligence 在中國市場推遲上市、
中國 iPhone 出貨被華為 / 小米吃掉 20%+ 市占。

2025 H2 雖然 iPhone 17 Air 預期、但供應鏈拉貨保守。鴻海 (2317) 雖然有 AI 伺服器 + 機器人雙引擎抵消、其他純蘋果鏈
（大立光 3008、玉晶光 3406、可成 2474）就維持低檔。

要回神得看 2026 iPhone 18 + AR/VR 裝置（Vision Pro 2 + 平價版）或 2027 摺疊機。
`.trim(),
    timeline: {
      start: "2024 Q1（炒作起）",
      peak: "2024 Q3（Apple Intelligence 發表）",
      nowStatus: "2026/5 持續低迷、等 iPhone 18 / Vision Pro 2",
    },
    twStocks: [
      { symbol: "3008.TW", name: "大立光", role: "iPhone 鏡頭模組" },
      { symbol: "3406.TWO", name: "玉晶光", role: "iPhone + AR 鏡頭" },
      { symbol: "2317.TW", name: "鴻海", role: "iPhone 組裝（其他事業抵消）" },
      { symbol: "2474.TW", name: "可成", role: "iPhone 金屬機殼" },
      { symbol: "2354.TW", name: "鴻準", role: "iPhone 金屬件" },
    ],
    catalysts: [
      "iPhone 18 規格 + 出貨預估（2026 Q3 法說）",
      "Vision Pro 2 / 平價版發表",
      "AI 手機殺手級 app 出現",
      "中國市場 iPhone 補貼政策",
    ],
    watchPoints: [
      "iPhone 16/17 中國市占（vs 華為小米）",
      "Apple Intelligence 中國上市時程",
      "鴻海蘋果業務佔比下降程度",
    ],
    peakReturn: "—（請以即時報價為準）",
  },

  {
    id: "china-adr-related",
    name: "中國消費 ADR 鏈｜鴻海集團代工",
    status: "declined",
    brief: "中國消費電子 / 阿里巴巴系疲弱、台廠中國代工營收下滑",
    narrative: `
2024 中國消費刺激政策不及預期、阿里巴巴 / 拼多多等 ADR 走低、連帶台廠在中國的消費電子代工（鴻海集團子公司 + 群創 /
友達面板）也表現疲弱。

2025 川普第二任期關稅戰、台廠加速產線移到墨西哥 / 印度 / 越南、中國產能裁撤、但短期還在 transition cost 壓力下。

要重啟得看：
1. 中國消費政策大幅度刺激
2. 中美關稅戰落幕（不太可能 2026）
3. 台廠完成產能轉移、低成本基地穩定營運
`.trim(),
    timeline: {
      start: "2023 Q4",
      peak: "—",
      nowStatus: "2026/5 持續低迷、等關稅戰落幕",
    },
    twStocks: [
      { symbol: "3481.TW", name: "群創", role: "面板（中國 + 蘋果代工）" },
      { symbol: "2409.TW", name: "友達", role: "面板" },
      { symbol: "3231.TW", name: "緯創", role: "中國 PC 代工（其他 AI 業務撐）" },
    ],
    catalysts: [
      "中國消費刺激政策（家電以舊換新 2.0）",
      "中美關稅戰新階段",
      "台廠墨西哥 / 印度產能上線",
    ],
    watchPoints: [
      "鴻海中國產能佔比下降速度",
      "阿里巴巴 / 拼多多季營收成長",
      "面板報價（IT / TV 雙弱）",
    ],
    peakReturn: "—（請以即時報價為準）",
  },

  {
    id: "memory-modules",
    name: "記憶體模組｜DRAM 漲過後拉回中",
    status: "declined",
    brief: "2024-2025 H1 漲過後、2026 Q1 起 DDR5 報價拉回 + 模組廠股價回檔",
    narrative: `
2024 全年 DRAM 因 HBM 排擠 DDR5 產能、報價狂飆 80%、記憶體模組廠一度大賺。
2025 Q4 - 2026 Q1 因 AI server DDR5 補單衝高、短暫第二波漲價。

但 2026 Q1 末因為：
1. **SK Hynix / Samsung 重新把產能拉回 DDR5**（HBM 良率提升、HBM3e 庫存堆積）
2. **AI server 採購節奏放緩**（部分 Hyperscaler 觀望 Rubin 規格）
3. **PC / 手機需求疲弱**（消費市場庫存仍高）

DDR5 8Gb 現貨價 2026/2-2026/5 跌 -25%、威剛從 130 元跌回 95 元 -27%、十銓從 110 跌到 85 -23%。
南亞科從 65 跌到 50 -23%（DRAM IDM 也受拖累、但跌幅較淺）。

題材現處於「跌深整理」階段、等 HBM4 量產（2026 H2）再次排擠 DDR5 才有反彈契機。
`.trim(),
    timeline: {
      start: "2023 Q4",
      peak: "2026 Q1 第二波（短）",
      nowStatus: "2026/5 從近期高點 -23~-27%、跌深整理中、等 HBM4 H2 量產帶起第三波",
    },
    twStocks: [
      { symbol: "3260.TW", name: "威剛", role: "DRAM 模組龍頭 (T1)" },
      { symbol: "8271.TWO", name: "宇瞻", role: "DRAM 模組 + SSD (T2)" },
      { symbol: "4967.TWO", name: "十銓", role: "電競 DRAM 模組 (T1)" },
      { symbol: "2408.TW", name: "南亞科", role: "DRAM IDM (T1)" },
    ],
    catalysts: [
      "HBM4 量產時點（壓縮 DDR5 產能、預期 2026 H2）",
      "AI 伺服器 DDR5 採購補單",
      "SK Hynix / Samsung / Micron 法說 DRAM 供需指引",
      "DDR5 8Gb 現貨價（DRAMeXchange 月報）",
    ],
    watchPoints: [
      "DDR5 8Gb 報價何時止跌",
      "南亞科 / 華邦電 月營收 YoY 何時由負轉正",
      "Hyperscaler 訂單回升訊號",
    ],
    peakReturn: "—（請以即時報價為準）",
  },

  {
    id: "memory-dram-idm",
    name: "DRAM IDM / 利基記憶體｜南亞科 / 華邦電 / 旺宏 — 漲過後拉回",
    status: "declined",
    brief: "南亞科 / 華邦電 / 旺宏 2024-2025 漲完一波後、2026 Q1 末隨 DRAM 整體拉回",
    narrative: `
有別於記憶體模組廠（買成品再組裝）、DRAM IDM 是「自己設計 + 自有 fab 量產」 — 台灣只剩**南亞科 (2408)** 一家。
華邦電 (2344) 主攻利基型 DRAM (DDR3 / Mobile DRAM)、NOR flash；旺宏 (2337) 主攻 NOR + 3D NAND。

過去一年強勢期（2024 Q4 - 2026 Q1）：
- 南亞科從 28 → 65 元 +130%
- 華邦電從 22 → 45 元 +105%
- 旺宏 35 → 55 +57%
- 群聯 (8299) 1.5 年 +90%

但 2026 Q1 末隨 DRAM 報價拉回 + HBM 良率提升釋出產能：
- 南亞科從近期高點 65 跌回 50 元 **-23%**
- 華邦電從 45 跌到 36 -20%
- 旺宏從 55 跌到 44 -20%

題材跟模組廠一樣處於跌深整理。等 HBM4 量產（2026 H2）再次壓縮 DDR5/利基 DRAM 才有反彈。
`.trim(),
    timeline: {
      start: "2024 Q4",
      peak: "2026 Q1",
      nowStatus: "2026/5 從高點 -20~-23%、跌深整理中、等 HBM4 H2 量產帶起反彈",
    },
    twStocks: [
      { symbol: "2408.TW", name: "南亞科", role: "DRAM IDM、DDR5 自製 (T1)" },
      { symbol: "2344.TW", name: "華邦電", role: "利基 DRAM + NOR flash (T1)" },
      { symbol: "2337.TW", name: "旺宏", role: "NOR + 3D NAND (T1)" },
      { symbol: "8299.TWO", name: "群聯", role: "NAND controller IC + SSD (T1)" },
      { symbol: "5269.TW", name: "祥碩", role: "ASMedia、SSD/USB controller (T2)" },
    ],
    relatedNvdaComponents: ["hbm"],
    catalysts: [
      "HBM4 量產時點（壓縮 DDR5 + 利基 DRAM）",
      "Micron / SK / Samsung 法說 DRAM 供需指引",
      "AI 邊緣裝置（AI PC、自駕車）BMC / NOR 採購",
      "群聯月營收 SSD controller 比重",
    ],
    watchPoints: [
      "南亞科 / 華邦電 月營收 YoY 何時由負轉正",
      "Samsung 是否擴大產能（壓抑漲價）",
      "中國 CXMT / YMTC 利基型 DRAM 追上速度",
    ],
    peakReturn: "—（請以即時報價為準）",
  },

  {
    id: "high-speed-cable",
    name: "高速 Cable / Copper Interconnect｜貿聯-KY / 健和興 / 信邦",
    status: "active",
    brief: "GB200 NVL72 內 5184 條銅纜、貿聯-KY / 健和興 / 信邦 高速線材整鏈受惠",
    narrative: `
GB200 NVL72 機架內部 NVLink 5 全部用銅纜（捨棄光纖、因為短距 < 5m 銅纜 30x 便宜 + 低功耗）。
單櫃 5184 條 224G PAM4 銅纜、加上電源線、控制線、感測線、整櫃近 1 萬條線材。

主力台廠：
- **貿聯-KY (3665)** — 全球高速 cable 龍頭、NVDA DGX / GB200 主力供應、Tesla 充電樁也是
- **健和興 (3003)** — 高速連接器 + cable 整套、AI server 連接器主力
- **信邦 (3023)** — 工業 + 醫療 + AI server cable 多腳發展、整廠連接系統

貿聯-KY 從 2024 初 350 元 → 2026/5 飆到 1,200+ 元 **+240%**（市值千億級成長）、是這波中型股最強之一。
健和興、信邦也跟著走強。

2026 H2 看點：Rubin NVL144（2027）內部 cable 升級到 224G 雙倍密度、加單潛力。
`.trim(),
    timeline: {
      start: "2024 Q2",
      peak: "進行中",
      nowStatus: "2026/5 仍強勢、貿聯 GB300 量產 + Rubin 規格升級雙引擎",
    },
    twStocks: [
      { symbol: "3665.TW", name: "貿聯-KY", role: "全球高速 cable 龍頭、NVDA / Tesla 雙主力 (T1)" },
      { symbol: "3003.TW", name: "健和興", role: "高速連接器 + cable 整套 (T1)" },
      { symbol: "3023.TW", name: "信邦", role: "工業 + 醫療 + AI server cable (T1)" },
      { symbol: "6153.TW", name: "嘉聯益", role: "DAC 高速銅纜 + 軟板 (T2)" },
      { symbol: "3679.TWO", name: "新至陞", role: "連接器 + cable 配套 (T2)" },
      { symbol: "8086.TW", name: "宏捷科", role: "高頻連接器材料 (T3)" },
    ],
    relatedNvdaComponents: ["cable", "connector", "networking-nvlink"],
    catalysts: [
      "貿聯-KY 月營收（AI cable 比重 vs Tesla）",
      "GB300 量產時程",
      "Rubin NVL144 規格揭曉（cable 升級）",
      "Tesla Cybertruck / Optimus 充電線需求",
    ],
    watchPoints: [
      "中國 cable 廠（Luxshare）價格戰",
      "224G → 448G cable 技術切換時點",
    ],
    peakReturn: "—（請以即時報價為準）",
  },

  {
    id: "bmc-server-ic",
    name: "AI Server BMC + 介面 IC｜信驊 / 譜瑞-KY / 祥碩",
    status: "active",
    brief: "信驊 BMC 全球第一、每塊伺服器主板必備、AI server 用量持續攀升",
    narrative: `
BMC（Baseboard Management Controller）是伺服器主板上的「小型管理電腦」 — 負責遠端管理、開關機、
監測溫度 / 風扇 / 電壓、被駭客攻擊也能還原韌體。每一塊伺服器主板都需要一顆 BMC。

**信驊 (5274)** 是全球 BMC 市占率第一（70%+、壓制 ASPEED 後其他競爭者）、且 AI server 用「升級版 BMC」 —
單顆 ASP 從 USD 8 拉到 USD 25-40（更多 PHY / 加密 / 算力）。

AI server 還大量用 PCIe Switch / Retimer：
- **譜瑞-KY (4966)** — Retimer 全球前三、PCIe 6 為 AI server 標配
- **祥碩 (5269)** — ASMedia、USB / SATA / PCIe controller

信驊 2024 初 1,600 元、2026/5 漲到 4,500+ 元 **+180%**（高股價但 EPS 跟著拉、本益比合理）。
譜瑞-KY 從 200 元飆到 750 元 **+275%**（小型股最猛）。
`.trim(),
    timeline: {
      start: "2024 Q1",
      peak: "進行中",
      nowStatus: "2026/5 仍強勢、PCIe 6 量產 + AI server 滲透率上升雙引擎",
    },
    twStocks: [
      { symbol: "5274.TW", name: "信驊", role: "BMC 全球第一 (T1)" },
      { symbol: "4966.TWO", name: "譜瑞-KY", role: "PCIe Retimer 全球前三 (T1)" },
      { symbol: "5269.TW", name: "祥碩", role: "ASMedia controller (T2)" },
      { symbol: "5471.TWO", name: "松翰", role: "IPMI 子卡 + 邊緣管理 IC (T3)" },
    ],
    relatedNvdaComponents: ["bmc-controller", "asic-ip"],
    catalysts: [
      "信驊月營收（BMC ASP 上修變化）",
      "PCIe 6 Retimer 採購單",
      "AI server BMC 規格升級時點",
    ],
    watchPoints: [
      "ASPEED 是否擴大 BMC 替代信驊",
      "Intel / AMD 整合 BMC 風險",
    ],
    peakReturn: "—（請以即時報價為準）",
  },

  {
    id: "semiconductor-equipment",
    name: "半導體設備｜家登 / 京鼎 / 萬潤 — TSMC capex 配套",
    status: "active",
    brief: "TSMC 2026 capex 預估 $50B+、N3 / N2 / A14 廠房擴建、家登 / 京鼎 / 萬潤 受惠",
    narrative: `
TSMC 2026 預估 capex $50B+（vs 2024 $32B、+56%）、主因 N2 / A14 量產 + 美國亞利桑那 Fab 21 第二期 + 日本熊本 Fab 2。
半導體設備鏈台廠：

- **家登 (6526)** — EUV 光罩傳載盒、全球獨家（ASML 認證）、TSMC EUV 機台爆增直接受惠
- **京鼎 (3413)** — TEL / AMAT 設備零件代工、AI 製程設備需求拉動
- **萬潤 (6187)** — 半導體封測機台、CoWoS 量產帶動測試機需求
- **崇越 (5434)** — 半導體製程化學品通路（雙氧水、研磨液）

家登從 2024 初 200 元 → 2026/5 飆到 800+ 元 **+300%**（EUV 滲透率最直接）。
京鼎 80 → 250 **+213%**。萬潤 100 → 320 **+220%**。

2026 H2 看點：A14 製程量產、量子退火 / 3D 異質整合需要新一代設備。
`.trim(),
    timeline: {
      start: "2024 Q2",
      peak: "進行中",
      nowStatus: "2026/5 仍強勢、TSMC N2 量產 + Arizona Fab 21 第二期擴建雙引擎",
    },
    twStocks: [
      { symbol: "3680.TW", name: "家登", role: "EUV 光罩傳載盒全球獨家 (T1)" },
      { symbol: "3413.TW", name: "京鼎", role: "TEL / AMAT 設備零件代工 (T1)" },
      { symbol: "6187.TWO", name: "萬潤", role: "封測機台、CoWoS 受惠 (T1)" },
      { symbol: "5434.TW", name: "崇越", role: "半導體製程化學品通路 (T2)" },
    ],
    relatedNvdaComponents: ["cowos", "cowos-l"],
    catalysts: [
      "TSMC capex 法說指引（每季更新）",
      "N2 / A14 量產時程",
      "ASML EUV 出貨量",
      "CoWoS 月產能擴張",
    ],
    watchPoints: [
      "TSMC 是否放緩 capex（AI demand 過熱風險）",
      "三星 / Intel Foundry 競爭力",
    ],
    peakReturn: "—（請以即時報價為準）",
  },

  {
    id: "ai-pc-npu-edge",
    name: "AI PC / NPU 邊緣運算｜聯發科 / 瑞昱 / 信驊 BMC",
    status: "active",
    brief: "AI PC（Copilot+ PC）滲透率拉升、聯發科 / 瑞昱 NPU IP / SoC 受惠",
    narrative: `
AI 浪潮從「雲端」延伸到「邊緣裝置」(AI PC / 手機 / 自駕車 / 智慧家居)。Microsoft Copilot+ PC 標準要求 40 TOPS NPU、
Apple M5 內建神經網路加速器。

台灣 AI 邊緣鏈：
- **聯發科 (2454)** — Dimensity 9400 / 天璣 旗艦 SoC 內建 NPU、與 NVDA 合作 Project Digits 桌上型 AI PC
- **瑞昱 (2379)** — 智慧家居 SoC + 網通晶片、加入 AI 邊緣運算
- **信驊 (5274)** — BMC + IPMI 子卡跨入 AI server 管理 IC（雙腳）
- **創意電子 (3443)** — 部分 AI 邊緣 ASIC 設計服務

聯發科 2024 初 1,000 元、2026/5 漲到 1,800 元 +80%（NVDA 合作消息 + 旗艦 SoC 出貨拉動）。
瑞昱 350 → 700 元 +100%。

2026 H2 看點：NVDA Project Digits PC（Q3 上市）、Apple M6 + Vision Pro 2、聯發科車用 SoC 大客戶。
`.trim(),
    timeline: {
      start: "2024 Q2",
      peak: "進行中",
      nowStatus: "2026/5 仍強勢、Copilot+ PC 滲透率 30%、聯發科 NVDA 合作放量",
    },
    twStocks: [
      { symbol: "2454.TW", name: "聯發科", role: "旗艦 SoC + NPU IP + 與 NVDA 合作 (T1)" },
      { symbol: "2379.TW", name: "瑞昱", role: "智慧家居 SoC + 網通 + AI 邊緣 (T1)" },
      { symbol: "5274.TW", name: "信驊", role: "BMC + AI 邊緣管理 IC (T2)" },
      { symbol: "3443.TW", name: "創意電子", role: "AI 邊緣 ASIC 設計服務 (T2)" },
    ],
    relatedNvdaComponents: ["asic-ip"],
    catalysts: [
      "NVDA Project Digits 出貨量",
      "聯發科月營收（與 NVDA 合作 SoC 比重）",
      "Apple M6 / Vision Pro 2 出貨",
      "Copilot+ PC 滲透率",
    ],
    watchPoints: [
      "AI PC 殺手級應用是否出現",
      "高通 / Qualcomm 在 AI PC 市佔搶占",
    ],
    peakReturn: "—（請以即時報價為準）",
  },

  // ═════════════════════════════════════════════════
  // 🔵 預期會漲 (ANTICIPATED) — 依零組件邏輯推測
  // ═════════════════════════════════════════════════

  {
    id: "cpo-silicon-photonics",
    name: "矽光子 / CPO 共封裝光學｜Rubin 標配",
    status: "anticipated",
    brief: "Vera Rubin NVL144（2027）強制 CPO、台廠光通訊 + 矽光子供應鏈準備中",
    narrative: `
CPO（Co-Packaged Optics）是把光引擎直接封裝到交換器 ASIC 旁、取代傳統 pluggable 光模組、省功耗 + 延遲。
NVDA Rubin 路線圖明示 CPO 是 Vera Rubin NVL144（2027）標配。

但目前（2026 Q2）股價已開始反應、聯亞 (3081) / 眾達-KY (4977) / 華星光 (4979) 等開始走強，但離真正
CPO 大量導入還有 1-2 年、預期 2026 H2 - 2027 H1 之間有 2 波大漲。

關鍵突破點：
- TSMC CPO 量產 yield 提升
- NVDA Rubin NVL144 規格公告（2026 GTC）
- 光引擎 ASIC 客戶確認
`.trim(),
    timeline: {
      start: "2025 Q4（熱身）",
      peak: "預期 2027（Rubin 量產時）",
      nowStatus: "2026/5 開始啟動、波段震盪向上",
    },
    twStocks: [
      { symbol: "2330.TW", name: "台積電", role: "CPO 光引擎 ASIC 製造 + 矽光子整合" },
      { symbol: "3450.TWO", name: "聯鈞", role: "光收發 + CPO 光引擎合作" },
      { symbol: "4977.TW", name: "眾達-KY", role: "矽光子 CPO 整合 + AOC" },
      { symbol: "3081.TW", name: "聯亞", role: "雷射晶粒（CPO 上游）" },
      { symbol: "4979.TWO", name: "華星光通", role: "800G / 1.6T 模組" },
      { symbol: "3163.TWO", name: "波若威", role: "光被動元件" },
      { symbol: "3363.TWO", name: "上詮", role: "矽光子模組整合" },
    ],
    relatedNvdaComponents: ["networking-cpo", "networking-optical"],
    catalysts: [
      "NVDA GTC 2026 Rubin NVL144 規格揭露",
      "TSMC CPO 量產 yield 公告",
      "客戶 (Meta / Google) 採用 CPO timeline",
    ],
    watchPoints: [
      "聯鈞 / 眾達 CPO 合作客戶確認",
      "光模組廠對 CPO 衝擊評估（替代效應）",
      "2026 GTC NVDA 公告（3 月）",
    ],
    peakReturn: "—（請以即時報價為準）",
  },

  {
    id: "hbm4-supply-chain",
    name: "HBM4 上游材料｜PCB / 載板 / 銅箔",
    status: "anticipated",
    brief: "HBM4 12-Hi 堆疊製程複雜、上游高密度 PCB / 銅箔 / 載板供應鏈受惠",
    narrative: `
HBM4 預計 2026 H2 量產（SK Hynix + Samsung 競爭激烈）、12-Hi（12 層 DRAM 堆疊）製程比 HBM3e 8-Hi 困難得多。

中間需要：
- 高密度 PCB（細線路）
- 載板（更精密的 substrate）
- 高純度銅箔
- 半導體設備（hybrid bonding）

台廠在 PCB 段（欣興 / 南電 / 景碩）、銅箔（金居 8358 / 長春集團）開始有 HBM4 訂單能見度、但市場焦點仍在 NVDA GPU、
HBM4 上游題材還沒被充分炒。預期 2026 Q3-Q4 在 HBM4 試產時會起漲。
`.trim(),
    timeline: {
      start: "2026 Q1（剛開始）",
      peak: "預期 2026 Q4 - 2027 H1",
      nowStatus: "2026/5 隱性題材、尚未充分炒作",
    },
    twStocks: [
      { symbol: "3037.TW", name: "欣興", role: "HBM 載板技術合作" },
      { symbol: "8046.TW", name: "南電", role: "HBM 載板 Tier 1" },
      { symbol: "8358.TWO", name: "金居", role: "高純度銅箔（HBM 用）" },
      { symbol: "1718.TW", name: "中纖", role: "上游材料供應" },
    ],
    relatedNvdaComponents: ["hbm", "abf-substrate"],
    catalysts: [
      "SK Hynix HBM4 試產時程確認",
      "Rubin GPU HBM4 規格公告（容量、頻寬）",
      "TSMC hybrid bonding 製程量產",
    ],
    watchPoints: [
      "SK Hynix vs Samsung HBM4 競爭",
      "Micron HBM4 追趕進度",
      "ABF / PCB 廠 HBM 相關營收佔比披露",
    ],
    peakReturn: "—（請以即時報價為準）",
  },

  {
    id: "hvdc-800v-power",
    name: "高壓直流電 800V HVDC｜AI Data Center 新架構",
    status: "anticipated",
    brief: "AI Data Center 從傳統 480V AC 轉 800V DC、整套電源架構重做",
    narrative: `
傳統 Data Center 用 480V AC → UPS → PDU → 機櫃 230V/120V。AI Data Center 因為功耗暴增、轉換損耗放大、
NVDA 跟 Microsoft / Google 聯合推 800V HVDC（高壓直流）架構 — 可省 5-10% 電力 + 縮小 30% 銅纜用量。

這需要重做：
- HVDC 整流模組（AC 480V → DC 800V）
- HVDC 配電（PDU + busbar）
- DC-DC 轉換器（800V → 48V）
- 高壓開關 + 保護裝置

台達電 (2308) 已明示 2026 H2 推出 HVDC 完整方案、光寶 / 群電跟進。重電廠（華城 / 東元）也切入 HVDC 變壓器
+ 開關櫃。

時程：2026 H2 - 2027 H1 是第一波，與 Rubin NVL144 部署同步。
`.trim(),
    timeline: {
      start: "2025 Q4（concept 公開）",
      peak: "預期 2027",
      nowStatus: "2026/5 醞釀中、台達電法說有提及",
    },
    twStocks: [
      { symbol: "2308.TW", name: "台達電", role: "HVDC 整體方案 + 整流模組" },
      { symbol: "2301.TW", name: "光寶", role: "HVDC PSU + Power Shelf" },
      { symbol: "1503.TW", name: "士電", role: "HVDC 變壓器 / 開關櫃" },
      { symbol: "1519.TW", name: "華城", role: "高壓變壓器" },
      { symbol: "1504.TW", name: "東元", role: "重電 + 馬達" },
    ],
    relatedNvdaComponents: ["power-psu", "power-semi"],
    catalysts: [
      "NVDA / Microsoft / Google HVDC 規範公告（2026 H1）",
      "OCP 開放運算組織採納 800V HVDC 標準",
      "台達電法說公告 HVDC 訂單能見度",
    ],
    watchPoints: [
      "全球第一個 HVDC AI Data Center 落地時點",
      "中國對 HVDC 採用（中國電網本身就 800V）",
    ],
    peakReturn: "—（請以即時報價為準）",
  },

  {
    id: "quantum-computing",
    name: "量子運算供應鏈｜長期題材、短期難炒",
    status: "anticipated",
    brief: "Google / IBM / Microsoft 量子電腦競賽、台廠在低溫設備 / 控制電路有切入",
    narrative: `
量子題材每隔半年炒一輪、實際商用化還在 5-10 年。台廠目前真正有量子相關產品的不多：
- 中華精測 (6510) — 量子晶片晶圓測試
- 漢磊 (3707) — 量子位元低溫元件代工
- 台達電 (2308) — 量子電腦低溫冷卻設備

每次 Google / IBM 量子位元數突破新聞、相關股短炒 10-30%。長期看好、短期難穩定。

要起飛的條件：
- IBM 1000+ 量子位元穩定運作（預期 2027）
- 容錯量子計算（FTQC）突破
- 商業應用案例（金融 / 製藥）
`.trim(),
    timeline: {
      start: "2024（首次炒作）",
      peak: "—（多次短炒）",
      nowStatus: "2026/5 沉睡中、隨新聞短炒",
    },
    twStocks: [
      { symbol: "6510.TWO", name: "中華精測", role: "量子晶片測試" },
      { symbol: "3707.TWO", name: "漢磊", role: "量子位元低溫元件" },
      { symbol: "2308.TW", name: "台達電", role: "量子電腦低溫冷卻" },
    ],
    catalysts: [
      "Google / IBM 量子位元數突破公告",
      "Microsoft Majorana topo qubit 進展",
      "FTQC 商用化新聞",
    ],
    watchPoints: [
      "IBM Roadmap 2027 1121 qubit 達成",
      "商業應用 PoC 案例增加",
    ],
    peakReturn: "—（請以即時報價為準）",
  },

  {
    id: "tsmc-3d-cake",
    name: "TSMC 三層蛋糕封裝｜A14 + SoW-X + SoIC-X (Rubin/Feynman 標配)",
    status: "anticipated",
    brief: "TSMC 2026 Tech Symposium 公布的 3D Fabric 完整架構、Rubin Ultra (2027) 標配、Feynman (2028) 全面用",
    narrative: `
TSMC 2026/4/28-29 北美 Tech Symposium 公布完整 3D Fabric 藍圖、市場稱為「三層蛋糕」。
這是繼 CoWoS-L 之後的下一步、Rubin Ultra (2027 H2) 第一個量產採用、Feynman (2028) 全面用。

🎂 **三層蛋糕架構（由下到上）**：

**第三層（最頂）— 記憶體 + 輔助晶片**
- HBM4 12-Hi 堆疊 + 小型 I/O / Cache chiplet
- 透過 **SoIC-X**（3D 直接打件、Cu-Cu hybrid bonding）跟下層連接
- vs 傳統 HBM 用 microbump → SoIC-X 連接密度高 100x、頻寬大 5x

**第二層（中間）— Compute Chiplet**
- 多顆 GPU compute chiplet 並排
- 透過 **CoWoS-L LSI Bridge** 連接（不需大 Si interposer、cost down）
- TSMC 2027 CoWoS-L 月產能上看 100K 片

**第一層（最底）— I/O + 電源 + 載板**
- I/O die（PCIe / NVLink 介面）獨立
- ABF Substrate 大尺寸（傳統 100x100mm → SoW-X 200x200mm）
- 部分高階產品開始導入 **玻璃載板**（cost 比 ABF -30%）

🆕 **三層蛋糕還搭配 3 大新技術**：
1. **A14 製程**（1.4nm-class、TSMC 2028 量產目標）— 配合 NanoFlex 提升 PPA
2. **BSPDN 背面供電**（A14 + 之後）— 電源從晶片背面進、減少前端線路擁塞
3. **SoW-X**（System on Wafer eXtended）— 一張整片晶圓裝 6x reticle、Cerebras 風格但 TSMC 量產化

📈 **題材時點**：目前（2026/5）所有相關概念股已開始反應、但真正出貨要看：
- Rubin Ultra 2027 H2 量產（NVDA GTC 2026 揭規格）
- 玻璃載板 2027 H2 試產
- A14 製程 2028 量產
`.trim(),
    timeline: {
      start: "2026 Q2（剛點火）",
      peak: "預期 2027 H2 - 2028（Rubin Ultra / Feynman 量產）",
      nowStatus: "2026/5 TSMC Tech Symposium 剛公告、相關股波段啟動",
    },
    twStocks: [
      // 三層蛋糕製造主軸
      { symbol: "2330.TW", name: "台積電", role: "三層蛋糕製造核心（CoWoS-L + SoIC-X + A14） (T1)" },
      // 後段封測
      { symbol: "2449.TW", name: "京元電子", role: "CoWoS-L 量產 + SoIC-X 後段測試 (T1)" },
      { symbol: "3711.TW", name: "日月光投控", role: "進階封裝 + 異質整合 (T1)" },
      { symbol: "6147.TWO", name: "頎邦", role: "Driver IC + 進階封裝 (T2)" },
      // 半導體設備
      { symbol: "3680.TW", name: "家登", role: "EUV 光罩傳載盒、A14 EUV 必備 (T1)" },
      { symbol: "3413.TW", name: "京鼎", role: "TEL / AMAT 設備零件代工 (T1)" },
      { symbol: "6187.TWO", name: "萬潤", role: "封測機台、CoWoS / SoIC 量產 (T1)" },
      // 材料 / 載板
      { symbol: "1560.TWO", name: "中砂", role: "CMP / TSV 製程研磨液 + 矽研磨片 (T1)" },
      { symbol: "3037.TW", name: "欣興", role: "ABF 載板（SoW-X 大尺寸） (T1)" },
      { symbol: "8046.TW", name: "南電", role: "ABF 載板 (T1)" },
      { symbol: "3189.TW", name: "景碩", role: "ABF + IC 基板 (T1)" },
      // CCL 上游
      { symbol: "2383.TW", name: "台光電", role: "高頻 CCL（SoW-X 大板上游） (T1)" },
    ],
    relatedNvdaComponents: [
      "soic-x",
      "process-a14",
      "sow-x",
      "cowos-l",
      "cowos",
      "abf-substrate",
      "hbm",
    ],
    deepDiveHref: "/companies/nvda",
    deepDiveLabel: "📖 對應 NVIDIA Rubin / Feynman 完整供應鏈頁",
    catalysts: [
      "NVDA GTC 2026（3 月）揭 Rubin NVL144 / Rubin Ultra 規格",
      "TSMC 法說公告 CoWoS-L 月產能擴張節奏",
      "玻璃載板廠（不二化學 / 達運 / Intel）試產進度",
      "A14 製程量產時程（預期 2028）",
      "SoIC-X 良率公告",
    ],
    watchPoints: [
      "Rubin Ultra 規格延遲風險（NVDA 過去多次跳票）",
      "玻璃載板 vs ABF 替代速度（影響欣興 / 南電）",
      "Samsung / Intel 同類技術（SAINT / 3D Foveros）競爭",
      "TSMC CapEx 是否再上修",
    ],
  },

  {
    id: "bess-energy-storage",
    name: "電池儲能 BESS｜AI Data Center UPS + 電網削峰填谷",
    status: "anticipated",
    brief: "AI 機房需「分鐘級不斷電 + 削峰填谷儲能」、UPS 規模從 MWh → GWh 級跳升",
    narrative: `
AI Data Center 一機房 100 MW 用電、若停電 1 分鐘要 1.7 MWh 不斷電容量 — 相當於 100 顆 EV 電池。
傳統 server 用「短秒級 UPS + 柴油發電機」的架構、AI Data Center 改用「鋰電 BESS（分鐘級）+ 燃料電池備援」雙系統。

更大需求來自「電網側」 — Hyperscaler 自建太陽能 + 風電後、需 BESS 削峰填谷（白天充電、晚上放電）。
特斯拉 Megapack 一櫃 3.9 MWh、市場規模 2026 預估 $25B、2030 上看 $100B。

台股 BESS 鏈：**順達 (3211)** 鋰電池 pack、**新普 (6121)** 大型 BESS 系統、**康舒 (6282)** 儲能變流器（PCS）、
**台達電 (2308)** BESS 一體化（含 PCS + EMS）。

2026 H1 多數還在「題材階段」、少數股票（康舒）開始有實質 BESS 出貨營收揭露。預期 2026 H2 看到大規模採購單。
`.trim(),
    timeline: {
      start: "2026 Q1（剛起漲）",
      nowStatus: "2026/5 剛點火、AI Data Center 採購規模未顯現",
    },
    twStocks: [
      { symbol: "3211.TWO", name: "順達", role: "BESS 用鋰電池 pack (T1)" },
      { symbol: "6121.TWO", name: "新普", role: "大型 BESS 系統整合 (T1)" },
      { symbol: "6282.TWO", name: "康舒", role: "儲能變流器 PCS (T1)" },
      { symbol: "2308.TW", name: "台達電", role: "BESS 一體化（PCS + EMS）(T1)" },
      { symbol: "5202.TWO", name: "力新", role: "BESS 控制系統 (T3)" },
    ],
    catalysts: [
      "Microsoft / Google 公告 BESS 採購規模",
      "台電 2026 開放 1GW BESS 招標",
      "美國 IRA 儲能稅收抵免政策延續",
      "順達 / 新普月營收 BESS 比重首次揭露",
    ],
    watchPoints: [
      "鋰電池價格（碳酸鋰下跌 → BESS 成本下降）",
      "美中關稅是否擴及 BESS 整機",
      "Tesla Megapack 2026 出貨指引",
    ],
  },

  // ═════════════════════════════════════════════════
  // 補充：歷史題材完整紀錄
  // ═════════════════════════════════════════════════

  {
    id: "satellite-low-orbit",
    name: "低軌衛星 LEO｜Starlink V3 + Direct-to-Cell + Kuiper 第二波",
    status: "active",
    brief: "Starlink V3 量產 + Direct-to-Cell 全球試運、Kuiper 加入戰局、台廠衛星鏈第二波啟動",
    narrative: `
2024 SpaceX Starlink 第一波（V2 Mini 月發射 50+ 顆）、2026 進入「**Starlink V3 量產 + Direct-to-Cell 商用**」第二波。
Amazon Project Kuiper 也開始大規模發射、OneWeb Gen2 補位、中國國網 + 千帆星座 2026-2027 全面追趕、市場供應商需求結構性放大。

🛰️ **三大新催化（2026 H1 - 2027）**：
1. **Starlink V3** — 每顆衛星載荷 5x V2 Mini、需要更多高功率 RF 元件、相位陣列天線
2. **Direct-to-Cell** — 手機直連衛星、台灣大 / 遠傳 已試運、聯發科出 IC、台揚 / 鐳洋 出地面整合
3. **台灣 B5G 國防衛星** — 中科院 + 工研院主導、漢翔 / 經緯航太 / 雷虎 配套

💡 **台廠供應鏈分五大塊**：
- **微波 / RF 元件**：昇達科 (3491、龍頭)、公準、立積、禾瑞亞
- **高頻 PCB / CCL**：台光電、台燿、嘉聯益、欣興
- **地面終端 + CPE**：台揚、啟碁、中磊、智易
- **連接器 / 天線**：正崴、嘉澤、信邦、健和興、鐳洋（相位陣列天線）
- **🧠 衛星算力 / Edge Compute**（新興）：
  - On-board ASIC：創意電子 (3443)、世芯-KY (3661)、智原 (3035)、力旺 (3529)
  - Direct-to-Cell SoC：聯發科 (2454、最直接)
  - 地面站 server / BMC：廣達 (2382)、緯穎 (6669)、信驊 (5274)、譜瑞-KY (4966)

電信端：中華電（與 OneWeb 合作）、遠傳、台灣大（SpaceX Direct-to-Cell）。
`.trim(),
    timeline: {
      start: "2023 Q4（第一波）",
      peak: "2024 Q3 第一波 / 2026-2027 第二波進行中",
      nowStatus: "2026/5 第二波啟動、Starlink V3 + Direct-to-Cell 雙引擎",
    },
    twStocks: [
      // Tier 1 — 微波 / RF 主力
      { symbol: "3491.TW", name: "昇達科", role: "微波元件龍頭、Starlink 供應鏈確認 (T1)" },
      { symbol: "2392.TW", name: "正崴", role: "RF 連接器 + LEO 天線整合 (T1)" },
      { symbol: "2314.TW", name: "台揚", role: "衛星 CPE 終端 + Ku/Ka 波段 RF (T1)" },
      { symbol: "6980.TWO", name: "鐳洋", role: "相位陣列天線整合（地面站 + 終端）(T1)" },
      // Tier 1 — 連接器 / 通訊終端
      { symbol: "3533.TWO", name: "嘉澤", role: "高頻連接器（衛星 + AI 共用）(T1)" },
      { symbol: "6285.TW", name: "啟碁科技", role: "Starlink / Kuiper 終端 ODM 主力 (T1)" },
      { symbol: "5388.TW", name: "中磊", role: "通訊網路設備 + 衛星終端 (T1)" },
      { symbol: "2454.TW", name: "聯發科", role: "Direct-to-Cell SoC + 衛星基頻 IC (T1)" },
      // Tier 1 — 電信運營
      { symbol: "2412.TW", name: "中華電", role: "與 OneWeb 合作、國防衛星合約 (T1)" },
      // Tier 2 — 中規模
      { symbol: "3178.TWO", name: "公準", role: "微波 RF 元件（衛星 + 雷達）(T2)" },
      { symbol: "4968.TWO", name: "立積", role: "RF 功率放大器 IC (T2)" },
      { symbol: "2383.TW", name: "台光電", role: "高頻 CCL（5G + 衛星）(T2)" },
      { symbol: "6274.TWO", name: "台燿", role: "高頻 CCL 銅箔基板 (T2)" },
      { symbol: "6153.TW", name: "嘉聯益", role: "高頻軟板 + PCB (T2)" },
      { symbol: "3023.TW", name: "信邦", role: "通訊 cable + 連接器整合 (T2)" },
      { symbol: "3596.TW", name: "智易", role: "CPE 終端 + 路由器 (T2)" },
      { symbol: "2634.TW", name: "漢翔", role: "國防自主衛星整合 (T2)" },
      // Tier 3 — 邊緣 / 觀察
      { symbol: "8064.TWO", name: "東捷", role: "衛星地面站 + 載荷測試 (T3)" },
      { symbol: "8466.TW", name: "經緯航太", role: "衛星測試 + 無人機系統 (T3)" },
      { symbol: "8033.TWO", name: "雷虎科技", role: "無人機 + 衛星整合 (T3)" },
      { symbol: "3556.TWO", name: "禾瑞亞", role: "高頻 RF IC 設計 (T3)" },
      { symbol: "3037.TW", name: "欣興", role: "高密度 PCB（衛星 + AI 共用）(T3)" },
      { symbol: "4904.TW", name: "遠傳", role: "OneWeb 合作 + 5G NTN 試運 (T3)" },
      { symbol: "3045.TW", name: "台灣大", role: "與 SpaceX Direct-to-Cell 合作試運 (T3)" },
      { symbol: "6271.TW", name: "同欣電", role: "衛星級半導體封測 (T3)" },
      { symbol: "3094.TWO", name: "聯傑", role: "電源 IC + 衛星模組 IC (T3)" },
      { symbol: "2419.TW", name: "仲琦", role: "通訊終端代工 (T3)" },
      { symbol: "3003.TW", name: "健和興", role: "電源 + 訊號連接器 (T3)" },
      // 🧠 衛星算力 / Edge Compute
      { symbol: "3443.TW", name: "創意電子", role: "🧠 衛星 payload ASIC 設計服務 (T2)" },
      { symbol: "3661.TWO", name: "世芯-KY", role: "🧠 衛星 ASIC 設計潛在客戶 (T2)" },
      { symbol: "3035.TW", name: "智原", role: "🧠 衛星 ASIC IP / 設計服務 (T3)" },
      { symbol: "3529.TWO", name: "力旺", role: "🧠 eFuse OTP IP、衛星 ASIC 加密 (T3)" },
      { symbol: "2382.TW", name: "廣達", role: "🧠 地面站 AI server ODM (T2)" },
      { symbol: "6669.TW", name: "緯穎", role: "🧠 Hyperscaler 地面站 server (T2)" },
      { symbol: "5274.TW", name: "信驊", role: "🧠 地面站 server BMC (T2)" },
      { symbol: "4966.TWO", name: "譜瑞-KY", role: "🧠 地面站 PCIe Retimer (T3)" },
    ],
    catalysts: [
      "Starlink V3 量產時程 + 月發射量",
      "Direct-to-Cell 全球試運 → 商用化新聞",
      "Amazon Kuiper 商用上線時程",
      "中華電 / 遠傳 / 台灣大 衛星合作公告",
      "中科院 / 國防部 B5G 自主衛星合約",
      "聯發科 衛星基頻 IC 出貨",
      "創意 / 世芯 衛星 ASIC 案件公告",
    ],
    watchPoints: [
      "SpaceX 上市時程（重大事件）",
      "中國國網 / 千帆 競爭加劇",
      "Starlink V3 試射成功率",
      "昇達科 月營收（衛星比重變化）",
    ],
    peakReturn: "—（請以即時報價為準）",
    deepDiveHref: "/topics/leo-satellite",
    deepDiveLabel: "🛰️ 進入 LEO 衛星完整供應鏈頁",
  },

  {
    id: "heavy-electric",
    name: "重電｜AI 耗電 narrative",
    status: "peaked",
    brief: "AI Data Center 用電翻倍、重電廠（變壓器 / 開關）2024-2025 雙峰大漲",
    narrative: `
NVDA GB200 NVL72 單櫃 120kW、全球 AI Data Center 用電預估 2030 達 1000 TWh（佔全球發電 5%）。
變壓器、開關櫃、不斷電系統（UPS）整套電力設備需求暴增、北美變壓器交期從 6 個月拉長到 24 個月。

華城 (1519) / 士電 (1503) / 中興電 (1513) 2024-2025 股價飆 4-8 倍、變壓器訂單能見度看到 2028。但 2026 Q1
因股價已高、加上市場擔心「過度建廠」(Microsoft 取消部分 Data Center 訂單)、相關股拉回 25-35%。

但結構性需求仍在、第二波看 HVDC 落地（見上個題材）。
`.trim(),
    timeline: {
      start: "2024 Q1",
      peak: "2025 Q3",
      nowStatus: "2026/5 從高點 -25~-35%、等 HVDC 第二波",
    },
    twStocks: [
      { symbol: "1519.TW", name: "華城", role: "高壓變壓器龍頭" },
      { symbol: "1503.TW", name: "士電", role: "變壓器 + 開關櫃" },
      { symbol: "1513.TW", name: "中興電", role: "開關櫃 + GIS" },
      { symbol: "1504.TW", name: "東元", role: "重電 + 馬達" },
      { symbol: "1521.TW", name: "大億", role: "馬達 + 重電" },
    ],
    catalysts: [
      "美國變壓器交期變化",
      "AI Data Center 新建項目（OpenAI Stargate 等）",
      "HVDC 採用 → 變壓器規格升級",
    ],
    watchPoints: [
      "Microsoft / Google 資本支出指引（資料中心擴張續強？）",
      "電力設備供需是否轉鬆",
    ],
    peakReturn: "—（請以即時報價為準）",
  },
];

// ─── 輔助 ─────────────────────────────────────────

export const STATUS_META: Record<
  ThemeStatus,
  { label: string; emoji: string; color: string; description: string; order: number }
> = {
  active: {
    label: "正在漲",
    emoji: "🟡",
    color: "border-red-300 bg-red-50",
    description: "結構性強勢中、仍有續航空間",
    order: 1,
  },
  anticipated: {
    label: "預期會漲",
    emoji: "🔵",
    color: "border-blue-300 bg-blue-50",
    description: "依零組件邏輯推測、下一波輪動標的",
    order: 2,
  },
  peaked: {
    label: "漲過了 / 高基期",
    emoji: "🟢",
    color: "border-emerald-300 bg-emerald-50",
    description: "已漲一波、現在整理 / 高檔震盪",
    order: 3,
  },
  declined: {
    label: "跌深",
    emoji: "🔴",
    color: "border-gray-300 bg-gray-50",
    description: "短期難有起色、等催化劑",
    order: 4,
  },
};

export function getThemesByStatus(status: ThemeStatus): ThemeEntry[] {
  return THEMES.filter((t) => t.status === status);
}

/** 收集所有題材涉及的台股 symbols（去重）*/
export function allThemeTwSymbols(): string[] {
  const set = new Set<string>();
  for (const t of THEMES) {
    for (const s of t.twStocks) set.add(s.symbol);
  }
  return Array.from(set);
}

/** 找出哪些 timeline 題材對應到指定 NVDA 組件 ID */
export function findThemesByNvdaComponent(nvdaComponentId: string): ThemeEntry[] {
  return THEMES.filter((t) =>
    t.relatedNvdaComponents?.includes(nvdaComponentId),
  );
}
