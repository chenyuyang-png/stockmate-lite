"use client";

// NVIDIA 供應鏈深度展示元件
//
// 三大區塊：
//   1. Hero：產品路線圖 hero + 篇章導航
//   2. 產品時間軸：依 family 分組顯示所有 NVDA 產品
//   3. 供應鏈分類：9 大類零組件 + 每類底下的台股 supplier 卡片（含即時報價）

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Cpu,
  Calendar,
  Layers,
  Zap,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import {
  NVDA_PRODUCTS,
  NVDA_COMPONENTS,
  CATEGORY_META,
  FAMILY_META,
  STATUS_META,
  allNvdaTwSymbols,
  type NvdaProduct,
  type NvdaProductFamily,
  type NvdaComponent,
  type ComponentCategory,
  type TwSupplier,
} from "@/lib/nvda-supply-chain";
import { useQuotes } from "@/lib/useQuotes";
import { changeColor, formatPercent, formatPrice } from "@/lib/format";

export function NvdaDeepDive() {
  // 預先抓所有相關台股的即時報價
  const symbols = useMemo(() => allNvdaTwSymbols(), []);
  const { quotes } = useQuotes(symbols, 60_000);

  // 抓 NVDA 自己的報價
  const { quotes: nvdaQuotes } = useQuotes(["NVDA", "TSM"], 60_000);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <header className="overflow-hidden rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-6 shadow-md">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
              <Cpu size={11} /> Deep Dive
            </div>
            <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
              NVIDIA 完整供應鏈
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-700">
              全部 NVDA 在出貨 + 即將推出的產品（Hopper / Blackwell / Rubin / Feynman）、
              每個產品用到的<strong>零組件</strong>、每個零組件對應的<strong>台股受惠族群</strong>，
              都用公開資料整理在一頁。
              <span className="block mt-1 text-[11px] text-gray-500">
                💡 純資料整理，不構成投資建議。資料源：NVIDIA 公告、TSMC 法說、各廠商 IR
                + 多家券商研究報告（標明為機構觀點、非本工具觀點）。
              </span>
            </p>
          </div>

          {/* NVDA + TSM 即時報價 */}
          <div className="flex flex-wrap gap-2">
            <QuoteChip symbol="NVDA" name="NVIDIA" quote={nvdaQuotes["NVDA"]} />
            <QuoteChip
              symbol="TSM"
              name="台積電 ADR"
              quote={nvdaQuotes["TSM"]}
            />
          </div>
        </div>

        {/* 篇章快速導航 */}
        <nav className="mt-5 flex flex-wrap gap-2 text-xs">
          <a
            href="#products"
            className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-white px-3 py-1 font-semibold text-emerald-800 hover:bg-emerald-50"
          >
            <Calendar size={11} /> 產品時間軸
          </a>
          <a
            href="#supply"
            className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-white px-3 py-1 font-semibold text-emerald-800 hover:bg-emerald-50"
          >
            <Layers size={11} /> 9 大供應鏈分類
          </a>
          <a
            href="#power-semi"
            className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-white px-3 py-1 font-semibold text-red-800 hover:bg-red-50"
          >
            <Zap size={11} /> 功率半導體（新增）
          </a>
        </nav>
      </header>

      {/* 產品時間軸 */}
      <section id="products" className="scroll-mt-20">
        <h2 className="mb-3 flex items-baseline gap-2 text-base font-bold text-gray-900">
          <Calendar size={16} className="text-emerald-700" />
          產品時間軸
          <span className="text-[11px] font-normal text-gray-500">
            （從目前出貨到 2029 路線圖）
          </span>
        </h2>
        <div className="space-y-4">
          {(Object.keys(FAMILY_META) as NvdaProductFamily[]).map((family) => (
            <ProductFamilyCard
              key={family}
              family={family}
              products={NVDA_PRODUCTS.filter((p) => p.family === family)}
            />
          ))}
        </div>
      </section>

      {/* 供應鏈分類 */}
      <section id="supply" className="scroll-mt-20">
        <h2 className="mb-3 flex items-baseline gap-2 text-base font-bold text-gray-900">
          <Layers size={16} className="text-emerald-700" />
          9 大零組件供應鏈
          <span className="text-[11px] font-normal text-gray-500">
            （每類別含台股 tier 1-3 對應 + 即時報價）
          </span>
        </h2>
        <div className="space-y-3">
          {(Object.keys(CATEGORY_META) as ComponentCategory[])
            .sort((a, b) => CATEGORY_META[a].order - CATEGORY_META[b].order)
            .map((cat) => {
              const items = NVDA_COMPONENTS.filter((c) => c.category === cat);
              if (items.length === 0) return null;
              return (
                <ComponentCategoryBlock
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
          📚 <strong>資料源</strong>：NVIDIA 官方公告（H100/H200/B200/GB200 規格）、
          TSMC 法說會（CoWoS 產能）、台達電 / 光寶 / 雙鴻 / 廣達 等廠商 IR 公開資料、
          多家券商研究報告（僅引用機構觀點、非本工具觀點）。
        </p>
        <p className="mt-1">
          ⚠️ <strong>免責</strong>：本頁為公開資料整理工具，
          不構成任何投資建議。Tier 分級僅描述「供應鏈規模」，
          非「投資排名」。受惠程度受訂單比例、毛利率、外部需求變化影響、需自行查證。
        </p>
        <p className="mt-1 text-gray-400">
          🔄 資料整理截至 2026 年 5 月。NVDA 路線圖以官方最新公告為準。
        </p>
      </footer>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────

function QuoteChip({
  symbol,
  name,
  quote,
}: {
  symbol: string;
  name: string;
  quote?: { price: number; change: number; changePercent: number };
}) {
  if (!quote) {
    return (
      <div className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs">
        <div className="text-gray-500">{symbol}</div>
        <div className="text-gray-400">—</div>
      </div>
    );
  }
  const color = changeColor(quote.change);
  return (
    <Link
      href={`/stock/${encodeURIComponent(symbol)}`}
      className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs hover:border-emerald-400"
      title={name}
    >
      <div className="text-[10px] text-gray-500">{symbol}</div>
      <div className="font-bold tabular-nums text-gray-900">
        {formatPrice(quote.price, "USD")}
      </div>
      <div className={`text-[10px] tabular-nums ${color}`}>
        {formatPercent(quote.changePercent)}
      </div>
    </Link>
  );
}

function ProductFamilyCard({
  family,
  products,
}: {
  family: NvdaProductFamily;
  products: NvdaProduct[];
}) {
  const meta = FAMILY_META[family];
  if (products.length === 0) return null;
  return (
    <div className={`rounded-xl border-2 ${meta.color} p-4`}>
      <header className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-bold text-gray-900">{meta.label}</h3>
        <span className="text-[11px] text-gray-500">{meta.period}</span>
      </header>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: NvdaProduct }) {
  const status = STATUS_META[product.status];
  return (
    <div
      className={`rounded-lg border bg-white p-3 transition ${
        product.highlighted
          ? "border-red-300 ring-1 ring-red-200 shadow-sm"
          : "border-gray-200"
      }`}
    >
      <div className="flex items-baseline justify-between gap-1">
        <h4 className="text-sm font-bold text-gray-900">{product.name}</h4>
        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${status.color}`}>
          {status.label}
        </span>
      </div>
      <p className="mt-0.5 text-[11px] text-gray-500">{product.timeline}</p>
      <p className="mt-1 text-xs leading-relaxed text-gray-700">{product.brief}</p>

      {/* 規格 */}
      {product.specs && (
        <dl className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
          {product.specs.process && <Spec k="製程" v={product.specs.process} />}
          {product.specs.transistors && (
            <Spec k="電晶體" v={product.specs.transistors} />
          )}
          {product.specs.hbm && <Spec k="HBM" v={product.specs.hbm} />}
          {product.specs.tdp && <Spec k="TDP" v={product.specs.tdp} />}
          {product.specs.interconnect && (
            <Spec k="互連" v={product.specs.interconnect} />
          )}
          {product.specs.fp4Perf && (
            <Spec k="FP4 算力" v={product.specs.fp4Perf} />
          )}
        </dl>
      )}

      {/* 用到的元件 chips */}
      <div className="mt-2 flex flex-wrap gap-1">
        {product.components.map((cid) => {
          const c = NVDA_COMPONENTS.find((x) => x.id === cid);
          if (!c) return null;
          const meta = CATEGORY_META[c.category];
          return (
            <a
              key={cid}
              href={`#cat-${c.category}`}
              className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-medium text-gray-700 hover:bg-gray-200"
              title={c.label}
            >
              {meta.emoji} {c.label.length > 12 ? c.label.slice(0, 12) + "…" : c.label}
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
      <dd className="truncate font-medium tabular-nums text-gray-800" title={v}>
        {v}
      </dd>
    </div>
  );
}

type QuoteMap = Record<
  string,
  { price: number; change: number; changePercent: number; name?: string }
>;

function ComponentCategoryBlock({
  category,
  components,
  quotes,
}: {
  category: ComponentCategory;
  components: NvdaComponent[];
  quotes: QuoteMap;
}) {
  const meta = CATEGORY_META[category];
  const [open, setOpen] = useState(true); // 預設展開

  // 整類別總受惠台股數
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
  component: NvdaComponent;
  quotes: QuoteMap;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <header className="mb-2">
        <h4 className="text-sm font-bold text-gray-900">{component.label}</h4>
        {component.specHint && (
          <p className="mt-0.5 text-[10px] text-gray-500">
            📐 {component.specHint}
          </p>
        )}
      </header>
      <p className="text-xs leading-relaxed text-gray-700">
        {component.description}
      </p>

      {/* 國際供應商 */}
      {component.globalSuppliers && component.globalSuppliers.length > 0 && (
        <div className="mt-2 text-[10px] text-gray-500">
          🌐 國際主要供應商：
          {component.globalSuppliers.join("、")}
        </div>
      )}

      {/* 對應到哪些 NVDA 產品 */}
      <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
        <span className="text-gray-500">用於：</span>
        {component.usedIn.map((pid) => {
          const p = NVDA_PRODUCTS.find((x) => x.id === pid);
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

      {/* 台股受惠 */}
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
  supplier: TwSupplier;
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
      className={`flex items-start gap-2 rounded-md border ${tierColor} px-2.5 py-1.5 text-[11px] transition hover:border-emerald-400`}
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
