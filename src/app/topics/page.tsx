import Link from "next/link";
import { Cpu, ArrowRight, Calendar, Satellite, BookOpen } from "lucide-react";
import { TopicCatalog } from "@/components/TopicCatalog";
import { RankBoard } from "@/components/RankBoard";

// 不預渲染（RankBoard 抓即時報價）
export const dynamic = "force-dynamic";

export const metadata = {
  title: "題材脈動 · Stockmate",
  description:
    "台美股 16 大產業即時題材熱度、領漲領跌族群、跨題材強弱排行榜 — 免費瀏覽。",
};

// 題材分頁 — 完全開放未登入瀏覽
export default function TopicsPage() {
  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-4">
      {/* 🆕 法人怎麼看財報 + 預估 EPS — 教學頁 */}
      <Link
        href="/learn/valuation"
        className="group flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 border-fuchsia-300 bg-gradient-to-r from-fuchsia-50 via-pink-50 to-rose-50 px-4 py-3 shadow-sm transition hover:border-fuchsia-500 hover:shadow-md"
      >
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-fuchsia-600 p-1.5 text-white">
            <BookOpen size={14} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">
              📊 法人怎麼看財報 + 預估 EPS
            </p>
            <p className="text-[11px] text-gray-600">
              從營收、毛利率推到 EPS、再到目標價 — 一套<strong>機構投資人實戰流程</strong>。含<strong>欣興 / 國巨</strong>真實案例、Forward EPS + 反推法 + 景氣循環陷阱完整教學
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-md bg-fuchsia-600 px-3 py-1.5 text-xs font-bold text-white group-hover:bg-fuchsia-700">
          看教學 <ArrowRight size={11} />
        </span>
      </Link>

      {/* 🆕 2024-2026 題材輪動時間軸 */}
      <Link
        href="/topics/timeline"
        className="group flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 border-indigo-300 bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50 px-4 py-3 shadow-sm transition hover:border-indigo-500 hover:shadow-md"
      >
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-indigo-600 p-1.5 text-white">
            <Calendar size={14} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">
              📅 2024-2026 台股漲價邏輯題材輪動史
            </p>
            <p className="text-[11px] text-gray-600">
              過去 2 年漲過的、跌深的、正在漲的、預期下一波漲的 — 全部依「零組件邏輯」深度盤點（含<strong>功率半導體</strong> / CPO / HVDC 等下波熱點）
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white group-hover:bg-indigo-700">
          深度看 <ArrowRight size={11} />
        </span>
      </Link>

      {/* 🆕 低軌衛星 LEO 完整供應鏈深度頁 — featured banner */}
      <Link
        href="/topics/leo-satellite"
        className="group flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 border-violet-300 bg-gradient-to-r from-violet-50 via-purple-50 to-fuchsia-50 px-4 py-3 shadow-sm transition hover:border-violet-500 hover:shadow-md"
      >
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-violet-600 p-1.5 text-white">
            <Satellite size={14} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">
              🛰️ 低軌衛星 LEO 完整供應鏈
            </p>
            <p className="text-[11px] text-gray-600">
              Starlink V2 Mini / V3 / Direct-to-Cell + Kuiper / OneWeb / 中國國網 + 台灣 B5G — 10 大零組件分類 + 30+ 檔台股受惠（含<strong>相位陣列天線</strong> / 高頻 PCB / RF 連接器）
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-md bg-violet-600 px-3 py-1.5 text-xs font-bold text-white group-hover:bg-violet-700">
          深度看 <ArrowRight size={11} />
        </span>
      </Link>

      {/* 🆕 NVIDIA 完整供應鏈深度頁 — featured banner */}
      <Link
        href="/companies/nvda"
        className="group flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 px-4 py-3 shadow-sm transition hover:border-emerald-500 hover:shadow-md"
      >
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-emerald-600 p-1.5 text-white">
            <Cpu size={14} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">
              📖 NVIDIA 完整供應鏈深度頁
            </p>
            <p className="text-[11px] text-gray-600">
              產品時間軸（H100 / B200 / GB200 / Rubin / Feynman）+ 9 大零組件分類 + 50+ 檔台股受惠（含<strong>功率半導體</strong>）
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white group-hover:bg-emerald-700">
          深度看 <ArrowRight size={11} />
        </span>
      </Link>

      <TopicCatalog />
      <RankBoard />
    </main>
  );
}
