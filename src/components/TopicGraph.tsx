"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Network, Info } from "lucide-react";
import { INFLUENCE_GROUPS, allInfluenceSymbols, computeSectorEdges } from "@/lib/influence";
import { TW_SECTORS } from "@/lib/sectors";
import { useQuotes } from "@/lib/useQuotes";
import { displayName } from "@/lib/symbols";
import { formatPercent } from "@/lib/format";
import type { Quote } from "@/lib/types";

// 美股題材 → 台股題材 雙邊圖（bipartite graph）
//
// 左欄：美股 influence groups（含當下平均漲跌）
// 右欄：被影響的台股 sectors（含當下平均漲跌）
// 邊：透過 INFLUENCE_GROUPS 計算重疊個股關係，stroke width 表示連結強度
//
// 互動：
// - hover 任一節點 → 高亮該節點所有連結 + 連到的另一邊節點
// - hover 邊 → 顯示共有的個股
// - 顏色：節點背景依平均漲跌；綠 = 漲、紅 = 跌、灰 = 持平

const WIDTH = 880;
const NODE_HEIGHT = 50;
const NODE_WIDTH = 200;
const COL_GAP = 480; // 左右兩欄水平距離
const PAD_LEFT = 20;
const PAD_TOP = 30;

export function TopicGraph() {
  const symbols = useMemo(() => allInfluenceSymbols(), []);
  const { quotes, loading } = useQuotes(symbols, 60_000);
  const [hovered, setHovered] = useState<{ kind: "us" | "tw"; id: string } | null>(null);
  const [edgeHovered, setEdgeHovered] = useState<{ fromUs: string; toTw: string } | null>(null);

  const edges = useMemo(() => computeSectorEdges(TW_SECTORS), []);

  // 計算每個 US group 的平均 %（基於它的 usSymbols）
  const usStats = useMemo(() => {
    return INFLUENCE_GROUPS.map((g) => {
      const qs = g.usSymbols
        .map((s) => quotes[s])
        .filter((q): q is Quote => Boolean(q) && Number.isFinite(q.changePercent));
      const avg = qs.length > 0 ? qs.reduce((s, q) => s + q.changePercent, 0) / qs.length : 0;
      return { id: g.id, label: g.label, avg, count: qs.length, symbols: g.usSymbols };
    });
  }, [quotes]);

  // 只取「被連結到」的台股 sectors（剩下的不畫，視覺乾淨）
  const twStats = useMemo(() => {
    const connectedIds = new Set(edges.map((e) => e.toTwSector));
    return TW_SECTORS.filter((s) => connectedIds.has(s.id)).map((sec) => {
      const qs = sec.symbols
        .map((s) => quotes[s])
        .filter((q): q is Quote => Boolean(q) && Number.isFinite(q.changePercent));
      const avg = qs.length > 0 ? qs.reduce((s, q) => s + q.changePercent, 0) / qs.length : 0;
      return { id: sec.id, label: sec.label, avg, symbols: sec.symbols };
    });
  }, [quotes, edges]);

  // 計算節點座標
  const usPositions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    usStats.forEach((g, i) => {
      map.set(g.id, { x: PAD_LEFT, y: PAD_TOP + i * (NODE_HEIGHT + 12) });
    });
    return map;
  }, [usStats]);

  const twPositions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    twStats.forEach((s, i) => {
      map.set(s.id, { x: PAD_LEFT + COL_GAP, y: PAD_TOP + i * (NODE_HEIGHT + 12) });
    });
    return map;
  }, [twStats]);

  const totalHeight =
    PAD_TOP * 2 +
    Math.max(usStats.length, twStats.length) * (NODE_HEIGHT + 12);

  // 高亮邏輯：算出哪些節點/邊在當前 hover 狀態下要被點亮
  const activeUs = new Set<string>();
  const activeTw = new Set<string>();
  if (hovered) {
    if (hovered.kind === "us") {
      activeUs.add(hovered.id);
      for (const e of edges) if (e.fromUs === hovered.id) activeTw.add(e.toTwSector);
    } else {
      activeTw.add(hovered.id);
      for (const e of edges) if (e.toTwSector === hovered.id) activeUs.add(e.fromUs);
    }
  }
  if (edgeHovered) {
    activeUs.add(edgeHovered.fromUs);
    activeTw.add(edgeHovered.toTw);
  }
  const hasHighlight = activeUs.size > 0 || activeTw.size > 0;

  function edgeIsActive(fromUs: string, toTw: string) {
    if (edgeHovered) return edgeHovered.fromUs === fromUs && edgeHovered.toTw === toTw;
    if (!hovered) return false;
    if (hovered.kind === "us") return hovered.id === fromUs;
    return hovered.id === toTw;
  }

  // 找目前 hover 的邊 → 列出 sharedSymbols
  const detailEdge = edgeHovered
    ? edges.find((e) => e.fromUs === edgeHovered.fromUs && e.toTwSector === edgeHovered.toTw)
    : null;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Network size={16} className="text-fuchsia-600" />
          <h2 className="text-sm font-semibold text-gray-700">題材關係圖</h2>
          <span className="text-xs text-gray-500">美股 → 影響 → 台股供應鏈</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-gray-500">
          <Info size={11} /> 滑鼠移到節點上可高亮關聯
        </div>
      </header>

      {loading && Object.keys(quotes).length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">載入中…</p>
      ) : (
        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${WIDTH} ${totalHeight}`}
            className="w-full min-w-[700px]"
            style={{ minHeight: totalHeight }}
          >
            {/* 邊（先畫，才會在節點底下） */}
            {edges.map((e, i) => {
              const usPos = usPositions.get(e.fromUs);
              const twPos = twPositions.get(e.toTwSector);
              if (!usPos || !twPos) return null;
              const x1 = usPos.x + NODE_WIDTH;
              const y1 = usPos.y + NODE_HEIGHT / 2;
              const x2 = twPos.x;
              const y2 = twPos.y + NODE_HEIGHT / 2;
              const cx = (x1 + x2) / 2;
              const active = edgeIsActive(e.fromUs, e.toTwSector);
              const dimmed = hasHighlight && !active;
              const usAvg = usStats.find((u) => u.id === e.fromUs)?.avg ?? 0;
              const strokeColor =
                usAvg > 0
                  ? `rgba(16, 185, 129, ${active ? 0.9 : dimmed ? 0.08 : 0.35})`
                  : usAvg < 0
                    ? `rgba(244, 63, 94, ${active ? 0.9 : dimmed ? 0.08 : 0.35})`
                    : `rgba(113, 113, 122, ${active ? 0.9 : dimmed ? 0.08 : 0.35})`;
              const sw = Math.min(4, 1 + e.sharedSymbols.length * 0.6);

              return (
                <path
                  key={i}
                  d={`M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={active ? sw + 1.5 : sw}
                  style={{ cursor: "pointer", transition: "stroke 150ms" }}
                  onMouseEnter={() => setEdgeHovered({ fromUs: e.fromUs, toTw: e.toTwSector })}
                  onMouseLeave={() => setEdgeHovered(null)}
                />
              );
            })}

            {/* 左欄：美股 nodes */}
            {usStats.map((g) => {
              const pos = usPositions.get(g.id)!;
              const isActive = activeUs.has(g.id);
              const dimmed = hasHighlight && !isActive;
              const colors = nodeColors(g.avg);
              return (
                <g
                  key={g.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  style={{
                    cursor: "pointer",
                    opacity: dimmed ? 0.35 : 1,
                    transition: "opacity 150ms",
                  }}
                  onMouseEnter={() => setHovered({ kind: "us", id: g.id })}
                  onMouseLeave={() => setHovered(null)}
                >
                  <rect
                    width={NODE_WIDTH}
                    height={NODE_HEIGHT}
                    rx="8"
                    fill={colors.bg}
                    stroke={isActive ? "#fbbf24" : colors.border}
                    strokeWidth={isActive ? 2 : 1}
                  />
                  <text
                    x={NODE_WIDTH / 2}
                    y={20}
                    textAnchor="middle"
                    fontSize="11"
                    fill="#1f2937"
                    fontWeight="600"
                  >
                    {truncate(g.label, 18)}
                  </text>
                  <text
                    x={NODE_WIDTH / 2}
                    y={38}
                    textAnchor="middle"
                    fontSize="11"
                    fill={colors.text}
                    fontWeight="700"
                  >
                    🇺🇸 {formatPercent(g.avg)}
                  </text>
                </g>
              );
            })}

            {/* 右欄：台股 nodes（點擊跳轉題材深度頁） */}
            {twStats.map((s) => {
              const pos = twPositions.get(s.id)!;
              const isActive = activeTw.has(s.id);
              const dimmed = hasHighlight && !isActive;
              const colors = nodeColors(s.avg);
              return (
                <a
                  key={s.id}
                  href={`/topics/${s.id}`}
                  onMouseEnter={() => setHovered({ kind: "tw", id: s.id })}
                  onMouseLeave={() => setHovered(null)}
                  style={{ cursor: "pointer" }}
                >
                <g
                  transform={`translate(${pos.x}, ${pos.y})`}
                  style={{
                    opacity: dimmed ? 0.35 : 1,
                    transition: "opacity 150ms",
                  }}
                >
                  <rect
                    width={NODE_WIDTH}
                    height={NODE_HEIGHT}
                    rx="8"
                    fill={colors.bg}
                    stroke={isActive ? "#fbbf24" : colors.border}
                    strokeWidth={isActive ? 2 : 1}
                  />
                  <text
                    x={NODE_WIDTH / 2}
                    y={20}
                    textAnchor="middle"
                    fontSize="11"
                    fill="#1f2937"
                    fontWeight="600"
                  >
                    {truncate(s.label, 18)}
                  </text>
                  <text
                    x={NODE_WIDTH / 2}
                    y={38}
                    textAnchor="middle"
                    fontSize="11"
                    fill={colors.text}
                    fontWeight="700"
                  >
                    🇹🇼 {formatPercent(s.avg)}
                  </text>
                </g>
                </a>
              );
            })}
          </svg>
        </div>
      )}

      {/* 詳細卡片：hover 邊或節點時顯示 */}
      <div className="mt-3">
        {detailEdge ? (
          <EdgeDetail
            fromUs={detailEdge.fromUs}
            toTw={detailEdge.toTwSector}
            sharedSymbols={detailEdge.sharedSymbols}
            quotes={quotes}
          />
        ) : hovered ? (
          <NodeDetail kind={hovered.kind} id={hovered.id} quotes={quotes} />
        ) : (
          <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-[11px] text-gray-500">
            👆 滑鼠移到節點 / 線條上會顯示詳細資訊
          </div>
        )}
      </div>

      {/* 圖例 */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-gray-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-6 rounded" style={{ background: "#dc2626" }} />
          題材整體上漲
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-6 rounded" style={{ background: "#16a34a" }} />
          題材整體下跌
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-6" style={{ background: "#9ca3af" }} />
          線寬 = 共有個股數（連結強度）
        </span>
      </div>
    </section>
  );
}

function nodeColors(pct: number) {
  // 台股慣例：紅 = 漲、綠 = 跌
  if (pct >= 2) return { bg: "#fee2e2", border: "#dc2626", text: "#b91c1c" };
  if (pct >= 0.5) return { bg: "#fef2f2", border: "#fca5a5", text: "#dc2626" };
  if (pct > -0.5) return { bg: "#f9fafb", border: "#d1d5db", text: "#4b5563" };
  if (pct > -2) return { bg: "#f0fdf4", border: "#86efac", text: "#16a34a" };
  return { bg: "#dcfce7", border: "#22c55e", text: "#15803d" };
}

function truncate(s: string, max: number) {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}

function EdgeDetail({
  fromUs,
  toTw,
  sharedSymbols,
  quotes,
}: {
  fromUs: string;
  toTw: string;
  sharedSymbols: string[];
  quotes: Record<string, Quote>;
}) {
  const usGroup = INFLUENCE_GROUPS.find((g) => g.id === fromUs);
  const twSector = TW_SECTORS.find((s) => s.id === toTw);
  if (!usGroup || !twSector) return null;
  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs">
      <div className="mb-1.5 font-semibold text-amber-700">
        🔗 {usGroup.label} → {twSector.label}
      </div>
      <div className="mb-1.5 text-[11px] text-amber-700/80">{usGroup.rationale}</div>
      <div className="text-[11px] text-gray-500">
        重疊的台股供應鏈個股：
        <div className="mt-1 flex flex-wrap gap-1">
          {sharedSymbols.map((s) => {
            const q = quotes[s];
            const code = s.replace(/\.(TW|TWO)$/i, "");
            return (
              <Link
                key={s}
                href={`/stock/${encodeURIComponent(s)}`}
                className={`rounded px-1.5 py-0.5 hover:brightness-125 ${
                  q && q.changePercent >= 0
                    ? "bg-red-50 text-red-500"
                    : "bg-green-50 text-green-500"
                }`}
              >
                {displayName(s)} {q ? formatPercent(q.changePercent) : ""}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function NodeDetail({
  kind,
  id,
  quotes,
}: {
  kind: "us" | "tw";
  id: string;
  quotes: Record<string, Quote>;
}) {
  if (kind === "us") {
    const g = INFLUENCE_GROUPS.find((x) => x.id === id);
    if (!g) return null;
    return (
      <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs">
        <div className="mb-1 font-semibold text-gray-800">🇺🇸 {g.label}</div>
        <div className="mb-1 text-[11px] text-gray-500">{g.rationale}</div>
        <div className="flex flex-wrap gap-1">
          {g.usSymbols.map((s) => {
            const q = quotes[s];
            return (
              <Link
                key={s}
                href={`/stock/${encodeURIComponent(s)}`}
                className={`rounded px-1.5 py-0.5 text-[11px] hover:brightness-125 ${
                  q && q.changePercent >= 0
                    ? "bg-red-50 text-red-500"
                    : "bg-green-50 text-green-500"
                }`}
              >
                {displayName(s)} {q ? formatPercent(q.changePercent) : "—"}
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  const sec = TW_SECTORS.find((x) => x.id === id);
  if (!sec) return null;
  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs">
      <div className="mb-1 font-semibold text-gray-800">🇹🇼 {sec.label}</div>
      <div className="flex flex-wrap gap-1">
        {sec.symbols.map((s) => {
          const q = quotes[s];
          return (
            <Link
              key={s}
              href={`/stock/${encodeURIComponent(s)}`}
              className={`rounded px-1.5 py-0.5 text-[11px] hover:brightness-125 ${
                q && q.changePercent >= 0
                  ? "bg-red-50 text-red-500"
                  : "bg-green-50 text-green-500"
              }`}
            >
              {displayName(s)} {q ? formatPercent(q.changePercent) : "—"}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
