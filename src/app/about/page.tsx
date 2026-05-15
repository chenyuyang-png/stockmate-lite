// 關於我們 — 提升信任感，告訴使用者「這不是黑箱、可以聯絡到人」

import Link from "next/link";
import { Mail, MessageCircle, Shield, FileText, Sparkles, ArrowRight } from "lucide-react";
import { BRAND } from "@/lib/brand";

export const metadata = {
  title: `關於 ${BRAND.name}`,
  description: `${BRAND.name} 是專為台灣投資人設計的台美股 AI 投資資料整理工具。`,
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 leading-relaxed text-gray-800">
      <h1 className="text-2xl font-bold text-gray-900">關於 {BRAND.name}</h1>
      <p className="mt-2 text-sm text-gray-600">
        為台灣個人投資人設計的台美股 AI 資料整理工具
      </p>

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="flex items-center gap-1.5 text-base font-bold text-gray-900">
          <Sparkles size={14} className="text-red-600" /> 我們在做什麼
        </h2>
        <p className="mt-2 text-sm">
          {BRAND.name} 把台美股的<strong>財報、新聞、技術指標、法人籌碼、產業動態</strong>
          全部整理在一個畫面，再加上 AI 在 30 秒內彙整成一份結構化的研究素材。
        </p>
        <p className="mt-2 text-sm">
          設計初衷很簡單 — 一般上班族沒時間每天看 10 個網站、查 20 份財報、爬 PTT 籌碼文。我們把這些動作壓到 30 秒，讓你把時間花在「決策」而不是「找資料」。
        </p>
      </section>

      <section className="mt-4 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-base font-bold text-gray-900">我們不做什麼</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          <li>
            <strong>不下投資建議</strong> — AI 只整理公開資料、不給「該買 / 該賣」結論，不給目標價
          </li>
          <li>
            <strong>不是投顧</strong> — 沒有金管會核發的證券投資顧問執照，也不打算成為投顧
          </li>
          <li>
            <strong>不販售個資</strong> — 你的持股資料只用於提供服務，不會賣給任何第三方
          </li>
          <li>
            <strong>不自動續扣</strong> — 訂閱到期就降回免費版，不會偷偷扣你信用卡
          </li>
        </ul>
      </section>

      <section className="mt-4 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-base font-bold text-gray-900">技術 stack（透明公開）</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          <li>
            <strong>AI 模型</strong> — Claude Sonnet 4.6（個股 / 題材 / 健檢 / 再平衡）+ Haiku 4.5（K 線判讀、收盤速報）
          </li>
          <li>
            <strong>報價資料</strong> — Yahoo Finance API（15 分鐘延遲）
          </li>
          <li>
            <strong>三大法人 / 融資融券</strong> — FinMind v4 API（前一交易日）
          </li>
          <li>
            <strong>新聞</strong> — 多家 RSS（鉅亨網、Anue 鉅亨、經濟日報、中央社等）
          </li>
          <li>
            <strong>身分驗證</strong> — Clerk（Google OAuth）
          </li>
          <li>
            <strong>金流</strong> — 綠界科技 ECPay
          </li>
          <li>
            <strong>託管</strong> — Vercel
          </li>
        </ul>
      </section>

      <section className="mt-4 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="flex items-center gap-1.5 text-base font-bold text-gray-900">
          <MessageCircle size={14} className="text-blue-600" /> 聯絡我們
        </h2>
        <div className="mt-2 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <ContactItem
            Icon={Mail}
            label="客服 / 合作"
            value={BRAND.supportEmail}
            href={`mailto:${BRAND.supportEmail}`}
          />
          <ContactItem
            Icon={FileText}
            label="付款 / 退款爭議"
            value={BRAND.supportEmail}
            href={`mailto:${BRAND.supportEmail}?subject=付款問題`}
          />
        </div>
        <p className="mt-3 text-[11px] text-gray-500">
          回覆時間：工作日 24 小時內、假日 48 小時內
        </p>
      </section>

      <section className="mt-4 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="flex items-center gap-1.5 text-base font-bold text-gray-900">
          <Shield size={14} className="text-emerald-600" /> 重要法律文件
        </h2>
        <ul className="mt-2 space-y-1 text-sm">
          <li>
            <Link href="/terms" className="text-blue-700 hover:underline">
              服務條款 →
            </Link>
            <span className="ml-2 text-[11px] text-gray-500">
              訂閱規則、退款政策、責任限制、爭議解決
            </span>
          </li>
          <li>
            <Link href="/privacy" className="text-blue-700 hover:underline">
              隱私權政策 →
            </Link>
            <span className="ml-2 text-[11px] text-gray-500">
              個資蒐集 / 利用方式（依台灣個資法 §8）
            </span>
          </li>
          <li>
            <Link
              href="/pricing#disclaimer"
              className="text-blue-700 hover:underline"
            >
              完整免責聲明 →
            </Link>
            <span className="ml-2 text-[11px] text-gray-500">
              投資風險、AI 限制、資料準確性
            </span>
          </li>
        </ul>
      </section>

      <div className="mt-6 text-center">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-red-700"
        >
          看訂閱方案 <ArrowRight size={13} />
        </Link>
      </div>
    </main>
  );
}

function ContactItem({
  Icon,
  label,
  value,
  href,
}: {
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="flex items-start gap-2 rounded-md border border-gray-200 p-2.5 hover:border-blue-400 hover:bg-blue-50/50"
    >
      <Icon size={14} className="mt-0.5 shrink-0 text-blue-600" />
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase text-gray-500">{label}</div>
        <div className="truncate text-sm font-semibold text-gray-900">{value}</div>
      </div>
    </a>
  );
}
