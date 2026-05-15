"use client";

import Link from "next/link";
import { useMemo, useState, useEffect, useRef } from "react";
import { Moon, Sunrise, TrendingDown, TrendingUp, ArrowRight, Lock, RefreshCw } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useQuotes } from "@/lib/useQuotes";
import { allInfluenceSymbols, computeInfluenceStats } from "@/lib/influence";
import { TW_SECTORS, allSectorSymbols } from "@/lib/sectors";
import { displayName } from "@/lib/symbols";
import { changeColor, formatPercent } from "@/lib/format";
import { getTierFromMetadata } from "@/lib/tier";
import { classifyMarketState } from "@/lib/marketStatus";
import { useShowcase } from "./ShowcaseContext";
import type { Quote } from "@/lib/types";

type Tab = "overnight" | "twclose";

function autoTab(): Tab {
  // 台灣時間 (UTC+8)：21:30 後到 14:00 看「美股 → 明日台股」
  // 14:00-21:30 看「台股收盤回顧」
  const now = new Date();
  const taipei = new Date(now.getTime() + (8 * 60 - now.getTimezoneOffset() * -1) * 60_000);
  // 簡化：用使用者本機時間做粗略判斷
  const h = now.getUTCHours();
  // 美股盤 ≈ UTC 13:30-20:00；台股盤 ≈ UTC 01:00-05:30
  // 預設行為：UTC 05:30-13:00（台北 13:30-21:00）= 台股收盤回顧
  // 否則 = 美股 → 明日台股
  void taipei;
  if (h >= 5 && h < 13) return "twclose";
  return "overnight";
}

export function MarketBrief() {
  const [tab, setTab] = useState<Tab>("overnight");
  useEffect(() => setTab(autoTab()), []);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <header className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {tab === "overnight" ? (
            <Moon size={16} className="text-indigo-600" />
          ) : (
            <Sunrise size={16} className="text-amber-600" />
          )}
          <h2 className="text-sm font-semibold text-gray-700">
            {tab === "overnight" ? "美股夜盤 → 明日台股" : "台股收盤回顧"}
          </h2>
        </div>
        <div className="flex rounded-md border border-gray-300 bg-gray-100 p-0.5 text-xs">
          <button
            onClick={() => setTab("overnight")}
            className={`rounded px-2.5 py-1 ${tab === "overnight" ? "bg-zinc-700 text-gray-800" : "text-gray-500 hover:text-gray-700"}`}
          >
            🌙 美股 → 明日台股
          </button>
          <button
            onClick={() => setTab("twclose")}
            className={`rounded px-2.5 py-1 ${tab === "twclose" ? "bg-zinc-700 text-gray-800" : "text-gray-500 hover:text-gray-700"}`}
          >
            🌅 台股收盤回顧
          </button>
        </div>
      </header>

      {tab === "overnight" ? <OvernightBrief /> : <TwCloseBrief />}
    </section>
  );
}

// ───────── 夜盤美股 → 明日台股 ─────────
function OvernightBrief() {
  const symbols = useMemo(() => {
    const idx = ["^GSPC", "^IXIC", "^SOX", "^DJI"];
    return [...idx, ...allInfluenceSymbols()];
  }, []);
  const { quotes, loading, refresh } = useQuotes(symbols, 60_000);

  // 紀錄上次成功收到 quote 的時間，搭配自動跳動的「X 秒前」指示
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState(Date.now());
  const prevSamplesRef = useRef<string>("");
  useEffect(() => {
    // 每次 quotes 物件參考變動 → 更新 lastSyncAt
    const sample = JSON.stringify(Object.keys(quotes).slice(0, 3).map((k) => quotes[k]?.price));
    if (sample !== prevSamplesRef.current && Object.keys(quotes).length > 0) {
      prevSamplesRef.current = sample;
      setLastSyncAt(Date.now());
    }
  }, [quotes]);
  useEffect(() => {
    // 每秒讓 "X 秒前" 計時器跳一下
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const usIndices = [
    { sym: "^GSPC", label: "S&P 500" },
    { sym: "^IXIC", label: "NASDAQ" },
    { sym: "^SOX", label: "費城半導體" },
    { sym: "^DJI", label: "道瓊" },
  ];

  // 從 S&P 500 quote 拿 marketState → 整個 panel 套用
  const market = classifyMarketState(quotes["^GSPC"]?.marketState);

  const stats = useMemo(() => computeInfluenceStats(quotes), [quotes]);
  const bullish = stats.filter((s) => s.usAvg > 0).slice(0, 6);
  const bearish = stats.filter((s) => s.usAvg < 0).slice(0, 6);

  if (loading && Object.keys(quotes).length === 0) {
    return <p className="py-6 text-center text-sm text-gray-500">載入中…</p>;
  }

  const syncSecondsAgo = lastSyncAt
    ? Math.max(0, Math.floor((nowTick - lastSyncAt) / 1000))
    : null;

  return (
    <div className="space-y-3">
      {/* 市場狀態 + 同步指示器 */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5">
        <div className="flex items-center gap-2 text-xs">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${market.badgeClass}`}
            title={market.hint}
          >
            <span>{market.emoji}</span>
            {market.label}
          </span>
          <span className="hidden text-[10px] text-gray-500 sm:inline">
            {market.hint}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
          <span title="自動每 60 秒重抓報價">
            上次同步：
            <strong className="tabular-nums text-gray-700">
              {syncSecondsAgo == null
                ? "—"
                : syncSecondsAgo < 60
                  ? `${syncSecondsAgo} 秒前`
                  : `${Math.floor(syncSecondsAgo / 60)} 分${syncSecondsAgo % 60} 秒前`}
            </strong>
          </span>
          <button
            onClick={() => refresh?.()}
            className="rounded p-1 text-gray-500 hover:bg-white hover:text-gray-700"
            title="手動重新整理"
          >
            <RefreshCw size={11} />
          </button>
        </div>
      </div>

      {/* 美股大盤 */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {usIndices.map((i) => {
          const q = quotes[i.sym];
          const color = changeColor(q?.change);
          // 盤後 / 盤前變動（如果有）
          const afterPct =
            market.state === "post" && typeof q?.postMarketChangePercent === "number"
              ? q.postMarketChangePercent
              : market.state === "pre" && typeof q?.preMarketChangePercent === "number"
                ? q.preMarketChangePercent
                : undefined;
          const afterLabel = market.state === "post" ? "盤後" : "盤前";
          return (
            <div
              key={i.sym}
              className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2"
            >
              <div className="text-[10px] uppercase text-gray-500">{i.label}</div>
              <div className={`text-sm font-semibold tabular-nums ${color}`}>
                {formatPercent(q?.changePercent)}
              </div>
              {afterPct !== undefined && (
                <div
                  className={`text-[10px] tabular-nums ${changeColor(afterPct)}`}
                >
                  {afterLabel} {formatPercent(afterPct)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-gray-500">
        ⚡ 依「美股族群平均漲跌」推估明日台股可能受帶動 / 拖累的對應族群。
        {market.state === "closed" && (
          <span className="text-gray-400">
            （美股已收盤、指數會停在收盤價直到下一次開盤）
          </span>
        )}
        僅供參考，實際表現受台北開盤前消息影響。
      </p>

      {/* 利多 / 利空 */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <InfluenceColumn
          title="🟢 利多訊號"
          icon={<TrendingUp size={13} className="text-red-600" />}
          stats={bullish}
          quotes={quotes}
          positive
        />
        <InfluenceColumn
          title="🔴 利空訊號"
          icon={<TrendingDown size={13} className="text-green-600" />}
          stats={bearish}
          quotes={quotes}
          positive={false}
        />
      </div>
    </div>
  );
}

function InfluenceColumn({
  title,
  icon,
  stats,
  quotes,
  positive,
}: {
  title: string;
  icon: React.ReactNode;
  stats: ReturnType<typeof computeInfluenceStats>;
  quotes: Record<string, Quote>;
  positive: boolean;
}) {
  if (stats.length === 0) {
    return (
      <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
        <div className="mb-2 flex items-center gap-1 text-xs font-semibold text-gray-600">
          {icon} {title}
        </div>
        <p className="py-2 text-center text-[11px] text-gray-500">
          目前沒有顯著{positive ? "利多" : "利空"}族群
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
      <div className="mb-2 flex items-center gap-1 text-xs font-semibold text-gray-600">
        {icon} {title}
      </div>
      <ul className="space-y-2">
        {stats.map(({ group, usAvg, usQuotes }) => {
          const sortedUs = [...usQuotes].sort(
            (a, b) => (positive ? -1 : 1) * (a.q.changePercent - b.q.changePercent),
          );
          const color = changeColor(usAvg);
          return (
            <li key={group.id} className="rounded border border-gray-200 bg-white p-2">
              <div className="mb-1 flex items-baseline justify-between">
                <span className="text-xs font-medium text-gray-800">{group.label}</span>
                <span className={`text-xs font-semibold tabular-nums ${color}`}>
                  {formatPercent(usAvg)}
                </span>
              </div>
              <div className="text-[10px] text-gray-500 line-clamp-2">{group.rationale}</div>

              {/* US 領先股 */}
              <div className="mt-1.5 flex flex-wrap gap-1">
                {sortedUs.slice(0, 3).map(({ symbol, q }) => (
                  <span
                    key={symbol}
                    className={`rounded px-1.5 py-0.5 text-[10px] tabular-nums ${
                      q.changePercent >= 0
                        ? "bg-red-50 text-red-500"
                        : "bg-green-50 text-green-500"
                    }`}
                  >
                    {displayName(symbol, q.name)} {formatPercent(q.changePercent)}
                  </span>
                ))}
              </div>

              {/* TW 對應股（Pro+ 才能看具體標的） */}
              <ExpectedTwChips twSymbols={group.twSymbols} quotes={quotes} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * 「預期影響」TW 對應股 chip 列表
 * - Pro+ / 示範模式：完整顯示，可點擊跳轉
 * - Free：半遮罩 + 升級提示，chips 模糊看得到形狀但不可點
 */
function ExpectedTwChips({ twSymbols, quotes }: { twSymbols: string[]; quotes: Record<string, Quote> }) {
  // Lite 版：所有 chips 都直接可看，無 paywall（合併原 ExpectedTwChips + FullChips）
  if (twSymbols.length === 0) return null;
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1">
      <span className="text-[10px] text-gray-500">→ 預期影響：</span>
      {twSymbols.slice(0, 4).map((sym) => {
        const q = quotes[sym];
        const cleanCode = sym.replace(/\.(TW|TWO)$/i, '');
        return (
          <Link
            key={sym}
            href={`/stock/${encodeURIComponent(sym)}`}
            className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-700 hover:bg-gray-200 hover:text-blue-700"
            title={q?.name}
          >
            {displayName(sym, q?.name) || cleanCode}
          </Link>
        );
      })}
    </div>
  );
}

function FullChips({
  twSymbols,
  quotes,
}: {
  twSymbols: string[];
  quotes: Record<string, Quote>;
}) {
  return (
    <div className="mt-1.5 flex items-center gap-1 text-[10px] text-gray-500">
      <ArrowRight size={9} /> 預期影響：
      <div className="flex flex-wrap gap-1">
        {twSymbols.slice(0, 4).map((s) => {
          const q = quotes[s];
          const code = s.replace(/\.(TW|TWO)$/i, "");
          return (
            <Link
              key={s}
              href={`/stock/${encodeURIComponent(s)}`}
              className="rounded bg-gray-200 px-1.5 py-0.5 text-gray-600 hover:bg-gray-300"
              title={`${displayName(s)} ${code}`}
            >
              {displayName(s, q?.name)}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ───────── 台股收盤回顧 ─────────
function TwCloseBrief() {
  const symbols = useMemo(() => {
    const idx = ["^TWII", "^TWOII"];
    return [...idx, ...allSectorSymbols("TW")];
  }, []);
  const { quotes, loading } = useQuotes(symbols, 60_000);

  const sectorStats = useMemo(() => {
    return TW_SECTORS.map((s) => {
      const ss = s.symbols
        .map((sym) => quotes[sym])
        .filter((q): q is Quote => Boolean(q) && Number.isFinite(q.changePercent));
      const avgChange =
        ss.length > 0 ? ss.reduce((sum, q) => sum + q.changePercent, 0) / ss.length : 0;
      return { sector: s, avgChange, count: ss.length };
    })
      .filter((s) => s.count > 0)
      .sort((a, b) => b.avgChange - a.avgChange);
  }, [quotes]);

  const top3 = sectorStats.slice(0, 3);
  const bottom3 = [...sectorStats].slice(-3).reverse();

  // 個股漲跌前 5（從台股池）
  const allTwQuotes = useMemo(
    () =>
      allSectorSymbols("TW")
        .map((s) => quotes[s])
        .filter((q): q is Quote => Boolean(q) && Number.isFinite(q.changePercent)),
    [quotes],
  );
  const topStocks = [...allTwQuotes].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);
  const bottomStocks = [...allTwQuotes].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);

  const twii = quotes["^TWII"];
  const twoii = quotes["^TWOII"];

  if (loading && Object.keys(quotes).length === 0) {
    return <p className="py-6 text-center text-sm text-gray-500">載入中…</p>;
  }

  return (
    <div className="space-y-3">
      {/* 大盤 */}
      <div className="grid grid-cols-2 gap-2">
        <IndexCard label="加權指數" q={twii} />
        <IndexCard label="櫃買指數" q={twoii} />
      </div>

      {/* 領漲族群 + 領跌族群 */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <SectorList title="🚀 今日領漲族群" stats={top3} positive />
        <SectorList title="⛔ 今日領跌族群" stats={bottom3} positive={false} />
      </div>

      {/* 個股漲跌幅 */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <StockList title="🔥 漲幅前 5（觀察池）" stocks={topStocks} positive />
        <StockList title="❄️ 跌幅前 5（觀察池）" stocks={bottomStocks} positive={false} />
      </div>
    </div>
  );
}

function IndexCard({ label, q }: { label: string; q?: Quote }) {
  const color = changeColor(q?.change);
  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
      <div className="text-[10px] uppercase text-gray-500">{label}</div>
      <div className="flex items-baseline gap-2">
        <div className="text-sm font-semibold tabular-nums text-gray-800">
          {q ? q.price.toLocaleString() : "—"}
        </div>
        <div className={`text-xs tabular-nums ${color}`}>
          {q ? formatPercent(q.changePercent) : ""}
        </div>
      </div>
    </div>
  );
}

function SectorList({
  title,
  stats,
  positive,
}: {
  title: string;
  stats: { sector: { id: string; label: string }; avgChange: number }[];
  positive: boolean;
}) {
  void positive;
  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
      <div className="mb-2 text-xs font-semibold text-gray-600">{title}</div>
      <ul className="space-y-1">
        {stats.map(({ sector, avgChange }) => (
          <li
            key={sector.id}
            className="flex items-center justify-between rounded border border-gray-200 bg-white px-2 py-1"
          >
            <span className="text-xs text-gray-700">{sector.label}</span>
            <span className={`text-xs font-semibold tabular-nums ${changeColor(avgChange)}`}>
              {formatPercent(avgChange)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StockList({
  title,
  stocks,
  positive,
}: {
  title: string;
  stocks: Quote[];
  positive: boolean;
}) {
  void positive;
  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
      <div className="mb-2 text-xs font-semibold text-gray-600">{title}</div>
      <ul className="space-y-1">
        {stocks.map((q) => (
          <li key={q.symbol}>
            <Link
              href={`/stock/${encodeURIComponent(q.symbol)}`}
              className="flex items-center justify-between rounded border border-gray-200 bg-white px-2 py-1 hover:border-gray-300"
            >
              <span className="text-xs text-gray-700">{displayName(q.symbol, q.name)}</span>
              <span className={`text-xs font-semibold tabular-nums ${changeColor(q.changePercent)}`}>
                {formatPercent(q.changePercent)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
