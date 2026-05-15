// 常見美股代號 ↔ 中文名（用於顯示與中文搜尋）
// Yahoo 美股搜尋接受英文，所以中文搜尋走這個對照表

export type UsStock = {
  symbol: string;
  name: string; // 中文
  english: string; // 英文公司名
};

const RAW: [string, string, string][] = [
  // Mag7 / 大型科技
  ["NVDA", "輝達", "NVIDIA"],
  ["AAPL", "蘋果", "Apple"],
  ["MSFT", "微軟", "Microsoft"],
  ["GOOGL", "Alphabet (Google)", "Alphabet"],
  ["GOOG", "Alphabet (Google)", "Alphabet"],
  ["AMZN", "亞馬遜", "Amazon"],
  ["META", "Meta", "Meta Platforms"],
  ["TSLA", "特斯拉", "Tesla"],

  // 半導體
  ["AMD", "超微", "AMD"],
  ["AVGO", "博通", "Broadcom"],
  ["TSM", "台積電ADR", "Taiwan Semiconductor"],
  ["ASML", "艾司摩爾", "ASML"],
  ["MU", "美光", "Micron"],
  ["INTC", "英特爾", "Intel"],
  ["QCOM", "高通", "Qualcomm"],
  ["TXN", "德州儀器", "Texas Instruments"],
  ["MRVL", "邁威爾", "Marvell"],
  ["ARM", "安謀", "ARM Holdings"],
  ["AMAT", "應用材料", "Applied Materials"],
  ["LRCX", "科林研發", "Lam Research"],
  ["KLAC", "科磊", "KLA"],

  // 雲端 / SaaS
  ["NET", "Cloudflare", "Cloudflare"],
  ["SNOW", "Snowflake", "Snowflake"],
  ["CRM", "賽富時", "Salesforce"],
  ["NOW", "ServiceNow", "ServiceNow"],
  ["DDOG", "Datadog", "Datadog"],
  ["MDB", "MongoDB", "MongoDB"],
  ["PLTR", "Palantir", "Palantir"],
  ["CRWD", "CrowdStrike", "CrowdStrike"],
  ["ZS", "Zscaler", "Zscaler"],
  ["OKTA", "Okta", "Okta"],

  // 光通訊 / 網通
  ["LITE", "Lumentum", "Lumentum"],
  ["CIEN", "Ciena", "Ciena"],
  ["COHR", "Coherent", "Coherent"],
  ["ANET", "Arista Networks", "Arista Networks"],
  ["FFIV", "F5 Networks", "F5 Networks"],
  ["CSCO", "思科", "Cisco"],

  // 記憶體 / 儲存
  ["SNDK", "SanDisk", "SanDisk"],
  ["WDC", "威騰電子", "Western Digital"],
  ["STX", "希捷", "Seagate"],

  // EV / 中概
  ["NIO", "蔚來", "NIO"],
  ["XPEV", "小鵬", "XPeng"],
  ["LI", "理想汽車", "Li Auto"],
  ["BABA", "阿里巴巴", "Alibaba"],
  ["PDD", "拼多多", "PDD Holdings"],
  ["JD", "京東", "JD.com"],
  ["BIDU", "百度", "Baidu"],

  // 金融
  ["JPM", "摩根大通", "JPMorgan Chase"],
  ["BAC", "美國銀行", "Bank of America"],
  ["GS", "高盛", "Goldman Sachs"],
  ["MS", "摩根士丹利", "Morgan Stanley"],
  ["WFC", "富國銀行", "Wells Fargo"],
  ["C", "花旗", "Citigroup"],
  ["BRK-B", "波克夏-B", "Berkshire Hathaway B"],
  ["V", "Visa", "Visa"],
  ["MA", "Mastercard", "Mastercard"],

  // 醫療
  ["LLY", "禮來", "Eli Lilly"],
  ["UNH", "聯合健康", "UnitedHealth"],
  ["JNJ", "嬌生", "Johnson & Johnson"],
  ["PFE", "輝瑞", "Pfizer"],
  ["MRK", "默克", "Merck"],
  ["ABBV", "艾伯維", "AbbVie"],
  ["NVO", "諾和諾德", "Novo Nordisk"],

  // 能源
  ["XOM", "埃克森美孚", "Exxon Mobil"],
  ["CVX", "雪佛龍", "Chevron"],
  ["OXY", "西方石油", "Occidental Petroleum"],
  ["COP", "康菲石油", "ConocoPhillips"],

  // 消費 / 零售
  ["WMT", "沃爾瑪", "Walmart"],
  ["COST", "Costco", "Costco"],
  ["HD", "家得寶", "Home Depot"],
  ["PG", "寶僑", "Procter & Gamble"],
  ["KO", "可口可樂", "Coca-Cola"],
  ["MCD", "麥當勞", "McDonald's"],
  ["SBUX", "星巴克", "Starbucks"],
  ["NKE", "耐吉", "Nike"],
  ["DIS", "迪士尼", "Disney"],

  // ETF
  ["SPY", "標普500 ETF", "SPDR S&P 500"],
  ["QQQ", "納斯達克100 ETF", "Invesco QQQ"],
  ["VTI", "全美股市 ETF", "Vanguard Total Stock"],
  ["DIA", "道瓊 ETF", "SPDR Dow Jones"],
  ["SOXX", "費城半導體 ETF", "iShares Semiconductor"],
  ["SMH", "VanEck半導體", "VanEck Semiconductor"],

  // 其他熱門
  ["UBER", "Uber", "Uber"],
  ["LYFT", "Lyft", "Lyft"],
  ["NFLX", "網飛", "Netflix"],
  ["SPOT", "Spotify", "Spotify"],
  ["SHOP", "Shopify", "Shopify"],
  ["SQ", "Block", "Block"],
  ["PYPL", "PayPal", "PayPal"],
  ["RBLX", "Roblox", "Roblox"],
  ["DELL", "戴爾", "Dell Technologies"],
  ["HPE", "HPE", "Hewlett Packard Enterprise"],
  ["IBM", "IBM", "IBM"],
  ["ORCL", "甲骨文", "Oracle"],
  ["SMCI", "Super Micro", "Super Micro Computer"],
];

export const US_STOCKS: UsStock[] = RAW.map(([symbol, name, english]) => ({
  symbol,
  name,
  english,
}));

const BY_SYMBOL: Record<string, UsStock> = {};
for (const s of US_STOCKS) BY_SYMBOL[s.symbol] = s;

export function getUsStockName(symbol: string): string | null {
  return BY_SYMBOL[symbol]?.name ?? null;
}

export function searchUsStocks(query: string, limit = 8): UsStock[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const exact: UsStock[] = [];
  const prefix: UsStock[] = [];
  const contains: UsStock[] = [];

  for (const s of US_STOCKS) {
    const sym = s.symbol.toLowerCase();
    const name = s.name.toLowerCase();
    const eng = s.english.toLowerCase();
    if (sym === q || name === q) exact.push(s);
    else if (sym.startsWith(q) || name.startsWith(q) || eng.toLowerCase().startsWith(q))
      prefix.push(s);
    else if (sym.includes(q) || name.includes(q) || eng.includes(q)) contains.push(s);
  }

  return [...exact, ...prefix, ...contains].slice(0, limit);
}
