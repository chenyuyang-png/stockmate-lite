// 經濟事件日曆 — 重大 macro events
//
// 兩種來源：
//   1. 硬寫的具體日期（FOMC 利率決議等已排定的事件）
//   2. 規則計算的循環事件（CPI / NFP / PPI 等月度資料）
//
// 重要性：
//   - critical: 對大盤直接影響大（FOMC、CPI、NFP）
//   - high:     重要但影響中等（PPI、零售銷售、台股月營收）
//   - medium:   值得關注（PMI、消費信心）

export type Importance = "critical" | "high" | "medium";

export type EconomicEvent = {
  date: string; // YYYY-MM-DD
  time?: string; // 公布時間（台北時間）
  region: "US" | "TW" | "CN" | "GLOBAL";
  event: string;
  importance: Importance;
  description: string;
  previous?: string;
  forecast?: string;
};

// ─── 硬寫的已排定事件（2026） ─────────────────────────────
// 這些是已公開排程的事件，需定期手動更新
const SCHEDULED_2026: EconomicEvent[] = [
  // FOMC 2026 利率決議（依 Fed 公告）
  {
    date: "2026-05-13",
    time: "02:00",
    region: "US",
    event: "美 4 月 CPI 通膨數據",
    importance: "critical",
    description: "通膨關鍵指標。若高於預期，市場擔憂 Fed 延後降息，科技股 / 高估值股受壓。",
    forecast: "+2.4% YoY",
    previous: "+2.4% YoY",
  },
  {
    date: "2026-05-14",
    time: "20:30",
    region: "US",
    event: "美 4 月 PPI 生產者物價",
    importance: "high",
    description: "供應端通膨指標，CPI 領先指標。",
  },
  {
    date: "2026-05-15",
    time: "20:30",
    region: "US",
    event: "美 4 月零售銷售",
    importance: "high",
    description: "消費韌性觀察。強 = 經濟好但 Fed 鷹派；弱 = 衰退疑慮但寬鬆預期。",
  },
  {
    date: "2026-05-22",
    time: "21:45",
    region: "US",
    event: "美 5 月 PMI 製造業 / 服務業",
    importance: "medium",
    description: "經濟動能領先指標。",
  },
  {
    date: "2026-06-06",
    time: "20:30",
    region: "US",
    event: "美 5 月非農就業 NFP",
    importance: "critical",
    description: "Fed 決策最關鍵指標之一。就業強 = 鷹派、就業弱 = 鴿派。",
  },
  {
    date: "2026-06-11",
    time: "20:30",
    region: "US",
    event: "美 5 月 CPI",
    importance: "critical",
    description: "通膨關鍵指標。",
  },
  {
    date: "2026-06-17",
    time: "02:00",
    region: "US",
    event: "FOMC 6 月利率決議 + 經濟預測 (SEP)",
    importance: "critical",
    description: "美聯儲利率決議。SEP 含點陣圖（dot plot），預示後續降息路徑。市場最關注事件之一。",
  },
  {
    date: "2026-07-04",
    time: "20:30",
    region: "US",
    event: "美 6 月非農就業 NFP",
    importance: "critical",
    description: "Fed 決策關鍵指標。",
  },
  {
    date: "2026-07-15",
    time: "20:30",
    region: "US",
    event: "美 6 月 CPI",
    importance: "critical",
    description: "通膨關鍵指標。",
  },
  {
    date: "2026-07-29",
    time: "02:00",
    region: "US",
    event: "FOMC 7 月利率決議",
    importance: "critical",
    description: "美聯儲利率決議。",
  },

  // 台灣
  {
    date: "2026-05-10",
    region: "TW",
    event: "台股上市櫃 4 月營收公布截止",
    importance: "high",
    description: "每月 10 日前各公司需公布上月營收。AI / 半導體 / 蘋果鏈龍頭月營收動向。",
  },
  {
    date: "2026-05-15",
    region: "TW",
    event: "台 4 月物價指數",
    importance: "medium",
    description: "央行利率決策考量。",
  },
  {
    date: "2026-06-10",
    region: "TW",
    event: "台股上市櫃 5 月營收公布截止",
    importance: "high",
    description: "每月 10 日前各公司需公布上月營收。",
  },
  {
    date: "2026-06-19",
    region: "TW",
    event: "央行理監事會議",
    importance: "critical",
    description: "台灣央行季度理監事會議，決定利率與政策方向。",
  },
  {
    date: "2026-07-10",
    region: "TW",
    event: "台股上市櫃 6 月營收公布截止",
    importance: "high",
    description: "每月 10 日前各公司需公布上月營收。",
  },

  // 中國（影響中概股 + 全球風險偏好）
  {
    date: "2026-05-15",
    region: "CN",
    event: "中國 4 月零售銷售 / 工業生產",
    importance: "medium",
    description: "中國消費 / 製造動能觀察。",
  },
  {
    date: "2026-06-15",
    region: "CN",
    event: "中國 5 月零售銷售 / 工業生產",
    importance: "medium",
    description: "中國消費 / 製造動能觀察。",
  },
];

// 取得未來 N 天的事件
export function getUpcomingEvents(days = 30): EconomicEvent[] {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const until = new Date(now);
  until.setDate(until.getDate() + days);
  const untilStr = until.toISOString().slice(0, 10);

  return SCHEDULED_2026.filter(
    (e) => e.date >= todayStr && e.date <= untilStr,
  ).sort((a, b) => a.date.localeCompare(b.date));
}

// 取得今天的事件
export function getTodayEvents(): EconomicEvent[] {
  const today = new Date().toISOString().slice(0, 10);
  return SCHEDULED_2026.filter((e) => e.date === today);
}
