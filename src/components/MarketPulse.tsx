"use client";

import { useEffect, useState } from "react";
import { Building2, TrendingUp } from "lucide-react";
import type { InstitutionalTotal, MarginTotal } from "@/app/api/market-pulse/route";

export function MarketPulse() {
  const [institutional, setInstitutional] = useState<InstitutionalTotal | null>(null);
  const [margin, setMargin] = useState<MarginTotal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/market-pulse", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setInstitutional(d.institutional ?? null);
        setMargin(d.margin ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 text-center text-sm text-gray-500">
        載入大盤資金面…
      </div>
    );

  if (!institutional && !margin) return null;

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {institutional && <InstitutionalCard data={institutional} />}
      {margin && <MarginCard data={margin} />}
    </div>
  );
}

function InstitutionalCard({ data }: { data: InstitutionalTotal }) {
  const rows = [
    { label: "外資", val: data.foreign },
    { label: "投信", val: data.trust },
    { label: "自營商", val: data.dealerSelf },
    { label: "自營商避險", val: data.dealerHedge },
    { label: "外資自營商", val: data.foreignDealer },
  ];

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <header className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 size={15} className="text-violet-600" />
          <h3 className="text-sm font-semibold text-gray-800">三大法人</h3>
        </div>
        <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
          {data.date}
        </span>
      </header>

      <table className="w-full text-xs">
        <thead>
          <tr className="text-right text-[10px] uppercase text-gray-500">
            <th className="px-2 py-1.5 text-left"></th>
            <th className="px-2 py-1.5">買進</th>
            <th className="px-2 py-1.5">賣出</th>
            <th className="px-2 py-1.5">買賣超</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-t border-gray-100">
              <td className="px-2 py-1.5 text-gray-700">{r.label}</td>
              <td className="px-2 py-1.5 text-right tabular-nums text-gray-600">
                {fmt(r.val.buy)}
              </td>
              <td className="px-2 py-1.5 text-right tabular-nums text-gray-600">
                {fmt(r.val.sell)}
              </td>
              <td
                className={`px-2 py-1.5 text-right font-semibold tabular-nums ${netColor(
                  r.val.net,
                )}`}
              >
                {fmtSigned(r.val.net)}
              </td>
            </tr>
          ))}
          <tr className="border-t-2 border-gray-300">
            <td className="px-2 py-1.5 font-semibold text-gray-900">合計</td>
            <td className="px-2 py-1.5 text-right tabular-nums text-gray-700">
              {fmt(data.total.buy)}
            </td>
            <td className="px-2 py-1.5 text-right tabular-nums text-gray-700">
              {fmt(data.total.sell)}
            </td>
            <td
              className={`px-2 py-1.5 text-right font-bold tabular-nums ${netColor(
                data.total.net,
              )}`}
            >
              {fmtSigned(data.total.net)}
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}

function MarginCard({ data }: { data: MarginTotal }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <header className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={15} className="text-orange-600" />
          <h3 className="text-sm font-semibold text-gray-800">資券變化</h3>
        </div>
        <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
          {data.date}
        </span>
      </header>

      <div className="space-y-3">
        <MarginRow
          label="融資餘額"
          today={data.marginPurchase.today}
          yesterday={data.marginPurchase.yesterday}
          change={data.marginPurchase.change}
          unit="張"
        />
        <MarginRow
          label="融券餘額"
          today={data.shortSale.today}
          yesterday={data.shortSale.yesterday}
          change={data.shortSale.change}
          unit="張"
        />
      </div>

      <p className="mt-3 text-[10px] text-gray-400">
        融資增 = 散戶看多加碼；融券增 = 看空力道增加
      </p>
    </section>
  );
}

function MarginRow({
  label,
  today,
  yesterday,
  change,
  unit,
}: {
  label: string;
  today: number;
  yesterday: number;
  change: number;
  unit: string;
}) {
  return (
    <div className="rounded border border-gray-100 bg-gray-50 px-3 py-2">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-gray-700">{label}</span>
        <span
          className={`text-sm font-bold tabular-nums ${netColor(change)}`}
        >
          {fmtSigned(change)} {unit}
        </span>
      </div>
      <div className="mt-1 grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <span className="text-gray-500">今日 </span>
          <span className="tabular-nums text-gray-800">{today.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-gray-500">昨日 </span>
          <span className="tabular-nums text-gray-500">{yesterday.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

function fmt(v: number): string {
  if (Math.abs(v) >= 1e8) return `${(v / 1e8).toFixed(0)}億`;
  if (Math.abs(v) >= 1e4) return `${(v / 1e4).toFixed(1)}萬`;
  return v.toLocaleString();
}

function fmtSigned(v: number): string {
  const sign = v >= 0 ? "+" : "";
  return `${sign}${fmt(v)}`;
}

function netColor(v: number): string {
  if (v === 0) return "text-gray-500";
  // TW: 買超紅、賣超綠
  return v > 0 ? "text-red-600" : "text-green-600";
}
