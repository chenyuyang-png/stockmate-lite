"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Megaphone,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Newspaper,
  ExternalLink,
  Building2,
  Loader2,
  Sparkles,
} from "lucide-react";
import type {
  TwDailyWrapResponse,
  TwIndexLine,
  TwSectorPerf,
} from "@/app/api/tw-daily-wrap/route";
import { formatPercent } from "@/lib/format";
import { TwUsCorrelation } from "./TwUsCorrelation";

export function TwDailyWrapUp() {
  const [data, setData] = useState<TwDailyWrapResponse | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/tw-daily-wrap");
      const d = (await res.json()) as TwDailyWrapResponse;
      setData(d);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // 12 小時 server cache，每次掛載拉一次即可
  }, []);

  if (loading && !data)
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 text-center text-sm text-gray-500">
        <Loader2 className="mr-1 inline animate-spin" size={14} /> 整理台股收盤速報中…
      </div>
    );

  if (!data) return null;

  const isUp = (data.indices.find((i) => i.symbol === "^TWII")?.changePercent ?? 0) >= 0;
  const bannerCls = isUp
    ? "border-red-300 bg-gradient-to-br from-red-50/60 to-orange-50/30"
    : "border-green-300 bg-gradient-to-br from-green-50/60 to-emerald-50/30";

  return (
    <section className={`rounded-xl border ${bannerCls} p-4`}>
      <header className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-center gap-2">
          <Megaphone size={16} className="text-red-700" />
          <h2 className="text-sm font-bold text-gray-900">📊 台股收盤速報</h2>
          {/* 台股交易期 ID — 例如「5/15 收盤」 */}
          {data.session && (
            <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-800 ring-1 ring-red-200">
              {data.session.slice(5).replace("-", "/")} 收盤
            </span>
          )}
          {data.institutional?.date && (
            <span className="text-[10px] text-gray-500">
              法人 {data.institutional.date}
            </span>
          )}
          {data.asOf && (
            <span className="text-[10px] text-gray-500" title="cache 寫入時間">
              更新於{" "}
              {new Date(data.asOf).toLocaleString("zh-TW", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="rounded p-1 text-gray-500 hover:bg-white hover:text-gray-700 disabled:opacity-50"
          title="重新整理"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </header>

      {/* 一句話摘要 */}
      <div className="mb-3 rounded-md border border-red-200 bg-white/80 p-3 text-sm font-medium leading-relaxed text-gray-900">
        {data.oneLineSummary}
      </div>

      {/* 指數列 */}
      {data.indices.length > 0 && (
        <div className="mb-3 grid grid-cols-2 gap-2">
          {data.indices.map((i) => (
            <IndexChip key={i.symbol} idx={i} />
          ))}
        </div>
      )}

      {/* 三大法人 + 融資融券 */}
      {(data.institutional || data.margin) && (
        <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {data.institutional && <InstCard inst={data.institutional} />}
          {data.margin && <MarginCard margin={data.margin} />}
        </div>
      )}

      {/* 強勢 / 弱勢族群 */}
      {(data.strongSectors.length > 0 || data.weakSectors.length > 0) && (
        <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-2">
          <SectorListCard
            title="🔥 領漲族群"
            sectors={data.strongSectors}
            tone="bull"
          />
          <SectorListCard
            title="❄️ 領跌族群"
            sectors={data.weakSectors}
            tone="bear"
          />
        </div>
      )}

      {/* AI 整理：台股今日 10 大重點事件 — Pro 訂閱才看完整、free 只看第 1 條 */}
      {data.events && data.events.length > 0 && (
        
          <div className="mb-3 rounded-md border border-amber-300 bg-amber-50/60 p-3">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gray-800">
              <Sparkles size={12} className="text-amber-700" />
              AI 整理：今日台股 10 大重點事件
              {data.source === "ai" ? (
                <span className="rounded bg-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">
                  AI 即時整理
                </span>
              ) : (
                <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-bold text-gray-700">
                  Rule
                </span>
              )}
            </div>
            <ol className="space-y-1 text-xs leading-relaxed text-gray-800">
              {data.events.map((e) => (
                <li key={e.rank} className="flex gap-2">
                  <span className="w-5 shrink-0 text-right font-bold tabular-nums text-amber-700">
                    {e.rank}.
                  </span>
                  <span className="flex-1">{e.text}</span>
                </li>
              ))}
            </ol>
          </div>
        
      )}

      {/* 台美對應個股 — 跨市場聯動參考 */}
      <div className="mb-3">
        <TwUsCorrelation />
      </div>

      {/* 台股重點新聞 */}
      {data.news.length > 0 && (
        <div className="rounded-md border border-gray-200 bg-white p-3">
          <div className="mb-2 flex items-center gap-1 text-xs font-semibold text-gray-700">
            <Newspaper size={11} className="text-blue-700" /> 台股重點新聞
          </div>
          <ul className="space-y-1.5">
            {data.news.slice(0, 8).map((n, i) => (
              <li key={i} className="text-xs">
                <a
                  href={n.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-1.5 text-gray-700 hover:text-blue-700"
                >
                  <ExternalLink
                    size={10}
                    className="mt-0.5 shrink-0 text-gray-400 group-hover:text-blue-500"
                  />
                  <span className="flex-1">
                    <span className="line-clamp-1 leading-snug">{n.title}</span>
                    <span className="text-[10px] text-gray-400">
                      {n.source}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-3 text-[10px] text-gray-500">
        ⏰ <strong>資料更新時程</strong>（依證交所公布時間）：
        14:00 收盤指數 + 強弱族群即出；
        <strong>17:00 三大法人完整資料</strong>到位（個股級別）；
        21:00 後融資融券餘額最終版。
        <span className="text-gray-400">
          {" "}建議下午 5 點後再看法人 / 9 點後再看融資融券，數字才完整。
        </span>
        <br />
        資料源：Yahoo Finance（行情）+ FinMind（三大法人 / 融資融券）+ 多家 RSS。
      </p>
    </section>
  );
}

function IndexChip({ idx }: { idx: TwIndexLine }) {
  const colorCls =
    idx.changePercent >= 0 ? "text-red-700" : "text-green-700";
  return (
    <div className="rounded-md border border-gray-200 bg-white p-2.5">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-semibold text-gray-700">{idx.label}</span>
        <span className={`text-xs tabular-nums font-bold ${colorCls}`}>
          {formatPercent(idx.changePercent)}
        </span>
      </div>
      <div className="mt-0.5 flex items-baseline gap-1">
        <span className="text-lg font-bold tabular-nums text-gray-900">
          {idx.price.toFixed(2)}
        </span>
        <span className={`text-xs tabular-nums ${colorCls}`}>
          {idx.change >= 0 ? "+" : ""}
          {idx.change.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

function InstCard({
  inst,
}: {
  inst: NonNullable<TwDailyWrapResponse["institutional"]>;
}) {
  return (
    <div className="rounded-md border border-gray-200 bg-white p-2.5">
      <div className="mb-1.5 flex items-center justify-between gap-1 text-xs font-semibold text-gray-700">
        <div className="flex items-center gap-1">
          <Building2 size={11} className="text-purple-700" /> 三大法人買賣超（億）
        </div>
        <span
          className="text-[9px] font-normal text-amber-700"
          title="證交所 16:00 公布總體、17:00 公布個股級別。下午 5 點後資料才完整。"
        >
          ⏰ 17:00 後為準
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <InstCell label="外資" value={inst.foreign} />
        <InstCell label="投信" value={inst.trust} />
        <InstCell label="自營" value={inst.dealer} />
      </div>
      <div className="mt-1.5 border-t border-gray-100 pt-1.5 text-[11px]">
        <span className="text-gray-500">合計：</span>
        <span
          className={`font-bold tabular-nums ${inst.total >= 0 ? "text-red-700" : "text-green-700"}`}
        >
          {inst.total >= 0 ? "+" : ""}
          {inst.total.toFixed(0)} 億
        </span>
      </div>
    </div>
  );
}

function InstCell({ label, value }: { label: string; value: number }) {
  const color = value > 0 ? "text-red-700" : value < 0 ? "text-green-700" : "text-gray-700";
  return (
    <div className="text-center">
      <div className="text-[10px] text-gray-500">{label}</div>
      <div className={`font-bold tabular-nums ${color}`}>
        {value >= 0 ? "+" : ""}
        {value.toFixed(0)}
      </div>
    </div>
  );
}

function MarginCard({
  margin,
}: {
  margin: NonNullable<TwDailyWrapResponse["margin"]>;
}) {
  return (
    <div className="rounded-md border border-gray-200 bg-white p-2.5">
      <div className="mb-1.5 flex items-center justify-between gap-1 text-xs font-semibold text-gray-700">
        <span>💰 融資融券變化</span>
        <span
          className="text-[9px] font-normal text-amber-700"
          title="證交所 MI_MARGN 報表約 18:00-21:00 公布當日最終資料。晚上 9 點後最準確。"
        >
          ⏰ 21:00 後為準
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="text-center">
          <div className="text-[10px] text-gray-500">融資餘額</div>
          <div
            className={`font-bold tabular-nums ${
              margin.marginChange >= 0 ? "text-red-700" : "text-green-700"
            }`}
          >
            {margin.marginChange >= 0 ? "+" : ""}
            {(margin.marginChange / 1000).toFixed(1)} 萬張
          </div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-gray-500">融券餘額</div>
          <div
            className={`font-bold tabular-nums ${
              margin.shortChange >= 0 ? "text-green-700" : "text-red-700"
            }`}
          >
            {margin.shortChange >= 0 ? "+" : ""}
            {margin.shortChange.toLocaleString()} 張
          </div>
        </div>
      </div>
      <p className="mt-1 text-[10px] text-gray-500">
        融資↑ = 散戶追價 / 融券↑ = 看空增加
      </p>
    </div>
  );
}

function SectorListCard({
  title,
  sectors,
  tone,
}: {
  title: string;
  sectors: TwSectorPerf[];
  tone: "bull" | "bear";
}) {
  if (sectors.length === 0) return null;
  const Icon = tone === "bull" ? TrendingUp : TrendingDown;
  const iconCls = tone === "bull" ? "text-red-700" : "text-green-700";
  return (
    <div className="rounded-md border border-gray-200 bg-white p-2.5">
      <div className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-gray-700">
        <Icon size={11} className={iconCls} /> {title}
      </div>
      <ul className="space-y-0.5">
        {sectors.slice(0, 5).map((s) => {
          const color =
            s.avgChange >= 0 ? "text-red-700" : "text-green-700";
          return (
            <li key={s.id} className="flex items-baseline justify-between text-xs">
              <Link
                href={`/topics/${s.id}`}
                className="flex-1 truncate text-gray-700 hover:text-blue-700"
              >
                {s.label}
              </Link>
              <span className={`shrink-0 tabular-nums font-semibold ${color}`}>
                {formatPercent(s.avgChange)}
              </span>
              <span className="ml-1 shrink-0 text-[9px] text-gray-400">
                {s.stockCount} 檔
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
