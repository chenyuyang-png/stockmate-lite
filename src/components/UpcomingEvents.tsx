"use client";

import { useEffect, useState } from "react";
import { CalendarClock } from "lucide-react";
import type { StockHistory } from "@/app/api/stock-history/route";

type Props = {
  symbol: string;
};

export function UpcomingEvents({ symbol }: Props) {
  const [data, setData] = useState<StockHistory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stock-history?symbol=${encodeURIComponent(symbol)}&years=1`)
      .then((r) => r.json())
      .then((d) => setData(d as StockHistory))
      .finally(() => setLoading(false));
  }, [symbol]);

  if (loading || !data) return null;
  const up = data.upcoming;
  if (!up.nextEarnings && !up.exDividendDate && !up.dividendDate) return null;

  return (
    <section className="rounded-lg border border-violet-200 bg-violet-50 p-4">
      <header className="mb-2 flex items-center gap-2">
        <CalendarClock size={14} className="text-violet-600" />
        <h3 className="text-sm font-semibold text-gray-700">未來事件</h3>
      </header>

      <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
        {up.nextEarnings && (
          <Card
            label="下次法說 / 財報"
            value={up.nextEarnings}
            extra={
              up.earningsEstimate?.average
                ? `預估 EPS ${up.earningsEstimate.average.toFixed(2)}（${up.earningsEstimate.low?.toFixed(2)} - ${up.earningsEstimate.high?.toFixed(2)}）`
                : undefined
            }
          />
        )}
        {up.exDividendDate && (
          <Card
            label="除息日"
            value={up.exDividendDate}
            extra={
              up.dividendDate && up.dividendDate !== up.exDividendDate
                ? `發放日 ${up.dividendDate}`
                : undefined
            }
          />
        )}
        {up.revenueEstimate?.average && (
          <Card
            label="預估營收"
            value={`${(up.revenueEstimate.average / 1e8).toFixed(0)} 億`}
            extra={
              up.revenueEstimate.low && up.revenueEstimate.high
                ? `區間 ${(up.revenueEstimate.low / 1e8).toFixed(0)} - ${(up.revenueEstimate.high / 1e8).toFixed(0)} 億`
                : undefined
            }
          />
        )}
      </div>
    </section>
  );
}

function Card({
  label,
  value,
  extra,
}: {
  label: string;
  value: string;
  extra?: string;
}) {
  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
      <div className="text-[10px] uppercase text-gray-500">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-gray-800">{value}</div>
      {extra && <div className="text-[10px] text-gray-500">{extra}</div>}
    </div>
  );
}
