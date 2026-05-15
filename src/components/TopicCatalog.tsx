"use client";

// 題材頁主元件 — 雜誌風大改版（脫離卡片格子的同質化感）
//
// 設計概念：
//   1. 「今日題材脈動」hero — 顯示市場概況 + 動態統計
//   2. 「🔥 今日燒燙 Top 3」magazine-style 大卡 — 跨欄、含 sparkline
//   3. 「❄️ 今日冷卻 Top 3」對稱呈現
//   4. 完整題材池：用「火力溫度」排序，視覺差異化（顏色 + 大小 + emoji）
//
// 跟 aistockmap / 玩股不一樣的地方：
//   - 不是齊頭式 grid，而是「重要的題材視覺更大」
//   - 每張卡看得到 top 3 個股名 + 即時漲跌（不用點進去）
//   - 用「火焰 emoji 數量」表達熱度（直觀 > 數字）

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Flame, Snowflake, TrendingUp, TrendingDown, Activity } from "lucide-react";
import {
  TW_SECTORS,
  US_SECTORS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type Category,
  type SectorGroup,
} from "@/lib/sectors";
import { useQuotes } from "@/lib/useQuotes";
import { displayName } from "@/lib/symbols";
import { changeColor, formatPercent } from "@/lib/format";
import type { Quote } from "@/lib/types";

type Market = "TW" | "US";

type SectorWithStats = {
  sector: SectorGroup;
  avgChange: number;
  validCount: number;
  topStocks: Array<{ symbol: string; q: Quote }>;
};

export function TopicCatalog() {
  const [market, setMarket] = useState<Market>("TW");
  const [category, setCategory] = useState<Category | "all">("all");

  const sectors = market === "TW" ? TW_SECTORS : US_SECTORS;
  const filtered = useMemo(
    () => (category === "all" ? sectors : sectors.filter((s) => s.category === category)),
    [sectors, category],
  );

  const availableCategories = useMemo(() => {
    const set = new Set<Category>();
    for (const s of sectors) set.add(s.category);
    return CATEGORY_ORDER.filter((c) => set.has(c));
  }, [sectors]);

  // 拉所有 symbol 的即時報價
  const symbols = useMemo(() => {
    const set = new Set<string>();
    for (const s of filtered) for (const sym of s.symbols) set.add(sym);
    return Array.from(set);
  }, [filtered]);
  const { quotes } = useQuotes(symbols, 60_000);

  // 加上計算 → 平均漲跌 + top stocks
  const enriched: SectorWithStats[] = useMemo(() => {
    return filtered.map((sector) => {
      const valid = sector.symbols
        .map((s) => ({ symbol: s, q: quotes[s] }))
        .filter(
          (x): x is { symbol: string; q: Quote } =>
            Boolean(x.q) && Number.isFinite(x.q.changePercent),
        );
      const avg =
        valid.length > 0
          ? valid.reduce((s, x) => s + x.q.changePercent, 0) / valid.length
          : 0;
      return {
        sector,
        avgChange: avg,
        validCount: valid.length,
        topStocks: [...valid]
          .sort((a, b) => Math.abs(b.q.changePercent) - Math.abs(a.q.changePercent))
          .slice(0, 3),
      };
    });
  }, [filtered, quotes]);

  // 統計
  const stats = useMemo(() => {
    const withData = enriched.filter((e) => e.validCount > 0);
    const hot = withData.filter((e) => e.avgChange > 0.5).length;
    const cold = withData.filter((e) => e.avgChange < -0.5).length;
    const neutral = withData.length - hot - cold;
    const overall =
      withData.length > 0
        ? withData.reduce((s, e) => s + e.avgChange, 0) / withData.length
        : 0;
    return { hot, cold, neutral, overall, total: withData.length };
  }, [enriched]);

  // Top 3 hot & cold
  const sortedByHeat = useMemo(
    () =>
      [...enriched]
        .filter((e) => e.validCount > 0)
        .sort((a, b) => b.avgChange - a.avgChange),
    [enriched],
  );
  const top3Hot = sortedByHeat.slice(0, 3);
  const top3Cold = sortedByHeat.slice(-3).reverse();

  // 其餘按熱度排
  const rest = sortedByHeat.slice(3, sortedByHeat.length - 3);

  return (
    <div className="space-y-5">
      {/* ─── HERO：今日題材脈動 ─────────────────── */}
      <header className="relative overflow-hidden rounded-2xl border border-zinc-900 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-6 text-white shadow-xl">
        {/* 微背景花紋 */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, rgba(255,165,0,0.3), transparent 50%), radial-gradient(circle at 80% 70%, rgba(120,80,200,0.3), transparent 50%)",
          }}
        />

        <div className="relative">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-zinc-400">
                <Activity size={11} />
                <span>{market === "TW" ? "台股題材脈動" : "美股題材脈動"}</span>
              </div>
              <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                今日 <span className="text-amber-400">{stats.hot}</span> 個題材轉強，
                <span className="text-emerald-400">{stats.cold}</span> 個降溫
              </h1>
              <p className="mt-1 text-sm text-zinc-300">
                整體平均{" "}
                <span
                  className={`font-bold tabular-nums ${
                    stats.overall > 0 ? "text-red-400" : "text-green-400"
                  }`}
                >
                  {formatPercent(stats.overall)}
                </span>
                ，活躍題材 {stats.total} 個
              </p>
            </div>

            {/* TW / US 切換（融入暗色 hero）*/}
            <div className="flex rounded-full border border-zinc-700 bg-zinc-900/80 p-0.5 backdrop-blur">
              {(["TW", "US"] as Market[]).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMarket(m);
                    setCategory("all");
                  }}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                    market === m
                      ? "bg-white text-zinc-900"
                      : "text-zinc-400 hover:text-zinc-100"
                  }`}
                >
                  {m === "TW" ? "🇹🇼 台股" : "🇺🇸 美股"}
                </button>
              ))}
            </div>
          </div>

          {/* 統計三色條 */}
          {stats.total > 0 && (
            <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="bg-amber-500"
                style={{ width: `${(stats.hot / stats.total) * 100}%` }}
                title={`${stats.hot} 個轉強`}
              />
              <div
                className="bg-zinc-600"
                style={{ width: `${(stats.neutral / stats.total) * 100}%` }}
                title={`${stats.neutral} 個盤整`}
              />
              <div
                className="bg-emerald-500"
                style={{ width: `${(stats.cold / stats.total) * 100}%` }}
                title={`${stats.cold} 個降溫`}
              />
            </div>
          )}
        </div>
      </header>

      {/* ─── 大分類 chips ───────────────────────── */}
      <div className="flex flex-wrap gap-1.5">
        <CategoryChip
          label="全部"
          active={category === "all"}
          onClick={() => setCategory("all")}
        />
        {availableCategories.map((c) => (
          <CategoryChip
            key={c}
            label={CATEGORY_LABELS[c]}
            active={category === c}
            onClick={() => setCategory(c)}
          />
        ))}
      </div>

      {/* ─── 🔥 今日燒燙 Top 3（精選 hero cards）─── */}
      {top3Hot.length > 0 && top3Hot[0].avgChange > 0 && (
        <FeatureSection
          title="🔥 今日燒燙"
          subtitle="平均漲幅最大的 3 個題材"
          tone="hot"
          items={top3Hot}
        />
      )}

      {/* ─── ❄️ 今日冷卻 Top 3 ──────────────────── */}
      {top3Cold.length > 0 && top3Cold[0].avgChange < 0 && (
        <FeatureSection
          title="❄️ 今日冷卻"
          subtitle="平均跌幅最大的 3 個題材"
          tone="cold"
          items={top3Cold}
        />
      )}

      {/* ─── 其他題材：完整池 ──────────────────── */}
      {rest.length > 0 && (
        <section>
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-700">
              全部題材
            </h2>
            <span className="text-xs text-zinc-500">{rest.length} 個</span>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((item) => (
              <CompactTopicCard key={item.sector.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {enriched.length === 0 && (
        <p className="py-12 text-center text-sm text-zinc-500">
          沒有符合條件的題材。
        </p>
      )}
    </div>
  );
}

// ───────────── Feature section（hero cards）─────────────
function FeatureSection({
  title,
  subtitle,
  tone,
  items,
}: {
  title: string;
  subtitle: string;
  tone: "hot" | "cold";
  items: SectorWithStats[];
}) {
  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-base font-bold text-zinc-800">{title}</h2>
        <span className="text-xs text-zinc-500">{subtitle}</span>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {items.map((item) => (
          <FeatureTopicCard key={item.sector.id} item={item} tone={tone} />
        ))}
      </div>
    </section>
  );
}

// ───────────── Hero feature card（大卡）─────────────
function FeatureTopicCard({
  item,
  tone,
}: {
  item: SectorWithStats;
  tone: "hot" | "cold";
}) {
  const { sector, avgChange, topStocks } = item;
  const shortLabel = sector.label.includes("｜")
    ? sector.label.split("｜")[1]
    : sector.label;
  const categoryLabel = CATEGORY_LABELS[sector.category];

  const heatLevel = Math.min(3, Math.max(1, Math.floor(Math.abs(avgChange))));

  const bgStyles =
    tone === "hot"
      ? "border-amber-300 bg-gradient-to-br from-red-50 via-orange-50 to-amber-50"
      : "border-emerald-300 bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50";
  const ringStyles =
    tone === "hot"
      ? "from-red-400/30 via-amber-400/20 to-transparent"
      : "from-emerald-400/30 via-teal-400/20 to-transparent";
  const HeatIcon = tone === "hot" ? Flame : Snowflake;
  const heatColor = tone === "hot" ? "text-amber-600" : "text-emerald-600";

  return (
    <Link
      href={`/topics/${sector.id}`}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border-2 ${bgStyles} p-4 shadow-sm transition hover:shadow-lg`}
    >
      {/* 角落 ring 裝飾 */}
      <div
        aria-hidden
        className={`pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br ${ringStyles}`}
      />

      <div className="relative">
        {/* 上排：分類 tag + 熱度 emoji */}
        <div className="mb-2 flex items-center justify-between">
          <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-medium text-zinc-700 backdrop-blur">
            {categoryLabel}
          </span>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: heatLevel }).map((_, i) => (
              <HeatIcon key={i} size={12} className={heatColor} />
            ))}
          </div>
        </div>

        {/* 標題 */}
        <h3 className="text-base font-bold leading-snug text-zinc-900 group-hover:text-zinc-700">
          {shortLabel}
        </h3>

        {/* 大號漲跌 */}
        <div
          className={`mt-1 text-3xl font-black tabular-nums ${
            avgChange >= 0 ? "text-red-600" : "text-emerald-600"
          }`}
        >
          {formatPercent(avgChange)}
        </div>
        <p className="text-[10px] text-zinc-500">
          {sector.symbols.length} 檔個股平均
        </p>

        {/* Top 3 個股漲跌 mini-bar */}
        {topStocks.length > 0 && (
          <div className="mt-3 space-y-1 rounded-md bg-white/70 p-2 backdrop-blur">
            {topStocks.map(({ symbol, q }) => {
              const code = symbol.replace(/\.(TW|TWO)$/i, "");
              const name = displayName(symbol, q.name);
              return (
                <div
                  key={symbol}
                  className="flex items-center justify-between text-[11px]"
                >
                  <span className="truncate text-zinc-700">
                    {name}
                    <span className="ml-1 text-[10px] text-zinc-400">
                      {code}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 font-bold tabular-nums ${
                      q.changePercent >= 0 ? "text-red-600" : "text-emerald-600"
                    }`}
                  >
                    {formatPercent(q.changePercent)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* 描述 */}
        {sector.description && (
          <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-zinc-600">
            {sector.description}
          </p>
        )}

        {/* CTA */}
        <div className="mt-3 flex items-center justify-end text-xs font-semibold text-zinc-700 group-hover:translate-x-0.5 group-hover:text-zinc-900">
          深入解析 <ArrowRight size={12} className="ml-1" />
        </div>
      </div>
    </Link>
  );
}

// ───────────── Compact card（小卡）─────────────
function CompactTopicCard({ item }: { item: SectorWithStats }) {
  const { sector, avgChange, topStocks } = item;
  const shortLabel = sector.label.includes("｜")
    ? sector.label.split("｜")[1]
    : sector.label;
  const categoryLabel = CATEGORY_LABELS[sector.category];

  const isPositive = avgChange > 0;
  const isNeutral = Math.abs(avgChange) < 0.3;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  const accentColor = isNeutral
    ? "text-zinc-500"
    : isPositive
      ? "text-red-600"
      : "text-emerald-600";

  return (
    <Link
      href={`/topics/${sector.id}`}
      className="group flex flex-col rounded-xl border border-zinc-200 bg-white p-3 transition hover:border-zinc-400 hover:shadow-sm"
    >
      <div className="mb-1 flex items-baseline justify-between">
        <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600">
          {categoryLabel}
        </span>
        <div className={`flex items-center gap-0.5 text-sm font-bold tabular-nums ${accentColor}`}>
          {!isNeutral && <TrendIcon size={11} />}
          {formatPercent(avgChange)}
        </div>
      </div>
      <h3 className="text-sm font-bold text-zinc-900 group-hover:text-zinc-700">
        {shortLabel}
      </h3>
      <p className="mt-0.5 text-[10px] text-zinc-500">
        {sector.symbols.length} 檔
      </p>

      {/* mini top 3 — 每檔一個小 chip */}
      {topStocks.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {topStocks.map(({ symbol, q }) => {
            const name = displayName(symbol, q.name);
            return (
              <span
                key={symbol}
                className={`rounded px-1.5 py-0.5 text-[10px] tabular-nums ${
                  q.changePercent >= 0
                    ? "bg-red-50 text-red-700"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {name.slice(0, 6)} {formatPercent(q.changePercent)}
              </span>
            );
          })}
        </div>
      )}
    </Link>
  );
}

// ───────────── Category chip ─────────────
function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${
        active
          ? "border-zinc-900 bg-zinc-900 text-white"
          : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400"
      }`}
    >
      {label}
    </button>
  );
}
