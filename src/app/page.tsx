import { IndexBar } from "@/components/IndexBar";
import { MarketBrief } from "@/components/MarketBrief";
import { RankBoard } from "@/components/RankBoard";
import { DailyFocus } from "@/components/DailyFocus";
import { MarketPulse } from "@/components/MarketPulse";
import { EconomicEventsBar } from "@/components/EconomicEventsBar";
import { PreMarketAlert } from "@/components/PreMarketAlert";
import { SectorBlockMap } from "@/components/SectorBlockMap";
import { MarketSentiment } from "@/components/MarketSentiment";
import { TwFuturesNight } from "@/components/TwFuturesNight";
import { MarketCloseWrapUp } from "@/components/MarketCloseWrapUp";
import { PopularEtfTracker } from "@/components/PopularEtfTracker";
// HomeHero 移到 /pricing 頂部（品牌主視覺 + 升級 CTA）
// PremiumBanner 移除 — 廣告改散播到各個股頁面（StockUpsellBanner）
// MarketCloseWrapUp 外層 PaywallBlur 已拿掉 — 內部 TwDailyWrapUp / DailyWrapUp
// 自己分區 free / paid：指數 + 三大法人 + 領漲族群 → free；AI 10 大事件 → paid blur

// 不預渲染 — 因為 PaywallBlur 用 Clerk useUser
export const dynamic = "force-dynamic";

// 排序邏輯：台股優先 + 板塊優先順序
//
// 🇹🇼 第一層：盤前必看
//   1. IndexBar 指數列
//   2. PreMarketAlert 美股盤前 / 盤後異動（免費）
//   3. TwFuturesNight 台指期 + 夜盤
//   4. MarketBrief 美股族群 → 明日台股（預期影響 chips Pro 鎖）⭐
//   5. RankBoard 強勢 / 弱勢股（top 5 免費、6-10 Pro 鎖）
//   6. MarketPulse 三大法人 + 資券
//
// 🇹🇼 第二層：盤後收盤回顧
//   7. MarketCloseWrapUp 台股 / 美股 收盤速報（Pro 鎖）
//
// 第三層：總體環境
//   8. EconomicEventsBar 重大事件
//   9. MarketSentiment VIX + F&G
//
// 第四層：產業 / 個股焦點
//   10. SectorBlockMap 產業熱度
//   11. PopularEtfTracker 熱門 ETF
//   12. DailyFocus 每日焦點
export default function Home() {
  return (
    <main className="mx-auto max-w-7xl space-y-4 px-4 py-4">
      <IndexBar />
      <PreMarketAlert />
      <TwFuturesNight />
      <MarketBrief />
      <RankBoard />
      <MarketPulse />
      {/* 收盤速報 — 指數 + 三大法人 + 領漲領跌族群免費看
          AI 整理的「10 大重點事件」對 free 用戶 blur，付費才看得到 */}
      <MarketCloseWrapUp />
      <EconomicEventsBar />
      <MarketSentiment />
      <SectorBlockMap />
      <PopularEtfTracker />
      <DailyFocus />
    </main>
  );
}
