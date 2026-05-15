"use client";

import Link from "next/link";
import { useState } from "react";
import { X, ExternalLink, LineChart, Loader2, Check } from "lucide-react";
import type { Quote } from "@/lib/types";
import { detectRegion, displayName } from "@/lib/symbols";
import {
  changeColor,
  formatChange,
  formatLargeNumber,
  formatPercent,
  formatPrice,
  formatVolume,
} from "@/lib/format";

type Props = {
  symbol: string;
  quote?: Quote;
  onRemove?: () => void;
  loading?: boolean;
};

export function QuoteCard({ symbol, quote, onRemove, loading }: Props) {
  const region = detectRegion(symbol);
  const color = changeColor(quote?.change);
  const cleanCode = symbol.replace(/\.(TW|TWO)$/i, "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  // 跳轉連結
  const tvLink = `https://tradingview.com/symbols/${region === "TW" ? `TPE-${cleanCode}` : cleanCode}/`;
  const finvizLink = region === "US" ? `https://finviz.com/quote.ashx?t=${symbol}` : null;

  // 區域標籤
  const regionBadge =
    region === "TW" ? (
      <span className="shrink-0 rounded bg-blue-50 px-1 py-0.5 text-[9px] font-semibold text-blue-700">
        🇹🇼 TW
      </span>
    ) : (
      <span className="shrink-0 rounded bg-purple-50 px-1 py-0.5 text-[9px] font-semibold text-purple-700">
        🇺🇸 US
      </span>
    );

  return (
    <div className="group relative rounded-lg border border-gray-200 bg-white p-3 transition hover:border-gray-400 hover:shadow-sm">
      {/* 永遠顯示的刪除按鈕（二次確認） */}
      {onRemove && (
        <div className="absolute right-2 top-2 z-10">
          {confirmDelete ? (
            <div className="flex items-center gap-1 rounded bg-red-50 px-1 py-0.5 ring-1 ring-red-300">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onRemove();
                }}
                className="flex items-center gap-0.5 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white hover:bg-red-700"
                aria-label="確認移除"
              >
                <Check size={9} /> 確定
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setConfirmDelete(false);
                }}
                className="rounded px-1 text-[10px] text-gray-500 hover:text-gray-700"
              >
                取消
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                setConfirmDelete(true);
              }}
              className="rounded-full bg-gray-100 p-1 text-gray-400 transition hover:bg-red-100 hover:text-red-600"
              aria-label="移除自選"
              title="從自選股移除"
            >
              <X size={12} />
            </button>
          )}
        </div>
      )}

      <div className="flex items-baseline gap-2 pr-7">
        {regionBadge}
        <span className="truncate text-sm font-semibold text-gray-900">
          {displayName(symbol, quote?.name)}
        </span>
        <span className="shrink-0 rounded bg-gray-100 px-1 py-0.5 text-[10px] tabular-nums text-gray-600">
          {cleanCode}
        </span>
      </div>

      {/* 價格區 */}
      {loading && !quote ? (
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-400">
          <Loader2 size={14} className="animate-spin" />
          <span>載入即時報價…</span>
        </div>
      ) : !quote ? (
        <div className="mt-2 text-sm text-gray-400">— 找不到報價</div>
      ) : (
        <>
          <div className="mt-2 text-2xl font-bold tabular-nums text-gray-900">
            {formatPrice(quote.price)}
            <span className="ml-1 text-xs text-gray-500">
              {quote.currency ?? ""}
            </span>
          </div>

          <div className={`text-sm tabular-nums ${color}`}>
            {formatPercent(quote.changePercent)}
            <span className="ml-1.5 text-xs">({formatChange(quote.change)})</span>
          </div>

          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
            <div>
              <div className="text-[10px] text-gray-400">成交量</div>
              <div className="text-gray-600">{formatVolume(quote.volume)}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400">市值</div>
              <div className="text-gray-600">{formatLargeNumber(quote.marketCap)}</div>
            </div>
            {quote.pe && (
              <div>
                <div className="text-[10px] text-gray-400">本益比</div>
                <div className="text-gray-600">{quote.pe.toFixed(1)}</div>
              </div>
            )}
          </div>
        </>
      )}

      {/* 連結 chips */}
      <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
        <Link
          href={`/stock/${encodeURIComponent(symbol)}`}
          className="flex items-center gap-0.5 rounded bg-red-50 px-1.5 py-0.5 font-semibold text-red-700 hover:bg-red-100"
        >
          <LineChart size={9} /> 查看個股
        </Link>
        <a
          href={tvLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-0.5 rounded bg-gray-100 px-1.5 py-0.5 text-gray-600 hover:bg-gray-200"
        >
          TradingView <ExternalLink size={9} />
        </a>
        {finvizLink && (
          <a
            href={finvizLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-0.5 rounded bg-gray-100 px-1.5 py-0.5 text-gray-600 hover:bg-gray-200"
          >
            Finviz <ExternalLink size={9} />
          </a>
        )}
      </div>
    </div>
  );
}
