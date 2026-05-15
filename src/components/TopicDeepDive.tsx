"use client";

import Link from "next/link";
import { useMemo, useEffect, useState } from "react";
import { Crown, Medal, Award, ExternalLink } from "lucide-react";
import { getSectorById, getTierSymbols, type Tier } from "@/lib/sectors";
import { useQuotes } from "@/lib/useQuotes";
import { displayName, detectRegion } from "@/lib/symbols";
import { changeColor, formatLargeNumber, formatPercent, formatPrice } from "@/lib/format";
import type { StockDetail } from "@/app/api/stock-detail/route";

type Props = {
  sectorId: string;
};

const TIER_META: Record<
  Tier,
  { label: string; icon: React.ReactNode; color: string; subtitle: string }
> = {
  1: {
    label: "Tier 1 龍頭股",
    icon: <Crown size={14} className="text-amber-600" />,
    color: "border-amber-300 bg-amber-50",
    subtitle: "市值最大、市佔最高、產業龍頭",
  },
  2: {
    label: "Tier 2 中堅股",
    icon: <Medal size={14} className="text-slate-600" />,
    color: "border-slate-300 bg-slate-50",
    subtitle: "中型主要玩家、營運穩定",
  },
  3: {
    label: "Tier 3 衛星股",
    icon: <Award size={14} className="text-orange-600" />,
    color: "border-orange-300 bg-orange-50",
    subtitle: "小型 / 邊緣相關、波動較大",
  },
};

export function TopicDeepDive({ sectorId }: Props) {
  const sector = getSectorById(sectorId);
  const symbols = useMemo(() => sector?.symbols ?? [], [sector]);
  const { quotes } = useQuotes(symbols, 60_000);
  const [details, setDetails] = useState<Record<string, StockDetail>>({});

  // 抓 fundamentals
  useEffect(() => {
    if (symbols.length === 0) return;
    let cancelled = false;
    Promise.all(
      symbols.map((s) =>
        fetch(`/api/stock-detail?symbol=${encodeURIComponent(s)}`)
          .then((r) => r.json())
          .then((d) => ({ sym: s, detail: d.detail as StockDetail | null }))
          .catch(() => ({ sym: s, detail: null })),
      ),
    ).then((results) => {
      if (cancelled) return;
      const map: Record<string, StockDetail> = {};
      for (const r of results) if (r.detail) map[r.sym] = r.detail;
      setDetails(map);
    });
    return () => {
      cancelled = true;
    };
  }, [symbols.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!sector) return null;

  // 計算各 tier 成員（沒有 tier 定義的 fallback 為 Tier 3）
  const t1 = getTierSymbols(sector, 1);
  const t2 = getTierSymbols(sector, 2);
  const t3 = getTierSymbols(sector, 3);
  const classified = new Set([...t1, ...t2, ...t3]);
  const unranked = sector.symbols.filter((s) => !classified.has(s));

  // 平均漲跌（提供 header 統計用）
  const validQuotes = symbols.map((s) => quotes[s]).filter((q) => q && Number.isFinite(q.changePercent));
  const avg =
    validQuotes.length > 0
      ? validQuotes.reduce((sum, q) => sum + q.changePercent, 0) / validQuotes.length
      : 0;

  return (
    <div className="space-y-4">
      {/* 統計列 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBlock label="題材平均漲跌">
          <span className={`text-lg font-semibold tabular-nums ${changeColor(avg)}`}>
            {formatPercent(avg)}
          </span>
        </StatBlock>
        <StatBlock label="領漲">
          {(() => {
            const top = [...validQuotes].sort((a, b) => b.changePercent - a.changePercent)[0];
            if (!top) return <span className="text-gray-500">—</span>;
            return (
              <div>
                <div className="text-sm font-semibold text-gray-800">
                  {displayName(top.symbol, top.name)}
                </div>
                <div className={`text-xs ${changeColor(top.change)}`}>
                  {formatPercent(top.changePercent)}
                </div>
              </div>
            );
          })()}
        </StatBlock>
        <StatBlock label="領跌">
          {(() => {
            const bot = [...validQuotes].sort((a, b) => a.changePercent - b.changePercent)[0];
            if (!bot) return <span className="text-gray-500">—</span>;
            return (
              <div>
                <div className="text-sm font-semibold text-gray-800">
                  {displayName(bot.symbol, bot.name)}
                </div>
                <div className={`text-xs ${changeColor(bot.change)}`}>
                  {formatPercent(bot.changePercent)}
                </div>
              </div>
            );
          })()}
        </StatBlock>
        <StatBlock label="總市值">
          {(() => {
            const total = symbols.reduce((sum, s) => sum + (details[s]?.marketCap ?? 0), 0);
            return total > 0 ? (
              <span className="text-sm font-semibold text-gray-800">
                {formatLargeNumber(total)}
              </span>
            ) : (
              <span className="text-gray-500">—</span>
            );
          })()}
        </StatBlock>
      </div>

      {/* Tiered 區塊 */}
      {([1, 2, 3] as Tier[]).map((tier) => {
        const tierSymbols = getTierSymbols(sector, tier);
        if (tierSymbols.length === 0) return null;
        const meta = TIER_META[tier];
        return (
          <section
            key={tier}
            className={`rounded-xl border ${meta.color} p-4`}
          >
            <header className="mb-3">
              <div className="flex items-center gap-2">
                {meta.icon}
                <h2 className="text-base font-semibold text-gray-800">{meta.label}</h2>
                <span className="text-xs text-gray-500">{tierSymbols.length} 檔</span>
              </div>
              <p className="text-[11px] text-gray-500">{meta.subtitle}</p>
            </header>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tierSymbols.map((s) => (
                <StockTile key={s} symbol={s} quote={quotes[s]} detail={details[s]} />
              ))}
            </div>
          </section>
        );
      })}

      {/* 未分類的 */}
      {unranked.length > 0 && (
        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <header className="mb-3">
            <h2 className="text-base font-semibold text-gray-800">其他成員</h2>
            <p className="text-[11px] text-gray-500">尚未分層的個股</p>
          </header>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {unranked.map((s) => (
              <StockTile key={s} symbol={s} quote={quotes[s]} detail={details[s]} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
      <div className="text-[10px] uppercase text-gray-500">{label}</div>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

function StockTile({
  symbol,
  quote,
  detail,
}: {
  symbol: string;
  quote?: { price: number; change: number; changePercent: number; name?: string; volume?: number };
  detail?: StockDetail;
}) {
  const code = symbol.replace(/\.(TW|TWO)$/i, "");
  const name = displayName(symbol, quote?.name);
  const region = detectRegion(symbol);
  const tvLink = `https://tradingview.com/symbols/${region === "TW" ? `TPE-${code}` : code}/`;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 transition hover:border-gray-300">
      <Link href={`/stock/${encodeURIComponent(symbol)}`} className="block">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate font-semibold text-gray-800 hover:text-red-600">
            {name}
          </span>
          <span className="shrink-0 rounded bg-gray-200 px-1.5 py-0.5 text-[10px] text-gray-500">
            {code}
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold tabular-nums text-gray-900">
            {formatPrice(quote?.price)}
          </span>
          <span className={`text-sm tabular-nums ${changeColor(quote?.change)}`}>
            {quote ? formatPercent(quote.changePercent) : "—"}
          </span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-gray-500">
          <Field label="市值" value={detail?.marketCap ? formatLargeNumber(detail.marketCap) : "—"} />
          <Field
            label="PE"
            value={detail?.trailingPE ? detail.trailingPE.toFixed(1) : "—"}
          />
          <Field
            label="ROE"
            value={detail?.returnOnEquity ? `${(detail.returnOnEquity * 100).toFixed(1)}%` : "—"}
          />
          <Field
            label="殖利率"
            value={
              detail?.dividendYield ? `${(detail.dividendYield * 100).toFixed(2)}%` : "—"
            }
          />
        </div>
      </Link>

      <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
        <a
          href={tvLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-0.5 rounded bg-gray-200 px-1.5 py-0.5 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
        >
          TradingView <ExternalLink size={9} />
        </a>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="tabular-nums text-gray-600">{value}</span>
    </div>
  );
}
