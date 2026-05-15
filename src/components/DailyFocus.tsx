"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Newspaper, ExternalLink, RefreshCw } from "lucide-react";
import type { FocusCard } from "@/app/api/daily-focus/route";

export function DailyFocus() {
  const [cards, setCards] = useState<FocusCard[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/daily-focus", { cache: "no-store" });
      const d = await res.json();
      setCards(d.cards ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 10 * 60_000); // 每 10 分鐘
    return () => clearInterval(id);
  }, []);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <header className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Newspaper size={16} className="text-blue-600" />
          <div>
            <h2 className="text-sm font-semibold text-gray-800">產業焦點導航</h2>
            <p className="text-[11px] text-gray-500">
              快速掌握每日核心題材與連動關係 · 每 10 分鐘更新
            </p>
          </div>
        </div>
        <button
          onClick={load}
          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          aria-label="刷新"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </header>

      {loading && cards.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">載入中…</p>
      ) : cards.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">沒有相關焦點新聞。</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {cards.slice(0, 6).map((c, i) => (
            <FocusTile key={`${c.link}-${i}`} card={c} />
          ))}
        </div>
      )}
    </section>
  );
}

function FocusTile({ card }: { card: FocusCard }) {
  const date = card.date ? new Date(card.date).toLocaleDateString("zh-TW") : "";
  return (
    <article className="flex flex-col rounded-lg border border-gray-200 bg-gray-50 p-3 transition hover:border-gray-300 hover:shadow-sm">
      <header className="mb-2 flex items-center justify-between">
        <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
          {card.source}
        </span>
        <span className="text-[10px] text-gray-500">📅 {date}</span>
      </header>
      <a
        href={card.link}
        target="_blank"
        rel="noopener noreferrer"
        className="group"
      >
        <h3 className="text-sm font-semibold leading-snug text-gray-900 group-hover:text-blue-700">
          {card.title}
        </h3>
        {card.snippet && (
          <p className="mt-1 line-clamp-3 text-[12px] leading-relaxed text-gray-600">
            {card.snippet}
          </p>
        )}
        <ExternalLink
          size={11}
          className="mt-1 inline text-gray-400 group-hover:text-blue-600"
        />
      </a>
      {card.sectors.length > 0 && (
        <div className="mt-auto flex flex-wrap gap-1 border-t border-gray-200 pt-2">
          {card.sectors.map((s) => (
            <Link
              key={s.id}
              href={`/topics/${s.id}`}
              className="flex items-center gap-0.5 rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] text-gray-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            >
              📊 {s.label}
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}
