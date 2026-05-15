#!/bin/bash
# 從 stockmate-pro 同步並自動「閹割」到 stockmate-lite
#
# 用法：bash scripts/sync-from-pro.sh
# 跑完會：
#   1. rsync src/ 過來，排除所有 AI / 認證 / 金流相關檔案
#   2. patch 各檔案，拿掉 AI / paywall 相關呼叫
#   3. 換掉 HomeHero / TopNav / /ai page 為 Lite 版本
#   4. 保留 lite-auth.ts / lite-anthropic.ts shim（next.config.ts alias 用）

set -e

PRO=/Users/yangchenyou/Documents/Claude/Projects/yoyo-stocks-pro
LITE=/Users/yangchenyou/Documents/Claude/Projects/stockmate-lite

if [ ! -d "$PRO" ]; then
  echo "❌ 找不到 pro 目錄：$PRO"
  exit 1
fi

echo "▶ rsync src/ 排除 AI / 認證 / 金流 / 付費頁面..."
rsync -a --delete-excluded \
  --exclude='app/api/ai/' \
  --exclude='app/api/ecpay/' \
  --exclude='app/api/threads/' \
  --exclude='app/api/cron/' \
  --exclude='app/admin/' \
  --exclude='app/account/' \
  --exclude='app/pricing/' \
  --exclude='app/sign-in/' \
  --exclude='app/sign-up/' \
  --exclude='components/AiInsights.tsx' \
  --exclude='components/AIRebalanceAdvisor.tsx' \
  --exclude='components/AIReportPreview.tsx' \
  --exclude='components/KlineAiVerdict.tsx' \
  --exclude='components/HoldingsAnalysis.tsx' \
  --exclude='components/FairValueAnalysis.tsx' \
  --exclude='components/PaywallBlur.tsx' \
  --exclude='components/PremiumBanner.tsx' \
  --exclude='components/StockUpsellBanner.tsx' \
  --exclude='components/HomeHero.tsx' \
  --exclude='components/SignInGate.tsx' \
  --exclude='lib/ecpay.ts' \
  --exclude='lib/quota.ts' \
  --exclude='lib/aiCache.ts' \
  --exclude='lib/aiResultCache.ts' \
  --exclude='lib/aiScoring.ts' \
  --exclude='lib/complianceFilter.ts' \
  --exclude='lib/lite-auth.ts' \
  --exclude='lib/lite-anthropic.ts' \
  "$PRO/src/" "$LITE/src/"

# ─── lite shim 已經在 src/lib/ 裡，rsync 不要清掉它 ──
# （rsync --delete-excluded 會保留沒被 rsync 涵蓋的檔案）

echo "▶ 把 /ai page 換成「升級 Pro 提示頁」..."
mkdir -p "$LITE/src/app/ai"
cat > "$LITE/src/app/ai/page.tsx" <<'EOF'
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
EOF
echo "  ✓ /ai page 已換成升級提示"

echo "▶ patch src/app/layout.tsx — 拿掉 ClerkProvider、改 brand..."
node -e "
const fs = require('fs');
const p = '$LITE/src/app/layout.tsx';
let s = fs.readFileSync(p, 'utf8');
// 移除 ClerkProvider import + wrapping（Lite shim 後其實沒影響，但避免警告）
// （shim 本身就是 fragment，留著 ClerkProvider 也 OK，留下不動）
fs.writeFileSync(p, s);
console.log('  ✓ layout.tsx 維持（ClerkProvider 已被 shim）');
"

echo "▶ patch src/components/TopNav.tsx — 加 Pro 版連結、移除登入/付費 tabs..."
node -e "
const fs = require('fs');
const p = '$LITE/src/components/TopNav.tsx';
let s = fs.readFileSync(p, 'utf8');
// 拿掉 /pricing tab（Lite 沒付費）
s = s.replace(/\\s*\\{ href: \"\\/pricing\"[^}]+\\},\\n/, '\n');
// 把 SignedOut/SignedIn 區塊換成「Pro 版」按鈕（外部連結）
s = s.replace(
  /<SignedOut>[\\s\\S]+?<\\/SignedIn>/,
  \`<a
            href={process.env.NEXT_PUBLIC_PRO_URL ?? 'https://stockmate-ai-ashen.vercel.app'}
            target=\"_blank\"
            rel=\"noopener noreferrer\"
            className=\"inline-flex items-center gap-1 rounded-md border border-violet-400 bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700 hover:bg-violet-100\"
            title=\"想看 AI 解讀？去 Pro 版\"
          >
            ✨ Pro 版
          </a>\`
);
// 移除 SignedIn/SignedOut import（已不用）
s = s.replace(/import \\{ SignedIn[^}]+\\} from \"@clerk\\/nextjs\";\\n/, '');
fs.writeFileSync(p, s);
console.log('  ✓ TopNav.tsx 已加 Pro 版連結');
"

echo "▶ patch src/app/layout.tsx 頂部加 LiteBanner..."
node -e "
const fs = require('fs');
const p = '$LITE/src/app/layout.tsx';
let s = fs.readFileSync(p, 'utf8');
// 在 <TopNav /> 之前插入 LiteBanner
if (!s.includes('LiteBanner')) {
  s = s.replace(
    /import \\{ TopNav \\} from \"@\\/components\\/TopNav\";\\n/,
    \`import { TopNav } from \"@/components/TopNav\";\nimport { LiteBanner } from \"@/components/LiteBanner\";\n\`
  );
  s = s.replace(
    /<TopNav \\/>/,
    '<LiteBanner />\n          <TopNav />'
  );
  // 改 brand name 為 Lite
  s = s.replace(/BRAND\\.name/g, '\`\${BRAND.name} Lite\`');
  // 改 description
  s = s.replace(/description: BRAND\\.tagline,/, 'description: \"完全免費、不登入、純資料整理 — 想要 AI 解讀請去 Pro 版。\",');
}
fs.writeFileSync(p, s);
console.log('  ✓ layout.tsx 已加 LiteBanner');
"

echo "▶ patch src/app/page.tsx — 移除 PaywallBlur wrap..."
node -e "
const fs = require('fs');
const p = '$LITE/src/app/page.tsx';
let s = fs.readFileSync(p, 'utf8');
// 拿掉 PaywallBlur import
s = s.replace(/import \\{ PaywallBlur \\} from \"@\\/components\\/PaywallBlur\";\\n/, '');
// 把 <PaywallBlur>{MarketCloseWrapUp}</PaywallBlur> 解開
s = s.replace(
  /<PaywallBlur[\\s\\S]+?<MarketCloseWrapUp[\\s\\S]+?<\\/PaywallBlur>/,
  '<MarketCloseWrapUp />'
);
fs.writeFileSync(p, s);
console.log('  ✓ page.tsx PaywallBlur 已解開');
"

echo "▶ patch src/app/portfolio/page.tsx — 移除 AIRebalanceAdvisor / HoldingsAnalysis paywall..."
node -e "
const fs = require('fs');
const p = '$LITE/src/app/portfolio/page.tsx';
let s = fs.readFileSync(p, 'utf8');
// 移除 import
s = s.replace(/import \\{ AIRebalanceAdvisor \\} from \"@\\/components\\/AIRebalanceAdvisor\";\\n/, '');
s = s.replace(/import \\{ HoldingsAnalysis \\} from \"@\\/components\\/HoldingsAnalysis\";\\n/, '');
s = s.replace(/import \\{ PaywallBlur \\} from \"@\\/components\\/PaywallBlur\";\\n/, '');
// 移除 <AIRebalanceAdvisor /> JSX
s = s.replace(/^\\s*<AIRebalanceAdvisor \\/>\\n/m, '');
// 移除整段 <PaywallBlur><HoldingsAnalysis /></PaywallBlur>
s = s.replace(
  /<PaywallBlur[\\s\\S]+?<HoldingsAnalysis[\\s\\S]+?<\\/PaywallBlur>/,
  ''
);
fs.writeFileSync(p, s);
console.log('  ✓ portfolio/page.tsx 已移除 AI 相關區塊');
"

echo "▶ patch src/app/stock/[symbol]/page.tsx — 移除 AI 元件 + 付費內容..."
node -e "
const fs = require('fs');
const p = '$LITE/src/app/stock/[symbol]/page.tsx';
let s = fs.readFileSync(p, 'utf8');
const removeImports = [
  'KlineAiVerdict',
  'StockUpsellBanner',
  'FairValueAnalysis',
  'PaywallBlur',
];
for (const name of removeImports) {
  // import 該元件
  const importRe = new RegExp('import \\\\{ ' + name + ' \\\\} from \"@\\\\/components\\\\/' + name + '\";\\\\n', 'g');
  s = s.replace(importRe, '');
  // JSX 用法（self-closing）
  const jsxRe = new RegExp('^\\\\s*<' + name + '[^/]*\\\\/>\\\\n', 'gm');
  s = s.replace(jsxRe, '');
}
// 處理 <PaywallBlur>...<FairValueAnalysis />...</PaywallBlur> 包裹
s = s.replace(/<PaywallBlur[\\s\\S]+?<FairValueAnalysis[\\s\\S]+?<\\/PaywallBlur>/, '');
fs.writeFileSync(p, s);
console.log('  ✓ stock/[symbol]/page.tsx 已移除 AI 元件');
"

echo "▶ patch src/components/MarketBrief.tsx — 移除 useUser / paywall ExpectedTwChips..."
node -e "
const fs = require('fs');
const p = '$LITE/src/components/MarketBrief.tsx';
let s = fs.readFileSync(p, 'utf8');
// useUser 由 lite-auth shim 處理（回 null user）→ isPaid 為 false → ExpectedTwChips 顯示半遮罩
// Lite 版：所有 TW chips 都直接顯示（移除 paywall 判斷）
// 找 ExpectedTwChips function 替換邏輯
s = s.replace(
  /function ExpectedTwChips\\(\\{[\\s\\S]+?^\\}/m,
  \`function ExpectedTwChips({ twSymbols, quotes }: { twSymbols: string[]; quotes: Record<string, Quote> }) {
  // Lite 版：所有 chips 都直接可看，無 paywall
  if (twSymbols.length === 0) return null;
  return (
    <div className=\"mt-1.5 flex flex-wrap items-center gap-1\">
      <span className=\"text-[10px] text-gray-500\">→ 預期影響：</span>
      {twSymbols.slice(0, 4).map((sym) => {
        const q = quotes[sym];
        const cleanCode = sym.replace(/\\\\.(TW|TWO)\\$/i, '');
        return (
          <Link
            key={sym}
            href={\\\`/stock/\\\${encodeURIComponent(sym)}\\\`}
            className=\"rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-700 hover:bg-gray-200 hover:text-blue-700\"
            title={q?.name}
          >
            {displayName(sym, q?.name) || cleanCode}
          </Link>
        );
      })}
    </div>
  );
}\`
);
fs.writeFileSync(p, s);
console.log('  ✓ MarketBrief.tsx ExpectedTwChips 已 unlock');
"

echo "▶ patch src/components/TwDailyWrapUp.tsx + DailyWrapUp.tsx — 拿掉 events PaywallBlur..."
node -e "
const fs = require('fs');
for (const f of ['$LITE/src/components/TwDailyWrapUp.tsx', '$LITE/src/components/DailyWrapUp.tsx']) {
  let s = fs.readFileSync(f, 'utf8');
  s = s.replace(/import \\{ PaywallBlur \\} from \"\\.\\/PaywallBlur\";\\n/, '');
  // 解開 PaywallBlur 包裹，保留內部
  s = s.replace(/<PaywallBlur[\\s\\S]+?intensity=\"light\"\\s*>([\\s\\S]+?)<\\/PaywallBlur>/g, '\$1');
  fs.writeFileSync(f, s);
}
console.log('  ✓ wrap-up 已 unlock events 區塊');
"

echo "▶ 建立 LiteBanner / LiteHero 元件..."
cat > "$LITE/src/components/LiteBanner.tsx" <<'EOF'
"use client";

// Lite 版頂部廣告條 — 提示「想看 AI 解讀？升 Pro 版」
// 每次 mount 都顯示，使用者點 X 後 sessionStorage 記住此頁不再顯示
//
// 設計：
//   - 紫色 gradient 配色（區隔 Lite 版的 red theme）
//   - 中央寫 hook 文案 + 右側「去 Pro 版 →」按鈕
//   - 右邊有 X 可關閉

import { useEffect, useState } from "react";
import { Sparkles, ArrowRight, X } from "lucide-react";

const DISMISS_KEY = "lite-banner-dismissed";
const PRO_URL =
  process.env.NEXT_PUBLIC_PRO_URL ?? "https://stockmate-ai-ashen.vercel.app";

export function LiteBanner() {
  const [hidden, setHidden] = useState(true); // SSR 時預設藏，避免閃爍

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const dismissed = sessionStorage.getItem(DISMISS_KEY) === "1";
      setHidden(dismissed);
    } catch {
      setHidden(false);
    }
  }, []);

  if (hidden) return null;

  function dismiss() {
    setHidden(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="border-b border-violet-300 bg-gradient-to-r from-violet-50 via-fuchsia-50 to-rose-50">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-1.5">
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] leading-snug text-gray-800">
          <Sparkles size={11} className="shrink-0 text-violet-700" />
          <span>
            <strong className="text-violet-800">Stockmate Lite</strong> · 100% 免費、不登入、純資料整理
          </span>
          <span className="hidden text-gray-500 sm:inline">
            · 想要 AI 解讀（個股 / 題材 / 持股健檢）？
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={PRO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md bg-violet-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-violet-700"
          >
            <Sparkles size={10} />
            去 Pro 版
            <ArrowRight size={10} />
          </a>
          <button
            onClick={dismiss}
            className="rounded p-1 text-gray-400 hover:bg-white hover:text-gray-700"
            aria-label="關閉"
            title="本次工作階段不再顯示"
          >
            <X size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
EOF
echo "  ✓ LiteBanner.tsx 建立"

echo ""
echo "✅ Sync 完成！下一步："
echo "   cd $LITE"
echo "   npm install"
echo "   npm run dev   # 試跑"
echo "   npx tsc --noEmit  # typecheck"
