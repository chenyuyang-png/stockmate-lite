"use client";

import { useEffect, useState } from "react";
import {
  Newspaper,
  Megaphone,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import type {
  MarketExplainerResponse,
  SectorSnapshot,
  NewsHeadline,
  DriverTheme,
} from "@/app/api/market-explainer/route";
import { formatPercent } from "@/lib/format";

export function MarketExplainer() {
  const [data, setData] = useState<MarketExplainerResponse | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/market-explainer");
      const d = (await res.json()) as MarketExplainerResponse;
      setData(d);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // 只在掛載時拉 1 次；server 端 6 小時 cache 處理新鮮度
    // 使用者要強制刷新點右上 ↻ 按鈕
    load();
  }, []);

  if (loading && !data)
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 text-center text-sm text-gray-500">
        蒐集市場全景中…（首次載入約 5–10 秒）
      </div>
    );

  if (!data) return null;

  const dirColor =
    data.marketDirection === "down"
      ? "border-green-300 bg-gradient-to-br from-green-50 to-emerald-50"
      : data.marketDirection === "up"
        ? "border-red-300 bg-gradient-to-br from-red-50 to-orange-50"
        : "border-gray-300 bg-gradient-to-br from-gray-50 to-slate-50";

  return (
    <section className={`rounded-xl border ${dirColor} p-4`}>
      {/* Header + TLDR banner */}
      <header className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <Megaphone size={18} className="mt-0.5 shrink-0 text-blue-700" />
          <div>
            <h2 className="text-sm font-semibold text-gray-800">市場全景解讀</h2>
            <p className="mt-1 text-sm font-medium leading-relaxed text-gray-900">
              {data.tldr || "正在分析市場資料…"}
            </p>
            <p className="mt-0.5 text-[10px] text-gray-500">
              更新於 {new Date(data.asOf).toLocaleTimeString("zh-TW")} · 6 小時 cache（收盤後更新）
            </p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="rounded p-1 text-gray-400 hover:bg-white/60 hover:text-gray-700 disabled:opacity-50"
          title="重新整理"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </header>

      <div className="space-y-3">
        {/* 指數列已移到上方 IndexBar；此區專注「解讀」 */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <DriversCard drivers={data.drivers} todayEvents={data.todayEvents} />
          <SectorsCard sectors={data.sectors} />
        </div>

        <NewsCard news={data.topNews} />
      </div>

      {data.errors && data.errors.length > 0 && (
        <p className="mt-3 text-[10px] text-amber-700">
          ⚠️ 部分資料源失敗：{data.errors.join(" / ")}
        </p>
      )}
    </section>
  );
}

// ─── 指數列已移除（由首頁 IndexBar + GlobalFutures 取代以避免重複）

// ─── 驅動因素卡 ─────────────────────────────────────────────
function DriversCard({
  drivers,
  todayEvents,
}: {
  drivers: DriverTheme[];
  todayEvents: MarketExplainerResponse["todayEvents"];
}) {
  const hasDrivers = drivers.length > 0;
  const hasEvents = todayEvents.length > 0;

  return (
    <div className="rounded-md border border-gray-200 bg-white p-3">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gray-700">
        <AlertTriangle size={11} className="text-amber-600" /> 今日焦點 / 驅動因素
      </div>

      {!hasDrivers && !hasEvents && (
        <p className="text-xs text-gray-500">無明顯驅動因素，市場動能來自既有部位調整。</p>
      )}

      {hasEvents && (
        <div className="mb-2">
          <div className="mb-1 text-[10px] font-semibold uppercase text-amber-700">
            今日經濟事件
          </div>
          <ul className="space-y-1">
            {todayEvents.map((e, i) => (
              <li
                key={i}
                className={`flex items-start gap-1.5 rounded px-2 py-1 text-xs ${
                  e.importance === "critical"
                    ? "bg-red-50 text-red-900"
                    : e.importance === "high"
                      ? "bg-amber-50 text-amber-900"
                      : "bg-gray-50 text-gray-800"
                }`}
              >
                <span className="shrink-0 font-semibold">{e.time ?? "—"}</span>
                <span className="flex-1">{e.event}</span>
                {e.importance === "critical" && (
                  <span className="shrink-0 rounded bg-red-600 px-1 text-[9px] text-white">
                    關鍵
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasDrivers && (
        <div>
          <div className="mb-1 text-[10px] font-semibold uppercase text-blue-700">
            新聞熱詞 (今日 24 小時)
          </div>
          <ul className="space-y-1.5">
            {drivers.map((d) => (
              <li key={d.theme} className="text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-800">{d.theme}</span>
                  <span className="text-[10px] text-gray-500">
                    {d.weight} 則相關報導
                  </span>
                </div>
                {d.exampleHeadlines[0] && (
                  <div className="ml-2 mt-0.5 truncate text-[11px] text-gray-600">
                    · {d.exampleHeadlines[0]}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── 產業表現卡 ─────────────────────────────────────────────
function SectorsCard({ sectors }: { sectors: SectorSnapshot[] }) {
  if (sectors.length === 0) return null;
  const worst = sectors.slice(0, 4); // 跌最多
  const best = sectors.slice(-4).reverse(); // 漲最多

  return (
    <div className="rounded-md border border-gray-200 bg-white p-3">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gray-700">
        <TrendingDown size={11} className="text-green-600" /> 美股 11 大產業表現
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="mb-1 text-[10px] font-semibold uppercase text-green-700">
            領跌
          </div>
          <ul className="space-y-1">
            {worst.map((s) => (
              <SectorRow key={s.symbol} sector={s} />
            ))}
          </ul>
        </div>
        <div>
          <div className="mb-1 text-[10px] font-semibold uppercase text-red-700">
            領漲
          </div>
          <ul className="space-y-1">
            {best.map((s) => (
              <SectorRow key={s.symbol} sector={s} />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function SectorRow({ sector }: { sector: SectorSnapshot }) {
  const positive = sector.changePercent >= 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  const color = positive ? "text-red-600" : "text-green-600";
  return (
    <li className="flex items-center justify-between text-xs">
      <span className="flex items-center gap-1 text-gray-700">
        <Icon size={10} className={color} />
        <span>{sector.label}</span>
        <span className="text-[9px] text-gray-400">{sector.symbol}</span>
      </span>
      <span className={`tabular-nums font-semibold ${color}`}>
        {formatPercent(sector.changePercent)}
      </span>
    </li>
  );
}

// ─── 新聞頭條卡 ─────────────────────────────────────────────
function NewsCard({ news }: { news: NewsHeadline[] }) {
  if (news.length === 0) return null;
  return (
    <div className="rounded-md border border-gray-200 bg-white p-3">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gray-700">
        <Newspaper size={11} className="text-blue-600" /> 頭條新聞（已分類）
      </div>
      <ul className="space-y-1.5">
        {news.slice(0, 8).map((n, i) => (
          <li key={i} className="text-xs">
            <a
              href={n.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-1.5 text-gray-700 hover:text-blue-700"
            >
              <ExternalLink
                size={10}
                className="mt-1 shrink-0 text-gray-400 group-hover:text-blue-500"
              />
              <span className="flex-1">
                <span className="line-clamp-2 leading-snug">{n.title}</span>
                <span className="mt-0.5 flex flex-wrap items-center gap-1">
                  <span className="text-[10px] text-gray-400">{n.source}</span>
                  {n.themes.slice(0, 2).map((t) => (
                    <span
                      key={t}
                      className="rounded bg-blue-50 px-1 text-[9px] text-blue-700"
                    >
                      {t}
                    </span>
                  ))}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
