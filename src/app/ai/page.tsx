import Link from "next/link";
import { Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "AI 個股分析 · Stockmate Lite",
  description: "Lite 版不提供 AI 解讀，點此前往 Pro 版體驗。",
};

const PRO_URL =
  process.env.NEXT_PUBLIC_PRO_URL ?? "https://stockmate-ai-ashen.vercel.app";

export default function AiPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <section className="overflow-hidden rounded-2xl border-2 border-violet-300 bg-gradient-to-br from-violet-50 via-fuchsia-50 to-rose-50 p-8 shadow-md">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
          <Sparkles size={11} /> Pro 版才有
        </div>
        <h1 className="mt-3 text-2xl font-bold text-gray-900 sm:text-3xl">
          AI 個股深度報告 / 題材整理 / 持股健檢
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-700">
          Stockmate <strong>Lite 版</strong>專注「快速資料整理」，不含 AI 解讀內容（為了維持完全免費）。
          想看 AI 在 30 秒內把財報、新聞、技術指標、籌碼動態整理成一份完整報告？
          來 <strong>Pro 版</strong>體驗。
        </p>

        <ul className="mt-5 space-y-2 text-sm text-gray-800">
          {[
            "AI 個股 IB 級報告（5 面向計分 + 三情境 PE 試算 + 同業比較）",
            "AI 題材深度解讀（產業動態 + 受惠族群 + 領頭股）",
            "AI 持股集中度健檢（vs 業界分散標準）",
            "AI K 線多空判讀（RSI / MACD / KD / 均線 整理）",
            "AI 持股再平衡建議（依風險目標重新配置）",
            "AI Web 搜尋催化劑（最新法說 / 分析師 / 產業新聞）",
          ].map((line) => (
            <li key={line} className="flex items-start gap-2">
              <CheckCircle2
                size={15}
                className="mt-0.5 shrink-0 text-violet-600"
              />
              <span>{line}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={PRO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-violet-700 hover:shadow-xl"
          >
            <Sparkles size={14} />
            去 Pro 版免費試用 4 種 AI
            <ArrowRight size={14} />
          </a>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            回 Lite 版首頁
          </Link>
        </div>

        <p className="mt-4 text-[11px] text-gray-500">
          Pro 版 NT$ 499 / 月、年票 NT$ 4,490（省 25%）— 不綁卡、月票模式、到期自動降回免費版。
        </p>
      </section>

      <p className="mt-4 text-center text-[11px] text-gray-500">
        Stockmate Lite 是純資料整理工具，不構成投資建議。
      </p>
    </main>
  );
}
