"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CalendarClock,
  TrendingUp,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { useHoldings, useWatchlist } from "@/lib/storage";
import { displayName } from "@/lib/symbols";
import { formatPercent } from "@/lib/format";
import type {
  EarningsPulseResponse,
  EarningsPulseItem,
  EarningsSignal,
} from "@/app/api/earnings-pulse/route";

const SIGNAL_STYLE: Record<
  EarningsSignal,
  { label: string; bg: string; icon: string }
> = {
  "double-up": {
    label: "雙增（營收+獲利 YoY 雙正）",
    bg: "bg-red-50 border-red-200 text-red-900",
    icon: "💪",
  },
  "rev-up-eps-down": {
    label: "增收減益（毛利壓力）",
    bg: "bg-amber-50 border-amber-200 text-amber-900",
    icon: "⚠️",
  },
  "rev-down-eps-up": {
    label: "減收增益（效率改善 / 一次性）",
    bg: "bg-blue-50 border-blue-200 text-blue-900",
    icon: "✨",
  },
  "double-down": {
    label: "雙減（需警惕）",
    bg: "bg-green-50 border-green-300 text-green-900",
    icon: "📉",
  },
  "no-eps": {
    label: "EPS 資料不足",
    bg: "bg-gray-50 border-gray-200 text-gray-700",
    icon: "—",
  },
  unknown: {
    label: "資料不足",
    bg: "bg-gray-50 border-gray-200 text-gray-700",
    icon: "?",
  },
};

export function EarningsReportPulse() {
  const { holdings, hydrated: hh } = useHoldings();
  const { items: watchlist, hydrated: wh } = useWatchlist();

  const symbols = useMemo(() => {
    const set = new Set<string>();
    holdings.forEach((h) => set.add(h.symbol));
    watchlist.forEach((w) => set.add(w.symbol));
    return Array.from(set);
  }, [holdings, watchlist]);

  const [data, setData] = useState<EarningsPulseResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hh || !wh) return;
    if (symbols.length === 0) {
      setData({ items: [], asOf: Date.now() });
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(
      `/api/earnings-pulse?symbols=${encodeURIComponent(symbols.join(","))}`,
    )
      .then((r) => r.json())
      .then((d: EarningsPulseResponse) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbols.join(","), hh, wh]);

  if (!hh || !wh) return null;

  if (loading)
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 text-center text-sm text-gray-500">
        蒐集財報 + 月營收日曆中…（首次約 10–20 秒）
      </div>
    );

  if (!data || data.items.length === 0) return null;

  // 分四類：近期財報 (30 天內公布) / 即將財報 (60 天內) / 近期月營收 / 即將月營收日期
  const now = new Date();
  const recentCutoff = new Date(now);
  recentCutoff.setDate(now.getDate() - 45); // 45 天，台股財報週期較長
  const upcomingCutoff = new Date(now);
  upcomingCutoff.setDate(now.getDate() + 90); // 90 天涵蓋下一季

  const recent = data.items
    .filter((i) => {
      if (!i.recentEarnings) return false;
      const d = new Date(i.recentEarnings.date);
      return d >= recentCutoff;
    })
    .sort((a, b) =>
      (b.recentEarnings?.date ?? "").localeCompare(a.recentEarnings?.date ?? ""),
    );

  const upcoming = data.items
    .filter((i) => {
      if (!i.nextEarningsDate) return false;
      const d = new Date(i.nextEarningsDate);
      return d >= now && d <= upcomingCutoff;
    })
    .sort((a, b) =>
      (a.nextEarningsDate ?? "").localeCompare(b.nextEarningsDate ?? ""),
    );

  const recentMonthRev = data.items
    .filter((i) => i.recentMonthRevenue)
    .sort((a, b) =>
      (b.recentMonthRevenue?.announceDate ?? "").localeCompare(
        a.recentMonthRevenue?.announceDate ?? "",
      ),
    );

  const upcomingMonthRev = data.items
    .filter((i) => i.nextMonthRevenueDate)
    .sort((a, b) =>
      (a.nextMonthRevenueDate ?? "").localeCompare(
        b.nextMonthRevenueDate ?? "",
      ),
    );

  const empty =
    recent.length === 0 &&
    upcoming.length === 0 &&
    recentMonthRev.length === 0 &&
    upcomingMonthRev.length === 0;

  if (empty) return null;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <header className="mb-3 flex items-center gap-2">
        <CalendarDays size={16} className="text-cyan-700" />
        <h2 className="text-sm font-semibold text-gray-800">法說 / 財報日曆</h2>
        <span className="text-xs text-gray-500">
          持股 + 自選股 · 自動健檢（{symbols.length} 檔）
        </span>
      </header>

      {/* 近期公布財報 with health check */}
      {recent.length > 0 && (
        <div className="mb-4">
          <SectionTitle
            icon={<Sparkles size={11} className="text-green-600" />}
            text="近期公布財報（自動健檢）"
            count={recent.length}
          />
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {recent.map((i) => (
              <RecentEarningsCard key={i.symbol} item={i} />
            ))}
          </div>
        </div>
      )}

      {/* 即將公布 */}
      {upcoming.length > 0 && (
        <div className="mb-4">
          <SectionTitle
            icon={<CalendarClock size={11} className="text-amber-600" />}
            text="即將公布財報（90 天內）"
            count={upcoming.length}
          />
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {upcoming.map((i) => (
              <UpcomingEarningsCard key={i.symbol} item={i} />
            ))}
          </div>
        </div>
      )}

      {/* 近期月營收 (TW) */}
      {recentMonthRev.length > 0 && (
        <div className="mb-4">
          <SectionTitle
            icon={<TrendingUp size={11} className="text-blue-600" />}
            text="台股近期月營收"
            count={recentMonthRev.length}
            hint="每月約 10 號公布"
          />
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {recentMonthRev.map((i) => (
              <RecentMonthRevCard key={i.symbol} item={i} />
            ))}
          </div>
        </div>
      )}

      {/* 預估下次月營收公告日 (TW) */}
      {upcomingMonthRev.length > 0 && (
        <div>
          <SectionTitle
            icon={<CalendarClock size={11} className="text-purple-600" />}
            text="預估下次月營收公告日"
            count={upcomingMonthRev.length}
            hint="台股慣例第 10 號前"
          />
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {upcomingMonthRev.map((i) => (
              <Link
                key={i.symbol}
                href={`/stock/${encodeURIComponent(i.symbol)}`}
                className="block rounded border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs hover:bg-gray-100"
              >
                <div className="truncate font-semibold text-gray-800">
                  {displayName(i.symbol)}
                </div>
                <div className="text-[10px] tabular-nums text-purple-700">
                  {i.nextMonthRevenueDate?.replaceAll("-", "/")}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <p className="mt-3 text-[10px] text-gray-400">
        資料源：Yahoo Finance（季報/法說日）+ FinMind（台股月營收）。
        健檢 = 營收/EPS YoY 雙增為「💪 雙增」，雙減為「📉 雙減」；增收減益代表毛利壓力。
      </p>
    </section>
  );
}

function SectionTitle({
  icon,
  text,
  count,
  hint,
}: {
  icon: React.ReactNode;
  text: string;
  count: number;
  hint?: string;
}) {
  return (
    <div className="mb-1.5 flex items-baseline gap-1.5">
      {icon}
      <span className="text-xs font-semibold text-gray-700">{text}</span>
      <span className="text-[10px] text-gray-400">
        ({count}
        {hint ? ` · ${hint}` : ""})
      </span>
    </div>
  );
}

function RecentEarningsCard({ item }: { item: EarningsPulseItem }) {
  const r = item.recentEarnings!;
  const style = SIGNAL_STYLE[r.signal];

  return (
    <Link
      href={`/stock/${encodeURIComponent(item.symbol)}`}
      className={`block rounded-md border px-3 py-2 transition hover:brightness-105 ${style.bg}`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <div className="min-w-0 flex-1 truncate font-semibold">
          {displayName(item.symbol)}
        </div>
        <span className="shrink-0 text-[10px] opacity-70">
          {r.date.replaceAll("-", "/")}
        </span>
      </div>
      <div className="mt-1 flex items-center gap-1.5 text-xs font-medium">
        <span className="text-base leading-none">{style.icon}</span>
        <span>{style.label}</span>
      </div>
      <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px]">
        {typeof r.revenueYoY === "number" && (
          <StatRow label="營收 YoY" value={r.revenueYoY} />
        )}
        {typeof r.epsYoY === "number" && (
          <StatRow label="EPS YoY" value={r.epsYoY} />
        )}
        {typeof r.revenueQoQ === "number" && (
          <StatRow label="營收 QoQ" value={r.revenueQoQ} />
        )}
        {typeof r.epsQoQ === "number" && (
          <StatRow label="EPS QoQ" value={r.epsQoQ} />
        )}
      </div>
      {typeof r.eps === "number" && (
        <div className="mt-1 text-[10px] text-gray-600">
          當季 EPS{" "}
          <span className="font-semibold tabular-nums">
            {r.eps.toFixed(2)}
          </span>
        </div>
      )}
    </Link>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  const color =
    value > 0 ? "text-red-700" : value < 0 ? "text-green-700" : "text-gray-600";
  return (
    <div className="flex items-baseline gap-1">
      <span className="text-gray-600">{label}</span>
      <span className={`tabular-nums font-semibold ${color}`}>
        {formatPercent(value)}
      </span>
    </div>
  );
}

function UpcomingEarningsCard({ item }: { item: EarningsPulseItem }) {
  if (!item.nextEarningsDate) return null;
  const days = Math.ceil(
    (new Date(item.nextEarningsDate).getTime() - Date.now()) /
      (24 * 60 * 60 * 1000),
  );
  const dColor =
    days <= 7
      ? "text-red-700"
      : days <= 21
        ? "text-amber-700"
        : "text-gray-700";

  return (
    <Link
      href={`/stock/${encodeURIComponent(item.symbol)}`}
      className="block rounded border border-gray-200 bg-gray-50 px-2 py-1.5 hover:bg-gray-100"
    >
      <div className="truncate text-xs font-semibold text-gray-800">
        {displayName(item.symbol)}
      </div>
      <div className="text-[10px] text-gray-500">
        {item.nextEarningsDate.replaceAll("-", "/")}
      </div>
      <div className={`mt-0.5 text-[10px] font-semibold tabular-nums ${dColor}`}>
        {days <= 0 ? "今天" : `${days} 天後`}
      </div>
    </Link>
  );
}

function RecentMonthRevCard({ item }: { item: EarningsPulseItem }) {
  const m = item.recentMonthRevenue!;
  const yoyColor =
    (m.yoyChange ?? 0) > 0
      ? "text-red-600"
      : (m.yoyChange ?? 0) < 0
        ? "text-green-600"
        : "text-gray-600";
  const momColor =
    (m.momChange ?? 0) > 0
      ? "text-red-600"
      : (m.momChange ?? 0) < 0
        ? "text-green-600"
        : "text-gray-600";

  // 健檢：YoY 跟 MoM 都正 → 💪；YoY 正 MoM 負 → 📈YoY；YoY 負 → 📉
  let badge = "";
  if (typeof m.yoyChange === "number") {
    if (m.yoyChange >= 20 && (m.momChange ?? 0) > 0) badge = "💪 雙位數成長";
    else if (m.yoyChange > 0) badge = "📈 YoY 正";
    else if (m.yoyChange < -10) badge = "📉 顯著衰退";
    else if (m.yoyChange < 0) badge = "↓ YoY 衰";
  }

  return (
    <Link
      href={`/stock/${encodeURIComponent(item.symbol)}`}
      className="block rounded border border-gray-200 bg-gray-50 p-2 hover:bg-gray-100"
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate text-xs font-semibold text-gray-800">
          {displayName(item.symbol)}
        </span>
        <span className="shrink-0 text-[10px] text-gray-500">
          {m.yearMonth} 月
        </span>
      </div>
      <div className="mt-1 flex items-baseline gap-2 text-[11px]">
        <span className="text-gray-500">營收</span>
        <span className="font-semibold tabular-nums text-gray-800">
          {(m.revenue / 1e8).toFixed(2)} 億
        </span>
      </div>
      <div className="mt-0.5 flex items-baseline gap-3 text-[11px]">
        {typeof m.yoyChange === "number" && (
          <span>
            YoY{" "}
            <span className={`tabular-nums font-semibold ${yoyColor}`}>
              {formatPercent(m.yoyChange)}
            </span>
          </span>
        )}
        {typeof m.momChange === "number" && (
          <span>
            MoM{" "}
            <span className={`tabular-nums font-semibold ${momColor}`}>
              {formatPercent(m.momChange)}
            </span>
          </span>
        )}
      </div>
      {badge && <div className="mt-0.5 text-[10px] font-semibold">{badge}</div>}
    </Link>
  );
}
