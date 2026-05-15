"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Megaphone,
  RefreshCw,
  Copy,
  Check,
  Sparkles,
  Loader2,
} from "lucide-react";
import type {
  DailyWrapResponse,
  IndexLine,
} from "@/app/api/daily-wrap/route";
import { useHoldings, useWatchlist } from "@/lib/storage";
import { formatPercent } from "@/lib/format";

export function DailyWrapUp() {
  const { holdings } = useHoldings();
  const { items: watchlist } = useWatchlist();
  const [data, setData] = useState<DailyWrapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // 把使用者的美股 symbols 帶過去（讓速報含使用者持股的 ADR % 變動）
  const userUsSymbols = useMemo(() => {
    const set = new Set<string>();
    for (const h of holdings) if (!/\.(TW|TWO)$/i.test(h.symbol)) set.add(h.symbol);
    for (const w of watchlist) if (!/\.(TW|TWO)$/i.test(w.symbol)) set.add(w.symbol);
    return Array.from(set).slice(0, 6);
  }, [holdings, watchlist]);

  async function load() {
    setLoading(true);
    try {
      const url = `/api/daily-wrap?symbols=${encodeURIComponent(userUsSymbols.join(","))}`;
      const res = await fetch(url);
      const d = (await res.json()) as DailyWrapResponse;
      setData(d);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // 只在掛載時拉 1 次；之後完全靠 cache，使用者要更新點右上「重新整理」按鈕
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userUsSymbols.join(",")]);

  function copyAll() {
    if (!data) return;
    const lines: string[] = [];
    lines.push("📊 美股收盤速報");
    if (data.indicesSummary) lines.push(data.indicesSummary);
    if (data.adrSummary) lines.push(data.adrSummary);
    if (data.futuresSummary) lines.push(data.futuresSummary);
    lines.push("");
    lines.push("本日重點財經事項：");
    for (const e of data.events) lines.push(`${e.rank}. ${e.text}`);
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading && !data)
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/30 p-4 text-center text-sm text-gray-500">
        <Loader2 className="mr-1 inline animate-spin" size={14} /> 整理今日收盤速報中…
      </div>
    );

  if (!data) return null;

  return (
    <section className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50/60 to-orange-50/30 p-4">
      <header className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-center gap-2">
          <Megaphone size={16} className="text-orange-700" />
          <h2 className="text-sm font-bold text-gray-900">📊 美股收盤速報</h2>
          {data.source === "ai" && (
            <span className="flex items-center gap-0.5 rounded bg-orange-200 px-1.5 py-0.5 text-[10px] font-semibold text-orange-900">
              <Sparkles size={9} /> AI 統整
            </span>
          )}
          {/* 美股交易期 ID（收盤日期）— 例如 "5/14 收盤" */}
          {data.session && (
            <span className="rounded bg-orange-50 px-1.5 py-0.5 text-[10px] font-semibold text-orange-800 ring-1 ring-orange-200">
              {data.session.slice(5).replace("-", "/")} 收盤
            </span>
          )}
          <span className="text-[10px] text-gray-500" title="cache 寫入時間">
            更新於{" "}
            {new Date(data.generatedAt).toLocaleString("zh-TW", {
              hour: "2-digit",
              minute: "2-digit",
              month: "numeric",
              day: "numeric",
            })}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={copyAll}
            className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-50"
            title="複製整份速報"
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? "已複製" : "複製"}
          </button>
          <button
            onClick={load}
            disabled={loading}
            className="rounded p-1 text-gray-500 hover:bg-white hover:text-gray-700 disabled:opacity-50"
            aria-label="重新整理"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      {/* 三大概要摘要 */}
      <div className="mb-3 space-y-1 rounded-md border border-amber-200 bg-white/80 p-3 text-sm leading-relaxed text-gray-800">
        {data.indicesSummary && (
          <div>
            <span className="text-amber-700">📈</span> {data.indicesSummary}
          </div>
        )}
        {data.adrSummary && (
          <div>
            <span className="text-amber-700">🌐</span> {data.adrSummary}
          </div>
        )}
        {data.futuresSummary && (
          <div>
            <span className="text-amber-700">🌙</span> {data.futuresSummary}
          </div>
        )}
      </div>

      {/* 指數 + ADR 快取卡 */}
      {(data.indices.length > 0 || data.adr.length > 0) && (
        <div className="mb-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-5">
          {[...data.indices, ...data.adr.slice(0, 5)].slice(0, 10).map((i) => (
            <IndexChip key={i.symbol} item={i} />
          ))}
        </div>
      )}

      {/* 10 大事項 — Pro 訂閱才看完整 AI 整理 */}
      
        <div className="rounded-md border border-gray-200 bg-white p-3">
          <h3 className="mb-2 text-xs font-bold text-gray-700">
            📋 本日重點財經事項{" "}
            <span className="font-normal text-gray-400">
              ({data.events.length})
            </span>
          </h3>
          {data.events.length > 0 ? (
            <ol className="space-y-1.5 text-sm">
              {data.events.map((e) => (
                <li
                  key={e.rank}
                  className="flex items-start gap-2 leading-snug"
                >
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[10px] font-bold text-orange-800">
                    {e.rank}
                  </span>
                  <span className="flex-1 text-gray-800">{e.text}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="py-2 text-center text-xs text-gray-500">
              目前沒有可用的新聞資料
            </p>
          )}
        </div>
      

      {data.error && (
        <p className="mt-2 text-[10px] text-amber-700">⚠️ {data.error}</p>
      )}

      <p className="mt-3 text-[10px] text-gray-500">
        12 小時 server cache（每日台股 / 美股收盤後各更新一次）。點右上 ↻ 重新整理可強制更新。
        資料源：Yahoo Finance + 多家 RSS + Claude Opus 4.7。
      </p>
    </section>
  );
}

function IndexChip({ item }: { item: IndexLine }) {
  const color =
    item.changePercent > 0
      ? "text-red-700"
      : item.changePercent < 0
        ? "text-green-700"
        : "text-gray-600";
  const bg =
    Math.abs(item.changePercent) >= 2
      ? item.changePercent > 0
        ? "border-red-200 bg-red-50"
        : "border-green-200 bg-green-50"
      : "border-gray-200 bg-white";
  return (
    <div className={`rounded border px-2 py-1 ${bg}`} title={item.label}>
      <div className="truncate text-[10px] text-gray-600">{item.label}</div>
      <div className="text-sm font-bold tabular-nums text-gray-900">
        {item.price.toFixed(item.price < 100 ? 2 : 0)}
      </div>
      <div className={`text-[10px] tabular-nums font-semibold ${color}`}>
        {formatPercent(item.changePercent)}
      </div>
    </div>
  );
}
