"use client";

// 低軌衛星 (LEO) 完整供應鏈深度頁
//
// 三大區塊：
//   1. Hero：題材簡介 + 篇章導航
//   2. 主要星系時間軸（Starlink / Kuiper / OneWeb / 中國國網 / 台灣 B5G）
//   3. 10 大零組件分類 + 台股受惠 tier 1-3

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Satellite,
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import {
  LEO_PROGRAMS,
  LEO_COMPONENTS,
  LEO_CATEGORY_META,
  LEO_CONSTELLATION_META,
  LEO_STATUS_META,
  allLeoTwSymbols,
  type LeoProgram,
  type LeoConstellation,
  type LeoComponent,
  type LeoCategory,
  type LeoTwSupplier,
} from "@/lib/leo-satellite";
import { useQuotes } from "@/lib/useQuotes";
import { changeColor, formatPercent, formatPrice } from "@/lib/format";

export function LeoSatelliteDeepDive() {
  const symbols = useMemo(() => allLeoTwSymbols(), []);
  const { quotes } = useQuotes(symbols, 60_000);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <header className="overflow-hidden rounded-2xl border-2 border-violet-300 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 p-6 shadow-md">
        <div className="inline-flex items-center gap-1 rounded-full bg-violet-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
          <Satellite size={11} /> LEO Deep Dive
        </div>
        <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
          低軌衛星 LEO 完整供應鏈
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-700">
          Starlink 在軌 7,000 顆、Kuiper 開打、中國國網 + 千帆雙星系開建、
          台灣 B5G 低軌衛星 2026 自主發射 — 全球 LEO 星系競賽進入大爆發階段。
          這頁整理<strong>所有主要星系 + 10 大零組件分類 + 對應台股受惠族群</strong>。
          <span className="block mt-1 text-[11px] text-gray-500">
            💡 純資料整理工具、不構成投資建議。
            資料源：SpaceX / Amazon / OneWeb / TASA 公開公告 +
            各廠商法說 IR + 多家券商研究報告（標明為機構觀點）。
          </span>
        </p>

        <nav className="mt-5 flex flex-wrap gap-2 text-xs">
          <a
            href="#programs"
            className="inline-flex items-center gap-1 rounded-full border border-violet-300 bg-white px-3 py-1 font-semibold text-violet-800 hover:bg-violet-50"
          >
            <Calendar size={11} /> 主要星系時間軸
          </a>
          <a
            href="#supply"
            className="inline-flex items-center gap-1 rounded-full border border-violet-300 bg-white px-3 py-1 font-semibold text-violet-800 hover:bg-violet-50"
          >
            <Layers size={11} /> 10 大供應鏈分類
          </a>
        </nav>
      </header>

      {/* 星系時間軸 */}
      <section id="programs" className="scroll-mt-20">
        <h2 className="mb-3 flex items-baseline gap-2 text-base font-bold text-gray-900">
          <Calendar size={16} className="text-violet-700" />
          主要 LEO 星系時間軸
          <span className="text-[11px] font-normal text-gray-500">
            （目前在軌 + 即將發射 + 路線圖）
          </span>
        </h2>
        <div className="space-y-4">
          {(Object.keys(LEO_CONSTELLATION_META) as LeoConstellation[]).map(
            (cons) => {
              const programs = LEO_PROGRAMS.filter(
                (p) => p.constellation === cons,
              );
              if (programs.length === 0) return null;
              return (
                <ConstellationCard
                  key={cons}
                  constellation={cons}
                  programs={programs}
                />
              );
            },
          )}
        </div>
      </section>

      {/* 零組件分類 */}
      <section id="supply" className="scroll-mt-20">
        <h2 className="mb-3 flex items-baseline gap-2 text-base font-bold text-gray-900">
          <Layers size={16} className="text-violet-700" />
          10 大零組件供應鏈
          <span className="text-[11px] font-normal text-gray-500">
            （每類含台股 tier 1-3 + 即時報價）
          </span>
        </h2>
        <div className="space-y-3">
          {(Object.keys(LEO_CATEGORY_META) as LeoCategory[])
            .sort(
              (a, b) =>
                LEO_CATEGORY_META[a].order - LEO_CATEGORY_META[b].order,
            )
            .map((cat) => {
              const items = LEO_COMPONENTS.filter((c) => c.category === cat);
              if (items.length === 0) return null;
              return (
                <CategoryBlock
                  key={cat}
                  category={cat}
                  components={items}
                  quotes={quotes}
                />
              );
            })}
        </div>
      </section>

      {/* Footer */}
      <footer className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-[11px] leading-relaxed text-gray-600">
        <p>
          📚 <strong>資料源</strong>：SpaceX Starlink / Amazon Kuiper / OneWeb /
          中國衛星網路集團公告、台灣太空中心 TASA / 中科院公告、聯發科 / 啟碁 /
          昇達科 / 鐳洋等廠商法說 IR、多家券商研究報告（僅引用機構觀點、非本工具觀點）。
        </p>
        <p className="mt-1">
          ⚠️ <strong>免責</strong>：本頁為公開資料整理 + 產業鏈對照工具，
          <strong>不構成任何投資建議</strong>。Tier 分級僅描述
          「供應鏈規模」，非「投資排名」。LEO 衛星題材 catalyst 依賴 SpaceX /
          Kuiper 實際發射節奏 + 全球電信商採用、需自行查證。
        </p>
        <p className="mt-1 text-gray-400">
          🔄 資料整理截至 2026 年 5 月。星系規格 / 在軌數量以官方最新公告為準。
        </p>
      </footer>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────

function ConstellationCard({
  constellation,
  programs,
}: {
  constellation: LeoConstellation;
  programs: LeoProgram[];
}) {
  const meta = LEO_CONSTELLATION_META[constellation];
  return (
    <div className={`rounded-xl border-2 ${meta.color} p-4`}>
      <header className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-bold text-gray-900">{meta.label}</h3>
        <span className="text-[11px] text-gray-500">{meta.period}</span>
      </header>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {programs.map((p) => (
          <ProgramCard key={p.id} program={p} />
        ))}
      </div>
    </div>
  );
}

function ProgramCard({ program }: { program: LeoProgram }) {
  const status = LEO_STATUS_META[program.status];
  return (
    <div
      className={`rounded-lg border bg-white p-3 transition ${
        program.highlighted
          ? "border-red-300 ring-1 ring-red-200 shadow-sm"
          : "border-gray-200"
      }`}
    >
      <div className="flex items-baseline justify-between gap-1">
        <h4 className="text-sm font-bold text-gray-900">{program.name}</h4>
        <span
          className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${status.color}`}
        >
          {status.label}
        </span>
      </div>
      <p className="mt-0.5 text-[11px] text-gray-500">{program.timeline}</p>
      <p className="mt-1 text-xs leading-relaxed text-gray-700">{program.brief}</p>

      {program.specs && (
        <dl className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
          {program.specs.operator && <Spec k="運營者" v={program.specs.operator} />}
          {program.specs.satellites && (
            <Spec k="衛星數" v={program.specs.satellites} />
          )}
          {program.specs.coverage && <Spec k="覆蓋範圍" v={program.specs.coverage} />}
          {program.specs.keyTech && <Spec k="關鍵技術" v={program.specs.keyTech} />}
          {program.specs.launchVehicle && (
            <Spec k="發射載具" v={program.specs.launchVehicle} />
          )}
        </dl>
      )}

      <div className="mt-2 flex flex-wrap gap-1">
        {program.components.map((cid) => {
          const c = LEO_COMPONENTS.find((x) => x.id === cid);
          if (!c) return null;
          const meta = LEO_CATEGORY_META[c.category];
          return (
            <a
              key={cid}
              href={`#cat-${c.category}`}
              className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-medium text-gray-700 hover:bg-gray-200"
              title={c.label}
            >
              {meta.emoji}{" "}
              {c.label.length > 12 ? c.label.slice(0, 12) + "…" : c.label}
            </a>
          );
        })}
      </div>
    </div>
  );
}

function Spec({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline gap-1">
      <dt className="shrink-0 text-gray-500">{k}：</dt>
      <dd className="truncate font-medium text-gray-800" title={v}>
        {v}
      </dd>
    </div>
  );
}

type QuoteMap = Record<
  string,
  { price: number; change: number; changePercent: number; name?: string }
>;

function CategoryBlock({
  category,
  components,
  quotes,
}: {
  category: LeoCategory;
  components: LeoComponent[];
  quotes: QuoteMap;
}) {
  const meta = LEO_CATEGORY_META[category];
  const [open, setOpen] = useState(true);

  const totalSuppliers = components.reduce(
    (sum, c) => sum + c.twSuppliers.length,
    0,
  );

  return (
    <section
      id={`cat-${category}`}
      className={`scroll-mt-20 rounded-xl border-2 ${meta.color} p-4`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <div className="flex items-baseline gap-2">
          <span className="text-2xl">{meta.emoji}</span>
          <h3 className="text-base font-bold text-gray-900">{meta.label}</h3>
          <span className="text-[11px] text-gray-500">
            · {components.length} 種元件 · {totalSuppliers} 檔台股對應
          </span>
        </div>
        <span className="text-xs text-gray-500">{open ? "收合 ▲" : "展開 ▼"}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {components.map((c) => (
            <ComponentCard key={c.id} component={c} quotes={quotes} />
          ))}
        </div>
      )}
    </section>
  );
}

function ComponentCard({
  component,
  quotes,
}: {
  component: LeoComponent;
  quotes: QuoteMap;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <header className="mb-2">
        <h4 className="text-sm font-bold text-gray-900">{component.label}</h4>
        {component.specHint && (
          <p className="mt-0.5 text-[10px] text-gray-500">📐 {component.specHint}</p>
        )}
      </header>
      <p className="text-xs leading-relaxed text-gray-700">
        {component.description}
      </p>

      {component.globalSuppliers && component.globalSuppliers.length > 0 && (
        <div className="mt-2 text-[10px] text-gray-500">
          🌐 國際主要供應商：
          {component.globalSuppliers.join("、")}
        </div>
      )}

      <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
        <span className="text-gray-500">用於：</span>
        {component.usedIn.map((pid) => {
          const p = LEO_PROGRAMS.find((x) => x.id === pid);
          if (!p) return null;
          return (
            <span
              key={pid}
              className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-700"
            >
              {p.name}
            </span>
          );
        })}
      </div>

      {component.twSuppliers.length > 0 && (
        <div className="mt-3 border-t border-gray-100 pt-2">
          <h5 className="mb-1.5 text-[11px] font-semibold text-gray-700">
            🇹🇼 台股受惠 {component.twSuppliers.length} 檔（依供應規模 tier 1-3 排序）
          </h5>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {component.twSuppliers.map((s) => (
              <TwSupplierRow key={s.symbol} supplier={s} quote={quotes[s.symbol]} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TwSupplierRow({
  supplier,
  quote,
}: {
  supplier: LeoTwSupplier;
  quote?: { price: number; change: number; changePercent: number };
}) {
  const code = supplier.symbol.replace(/\.(TW|TWO)$/i, "");
  const tierColor =
    supplier.tier === 1
      ? "border-red-300 bg-red-50/50"
      : supplier.tier === 2
        ? "border-amber-300 bg-amber-50/50"
        : "border-gray-200 bg-gray-50/30";
  const tierLabel = supplier.tier === 1 ? "T1" : supplier.tier === 2 ? "T2" : "T3";
  const color = changeColor(quote?.change);

  return (
    <Link
      href={`/stock/${encodeURIComponent(supplier.symbol)}`}
      className={`flex items-start gap-2 rounded-md border ${tierColor} px-2.5 py-1.5 text-[11px] transition hover:border-violet-400`}
    >
      <span className="mt-0.5 shrink-0 rounded bg-white px-1 py-0.5 text-[9px] font-bold text-gray-700 ring-1 ring-gray-300">
        {tierLabel}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-1">
          <span className="font-semibold text-gray-900">{supplier.name}</span>
          <span className="text-[10px] text-gray-500 tabular-nums">{code}</span>
        </div>
        <p className="mt-0.5 text-[10px] leading-snug text-gray-600 line-clamp-2">
          {supplier.role}
        </p>
        {quote && (
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xs font-bold tabular-nums text-gray-900">
              {formatPrice(quote.price)}
            </span>
            <span className={`text-[10px] tabular-nums ${color}`}>
              {formatPercent(quote.changePercent)}
            </span>
            <ExternalLink size={9} className="ml-auto text-gray-400" />
          </div>
        )}
      </div>
    </Link>
  );
}
