"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, AlertCircle, Activity } from "lucide-react";
import type { TwFuturesResponse, TxFuturesRow } from "@/app/api/tw-futures/route";
import { useQuotes } from "@/lib/useQuotes";
import { formatPercent } from "@/lib/format";

// 台股 ADR / 代理指標：透過美股市場間接看「夜盤」
// 台股 13:30 收盤之後，美股仍持續交易：
//   - EWT (iShares MSCI 台灣 ETF) 在美股盤中跟著美股動 → 夜盤代理
//   - TSM / UMC / ASX 等 ADR → 個股級夜盤代理
const ADR_SYMBOLS = [
  { symbol: "EWT", label: "iShares 台灣 ETF", short: "EWT", emoji: "🇹🇼" },
  { symbol: "TSM", label: "台積電 ADR", short: "TSM", emoji: "🏭" },
  { symbol: "UMC", label: "聯電 ADR", short: "UMC", emoji: "🔌" },
  { symbol: "ASX", label: "日月光 ADR", short: "ASX", emoji: "📦" },
  { symbol: "^TWII", label: "加權指數", short: "TWII", emoji: "📊" },
];

export function TwFuturesNight() {
  const [data, setData] = useState<TwFuturesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { quotes } = useQuotes(
    ADR_SYMBOLS.map((s) => s.symbol),
    60_000,
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/tw-futures");
        const d = (await res.json()) as TwFuturesResponse;
        if (!cancelled) setData(d);
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const id = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const hasFutures = data && (data.tx.day || data.mtx.day);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <header className="mb-3 flex items-center gap-2">
        <Activity size={16} className="text-emerald-700" />
        <h2 className="text-sm font-semibold text-gray-800">台股期貨 / 夜盤</h2>
        <span className="text-xs text-gray-500">含 ADR 與 EWT 代理指標</span>
        {data && (
          <span className="ml-auto text-[10px] text-gray-400">
            {new Date(data.asOf).toLocaleTimeString("zh-TW")}
          </span>
        )}
      </header>

      {/* 期貨區（FinMind） */}
      {loading && !data ? (
        <p className="py-4 text-center text-sm text-gray-500">載入期貨資料…</p>
      ) : hasFutures ? (
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <FuturesCard
            label="大台指期 (TX)"
            day={data?.tx.day}
            after={data?.tx.after}
            prevDay={data?.tx.prevDay}
          />
          <FuturesCard
            label="小台指期 (MTX)"
            day={data?.mtx.day}
            after={data?.mtx.after}
            prevDay={data?.mtx.prevDay}
          />
        </div>
      ) : data?.message ? (
        <div className="mb-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-800">
          <div className="flex items-start gap-1.5">
            <AlertCircle size={11} className="mt-0.5 shrink-0 text-amber-600" />
            <div>
              <div className="font-semibold">{data.message}</div>
              {data.hint && <div className="mt-0.5 text-[10px]">{data.hint}</div>}
            </div>
          </div>
        </div>
      ) : null}

      {/* ADR / EWT 代理區 */}
      <div className="mt-3">
        <div className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold text-gray-600">
          🌃 美股時段「夜盤代理」
          <span className="text-[10px] font-normal text-gray-400">
            (台股 13:30 收盤後，這些在美股仍交易，間接反映夜盤情緒)
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-5">
          {ADR_SYMBOLS.map((s) => (
            <AdrCell key={s.symbol} info={s} quote={quotes[s.symbol]} />
          ))}
        </div>
      </div>

      <p className="mt-3 text-[10px] text-gray-400">
        台指期日盤 8:45 - 13:45 ｜ 夜盤 15:00 - 次日 05:00（次月合約）。
        美股時段中 EWT / 台股 ADR 是台股 13:30 收盤後到隔天 9:00 開盤前的最即時動向。
      </p>
    </section>
  );
}

function FuturesCard({
  label,
  day,
  after,
  prevDay,
}: {
  label: string;
  day?: TxFuturesRow;
  after?: TxFuturesRow;
  prevDay?: TxFuturesRow;
}) {
  // 日盤漲跌 = day.close - prevDay.close
  // 夜盤漲跌 = after.close - day.close
  const dayChange =
    day && prevDay ? day.close - prevDay.close : undefined;
  const dayChangePct =
    typeof dayChange === "number" && prevDay
      ? (dayChange / prevDay.close) * 100
      : undefined;

  const afterChange =
    after && day ? after.close - day.close : undefined;
  const afterChangePct =
    typeof afterChange === "number" && day
      ? (afterChange / day.close) * 100
      : undefined;

  return (
    <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-gray-50 to-emerald-50/30 p-3">
      <div className="mb-2 flex items-baseline justify-between">
        <div className="text-xs font-semibold text-gray-800">{label}</div>
        {day && (
          <div className="text-[10px] text-gray-500">
            {day.contractDate} 月合約
          </div>
        )}
      </div>

      {/* 日盤 */}
      <div className="mb-2 rounded-md border border-amber-200 bg-amber-50 p-2">
        <div className="mb-0.5 flex items-center gap-1 text-[10px] font-semibold text-amber-800">
          <Sun size={10} /> 日盤 {day ? `(${day.date})` : ""}
        </div>
        {day ? (
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold tabular-nums text-gray-900">
              {day.close.toLocaleString()}
            </span>
            {typeof dayChangePct === "number" && (
              <span
                className={`text-xs font-semibold tabular-nums ${
                  dayChange! >= 0 ? "text-red-600" : "text-green-600"
                }`}
              >
                {dayChange! >= 0 ? "+" : ""}
                {dayChange!.toFixed(0)} ({formatPercent(dayChangePct)})
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-gray-400">無資料</span>
        )}
      </div>

      {/* 夜盤 */}
      <div className="rounded-md border border-indigo-200 bg-indigo-50 p-2">
        <div className="mb-0.5 flex items-center gap-1 text-[10px] font-semibold text-indigo-800">
          <Moon size={10} /> 夜盤 {after ? `(${after.date})` : ""}
        </div>
        {after ? (
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold tabular-nums text-gray-900">
              {after.close.toLocaleString()}
            </span>
            {typeof afterChangePct === "number" && (
              <span
                className={`text-xs font-semibold tabular-nums ${
                  afterChange! >= 0 ? "text-red-600" : "text-green-600"
                }`}
              >
                {afterChange! >= 0 ? "+" : ""}
                {afterChange!.toFixed(0)} ({formatPercent(afterChangePct)})
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-gray-400">尚未開盤 / 無資料</span>
        )}
      </div>
    </div>
  );
}

function AdrCell({
  info,
  quote,
}: {
  info: { symbol: string; label: string; short: string; emoji: string };
  quote?: { price?: number; changePercent?: number };
}) {
  const cp = quote?.changePercent;
  const colorClass =
    cp === undefined
      ? "text-gray-400"
      : cp > 0
        ? "text-red-600"
        : cp < 0
          ? "text-green-600"
          : "text-gray-600";

  const bgClass =
    cp === undefined
      ? "bg-gray-50 border-gray-200"
      : Math.abs(cp) >= 2
        ? cp > 0
          ? "bg-red-50 border-red-200"
          : "bg-green-50 border-green-200"
        : "bg-gray-50 border-gray-200";

  return (
    <div
      className={`rounded border px-2 py-1.5 ${bgClass}`}
      title={info.label}
    >
      <div className="flex items-baseline justify-between gap-1">
        <span className="text-[10px] font-medium text-gray-700">
          {info.emoji} {info.short}
        </span>
        <span className={`shrink-0 text-[10px] tabular-nums font-bold ${colorClass}`}>
          {cp === undefined ? "—" : formatPercent(cp)}
        </span>
      </div>
      <div className="text-sm font-bold tabular-nums text-gray-900">
        {typeof quote?.price === "number"
          ? quote.price.toFixed(quote.price < 100 ? 2 : 0)
          : "—"}
      </div>
    </div>
  );
}
