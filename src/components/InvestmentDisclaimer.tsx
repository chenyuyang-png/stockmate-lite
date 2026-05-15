// 投資警語 / 風險聲明元件
// 文案參考：金管會、證期局公開文件 + 台灣常見金融科技平台用語
// 目的：明確劃清「資訊整理」 vs 「投資建議」的界線，避免落入證券投資顧問業務範疇

import { AlertTriangle, Shield } from "lucide-react";

type Variant = "compact" | "full" | "ai-output";

export function InvestmentDisclaimer({
  variant = "compact",
}: {
  variant?: Variant;
}) {
  if (variant === "compact") {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50/70 p-2.5">
        <div className="flex items-start gap-1.5 text-[11px] leading-relaxed text-amber-900">
          <AlertTriangle size={11} className="mt-0.5 shrink-0" />
          <p>
            <strong>投資警語</strong>：本資訊
            <strong>僅供參考，不構成投資建議</strong>
            。所有分析依公開資料自動產生，投資人應自行判斷風險。本平台
            <strong>不為依此資訊所為之投資結果負任何責任</strong>。
          </p>
        </div>
      </div>
    );
  }

  if (variant === "ai-output") {
    return (
      <div className="rounded-md border border-amber-300 bg-amber-50 p-3">
        <div className="flex items-start gap-1.5 text-[11px] leading-relaxed text-amber-900">
          <Shield size={12} className="mt-0.5 shrink-0 text-amber-700" />
          <div>
            <strong className="text-amber-900">
              AI 分析免責聲明（請務必詳閱）
            </strong>
            <p className="mt-0.5">
              本 AI 分析、評分、建議參考價位等內容，係依公開市場資料
              <strong>自動生成</strong>，可能存在錯誤、遺漏或時效性問題。
              <strong>不構成任何具體投資建議、要約或要約之邀請</strong>，
              亦非證券投資顧問服務。
            </p>
            <p className="mt-1">
              投資人應依個人風險承受度、財務狀況、投資目標
              <strong>自行判斷並承擔投資結果</strong>。
              本平台與營運者對使用者依此資訊所為之投資結果，
              <strong>不負任何直接、間接、衍生或附帶責任</strong>。
            </p>
            <p className="mt-1 text-[10px] opacity-80">
              投資有風險，過去績效不代表未來表現。本服務未經金管會核准為證券投資顧問業務。
            </p>
          </div>
        </div>
      </div>
    );
  }

  // full
  return (
    <div className="rounded-md border border-gray-300 bg-gray-50 p-3">
      <div className="flex items-start gap-2 text-[11px] leading-relaxed text-gray-700">
        <Shield size={14} className="mt-0.5 shrink-0 text-gray-500" />
        <div>
          <strong className="text-gray-800">使用者須知 / 風險聲明</strong>
          <ol className="mt-1 ml-4 list-decimal space-y-1">
            <li>
              本系統提供之技術分析、評分、建議參考價位、AI 解讀等資訊，均為依公開市場資料
              <strong>自動產生</strong>，僅供使用者作為投資決策時之參考。
            </li>
            <li>
              本服務
              <strong>不構成任何具體投資建議、要約或要約之邀請</strong>，
              亦
              <strong>未經金管會核准為證券投資顧問業務</strong>。
            </li>
            <li>
              投資人應依個人風險承受度、財務狀況及投資目標自行判斷，並對所有投資決策
              <strong>獨立負責</strong>。
            </li>
            <li>
              本平台及其營運者，對使用者依據本系統資訊所為之投資結果，
              <strong>不負任何直接、間接、衍生或附帶之責任</strong>。
            </li>
            <li>投資有風險，過去績效不代表未來表現。股票報價為 15 分鐘延遲。</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
