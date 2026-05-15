import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { StockChart } from "@/components/StockChart";
import { StockHeader } from "@/components/StockHeader";
import { Fundamentals } from "@/components/Fundamentals";
import { FinancialDeepDive } from "@/components/FinancialDeepDive";
import { PeerComparison } from "@/components/PeerComparison";
import { RelatedTopics } from "@/components/RelatedTopics";
import { StockNews } from "@/components/StockNews";
import { QuarterlyFinancials } from "@/components/QuarterlyFinancials";
import { DividendHistory } from "@/components/DividendHistory";
import { InstitutionalChart } from "@/components/InstitutionalChart";
import { UpcomingEvents } from "@/components/UpcomingEvents";
import { GrowthAnalysis } from "@/components/GrowthAnalysis";
import { PEBand } from "@/components/PEBand";
import { MarginShortTrend } from "@/components/MarginShortTrend";
import { ShareholderDistribution } from "@/components/ShareholderDistribution";
import { StockSignalPanel } from "@/components/StockSignalPanel";
import { TechnicalSnapshot } from "@/components/TechnicalSnapshot";
import { detectRegion } from "@/lib/symbols";

type Props = {
  params: Promise<{ symbol: string }>;
};

export default async function StockPage({ params }: Props) {
  const { symbol: encoded } = await params;
  const symbol = decodeURIComponent(encoded);
  const region = detectRegion(symbol);
  const cleanCode = symbol.replace(/\.(TW|TWO)$/i, "");

  const tvLink = `https://tradingview.com/symbols/${region === "TW" ? `TPE-${cleanCode}` : cleanCode}/`;
  const finvizLink = region === "US" ? `https://finviz.com/quote.ashx?t=${symbol}` : null;

  return (
    <main className="mx-auto max-w-7xl space-y-4 px-4 py-4">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft size={14} /> 返回首頁
        </Link>
        <div className="flex gap-1 text-xs">
          <a
            href={tvLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded bg-gray-200 px-2 py-1 text-gray-600 hover:bg-gray-200"
          >
            TradingView <ExternalLink size={10} />
          </a>
          {finvizLink && (
            <a
              href={finvizLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded bg-gray-200 px-2 py-1 text-gray-600 hover:bg-gray-200"
            >
              Finviz <ExternalLink size={10} />
            </a>
          )}
        </div>
      </div>

      <StockHeader symbol={symbol} />
      {/* 個股頁的廣告位 — 在地化、輪替露出 Pro / Premium 賣點 */}
      <TechnicalSnapshot symbol={symbol} />
      <StockSignalPanel symbol={symbol} />
      <UpcomingEvents symbol={symbol} />
      <RelatedTopics symbol={symbol} />
      <StockChart symbol={symbol} />
      <GrowthAnalysis symbol={symbol} />
      <PEBand symbol={symbol} />
      <Fundamentals symbol={symbol} />
      {/* 5 tab 財務深度分析：盈利穿透 / 利潤率 / 資產負債 / 現金流 / 多維估值
          全部基於 Yahoo Finance 公開財報，3 年歷史 + 即時 TTM，零 AI 推論 */}
      <FinancialDeepDive symbol={symbol} />
      <QuarterlyFinancials symbol={symbol} />
      <DividendHistory symbol={symbol} />
      <InstitutionalChart symbol={symbol} />
      <ShareholderDistribution symbol={symbol} />
      <MarginShortTrend symbol={symbol} />
      <PeerComparison symbol={symbol} />
      <StockNews symbol={symbol} />
    </main>
  );
}
