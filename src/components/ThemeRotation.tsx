"use client";

// 2024-2026 台股漲價邏輯題材輪動深度頁
//
// 4 種狀態 filter：正在漲 / 預期會漲 / 漲過了 / 跌深
// 每個題材：narrative + 時間軸 + 受惠台股（含即時報價）+ 催化劑 + 觀察點

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  AlertTriangle,
  Calendar,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import {
  THEMES,
  STATUS_META,
  allThemeTwSymbols,
  type ThemeEntry,
  type ThemeStatus,
} from "@/lib/theme-rotation";
import { useQuotes } from "@/lib/useQuotes";
import { changeColor, formatPercent, formatPrice } from "@/lib/format";

export function ThemeRotation() {
  const symbols = useMemo(() => allThemeTwSymbols(), []);
  const { quotes } = useQuotes(symbols, 60_000);
  const [activeFilter, setActiveFilter] = useState<ThemeStatus | "all">("all");

  const filteredThemes = useMemo(() => {
    if (activeFilter === "all") {
      // 依 status order 排序：active → anticipated → peaked → declined
      return [...THEMES].sort(
        (a, b) =>
          STATUS_META[a.status].order - STATUS_META[b.status].order,
      );
    }
    return THEMES.filter((t) => t.status === activeFilter);
  }, [activeFilter]);

  // 統計每個 status 多少題材
  const statusCount: Record<ThemeStatus | "all", number> = useMemo(() => {
    const counts: Record<string, number> = { all: THEMES.length };
    for (const t of THEMES) {
      counts[t.status] = (counts[t.status] ?? 0) + 1;
    }
    return counts as Record<ThemeStatus | "all", number>;
  }, []);

  return (
    <div className="space-y-5">
      {/* Hero */}
      <header className="overflow-hidden rounded-2xl border-2 border-indigo-300 bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 p-6 shadow-md">
        <div className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
          <Calendar size={11} /> Theme Timeline
        </div>
        <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
          2024-2026 台股漲價邏輯題材輪動
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-700">
          完整盤點過去 2 年到現在（2026/5）的台股題材輪動。所有題材都跟著
          <strong>零組件邏輯</strong>走 — 從 AI GPU 上游（HBM、CoWoS）到下游（散熱、電源、ODM）—
          當你看懂這個鏈、就知道<strong>下一個會輪到誰</strong>。
          <span className="block mt-1 text-[11px] text-gray-500">
            💡 純資料整理工具，不構成投資建議。漲幅描述為「題材高峰中位數股票概略值」、僅供時間軸對照。
          </span>
        </p>

        {/* 4 status 圖例 */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
          {(Object.keys(STATUS_META) as ThemeStatus[])
            .sort((a, b) => STATUS_META[a].order - STATUS_META[b].order)
            .map((s) => (
              <div
                key={s}
                className={`rounded-md border ${STATUS_META[s].color} px-2 py-1.5`}
              >
                <div className="flex items-center gap-1 font-semibold text-gray-800">
                  <span>{STATUS_META[s].emoji}</span>
                  {STATUS_META[s].label}
                  <span className="ml-auto text-gray-500">
                    {statusCount[s] ?? 0}
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] text-gray-600">
                  {STATUS_META[s].description}
                </p>
              </div>
            ))}
        </div>
      </header>

      {/* Filter Tab */}
      <div className="flex flex-wrap gap-1.5">
        <FilterButton
          label={`全部 (${statusCount.all})`}
          active={activeFilter === "all"}
          onClick={() => setActiveFilter("all")}
          color="border-gray-400 bg-white"
        />
        {(Object.keys(STATUS_META) as ThemeStatus[])
          .sort((a, b) => STATUS_META[a].order - STATUS_META[b].order)
          .map((s) => {
            const m = STATUS_META[s];
            return (
              <FilterButton
                key={s}
                label={`${m.emoji} ${m.label} (${statusCount[s] ?? 0})`}
                active={activeFilter === s}
                onClick={() => setActiveFilter(s)}
                color={m.color}
              />
            );
          })}
      </div>

      {/* Theme List */}
      <div className="space-y-3">
        {filteredThemes.map((t) => (
          <ThemeCard key={t.id} theme={t} quotes={quotes} />
        ))}
      </div>

      {/* Footer */}
      <footer className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-[11px] leading-relaxed text-gray-600">
        <p>
          📚 <strong>資料源</strong>：TWSE 公開資訊、各家券商研究報告、外電科技新聞、PTT/Threads
          散戶討論彙整 + NVIDIA 官方產品路線圖。
        </p>
        <p className="mt-1">
          ⚠️ <strong>免責</strong>：本頁為公開資料整理 + 時間軸記錄、
          <strong>不構成任何投資建議</strong>。漲幅描述為題材高峰時段「中位數股票」的概略值、
          並非「保證未來會漲 / 跌」。題材輪動本質上有時序性、過去漲過不代表未來會漲、未來預期也不代表一定會發生。
        </p>
        <p className="mt-1 text-gray-400">
          🔄 資料整理截至 2026 年 5 月 18 日。題材輪動極快、需定期更新（每月一次）。
        </p>
      </footer>
    </div>
  );
}

function FilterButton({
  label,
  active,
  onClick,
  color,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? `${color} ring-2 ring-offset-1 ring-gray-400 text-gray-900`
          : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"
      }`}
    >
      {label}
    </button>
  );
}

type QuoteMap = Record<
  string,
  { price: number; change: number; changePercent: number; name?: string }
>;

function ThemeCard({
  theme,
  quotes,
}: {
  theme: ThemeEntry;
  quotes: QuoteMap;
}) {
  const meta = STATUS_META[theme.status];
  const [expanded, setExpanded] = useState(false);

  return (
    <article className={`rounded-xl border-2 ${meta.color} overflow-hidden`}>
      {/* Header */}
      <header className="p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl leading-none">{meta.emoji}</span>
            <h2 className="text-base font-bold text-gray-900">{theme.name}</h2>
          </div>
          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-gray-700 ring-1 ring-gray-300">
            {meta.label}
          </span>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-gray-700">
          {theme.brief}
        </p>

        {/* 時間軸 */}
        <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-gray-600">
          <span className="flex items-center gap-0.5">
            <Clock size={11} /> 起漲：
            <strong className="text-gray-800">{theme.timeline.start}</strong>
          </span>
          {theme.timeline.peak && (
            <span className="flex items-center gap-0.5">
              📈 高點：<strong className="text-gray-800">{theme.timeline.peak}</strong>
            </span>
          )}
          <span className="flex items-center gap-0.5">
            🔍 現況：<strong className="text-gray-800">{theme.timeline.nowStatus}</strong>
          </span>
        </div>

        {theme.peakReturn && (
          <div className="mt-2 text-[11px] text-gray-700">
            💰 高峰漲幅：<strong>{theme.peakReturn}</strong>
          </div>
        )}
      </header>

      {/* 預覽：top 4 stocks */}
      <div className="border-t border-gray-100 bg-white/50 px-4 py-2">
        <div className="text-[10px] font-semibold uppercase text-gray-500 mb-1">
          🇹🇼 受惠台股（{theme.twStocks.length} 檔）
        </div>
        <div className="flex flex-wrap gap-1.5">
          {theme.twStocks.slice(0, expanded ? theme.twStocks.length : 4).map((s) => (
            <StockChip key={s.symbol} stock={s} quote={quotes[s.symbol]} />
          ))}
          {theme.twStocks.length > 4 && !expanded && (
            <button
              onClick={() => setExpanded(true)}
              className="rounded bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-700 hover:bg-gray-200"
            >
              +{theme.twStocks.length - 4} 檔
            </button>
          )}
        </div>
      </div>

      {/* Expanded section */}
      <div className="px-4 pb-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-indigo-700 hover:text-indigo-900"
        >
          {expanded ? (
            <>
              <ChevronUp size={11} /> 收合
            </>
          ) : (
            <>
              <ChevronDown size={11} /> 看完整邏輯 + 催化劑 + 觀察點
            </>
          )}
        </button>

        {expanded && (
          <div className="mt-3 space-y-3">
            {/* Narrative */}
            <div className="rounded-md border border-gray-200 bg-white p-3">
              <h3 className="mb-1 text-[11px] font-bold uppercase text-gray-500">
                📖 漲價邏輯
              </h3>
              <p className="whitespace-pre-line text-xs leading-relaxed text-gray-800">
                {theme.narrative}
              </p>
            </div>

            {/* Catalysts */}
            {theme.catalysts.length > 0 && (
              <div className="rounded-md border border-amber-200 bg-amber-50/60 p-3">
                <h3 className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase text-amber-800">
                  <Target size={11} /> 觸發催化劑
                </h3>
                <ul className="space-y-0.5 text-xs">
                  {theme.catalysts.map((c, i) => (
                    <li key={i} className="flex gap-1.5 text-gray-700">
                      <span className="text-amber-700">→</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Watch Points */}
            {theme.watchPoints.length > 0 && (
              <div className="rounded-md border border-blue-200 bg-blue-50/60 p-3">
                <h3 className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase text-blue-800">
                  <AlertTriangle size={11} /> 觀察點 / 風險
                </h3>
                <ul className="space-y-0.5 text-xs">
                  {theme.watchPoints.map((w, i) => (
                    <li key={i} className="flex gap-1.5 text-gray-700">
                      <span className="text-blue-700">·</span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* NVDA components link */}
            {theme.relatedNvdaComponents &&
              theme.relatedNvdaComponents.length > 0 && (
                <Link
                  href="/companies/nvda"
                  className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100"
                >
                  🔗 對應 NVIDIA 零組件供應鏈頁 →
                </Link>
              )}

            {/* Theme-specific deep-dive page (e.g. LEO satellite) */}
            {theme.deepDiveHref && (
              <Link
                href={theme.deepDiveHref}
                className="ml-2 inline-flex items-center gap-1 rounded-md border border-violet-300 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-800 hover:bg-violet-100"
              >
                {theme.deepDiveLabel || "深度頁"} →
              </Link>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function StockChip({
  stock,
  quote,
}: {
  stock: { symbol: string; name: string; role: string; perfHint?: string };
  quote?: { price: number; change: number; changePercent: number };
}) {
  const code = stock.symbol.replace(/\.(TW|TWO)$/i, "");
  return (
    <Link
      href={`/stock/${encodeURIComponent(stock.symbol)}`}
      className="group flex items-baseline gap-1.5 rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] hover:border-indigo-400"
      title={`${stock.name} ${code} — ${stock.role}${stock.perfHint ? "\n表現：" + stock.perfHint : ""}`}
    >
      <span className="font-semibold text-gray-800 group-hover:text-indigo-700">
        {stock.name}
      </span>
      <span className="text-[10px] tabular-nums text-gray-500">{code}</span>
      {quote && (
        <span
          className={`text-[10px] tabular-nums ${changeColor(quote.change)}`}
        >
          {formatPercent(quote.changePercent)}
        </span>
      )}
      <ExternalLink size={9} className="text-gray-400" />
    </Link>
  );
}
