import { Holdings } from "@/components/Holdings";
import { Transactions } from "@/components/Transactions";
import { PortfolioHistory } from "@/components/PortfolioHistory";
import { PortfolioAllocation } from "@/components/PortfolioAllocation";
import { PriceAlerts } from "@/components/PriceAlerts";
import { PlanningDashboard } from "@/components/PlanningDashboard";
import { SettlementReminder } from "@/components/SettlementReminder";

export const metadata = {
  title: "我的持股 · 楊yoyo的持股",
};

// 不預渲染 — HoldingsAnalysis 等元件用 Clerk useUser（PaywallBlur）
export const dynamic = "force-dynamic";

// 持股分頁：持股、加碼計畫、配置、警示、體檢、交易紀錄、資產凍結
export default function PortfolioPage() {
  return (
    <main className="mx-auto max-w-7xl space-y-4 px-4 py-4">
      <SettlementReminder />
      <Holdings />
      <PlanningDashboard />
      <PortfolioAllocation />
      <PriceAlerts />
      
      <PortfolioHistory />
      <Transactions />
    </main>
  );
}
