"use client";

import { useMemo } from "react";
import { CalendarClock, AlertCircle } from "lucide-react";
import { getUpcomingEvents, getTodayEvents, type EconomicEvent } from "@/lib/economicCalendar";

export function EconomicEventsBar() {
  const today = useMemo(() => getTodayEvents(), []);
  const upcoming = useMemo(() => getUpcomingEvents(14).filter((e) => !today.includes(e)), [today]);

  if (today.length === 0 && upcoming.length === 0) return null;

  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
      <header className="mb-3 flex items-center gap-2">
        <CalendarClock size={16} className="text-amber-700" />
        <h2 className="text-sm font-semibold text-gray-800">📅 重大經濟事件日曆</h2>
        <span className="text-[11px] text-gray-500">未來 14 天 · 影響大盤關鍵事件</span>
      </header>

      {/* 今天 */}
      {today.length > 0 && (
        <div className="mb-3">
          <div className="mb-1.5 flex items-center gap-1 text-xs font-bold text-red-700">
            <AlertCircle size={12} /> ⚡ 今日重點
          </div>
          <div className="space-y-2">
            {today.map((e, i) => (
              <EventCard key={i} event={e} isToday />
            ))}
          </div>
        </div>
      )}

      {/* 未來 14 天 */}
      {upcoming.length > 0 && (
        <div>
          <div className="mb-1.5 text-xs font-semibold text-gray-600">📌 接下來</div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
            {upcoming.slice(0, 9).map((e, i) => (
              <EventCard key={i} event={e} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function EventCard({ event, isToday }: { event: EconomicEvent; isToday?: boolean }) {
  const impColors = {
    critical: "border-red-300 bg-red-50",
    high: "border-amber-300 bg-amber-50",
    medium: "border-blue-200 bg-blue-50",
  };
  const flagEmoji = { US: "🇺🇸", TW: "🇹🇼", CN: "🇨🇳", GLOBAL: "🌐" }[event.region];
  const daysFromNow = Math.round(
    (new Date(event.date).getTime() - Date.now()) / (24 * 60 * 60 * 1000),
  );
  const dateBadge = isToday
    ? "今日"
    : daysFromNow === 1
      ? "明日"
      : daysFromNow <= 7
        ? `${daysFromNow} 天後`
        : event.date.slice(5);

  return (
    <div
      className={`rounded-lg border ${impColors[event.importance]} p-2.5 text-xs ${
        isToday ? "ring-2 ring-red-400 ring-offset-1" : ""
      }`}
    >
      <div className="mb-1 flex items-center gap-1.5">
        <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-bold text-gray-700">
          {dateBadge}
        </span>
        {event.time && (
          <span className="text-[10px] text-gray-500">{event.time}</span>
        )}
        <span className="text-[10px]">{flagEmoji}</span>
        {event.importance === "critical" && (
          <span className="rounded bg-red-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
            重要
          </span>
        )}
      </div>
      <div className="font-semibold text-gray-900">{event.event}</div>
      <div className="mt-0.5 text-[11px] leading-snug text-gray-600">{event.description}</div>
      {(event.previous || event.forecast) && (
        <div className="mt-1.5 flex gap-3 text-[10px] text-gray-500">
          {event.previous && <span>前值: {event.previous}</span>}
          {event.forecast && (
            <span>
              預期: <span className="font-semibold text-gray-700">{event.forecast}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
