// 隱私權政策 — 依台灣《個人資料保護法》§8 告知義務
// 公司資料 / 蒐集目的 / 個資類別 / 利用期間 / 利用對象 / 利用地區 / 利用方式 / 當事人權利

import { BRAND } from "@/lib/brand";

export const metadata = {
  title: `隱私權政策 · ${BRAND.name}`,
  description: "本服務依台灣《個人資料保護法》§8 規定告知個資蒐集利用方式。",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 leading-relaxed text-gray-800">
      <h1 className="text-2xl font-bold text-gray-900">隱私權政策</h1>
      <p className="mt-1 text-sm text-gray-500">
        最後更新：2026 年 5 月 · 適用：{BRAND.domain}
      </p>

      <Section title="一、緒言">
        <p>
          {BRAND.name}（以下簡稱「本服務」）非常重視使用者個人資料保護。本政策依中華民國《個人資料保護法》第 8 條及第 9 條規定，向您告知本服務蒐集、處理及利用個人資料之相關事項。
        </p>
        <p>
          您於使用本服務時即代表已詳閱、理解並同意本政策內容。如不同意，請立即停止使用本服務。
        </p>
      </Section>

      <Section title="二、蒐集個資之目的">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>O01 消費者、客戶管理與服務</strong> — 提供訂閱方案、加值次數包、客服回應
          </li>
          <li>
            <strong>O40 行銷</strong> — 寄送服務更新、改版通知（可隨時取消訂閱）
          </li>
          <li>
            <strong>O90 消費者保護</strong> — 處理使用者申訴、退款查詢
          </li>
          <li>
            <strong>O135 資（通）訊服務</strong> — 提供 AI 個股分析、持股健檢、自選股雲端同步
          </li>
        </ul>
      </Section>

      <Section title="三、蒐集個資之類別">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>C001 辨識個人者</strong> — 使用者姓名（Google OAuth 名稱）、email
          </li>
          <li>
            <strong>C003 政府資料中之辨識者</strong> — 無（本服務不蒐集身分證字號、護照號）
          </li>
          <li>
            <strong>C011 個人描述</strong> — 自選股、持股部位、交易紀錄（皆由使用者自行輸入）
          </li>
          <li>
            <strong>C036 財務交易</strong> — 訂閱付款紀錄、加值次數包購買紀錄
          </li>
          <li>
            <strong>C132 未分類之數據</strong> — IP 位址、瀏覽器類型、裝置資訊、使用紀錄（cookies / localStorage）
          </li>
        </ul>
      </Section>

      <Section title="四、個資利用期間">
        <p>
          自您建立帳號日起，至您刪除帳號或本服務終止營運之日止。財務交易紀錄依《商業會計法》§38 保存至少 5 年。
        </p>
      </Section>

      <Section title="五、個資利用對象與地區">
        <ul className="list-disc space-y-1 pl-5">
          <li>本服務經營者 — 中華民國境內</li>
          <li>
            身分驗證服務 <strong>Clerk Inc.</strong>（美國）— 處理登入與帳號管理
          </li>
          <li>
            金流服務 <strong>綠界科技 ECPay</strong>（中華民國）— 處理訂閱付款
          </li>
          <li>
            雲端基礎設施 <strong>Vercel Inc.</strong>（美國）— 託管網站
          </li>
          <li>
            資料快取 <strong>Upstash Inc.</strong>（美國 / 歐盟）— Redis 配額紀錄
          </li>
          <li>
            AI 模型服務 <strong>Anthropic PBC</strong>（美國）— 處理使用者輸入的個股代號 / 持股資料以生成分析。Anthropic 依其政策不會將 API 資料用於模型訓練。
          </li>
        </ul>
        <p className="mt-2 text-[12px] text-gray-600">
          ※ 上述美國境外傳輸經本服務評估均符合《個人資料保護法》§21 及國家發展委員會公告之國際傳輸標準。
        </p>
      </Section>

      <Section title="六、個資利用方式">
        <ul className="list-disc space-y-1 pl-5">
          <li>建立並維護您的帳號與訂閱權益</li>
          <li>處理付款交易並開立電子收據</li>
          <li>客服信件回覆與爭議處理</li>
          <li>網站運作分析、流量統計（匿名彙總）</li>
          <li>偵測異常存取、保護網站安全</li>
        </ul>
        <p className="mt-2 font-semibold text-gray-800">
          本服務<strong>不會將您的個人資料販售給第三方</strong>，亦不會用於本政策範圍外之用途。
        </p>
      </Section>

      <Section title="七、當事人權利（個資法 §3）">
        <p>就您於本服務之個人資料，您得依以下方式行使權利：</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>查詢或請求閱覽</li>
          <li>請求製給複製本</li>
          <li>請求補充或更正</li>
          <li>請求停止蒐集、處理或利用</li>
          <li>請求刪除</li>
        </ul>
        <p>
          請來信{" "}
          <a
            href={`mailto:${BRAND.supportEmail}`}
            className="font-semibold text-blue-700 underline"
          >
            {BRAND.supportEmail}
          </a>
          ，本服務將於 30 日內回覆。
        </p>
      </Section>

      <Section title="八、Cookies 與本機儲存">
        <p>
          本服務使用 cookies / localStorage 儲存以下資料於您裝置：
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>登入狀態（由 Clerk 管理）</li>
          <li>免費版的自選股、持股、警示（不會上傳）</li>
          <li>AI 報告結果快取（避免重新計費）</li>
          <li>免責聲明已同意之版本標記</li>
        </ul>
        <p>
          您可隨時透過瀏覽器設定清除 cookies / localStorage，但這可能影響部分功能正常運作。
        </p>
      </Section>

      <Section title="九、第三方連結">
        <p>
          本服務可能含 Yahoo Finance、TradingView、Finviz 等外部連結。離開本網站後，這些站點的隱私政策與本服務無關，請您自行查閱。
        </p>
      </Section>

      <Section title="十、政策修訂">
        <p>
          本政策得不定期修訂，修訂版本以本網頁公告為準。重大變動將於網站首頁公告 7 日。繼續使用本服務即視為您接受最新版本之條款。
        </p>
      </Section>

      <Section title="十一、聯絡方式">
        <p>
          隱私權相關問題請來信：
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
