import Link from "next/link";
import { Cpu, ArrowRight } from "lucide-react";
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
