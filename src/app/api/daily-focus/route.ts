import { NextResponse } from "next/server";
import Parser from "rss-parser";
import { TW_SECTORS, US_SECTORS, type SectorGroup } from "@/lib/sectors";
import { getTwStockName } from "@/lib/twStockNames";
import { getUsStockName, US_STOCKS } from "@/lib/usStockNames";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export type FocusCard = {
  source: string;
  date: string; // ISO
  title: string;
  snippet?: string;
  link: string;
  sectors: { id: string; label: string }[]; // 標籤化的相關題材
};

const SOURCES = [
  { name: "經濟日報", url: "https://money.udn.com/rssfeed/news/1001/5588/5589" },
  { name: "經濟日報·台股", url: "https://money.udn.com/rssfeed/news/1001/5588/12017" },
  { name: "經濟日報·產業", url: "https://money.udn.com/rssfeed/news/1001/5591/7242" },
  { name: "經濟日報·科技", url: "https://money.udn.com/rssfeed/news/1001/5591/12925" },
  { name: "UDN財經", url: "https://udn.com/rssfeed/news/2/6644?if=mr" },
  { name: "ETtoday財經", url: "https://feeds.feedburner.com/ettoday/finance" },
  { name: "中央社財經", url: "https://feeds.feedburner.com/rsscna/finance" },
  { name: "Yahoo Finance", url: "https://finance.yahoo.com/news/rssindex" },
  { name: "Bloomberg Markets", url: "https://feeds.bloomberg.com/markets/news.rss" },
];

const parser = new Parser({
  timeout: 8000,
  headers: { "User-Agent": "Mozilla/5.0 (compatible; YoyoStocks/1.0)" },
});

// 為每個題材建立關鍵字索引
const SECTOR_INDEX = (() => {
  const map = new Map<string, { sector: SectorGroup; keywords: string[] }>();
  for (const sector of [...TW_SECTORS, ...US_SECTORS]) {
    const kws = new Set<string>();
    // 題材名稱拆解
    for (const part of sector.label.split(/[\/／·、 ()（）]+/)) {
      const t = part.trim();
      if (t.length >= 2) kws.add(t);
    }
    // 加入個股中文名作為關鍵字
    for (const sym of sector.symbols) {
      const cn = getTwStockName(sym) ?? getUsStockName(sym);
      if (cn) {
        kws.add(cn);
        const clean = cn.replace(/[-*].*$/, "").trim();
        if (clean && clean !== cn && clean.length >= 2) kws.add(clean);
      }
      // 美股代碼本身
      const us = US_STOCKS.find((s) => s.symbol === sym);
      if (us) kws.add(us.symbol);
    }
    // 一些常用同義詞補強（對應新版 sector IDs）
    const aliases: Record<string, string[]> = {
      "tw-semi-foundry": ["晶圓代工", "代工", "晶圓", "TSMC", "台積"],
      "tw-ic-asic-ip": ["ASIC", "矽智財", "IP 設計", "IP Core"],
      "tw-ic-hpc-network": ["IC設計", "IC 設計", "晶片設計", "聯發科"],
      "tw-pkg-cowos": ["CoWoS", "先進封裝"],
      "tw-pkg-osat": ["封裝測試", "OSAT", "封測"],
      "tw-mem-dram": ["DRAM", "記憶體"],
      "tw-mem-nand": ["NAND", "SSD", "Flash"],
      "tw-mem-hbm-concept": ["HBM", "高頻寬記憶體"],
      "tw-ai-odm": ["AI 伺服器", "伺服器", "ODM"],
      "tw-ai-power-bbu": ["電源", "BBU", "備援電池"],
      "tw-cooling-liquid": ["液冷", "VC", "均熱板"],
      "tw-cooling-fan": ["散熱", "風扇"],
      "tw-network-optical": ["矽光子", "CPO", "光通訊", "光收發"],
      "tw-network-satellite": ["低軌衛星", "Starlink", "衛星"],
      "tw-passive-mlcc": ["MLCC", "電容"],
      "tw-passive-inductor": ["電感", "功率電感"],
      "tw-passive-resistor": ["電阻", "晶片電阻"],
      "tw-pkg-substrate": ["ABF", "載板", "IC 載板"],
      "tw-elec-pcb": ["PCB", "印刷電路板", "銅箔基板"],
      "tw-diverse-shipping": ["貨櫃", "航運", "散裝", "SCFI", "BDI"],
      "tw-diverse-aviation": ["航空", "觀光", "旅遊"],
      "tw-ev-vehicle": ["電動車", "Tesla", "特斯拉", "自駕"],
      "tw-ev-powertrain": ["馬達", "減速機", "三電"],
      "tw-ev-auto-semi": ["車用半導體", "車用 IC", "SiC"],
      "tw-diverse-defense": ["軍工", "國防", "無人機"],
      "tw-robot-industrial": ["工業機器人", "自動化", "減速機"],
      "tw-robot-humanoid": ["人形機器人", "Optimus"],
      "tw-robot-cnc": ["CNC", "工具機"],
      "tw-diverse-finance": ["金融", "金控", "銀行", "壽險"],
      "us-ic-design-ai": ["AI 半導體", "GPU", "NVIDIA", "輝達"],
      "us-consumer-mag7": ["Mag 7", "蘋果", "微軟", "Google", "亞馬遜"],
      "us-software-cloud": ["雲端", "SaaS", "Cloudflare"],
    };
    if (aliases[sector.id]) {
      for (const a of aliases[sector.id]) kws.add(a);
    }
    map.set(sector.id, { sector, keywords: Array.from(kws) });
  }
  return map;
})();

function escapeRegex(s: string): string {
  return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
}

// 對單則新聞分類
function classify(title: string, snippet?: string): { id: string; label: string; score: number }[] {
  const text = (title + " " + (snippet ?? "")).toLowerCase();
  const matches: { id: string; label: string; score: number }[] = [];
  for (const [id, { sector, keywords }] of SECTOR_INDEX) {
    let score = 0;
    for (const kw of keywords) {
      const hasChinese = /[一-鿿]/.test(kw);
      if (hasChinese) {
        // 中文字串 substring 匹配（中文不需要 word boundary）
        if (kw.length >= 2 && text.includes(kw.toLowerCase())) score++;
      } else {
        // 純 ASCII：用 word boundary 比對、至少 3 個字（避免 "AI" "LI" "PC" 之類過度匹配）
        if (kw.length < 3) continue;
        const re = new RegExp(`\\b${escapeRegex(kw.toLowerCase())}\\b`, "i");
        if (re.test(text)) score++;
      }
    }
    if (score > 0) matches.push({ id, label: sector.label, score });
  }
  return matches.sort((a, b) => b.score - a.score).slice(0, 3);
}

// GET /api/daily-focus
export async function GET() {
  try {
    const results = await Promise.all(
      SOURCES.map(async (src) => {
        try {
          const feed = await parser.parseURL(src.url);
          return (feed.items ?? []).slice(0, 15).map((item) => ({
            source: src.name,
            title: item.title ?? "",
            snippet: item.contentSnippet?.slice(0, 220),
            link: item.link ?? "",
            date: item.isoDate ?? new Date().toISOString(),
          }));
        } catch {
          return [];
        }
      }),
    );

    const all = results.flat();

    // 分類 + 去重 (依標題)
    const seen = new Set<string>();
    const classified: FocusCard[] = [];
    for (const item of all) {
      if (!item.title || seen.has(item.title)) continue;
      seen.add(item.title);
      const tags = classify(item.title, item.snippet);
      // 只保留至少有一個題材匹配的新聞
      if (tags.length === 0) continue;
      classified.push({
        source: item.source,
        date: item.date,
        title: item.title,
        snippet: item.snippet,
        link: item.link,
        sectors: tags.map((t) => ({ id: t.id, label: t.label })),
      });
    }

    // 依新到舊
    classified.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ cards: classified.slice(0, 12) });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
