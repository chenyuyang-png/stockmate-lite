"use client";

import { useEffect, useState } from "react";
import { Building2, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import type {
  BrokerDetailResponse,
  BrokerSummary,
} from "@/app/api/stock-broker-detail/route";

type Props = { symbol: string };

const DAYS_OPTIONS = [5, 10, 20] as const;

export function BrokerDetail({ symbol }: Props) {
  const isTw = /\.(TW|TWO)$/i.test(symbol);
  const [data, setData] = useState<BrokerDetailResponse | null>(null);
  const [days, setDays] = useState<5 | 10 | 20>(5);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isTw) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(
      `/api/stock-broker-detail?symbol=${encodeURIComponent(symbol)}&days=${days}`,
    )
      .then((r) => r.json())
      .then((d) => setData(d as BrokerDetailResponse))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [symbol, days, isTw]);

  if (!isTw) return null;

  if (loading)
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 text-center text-sm text-gray-500">
        載入主力券商進出…
      </div>
    );

  if (!data) return null;

  const hasData = data.topBuyers.length > 0 || data.topSellers.length > 0;
  const maxNet = Math.max(
    ...data.topBuyers.map((b) => Math.abs(b.net)),
    ...data.topSellers.map((b) => Math.abs(b.net)),
    1,
  );

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Building2 size={14} className="text-purple-600" />
          <h3 className="text-sm font-semibold text-gray-800">主力券商進出</h3>
          {hasData && (
            <span className="text-xs text-gray-500">
              {data.asOfStart.replaceAll("-", "/")} ~ {data.asOfEnd.replaceAll("-", "/")} ·
              共 {data.totalDays} 個交易日
            </span>
          )}
        </div>
        <div className="flex rounded-md border border-gray-200 bg-gray-50 p-0.5 text-xs">
          {DAYS_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded px-2.5 py-1 ${
                days === d
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              近 {d} 日
            </button>
          ))}
        </div>
      </header>

      {!hasData ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
          <div className="flex items-start gap-2">
            <AlertCircle size={14} className="mt-0.5 shrink-0 text-amber-600" />
            <div className="flex-1 text-xs text-amber-900">
              <div className="font-semibold">{data.message ?? "尚無資料"}</div>
              {data.hint && (
                <div className="mt-1 text-[11px] text-amber-700">💡 {data.hint}</div>
              )}
              <div className="mt-2 text-[10px] text-amber-700">
                FinMind 券商分點 (TaiwanStockTradingDailyReport) 為進階 dataset，
                需付費方案才能拉日內 broker 級資料。可先用「籌碼分析」與「三大法人」分析。
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-red-700">
              <TrendingUp size={11} /> 主力買超 Top {data.topBuyers.length}
            </div>
            <BrokerList list={data.topBuyers} maxNet={maxNet} tone="bull" />
          </div>
          <div>
            <div className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-green-700">
              <TrendingDown size={11} /> 主力賣超 Top {data.topSellers.length}
            </div>
            <BrokerList list={data.topSellers} maxNet={maxNet} tone="bear" />
          </div>
        </div>
      )}

      <p className="mt-3 text-[10px] text-gray-400">
        資料源：FinMind TaiwanStockTradingDailyReport · 數字為近 {days} 日累計買賣張數（含分點）
      </p>
    </section>
  );
}

function BrokerList({
  list,
  maxNet,
  tone,
}: {
  list: BrokerSummary[];
  maxNet: number;
  tone: "bull" | "bear";
}) {
  if (list.length === 0)
    return <p className="text-xs text-gray-500">無資料</p>;

  const barColor = tone === "bull" ? "bg-red-400" : "bg-green-400";
  const textColor = tone === "bull" ? "text-red-700" : "text-green-700";

  return (
    <ul className="space-y-1 text-xs">
      {list.map((b, i) => {
        const pct = (Math.abs(b.net) / maxNet) * 100;
        return (
          <li key={i} className="flex items-center gap-2">
            <span className="w-6 shrink-0 text-right tabular-nums text-gray-400">
              #{i + 1}
            </span>
            <span
              className="flex-1 truncate font-medium text-gray-700"
              title={b.name}
            >
              {b.name}
            </span>
            <span className="relative h-3.5 w-20 shrink-0 overflow-hidden rounded bg-gray-100">
              <span
                className={`absolute inset-y-0 left-0 ${barColor}`}
                style={{ width: `${pct}%` }}
              />
            </span>
            <span
              className={`w-20 shrink-0 text-right tabular-nums font-semibold ${textColor}`}
            >
              {b.net > 0 ? "+" : ""}
              {b.net.toLocaleString()} 張
            </span>
          </li>
        );
      })}
    </ul>
  );
}
