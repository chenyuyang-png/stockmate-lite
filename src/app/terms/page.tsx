// 服務條款 — 與使用者之契約關係
// 重點：服務性質為「資料整理工具」、非投資顧問、不負損害賠償責任、爭議解決

import { BRAND } from "@/lib/brand";

export const metadata = {
  title: `服務條款 · ${BRAND.name}`,
  description: "使用本服務前請詳閱本服務條款，繼續使用即視為同意。",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 leading-relaxed text-gray-800">
      <h1 className="text-2xl font-bold text-gray-900">服務條款</h1>
      <p className="mt-1 text-sm text-gray-500">
        最後更新：2026 年 5 月 · 適用：{BRAND.domain}
      </p>

      <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-[13px] leading-relaxed text-amber-900">
        ⚠️ 使用本服務前請完整閱讀本條款。<strong>繼續使用本服務即視為您同意</strong>所有條款內容；如不同意，請立即停止使用。
      </div>

      <Section title="一、服務性質">
        <p>
          {BRAND.name}（以下簡稱「本服務」）為一項
          <strong>網路資料整理與輔助分析工具</strong>，提供台美股市場之公開資料彙整、AI 整理之研究素材、個人持股紀錄與雲端同步等功能。
        </p>
        <p>
          本服務<strong>並非投資顧問服務</strong>，未獲得中華民國金融監督管理委員會（金管會）核發之「證券投資顧問事業」「證券投資信託事業」執照，亦非中華民國證券投資信託暨顧問商業同業公會（SITCA）會員。本服務之任何內容、AI 輸出、分數、報告、訊號、價位區間、評論均
          <strong>不構成任何形式之投資建議</strong>，亦不作為任何金融商品或證券之招攬、要約、推薦、購買、出售之意思表示。
        </p>
      </Section>

      <Section title="二、帳號註冊與使用">
        <ul className="list-disc space-y-1 pl-5">
          <li>本服務採 Google OAuth 帳號註冊。您應確保所提供資料為真實、正確、最新</li>
          <li>您應妥善保管登入憑證，因您之疏失導致帳號遭盜用之損失，由您自行承擔</li>
          <li>本服務得依法令、主管機關要求或經營判斷，暫停或終止特定帳號之使用權</li>
          <li>禁止使用爬蟲、自動化程式大量擷取本服務內容；禁止對本服務進行逆向工程或安全攻擊</li>
        </ul>
      </Section>

      <Section title="三、訂閱與付款">
        <ul className="list-disc space-y-1 pl-5">
          <li>本服務採「一次性月票 / 半年票 / 年票」模式，到期後自動降回免費版，<strong>不會自動續扣</strong></li>
          <li>付款由<strong>綠界科技 ECPay</strong>處理，本服務不留存您的信用卡完整號碼</li>
          <li>訂閱所附之 AI 服務配額於每個自然月重設；加值次數包採加值制，永不過期</li>
          <li>如發生付款異常、未開通服務、配額未到帳等情形，請於 7 日內以 email 通知本服務協助處理</li>
        </ul>
      </Section>

      <Section title="四、退款政策">
        <p>
          依《消費者保護法》§19 第 1 項但書及行政院消費者保護處公告之「通訊交易解除權合理例外情事適用準則」第 2 條第 5 款規定：
        </p>
        <p className="rounded-md border border-gray-200 bg-gray-50 p-3 text-[12px] font-semibold text-gray-700">
          「非以有形媒介提供之數位內容或一經提供即為完成之線上服務，經消費者事先同意始提供。」
        </p>
        <p>
          本服務屬上述例外情形，<strong>數位內容一經開通即無 7 日鑑賞期</strong>。為保障消費者權益，本服務提供「免費體驗 1 次 AI 個股深度報告」，讓您於付款前先確認內容。
        </p>
        <p>
          如有付款異常、服務無法使用、扣款重複等問題，請來信
          <a
            href={`mailto:${BRAND.supportEmail}`}
            className="ml-1 font-semibold text-blue-700 underline"
          >
            {BRAND.supportEmail}
          </a>
          ，本服務將個案協助處理。
        </p>
      </Section>

      <Section title="五、智慧財產權">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            本服務之介面設計、原始碼、AI 提示工程（prompt engineering）、自製內容、商標等所有智慧財產權歸本服務經營者所有
          </li>
          <li>
            本服務所引用之第三方公開資料（股票名稱、財報數據、新聞摘要等），著作權歸原權利人所有，本服務僅基於合理使用原則為研究目的引用
          </li>
          <li>
            訂閱用戶得自行下載 AI 報告作為個人研究使用，但<strong>不得轉售、公開散布、用於商業用途</strong>
          </li>
        </ul>
      </Section>

      <Section title="六、投資風險警語">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>投資有風險</strong>。買賣前請審慎評估，並依據自身財務狀況、投資目標、知識經驗及風險承受度做出決定
          </li>
          <li>
            過去績效並不代表未來表現。本服務所列之歷史數據、回測結果、AI 推論均不構成未來收益之保證或暗示
          </li>
          <li>
            報價資料源自 Yahoo Finance、FinMind、TWSE / TPEX 公開資料庫，可能存在延遲（最高 15 分鐘）、遺漏、錯誤或不完整之情形。使用者應自行查證後再行運用
          </li>
          <li>
            AI 模型輸出可能因模型推論偏差、新聞滯後、樣本限制而產生錯誤或不適當之結論
          </li>
        </ul>
      </Section>

      <Section title="七、責任限制">
        <p>
          您依本服務資訊所為之任何投資決定，所衍生之獲利、損失、稅務、法律責任及第三人之求償，
          <strong>概由您本人自行承擔</strong>。本服務及其經營者於法律所許可之最大範圍內，
          <strong>不負任何損害賠償責任</strong>（包括但不限於直接、間接、衍生、附隨損害）。
        </p>
        <p>
          本服務不保證網站持續可用、無中斷、無錯誤、無安全漏洞。因不可抗力（戰爭、天災、網路故障、第三方服務中斷等）導致之服務暫停，本服務不負違約責任。
        </p>
      </Section>

      <Section title="八、條款修訂">
        <p>
          本服務得不定期修訂本條款。重大修訂將於網站首頁公告 7 日，公告後繼續使用本服務即視為您同意修訂後之條款。如不同意修訂內容，您應立即停止使用本服務。
        </p>
      </Section>

      <Section title="九、準據法與管轄">
        <p>
          本條款之解釋及適用，以及與本服務有關之爭議，均依中華民國法律為準據法。雙方因本條款發生之爭議，應本誠信原則協商解決；協商不成時，雙方合意以
          <strong>臺灣臺北地方法院</strong>為第一審管轄法院。
        </p>
      </Section>

      <Section title="十、聯絡方式">
        <p>
          條款相關問題請來信：
          <a
            href={`mailto:${BRAND.supportEmail}`}
            className="ml-1 font-semibold text-blue-700 underline"
          >
            {BRAND.supportEmail}
          </a>
        </p>
      </Section>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6">
      <h2 className="text-base font-bold text-gray-900">{title}</h2>
      <div className="mt-2 space-y-2 text-sm">{children}</div>
    </section>
  );
}
