"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LayoutGrid, RefreshCw } from "lucide-react";
import {
  TW_SECTORS,
  US_SECTORS,
  allSectorSymbols,
  type SectorGroup,
} from "@/lib/sectors";
import { useQuotes } from "@/lib/useQuotes";
import { useChanges } from "@/lib/useChanges";
import { formatPercent } from "@/lib/format";
import type { RangeKey } from "@/app/api/changes/route";

type Market = "ALL" | "TW" | "US";
type TimeFrame = RangeKey; // "1d" | "5d" | "1mo" | "3mo" | "6mo" | "1y" | "ytd"

const TF_OPTIONS: { id: TimeFrame; label: string }[] = [
  { id: "1d", label: "1天" },
  { id: "5d", label: "1周" },
  { id: "1mo", label: "1月" },
  { id: "3mo", label: "3月" },
  { id: "ytd", label: "YTD" },
  { id: "1y", label: "1年" },
];

const MARKET_TABS: { id: Market; label: string }[] = [
  { id: "ALL", label: "全部" },
  { id: "TW", label: "台股" },
  { id: "US", label: "美股" },
];

// ─── Squarified Treemap algorithm（Bruls et al. 2000）────────
type TreemapItem<T> = { id: string; value: number; meta: T };
type TreemapTile<T> = TreemapItem<T> & {
  x: number;
  y: number;
  w: number;
  h: number;
};

function squarifiedTreemap<T>(
  items: TreemapItem<T>[],
  width: number,
  height: number,
): TreemapTile<T>[] {
  const sorted = items
    .filter((i) => i.value > 0)
    .sort((a, b) => b.value - a.value);
  if (sorted.length === 0 || width <= 0 || height <= 0) return [];
  const totalValue = sorted.reduce((s, i) => s + i.value, 0);
  if (totalValue === 0) return [];
  const scale = (width * height) / totalValue;

  const tiles: TreemapTile<T>[] = [];
  const rect = { x: 0, y: 0, w: width, h: height };
  let row: TreemapItem<T>[] = [];
  const remaining = [...sorted];

  function worst(testRow: TreemapItem<T>[], short: number): number {
    if (testRow.length === 0 || short <= 0) return Infinity;
    let sum = 0,
      mx = -Infinity,
      mn = Infinity;
    for (const r of testRow) {
      const a = r.value * scale;
      sum += a;
      if (a > mx) mx = a;
      if (a < mn) mn = a;
    }
    if (mn <= 0 || sum <= 0) return Infinity;
    const s2 = short * short;
    return Math.max((s2 * mx) / (sum * sum), (sum * sum) / (s2 * mn));
  }

  function layoutRow(testRow: TreemapItem<T>[]) {
    const short = Math.min(rect.w, rect.h);
    if (short <= 0) return;
    const sum = testRow.reduce((s, r) => s + r.value * scale, 0);
    if (sum <= 0) return;
    const long = sum / short;

    if (rect.w >= rect.h) {
      // 短邊是 h，row 是左側寬度 long 的 column
      let cy = rect.y;
      for (const item of testRow) {
        const a = item.value * scale;
        const itemH = a / long;
        tiles.push({ ...item, x: rect.x, y: cy, w: long, h: itemH });
        cy += itemH;
      }
      rect.x += long;
      rect.w -= long;
    } else {
      // 短邊是 w，row 是上方高度 long 的 row
      let cx = rect.x;
      for (const item of testRow) {
        const a = item.value * scale;
        const itemW = a / long;
        tiles.push({ ...item, x: cx, y: rect.y, w: itemW, h: long });
        cx += itemW;
      }
      rect.y += long;
      rect.h -= long;
    }
  }

  while (remaining.length > 0) {
    const item = remaining[0];
    const short = Math.min(rect.w, rect.h);
    const candidate = [...row, item];

    if (row.length === 0 || worst(candidate, short) <= worst(row, short)) {
      row = candidate;
      remaining.shift();
    } else {
      layoutRow(row);
      row = [];
    }
  }
  if (row.length > 0) layoutRow(row);

  return tiles;
}

// ─── Color scale ────────────────────────────────────────────
function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}
function colorFor(pct: number): string {
  if (!Number.isFinite(pct)) return "#9ca3af";
  // 取 -5% ~ +5% 區間做線性內插
  const t = Math.max(-1, Math.min(1, pct / 5));
  if (t >= 0) {
    // gray (#9ca3af) → deep red (#7f1d1d)
    const r = lerp(0x9c, 0x7f, t);
    const g = lerp(0xa3, 0x1d, t);
    const b = lerp(0xaf, 0x1d, t);
    return `rgb(${r},${g},${b})`;
  } else {
    // gray → deep green (#14532d)
    const r = lerp(0x9c, 0x14, -t);
    const g = lerp(0xa3, 0x53, -t);
    const b = lerp(0xaf, 0x2d, -t);
    return `rgb(${r},${g},${b})`;
  }
}

// ─── Component ─────────────────────────────────────────────
type SectorAvg = {
  sector: SectorGroup;
  avg: number;
  count: number;
};

export function SectorBlockMap() {
  const [market, setMarket] = useState<Market>("ALL");
  const [tf, setTf] = useState<TimeFrame>("1d");
  // 響應式 treemap 比例 — 手機螢幕窄，需要更接近正方形避免擠扁
  // < 640px：4:5（直式、偏正方形）；>= 640px：2:1（寬扁桌面版）
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  const symbols = useMemo(() => {
    if (market === "ALL") return allSectorSymbols();
    return allSectorSymbols(market);
  }, [market]);

  const quotesResult = useQuotes(symbols, 60_000);
  const changesResult = useChanges(symbols, tf, 5 * 60_000);

  const symChange = useMemo(() => {
    const m: Record<string, number> = {};
    if (tf === "1d") {
      for (const s of symbols) {
        const q = quotesResult.quotes[s];
        if (q && Number.isFinite(q.changePercent)) m[s] = q.changePercent;
      }
    } else {
      for (const c of Object.values(changesResult.changes)) {
        if (Number.isFinite(c.changePercent)) m[c.symbol] = c.changePercent;
      }
    }
    return m;
  }, [tf, symbols, quotesResult.quotes, changesResult.changes]);

  const sectors = useMemo(() => {
    if (market === "ALL") return [...TW_SECTORS, ...US_SECTORS];
    return market === "TW" ? TW_SECTORS : US_SECTORS;
  }, [market]);

  const sectorAvg = useMemo<SectorAvg[]>(() => {
    return sectors
      .map((s) => {
        const vals = s.symbols
          .map((x) => symChange[x])
          .filter((v): v is number => Number.isFinite(v));
        const avg =
          vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : NaN;
        return { sector: s, avg, count: vals.length };
      })
      .filter((s) => Number.isFinite(s.avg) && s.count > 0);
  }, [sectors, symChange]);

  const isLoading =
    tf === "1d"
      ? quotesResult.loading && Object.keys(quotesResult.quotes).length === 0
      : changesResult.loading && Object.keys(changesResult.changes).length === 0;

  // Treemap items：value = |change% | (最小 0.5 保證可見)
  // 手機顯示偏正方形 4:5、最多 30 格（cells 更大、字看得清）
  // 桌面寬扁 2:1、最多 60 格（資訊密度高）
  const W = isMobile ? 800 : 1600;
  const H = isMobile ? 1000 : 800;
  const TILE_LIMIT = isMobile ? 30 : 60;
  const tiles = useMemo(() => {
    const top = [...sectorAvg]
      .sort((a, b) => Math.abs(b.avg) - Math.abs(a.avg))
      .slice(0, TILE_LIMIT)
      .map((s) => ({
        id: s.sector.id,
        value: Math.max(0.5, Math.abs(s.avg)),
        meta: s,
      }));
    return squarifiedTreemap(top, W, H);
  }, [sectorAvg, W, H, TILE_LIMIT]);

  function refresh() {
    if (tf === "1d") quotesResult.refresh?.();
    else changesResult.refresh?.();
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <LayoutGrid size={16} className="shrink-0 text-blue-600" />
          <h2 className="text-sm font-semibold text-gray-800">產業板塊圖</h2>
          <span className="hidden text-xs text-gray-500 sm:inline">
            區塊大小依漲跌絕對值 · 顏色由 -5% ~ +5% 線性內插
          </span>
        </div>
        <button
          onClick={refresh}
          disabled={isLoading}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
          title="重新整理"
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
        </button>
      </header>

      {/* Tab Bar — 全部 / 台股 / 美股 */}
      <div className="mb-3 flex items-center gap-1 border-b border-gray-200">
        {MARKET_TABS.map((m) => (
          <button
            key={m.id}
            onClick={() => setMarket(m.id)}
            className={`-mb-px border-b-2 px-3 py-1.5 text-sm transition ${
              market === m.id
                ? "border-blue-600 font-semibold text-blue-700"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Time Frame + Legend */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 max-w-full overflow-x-auto rounded-md border border-gray-300 bg-white p-0.5 text-xs">
          {TF_OPTIONS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTf(t.id)}
              className={`shrink-0 rounded px-2.5 py-1 sm:px-3 ${
                tf === t.id
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {/* 手機隱藏 legend（佔太多空間）*/}
        <div className="hidden sm:block">
          <ColorLegend />
        </div>
      </div>

      {/* Treemap */}
      {isLoading && tiles.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-500">
          {tf === "1d"
            ? "載入即時漲跌中…"
            : "計算歷史漲跌中（首次約 5-10 秒）…"}
        </p>
      ) : tiles.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-500">尚無資料</p>
      ) : (
        <div
          className="relative w-full overflow-hidden rounded-md"
          style={{ aspectRatio: `${W} / ${H}` }}
        >
          {tiles.map((t) => (
            <TreemapCell key={t.id} tile={t} W={W} H={H} />
          ))}
        </div>
      )}

      <p className="mt-3 text-[10px] text-gray-400">
        🎯 區塊大小 = 該題材平均漲跌絕對值；顯示絕對變化最大的 {TILE_LIMIT} 個子題材。
        點任一區塊進入該題材深度頁。
      </p>
    </section>
  );
}

function TreemapCell({
  tile,
  W,
  H,
}: {
  tile: TreemapTile<SectorAvg>;
  W: number;
  H: number;
}) {
  const left = (tile.x / W) * 100;
  const top = (tile.y / H) * 100;
  const width = (tile.w / W) * 100;
  const height = (tile.h / H) * 100;
  const { sector, avg } = tile.meta;

  // 相對面積（佔總面積百分比 0-100）
  const areaPct = width * height; // 0-10000 region
  const showLabel = width > 5 && height > 5;
  const showChange = width > 6 && height > 7;

  const labelSize =
    areaPct > 600
      ? "1.15rem"
      : areaPct > 250
        ? "0.95rem"
        : areaPct > 100
          ? "0.78rem"
          : areaPct > 40
            ? "0.66rem"
            : "0.6rem";
  const changeSize =
    areaPct > 600
      ? "1.05rem"
      : areaPct > 250
        ? "0.85rem"
        : areaPct > 100
          ? "0.72rem"
          : "0.6rem";

  const bg = colorFor(avg);

  return (
    <Link
      href={`/topics/${sector.id}`}
      style={{
        position: "absolute",
        left: `${left}%`,
        top: `${top}%`,
        width: `${width}%`,
        height: `${height}%`,
        backgroundColor: bg,
      }}
      className="group flex flex-col items-center justify-center overflow-hidden border border-white/40 px-1 text-center text-white transition hover:z-10 hover:shadow-lg hover:brightness-110"
      title={`${sector.label} · ${formatPercent(avg)}`}
    >
      {showLabel && (
        <div
          className="overflow-hidden font-bold leading-tight"
          style={{ fontSize: labelSize, maxWidth: "100%" }}
        >
          <span className="line-clamp-2">{sector.label}</span>
        </div>
      )}
      {showChange && (
        <div
          className="font-bold tabular-nums"
          style={{ fontSize: changeSize }}
        >
          {formatPercent(avg)}
        </div>
      )}
    </Link>
  );
}

function ColorLegend() {
  const swatches = [
    { pct: -5, label: "-5%" },
    { pct: -2, label: "-2%" },
    { pct: 0, label: "0%" },
    { pct: 2, label: "2%" },
    { pct: 5, label: "5%" },
  ];
  return (
    <div className="flex items-center gap-1 text-[10px]">
      {swatches.map((s) => (
        <div
          key={s.pct}
          className="flex h-5 w-9 items-center justify-center rounded text-white"
          style={{ backgroundColor: colorFor(s.pct) }}
        >
          {s.label}
        </div>
      ))}
    </div>
  );
}
