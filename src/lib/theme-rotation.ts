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
  /** 從本題材起漲到現在的累計漲幅描述 — approximate, narrative */
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
      { symbol: "3707.TWO", name: "漢磊", role: "SiC / GaN 晶圓代工 IDM", perfHint: "6 個月 +180%" },
      { symbol: "6286.TW", name: "立錡", role: "多相 VRM controller 主力", perfHint: "6 個月 +120%" },
      { symbol: "6415.TW", name: "矽力*-KY", role: "DC-DC controller 大廠", perfHint: "6 個月 +90%" },
      { symbol: "8255.TW", name: "朋程", role: "整流 / 二極體模組（PSU）", perfHint: "6 個月 +60%" },
      { symbol: "2481.TW", name: "強茂", role: "MOSFET + 二極體", perfHint: "6 個月 +50%" },
      { symbol: "8261.TW", name: "富鼎", role: "Power MOSFET 設計", perfHint: "6 個月 +45%" },
      { symbol: "3016.TWO", name: "嘉晶", role: "SiC / GaN 上游磊晶", perfHint: "6 個月 +40%" },
      { symbol: "8081.TW", name: "致新", role: "POL 多相 VRM", perfHint: "6 個月 +35%" },
      { symbol: "6138.TW", name: "茂達", role: "電源管理類比 IC", perfHint: "6 個月 +30%" },
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
    peakReturn: "Tier 1（漢磊 / 立錡）6 個月 +100~180%、Tier 2 +30~60%",
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
      { symbol: "3324.TWO", name: "雙鴻", role: "液冷板 + CDU 雙領域龍頭", perfHint: "2 年 +400%" },
      { symbol: "8996.TW", name: "高力", role: "板式熱交換器 + 液冷模組", perfHint: "2 年 +500%" },
      { symbol: "3017.TW", name: "奇鋐", role: "散熱模組 + CDU 整合", perfHint: "2 年 +280%" },
      { symbol: "3653.TW", name: "健策", role: "液冷板 + 模組中堅", perfHint: "2 年 +200%" },
      { symbol: "2421.TW", name: "建準", role: "風扇 + 液冷 hybrid", perfHint: "2 年 +150%" },
      { symbol: "3402.TW", name: "漢科", role: "Quick Disconnect 接頭", perfHint: "2 年 +180%" },
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
    peakReturn: "Tier 1（雙鴻 / 高力 / 奇鋐）2 年 +280~500%",
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
      { symbol: "3661.TWO", name: "世芯-KY", role: "Broadcom + AMD ASIC 設計主力", perfHint: "2 年 +600%" },
      { symbol: "3443.TW", name: "創意電子", role: "TSMC 設計服務、Meta MTIA 主供", perfHint: "2 年 +350%" },
      { symbol: "3035.TW", name: "智原", role: "聯電旗下、IP / 設計服務", perfHint: "2 年 +180%" },
      { symbol: "3529.TW", name: "力旺", role: "embedded NVM IP", perfHint: "2 年 +220%" },
      { symbol: "6643.TWO", name: "M31", role: "Foundation IP", perfHint: "2 年 +150%" },
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
    peakReturn: "Tier 1（世芯）2 年 +600%、創意 +350%",
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
      { symbol: "2049.TW", name: "上銀", role: "諧波減速機 + 線性傳動", perfHint: "1.5 年 +120%" },
      { symbol: "2317.TW", name: "鴻海", role: "Optimus 代工試產 + MIH 平台", perfHint: "1.5 年 +60%" },
      { symbol: "2359.TW", name: "所羅門", role: "工業機器手臂 vision system", perfHint: "1.5 年 +90%" },
      { symbol: "4763.TW", name: "材料-KY", role: "機器人複合材料 + 結構件", perfHint: "1.5 年 +110%" },
      { symbol: "1597.TW", name: "直得", role: "線性滑軌", perfHint: "1.5 年 +70%" },
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
    peakReturn: "Tier 1（上銀 / 鴻海）1.5 年 +60~120%",
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
      { symbol: "2382.TW", name: "廣達", role: "GB200 NVL72 最大 ODM", perfHint: "2 年 +500%、高點 -20%" },
      { symbol: "2317.TW", name: "鴻海", role: "GB200 ODM + Bluefield 組裝", perfHint: "2 年 +120%" },
      { symbol: "3231.TW", name: "緯創", role: "GB200 ODM + AI Diamond 大單", perfHint: "2 年 +400%、高點 -25%" },
      { symbol: "6669.TW", name: "緯穎", role: "Meta / Microsoft 客製 AI 伺服器", perfHint: "2 年 +350%" },
      { symbol: "2356.TW", name: "英業達", role: "AI 伺服器代工 Tier 2", perfHint: "2 年 +180%" },
      { symbol: "2376.TW", name: "技嘉", role: "HGX 主機板 + 整機", perfHint: "2 年 +200%、高點 -30%" },
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
    peakReturn: "Tier 1（廣達 / 緯創 / 緯穎）2 年 +350~500%、已從高點回 20-30%",
  },

  {
    id: "cowos-packaging",
    name: "CoWoS 先進封裝｜TSMC + 後段測試",
    status: "peaked",
    brief: "TSMC 持續擴 CoWoS 產能、相關後段測試廠營收創高、但股價已大漲",
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
      { symbol: "2330.TW", name: "台積電", role: "CoWoS 唯一供應商", perfHint: "2 年 +180%" },
      { symbol: "2449.TW", name: "京元電子", role: "CoWoS 後段測試", perfHint: "2 年 +250%" },
      { symbol: "3711.TW", name: "日月光投控", role: "後段封裝測試", perfHint: "2 年 +90%" },
      { symbol: "6239.TW", name: "力成", role: "DRAM / NAND 後段", perfHint: "2 年 +100%" },
      { symbol: "1560.TW", name: "中砂", role: "CMP 拋光研磨料", perfHint: "2 年 +200%" },
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
    peakReturn: "Tier 1（TSMC / 京元電 / 中砂）2 年 +180~250%",
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
      { symbol: "3037.TW", name: "欣興", role: "全球 ABF 第三大", perfHint: "2 年 +120%、距高點 -25%" },
      { symbol: "8046.TW", name: "南電", role: "ABF 第二大", perfHint: "2 年 +90%、距高點 -30%" },
      { symbol: "3189.TW", name: "景碩", role: "ABF 第三家 + IC 基板", perfHint: "2 年 +110%、距高點 -20%" },
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
    peakReturn: "Tier 1（欣興 / 南電）距前高 25-30%、現在從低點 +40%",
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
      { symbol: "3008.TW", name: "大立光", role: "iPhone 鏡頭模組", perfHint: "2 年 -10%（持續低迷）" },
      { symbol: "3406.TWO", name: "玉晶光", role: "iPhone + AR 鏡頭", perfHint: "2 年 -15%" },
      { symbol: "2317.TW", name: "鴻海", role: "iPhone 組裝（其他事業抵消）", perfHint: "靠 AI / 機器人撐" },
      { symbol: "2474.TW", name: "可成", role: "iPhone 金屬機殼", perfHint: "2 年 -20%" },
      { symbol: "2354.TW", name: "鴻準", role: "iPhone 金屬件", perfHint: "2 年 -5%" },
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
    peakReturn: "純蘋果鏈 2 年 -10~-20%、跑輸大盤甚遠",
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
      { symbol: "3481.TW", name: "群創", role: "面板（中國 + 蘋果代工）", perfHint: "2 年 -25%" },
      { symbol: "2409.TW", name: "友達", role: "面板", perfHint: "2 年 -20%" },
      { symbol: "3231.TW", name: "緯創", role: "中國 PC 代工（其他 AI 業務撐）", perfHint: "純中國業務 -10%" },
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
    peakReturn: "純中國代工 -10~-25%",
  },

  {
    id: "memory-modules",
    name: "記憶體模組｜DRAM 報價拉回",
    status: "declined",
    brief: "2025 Q2-Q3 DRAM 報價拉回 30%、模組廠營收受傷",
    narrative: `
2024 全年 DRAM 因 HBM 排擠 DDR5 產能、報價狂飆 80%、記憶體模組廠（威剛 3260、宇瞻 8271、十銓 4967）一度大賺。

但 2025 Q2 開始 SK Hynix / Samsung 把 DRAM 產能拉回 DDR5、報價 4 個月跌 30%、模組廠 Q3 EPS 大幅 down。
威剛從高點 130 跌到 75、宇瞻從 90 跌到 50。

2026 Q1 因為 HBM4 量產壓縮 DDR5 產能 + AI 伺服器 DDR5 需求回升、模組廠又轉強。但離 2024 高點還有 30%。
`.trim(),
    timeline: {
      start: "2023 Q4",
      peak: "2024 Q4",
      nowStatus: "2026/5 從低點 +20% 但距高點 -30%",
    },
    twStocks: [
      { symbol: "3260.TW", name: "威剛", role: "DRAM 模組龍頭", perfHint: "從高點 -42%、低點 +20%" },
      { symbol: "8271.TWO", name: "宇瞻", role: "DRAM 模組 + SSD", perfHint: "從高點 -45%" },
      { symbol: "4967.TWO", name: "十銓", role: "電競 DRAM 模組", perfHint: "從高點 -40%" },
      { symbol: "2408.TW", name: "南亞科", role: "DRAM 自有品牌（IDM）", perfHint: "從高點 -30%" },
    ],
    catalysts: [
      "HBM4 量產（排擠 DDR5 產能 → DDR5 漲價）",
      "AI 伺服器 DDR5 需求量",
      "SK Hynix / Samsung 法說 DRAM 供需指引",
    ],
    watchPoints: [
      "DDR5 8Gb 報價（每月更新）",
      "威剛 / 宇瞻 月營收 YoY 由負轉正時點",
    ],
    peakReturn: "從高點 -30~-45%、現在從低點剛回升",
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
      { symbol: "2330.TW", name: "台積電", role: "CPO 光引擎 ASIC 製造 + 矽光子整合", perfHint: "—（在大盤裡）" },
      { symbol: "3450.TWO", name: "聯鈞", role: "光收發 + CPO 光引擎合作", perfHint: "1 年 +60%" },
      { symbol: "4977.TW", name: "眾達-KY", role: "矽光子 CPO 整合 + AOC", perfHint: "1 年 +90%" },
      { symbol: "3081.TW", name: "聯亞", role: "雷射晶粒（CPO 上游）", perfHint: "1 年 +80%" },
      { symbol: "4979.TWO", name: "華星光通", role: "800G / 1.6T 模組", perfHint: "1 年 +70%" },
      { symbol: "3163.TWO", name: "波若威", role: "光被動元件", perfHint: "1 年 +50%" },
      { symbol: "3363.TWO", name: "上詮", role: "矽光子模組整合", perfHint: "1 年 +60%" },
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
    peakReturn: "預期 1-2 年再 +60~150%",
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
      { symbol: "3037.TW", name: "欣興", role: "HBM 載板技術合作", perfHint: "尚未充分反映" },
      { symbol: "8046.TW", name: "南電", role: "HBM 載板 Tier 1", perfHint: "尚未充分反映" },
      { symbol: "8358.TWO", name: "金居", role: "高純度銅箔（HBM 用）", perfHint: "尚未充分反映" },
      { symbol: "1718.TW", name: "中纖", role: "上游材料供應", perfHint: "—" },
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
    peakReturn: "預期 1-2 年 +50~120%",
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
      { symbol: "2308.TW", name: "台達電", role: "HVDC 整體方案 + 整流模組", perfHint: "尚未反映新題材" },
      { symbol: "2301.TW", name: "光寶", role: "HVDC PSU + Power Shelf", perfHint: "—" },
      { symbol: "1503.TW", name: "士電", role: "HVDC 變壓器 / 開關櫃", perfHint: "—" },
      { symbol: "1519.TW", name: "華城", role: "高壓變壓器", perfHint: "已漲過、但 HVDC 是新故事" },
      { symbol: "1504.TW", name: "東元", role: "重電 + 馬達", perfHint: "—" },
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
    peakReturn: "預期 1-2 年 +40~80%",
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
      { symbol: "6510.TWO", name: "中華精測", role: "量子晶片測試", perfHint: "波動大、隨新聞短炒" },
      { symbol: "3707.TWO", name: "漢磊", role: "量子位元低溫元件", perfHint: "已被功率半導體題材帶動" },
      { symbol: "2308.TW", name: "台達電", role: "量子電腦低溫冷卻", perfHint: "—" },
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
    peakReturn: "難預估、視突破事件而定",
  },

  // ═════════════════════════════════════════════════
  // 補充：歷史題材完整紀錄
  // ═════════════════════════════════════════════════

  {
    id: "satellite-low-orbit",
    name: "低軌衛星 LEO｜StarLink + Kuiper",
    status: "peaked",
    brief: "2024 SpaceX Starlink + Amazon Kuiper 大發射、台廠衛星鏈受惠",
    narrative: `
SpaceX Starlink 月發射 50+ 顆衛星、Amazon Project Kuiper 2024 開始大規模發射。每顆衛星裡的微波 PCB、
高頻連接器、地面接收終端（CPE）都需要台廠零組件。

昇達科 (3491) 微波元件、嘉聯益 (6153) 高頻 PCB、台揚 (2314) CPE 都是受惠。2024 Q3 達高峰、2025 H2 因 SpaceX
資本支出放緩拉回 30%、2026 因 Kuiper 接棒重啟、但漲幅不如 2024。
`.trim(),
    timeline: {
      start: "2023 Q4",
      peak: "2024 Q3",
      nowStatus: "2026/5 第二波啟動中、規模不如 2024",
    },
    twStocks: [
      { symbol: "3491.TW", name: "昇達科", role: "微波元件", perfHint: "2 年 +250%、距高點 -25%" },
      { symbol: "2314.TW", name: "台揚", role: "CPE 終端", perfHint: "2 年 +150%" },
      { symbol: "8064.TWO", name: "東捷", role: "衛星地面站", perfHint: "2 年 +180%" },
      { symbol: "6153.TW", name: "嘉聯益", role: "高頻 PCB", perfHint: "2 年 +200%" },
    ],
    catalysts: [
      "SpaceX Starlink 月發射量",
      "Amazon Kuiper 商用上線",
      "中華電信 / 國防部低軌衛星合約",
    ],
    watchPoints: [
      "SpaceX 上市時程",
      "中國低軌衛星競爭",
    ],
    peakReturn: "Tier 1 2 年 +200~250%、距高點 -25%",
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
      { symbol: "1519.TW", name: "華城", role: "高壓變壓器龍頭", perfHint: "2 年 +800%、現距高點 -30%" },
      { symbol: "1503.TW", name: "士電", role: "變壓器 + 開關櫃", perfHint: "2 年 +400%、距高點 -25%" },
      { symbol: "1513.TW", name: "中興電", role: "開關櫃 + GIS", perfHint: "2 年 +500%、距高點 -30%" },
      { symbol: "1504.TW", name: "東元", role: "重電 + 馬達", perfHint: "2 年 +250%" },
      { symbol: "1521.TW", name: "大億", role: "馬達 + 重電", perfHint: "2 年 +200%" },
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
    peakReturn: "Tier 1（華城）2 年 +800%、距高點 -30%",
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
