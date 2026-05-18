/**
 * NVDA 零組件示意圖 (Schematic Diagrams)
 *
 * 用途：每個 NVDA 供應鏈零組件 (HBM、CoWoS、ABF...) 都畫一張 SVG 示意圖
 * 標出「每一層 / 每一塊」是什麼材料、台廠誰做。
 *
 * 注意：這些是 schematic illustrations、不是寫實照片。
 * 比例、層數有簡化、目的是教育性視覺化。
 */

import * as React from "react";

// ────────────────────────────────────────────────
// 共用樣式 / helpers
// ────────────────────────────────────────────────

const CHIP_FILL = "url(#chipGrad)";
const HBM_FILL = "url(#hbmGrad)";
const SUB_FILL = "url(#subGrad)";
const INT_FILL = "url(#intGrad)";
const COPPER_FILL = "url(#copperGrad)";

// 共用 <defs> — 漸層 + 陰影
function Defs() {
  return (
    <defs>
      <linearGradient id="chipGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#374151" />
        <stop offset="100%" stopColor="#1f2937" />
      </linearGradient>
      <linearGradient id="hbmGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
      <linearGradient id="subGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#10b981" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
      <linearGradient id="intGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#a3e635" />
        <stop offset="100%" stopColor="#65a30d" />
      </linearGradient>
      <linearGradient id="copperGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fb923c" />
        <stop offset="100%" stopColor="#c2410c" />
      </linearGradient>
      <linearGradient id="coldGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#06b6d4" />
        <stop offset="100%" stopColor="#0e7490" />
      </linearGradient>
      <linearGradient id="boardGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#15803d" />
        <stop offset="100%" stopColor="#14532d" />
      </linearGradient>
      <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" />
        <feOffset dx="0" dy="1" result="offsetblur" />
        <feComponentTransfer>
          <feFuncA type="linear" slope="0.3" />
        </feComponentTransfer>
        <feMerge>
          <feMergeNode />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

// 標注 — 帶箭頭 + 標籤 + 台廠
function Callout({
  x1,
  y1,
  x2,
  y2,
  label,
  tw,
  align = "start",
}: {
  x1: number | string;
  y1: number | string;
  x2: number | string;
  y2: number | string;
  label: string;
  /** 台廠標示，例 "🇹🇼 台積電 (T1)" */
  tw?: string;
  align?: "start" | "end";
}) {
  const anchor = align === "end" ? "end" : "start";
  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="#6b7280"
        strokeWidth="0.6"
        strokeDasharray="2,1.5"
      />
      <circle cx={x1} cy={y1} r="1.5" fill="#10b981" />
      <text
        x={x2}
        y={y2}
        fontSize="6"
        fontWeight="600"
        fill="#111827"
        textAnchor={anchor}
        dominantBaseline="central"
      >
        {label}
      </text>
      {tw && (
        <text
          x={x2}
          y={Number(y2) + 7}
          fontSize="5"
          fill="#047857"
          textAnchor={anchor}
          dominantBaseline="central"
        >
          {tw}
        </text>
      )}
    </g>
  );
}

// 統一 SVG 外框
function DiagramFrame({
  children,
  title,
  legend,
}: {
  children: React.ReactNode;
  title: string;
  legend?: string;
}) {
  return (
    <div className="my-3 rounded-lg border border-emerald-200 bg-gradient-to-br from-emerald-50/40 to-white p-2">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-[10px] font-bold text-emerald-900">📐 {title}</p>
        {legend && (
          <p className="text-[9px] text-gray-500 italic">{legend}</p>
        )}
      </div>
      <svg
        viewBox="0 0 320 200"
        className="h-auto w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <Defs />
        {children}
      </svg>
      <p className="mt-1 text-[9px] text-gray-400 italic">
        ※ 示意圖：實際比例 / 層數有簡化、僅供教育視覺化
      </p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 1. HBM — 高頻寬記憶體 3D 堆疊
// ════════════════════════════════════════════════════════════════
function HBMDiagram() {
  // 8-Hi stack: 8 DRAM dies + 1 base logic die
  const stackX = 30;
  const stackTop = 30;
  const dieH = 8;
  const dieW = 60;
  return (
    <DiagramFrame title="HBM3e Stack 剖面 (8-Hi)" legend="DRAM 3D 堆疊 + TSV 矽穿孔">
      {/* DRAM dies (8 層) */}
      {Array.from({ length: 8 }).map((_, i) => (
        <rect
          key={i}
          x={stackX}
          y={stackTop + i * dieH}
          width={dieW}
          height={dieH - 1}
          fill={HBM_FILL}
          stroke="#1e3a8a"
          strokeWidth="0.3"
          filter="url(#softShadow)"
        />
      ))}
      {/* Base logic die */}
      <rect
        x={stackX - 2}
        y={stackTop + 8 * dieH}
        width={dieW + 4}
        height={dieH * 1.4}
        fill="#7c3aed"
        stroke="#4c1d95"
        strokeWidth="0.5"
        filter="url(#softShadow)"
      />

      {/* TSV — 從上到下穿過所有 die */}
      {[0.2, 0.4, 0.6, 0.8].map((p, i) => (
        <line
          key={i}
          x1={stackX + dieW * p}
          y1={stackTop}
          x2={stackX + dieW * p}
          y2={stackTop + 8 * dieH + dieH * 1.4}
          stroke="#fbbf24"
          strokeWidth="0.5"
        />
      ))}

      {/* 矽中介層 (Interposer) — CoWoS */}
      <rect
        x={stackX - 12}
        y={stackTop + 8 * dieH + dieH * 1.5}
        width={dieW + 100}
        height={5}
        fill={INT_FILL}
        stroke="#3f6212"
        strokeWidth="0.3"
      />

      {/* GPU die 在 interposer 上、右側 */}
      <rect
        x={stackX + dieW + 14}
        y={stackTop + 8 * dieH - 18}
        width={70}
        height={32}
        fill={CHIP_FILL}
        stroke="#000"
        strokeWidth="0.4"
        filter="url(#softShadow)"
      />
      <text x={stackX + dieW + 49} y={stackTop + 8 * dieH - 2} fontSize="6.5" fill="#fff" textAnchor="middle" fontWeight="700">
        GPU Die
      </text>
      <text x={stackX + dieW + 49} y={stackTop + 8 * dieH + 6} fontSize="5" fill="#a7f3d0" textAnchor="middle">
        (NVIDIA H100/B200)
      </text>

      {/* ABF substrate 在 interposer 下面 */}
      <rect
        x={stackX - 18}
        y={stackTop + 8 * dieH + dieH * 1.5 + 5}
        width={dieW + 115}
        height={8}
        fill={SUB_FILL}
        stroke="#064e3b"
        strokeWidth="0.3"
      />
      {/* BGA balls */}
      {Array.from({ length: 12 }).map((_, i) => (
        <circle
          key={i}
          cx={stackX - 14 + i * 12}
          cy={stackTop + 8 * dieH + dieH * 1.5 + 16}
          r="1.8"
          fill="#9ca3af"
          stroke="#4b5563"
          strokeWidth="0.2"
        />
      ))}

      {/* Callouts (右側 → 左側標) */}
      <Callout x1={stackX + 30} y1={34} x2={205} y2={32} label="DRAM Die ×8" tw="🌐 SK Hynix / Samsung / Micron" />
      <Callout x1={stackX + 30} y1={stackTop + 8 * dieH + 6} x2={205} y2={50} label="Base Logic Die" tw="🌐 SK Hynix" />
      <Callout x1={stackX + dieW * 0.4} y1={60} x2={205} y2={68} label="TSV 矽穿孔" tw="🌐 製程內建" />
      <Callout x1={stackX + dieW + 30} y1={stackTop + 8 * dieH + 0} x2={205} y2={86} label="Si 中介層 (CoWoS)" tw="🇹🇼 台積電 (T1)" />
      <Callout x1={stackX + 30} y1={stackTop + 8 * dieH + dieH * 1.5 + 9} x2={205} y2={104} label="ABF 基板" tw="🇹🇼 欣興 / 南電 / 景碩 (T1)" />
      <Callout x1={stackX + 22} y1={stackTop + 8 * dieH + dieH * 1.5 + 16} x2={205} y2={122} label="BGA 球" tw="🇹🇼 千如 (T2)" />
    </DiagramFrame>
  );
}

// ════════════════════════════════════════════════════════════════
// 2. CoWoS / CoWoS-L — 2.5D 封裝
// ════════════════════════════════════════════════════════════════
function CoWoSDiagram({ withBridge = false }: { withBridge?: boolean }) {
  return (
    <DiagramFrame
      title={withBridge ? "CoWoS-L 封裝俯視 + 剖面" : "CoWoS-S 封裝俯視 + 剖面"}
      legend={withBridge ? "LSI Bridge 連接、Rubin 採用" : "Si Interposer 連接、H100/B200 採用"}
    >
      {/* 俯視圖 (上半) */}
      <text x="160" y="12" fontSize="7" fontWeight="700" fill="#065f46" textAnchor="middle">俯視圖</text>

      {/* HBM 8 顆 + GPU die 在中間 */}
      {/* GPU die */}
      <rect x="130" y="20" width="60" height="40" fill={CHIP_FILL} stroke="#000" strokeWidth="0.4" filter="url(#softShadow)" />
      <text x="160" y="42" fontSize="7" fill="#fff" textAnchor="middle" fontWeight="700">GPU Die</text>
      <text x="160" y="51" fontSize="5" fill="#a7f3d0" textAnchor="middle">B200 (104B 電晶體)</text>

      {/* HBM stacks (4 left + 4 right) */}
      {[0, 1, 2, 3].map((i) => (
        <g key={`L${i}`}>
          <rect x={95} y={20 + i * 10} width={28} height={9} fill={HBM_FILL} stroke="#1e3a8a" strokeWidth="0.3" />
          <text x={109} y={26 + i * 10} fontSize="3.5" fill="#fff" textAnchor="middle">HBM{i + 1}</text>
        </g>
      ))}
      {[0, 1, 2, 3].map((i) => (
        <g key={`R${i}`}>
          <rect x={197} y={20 + i * 10} width={28} height={9} fill={HBM_FILL} stroke="#1e3a8a" strokeWidth="0.3" />
          <text x={211} y={26 + i * 10} fontSize="3.5" fill="#fff" textAnchor="middle">HBM{i + 5}</text>
        </g>
      ))}

      {/* Si Interposer outline (透明色) */}
      <rect x="88" y="16" width="144" height="50" fill="none" stroke="#84cc16" strokeWidth="0.8" strokeDasharray="2,1" />
      <text x="232" y="20" fontSize="4.5" fill="#65a30d" textAnchor="start">← Si Interposer</text>

      {/* LSI bridges (CoWoS-L only) */}
      {withBridge && (
        <>
          <rect x={123} y="35" width="9" height="8" fill="#f59e0b" stroke="#92400e" strokeWidth="0.3" />
          <rect x={188} y="35" width="9" height="8" fill="#f59e0b" stroke="#92400e" strokeWidth="0.3" />
          <text x="127" y="48" fontSize="3.5" fill="#92400e" textAnchor="middle">LSI</text>
        </>
      )}

      {/* 分隔線 */}
      <line x1="20" y1="80" x2="300" y2="80" stroke="#9ca3af" strokeWidth="0.3" strokeDasharray="2,1" />

      {/* 剖面圖 (下半) */}
      <text x="160" y="92" fontSize="7" fontWeight="700" fill="#065f46" textAnchor="middle">剖面圖</text>

      {/* GPU + HBM 在 interposer 上 */}
      <rect x="95" y="100" width="28" height="22" fill={HBM_FILL} stroke="#1e3a8a" strokeWidth="0.3" />
      <rect x="130" y="100" width="60" height="22" fill={CHIP_FILL} stroke="#000" strokeWidth="0.4" />
      <rect x="197" y="100" width="28" height="22" fill={HBM_FILL} stroke="#1e3a8a" strokeWidth="0.3" />
      <text x="109" y="113" fontSize="4.5" fill="#fff" textAnchor="middle">HBM</text>
      <text x="160" y="113" fontSize="5" fill="#fff" textAnchor="middle">GPU</text>
      <text x="211" y="113" fontSize="4.5" fill="#fff" textAnchor="middle">HBM</text>

      {/* Interposer */}
      <rect x="88" y="122" width="144" height="5" fill={INT_FILL} stroke="#3f6212" strokeWidth="0.3" />
      {withBridge && (
        <>
          {/* LSI bridge embedded */}
          <rect x="121" y="120" width="9" height="4" fill="#f59e0b" stroke="#92400e" strokeWidth="0.3" />
          <rect x="190" y="120" width="9" height="4" fill="#f59e0b" stroke="#92400e" strokeWidth="0.3" />
        </>
      )}

      {/* ABF substrate */}
      <rect x="76" y="127" width="168" height="10" fill={SUB_FILL} stroke="#064e3b" strokeWidth="0.3" />

      {/* BGA */}
      {Array.from({ length: 14 }).map((_, i) => (
        <circle key={i} cx={80 + i * 12} cy="142" r="2" fill="#9ca3af" stroke="#4b5563" strokeWidth="0.2" />
      ))}

      {/* Callouts */}
      <Callout x1="160" y1="40" x2="20" y2="50" label="GPU 主晶片" tw="🌐 TSMC 4N/3N、🇹🇼 台積電 (T1)" />
      <Callout x1="109" y1="40" x2="20" y2="65" label="HBM 8 顆/GPU" tw="🌐 SK Hynix / Samsung" />
      {withBridge && (
        <Callout x1="128" y1="39" x2="20" y2="80" label="LSI 矽橋" tw="🇹🇼 台積電獨家 (T1)" />
      )}
      <Callout x1="160" y1="125" x2="20" y2={withBridge ? 95 : 80} label="Si 中介層" tw="🇹🇼 台積電 CoWoS (T1)" />
      <Callout x1="160" y1="132" x2="300" y2="125" label="ABF 基板" tw="🇹🇼 欣興/南電/景碩 (T1)" align="end" />
      <Callout x1="100" y1="142" x2="300" y2="140" label="BGA 球" tw="🇹🇼 千如 (T2)" align="end" />
      <Callout x1="160" y1="120" x2="300" y2="155" label="OS 封測 (測試/打件)" tw="🇹🇼 京元電子/日月光 (T1)" align="end" />
    </DiagramFrame>
  );
}

// ════════════════════════════════════════════════════════════════
// 3. ABF 基板 — 多層 PCB 剖面
// ════════════════════════════════════════════════════════════════
function AbfDiagram() {
  const layers = [
    { name: "Solder Mask (綠漆)", color: "#16a34a", h: 4 },
    { name: "Cu Trace L1", color: "#fb923c", h: 3 },
    { name: "ABF 介電層", color: "#fef3c7", h: 5 },
    { name: "Cu Trace L2", color: "#fb923c", h: 3 },
    { name: "ABF 介電層", color: "#fef3c7", h: 5 },
    { name: "Cu Trace L3", color: "#fb923c", h: 3 },
    { name: "Core (玻纖布)", color: "#a8a29e", h: 10 },
    { name: "Cu Trace L4", color: "#fb923c", h: 3 },
    { name: "ABF 介電層", color: "#fef3c7", h: 5 },
    { name: "Cu Trace L5", color: "#fb923c", h: 3 },
    { name: "ABF 介電層", color: "#fef3c7", h: 5 },
    { name: "Cu Trace L6", color: "#fb923c", h: 3 },
    { name: "Solder Mask", color: "#16a34a", h: 4 },
  ];
  let y = 25;
  return (
    <DiagramFrame title="ABF 基板剖面 (10+ 層)" legend="Ajinomoto Build-up Film 介電 + 銅蝕刻線路">
      {layers.map((l, i) => {
        const rect = (
          <g key={i}>
            <rect x="40" y={y} width="160" height={l.h} fill={l.color} stroke="#444" strokeWidth="0.2" />
            <text x="44" y={y + l.h * 0.7} fontSize="4" fill="#1f2937" fontWeight="500">
              {l.name}
            </text>
          </g>
        );
        y += l.h;
        return rect;
      })}

      {/* Via 通孔 (穿過所有層) */}
      {[60, 110, 160].map((vx, i) => (
        <line key={i} x1={vx} y1="25" x2={vx} y2={y - 1} stroke="#dc2626" strokeWidth="0.8" />
      ))}

      {/* BGA balls 在底部 */}
      {Array.from({ length: 14 }).map((_, i) => (
        <circle key={i} cx={45 + i * 11} cy={y + 4} r="2" fill="#9ca3af" stroke="#4b5563" strokeWidth="0.2" />
      ))}

      {/* Callouts */}
      <Callout x1="65" y1="30" x2="300" y2="30" label="ABF 介電膜 (味之素獨家)" tw="🌐 味之素 (Ajinomoto)" align="end" />
      <Callout x1="65" y1="42" x2="300" y2="48" label="銅蝕刻線路 ×6+" tw="🇹🇼 欣興/南電/景碩 (T1)" align="end" />
      <Callout x1="65" y1="63" x2="300" y2="68" label="Core 玻纖布 + 銅" tw="🇹🇼 台光電 (玻纖布、T1)" align="end" />
      <Callout x1="60" y1="50" x2="20" y2="50" label="Via 通孔" tw="🇹🇼 鑽針 — 尖點 (T2)" />
      <Callout x1="100" y1={y + 4} x2="20" y2={y + 4} label="BGA 球" tw="🇹🇼 千如 (T2)" />
    </DiagramFrame>
  );
}

// ════════════════════════════════════════════════════════════════
// 4. Power Semi (VRM Power Stage)
// ════════════════════════════════════════════════════════════════
function PowerSemiDiagram() {
  return (
    <DiagramFrame title="VRM Power Stage (GPU 供電模組)" legend="DrMOS / Smart Power Stage">
      {/* PCB */}
      <rect x="40" y="30" width="180" height="120" fill={boardFill} stroke="#14532d" strokeWidth="0.5" rx="3" />

      {/* MOSFET pair (High-side + Low-side) */}
      <rect x="60" y="50" width="28" height="20" fill={CHIP_FILL} stroke="#000" strokeWidth="0.3" />
      <text x="74" y="62" fontSize="5" fill="#fff" textAnchor="middle">HS MOS</text>
      <rect x="60" y="74" width="28" height="20" fill={CHIP_FILL} stroke="#000" strokeWidth="0.3" />
      <text x="74" y="86" fontSize="5" fill="#fff" textAnchor="middle">LS MOS</text>

      {/* Gate driver IC */}
      <rect x="95" y="55" width="22" height="34" fill="#7c3aed" stroke="#4c1d95" strokeWidth="0.3" />
      <text x="106" y="74" fontSize="4" fill="#fff" textAnchor="middle">Gate</text>
      <text x="106" y="79" fontSize="4" fill="#fff" textAnchor="middle">Driver</text>

      {/* Inductor */}
      <rect x="125" y="50" width="40" height="40" fill="#1f2937" stroke="#000" strokeWidth="0.3" rx="3" />
      <text x="145" y="73" fontSize="5" fill="#fbbf24" textAnchor="middle" fontWeight="700">L</text>
      {/* 線圈紋路 */}
      {[58, 65, 72, 79, 86].map((cy, i) => (
        <line key={i} x1="128" y1={cy} x2="162" y2={cy} stroke="#fbbf24" strokeWidth="0.3" />
      ))}

      {/* Output Caps */}
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={172 + i * 12} y="55" width="9" height="30" fill="#0ea5e9" stroke="#0c4a6e" strokeWidth="0.3" rx="1" />
          <text x={176.5 + i * 12} y="73" fontSize="3.5" fill="#fff" textAnchor="middle">C</text>
        </g>
      ))}

      {/* Controller IC */}
      <rect x="80" y="110" width="55" height="25" fill="#dc2626" stroke="#7f1d1d" strokeWidth="0.3" />
      <text x="107.5" y="125" fontSize="5" fill="#fff" textAnchor="middle" fontWeight="700">Controller IC</text>

      {/* 標 */}
      <Callout x1="74" y1="60" x2="300" y2="35" label="High/Low-side MOSFET" tw="🌐 Infineon / 安森美 / 🇹🇼 富鼎 (T2)" align="end" />
      <Callout x1="106" y1="72" x2="300" y2="55" label="Gate Driver IC" tw="🌐 Infineon / Renesas" align="end" />
      <Callout x1="145" y1="70" x2="300" y2="75" label="Power 電感 (合金粉芯)" tw="🇹🇼 奇力新 (T1) / 信邦 (T2)" align="end" />
      <Callout x1="184" y1="70" x2="300" y2="95" label="MLCC / 鉭電容" tw="🇹🇼 國巨 (T1) / 華新科" align="end" />
      <Callout x1="107" y1="122" x2="300" y2="115" label="PWM Controller" tw="🌐 MPS / 茂達 (T2)" align="end" />
      <Callout x1="50" y1="90" x2="20" y2="90" label="PCB 載板" tw="🇹🇼 健鼎 / 金像電 (T2)" />
    </DiagramFrame>
  );
}
const boardFill = "url(#boardGrad)";

// ════════════════════════════════════════════════════════════════
// 5. Power PSU — Server 電源供應器
// ════════════════════════════════════════════════════════════════
function PowerPsuDiagram() {
  return (
    <DiagramFrame title="Server PSU 內部 (Titanium 級 5500W)" legend="GB200 NVL72 用 33 顆 / rack">
      {/* PSU 外殼 */}
      <rect x="20" y="30" width="280" height="140" fill="#e5e7eb" stroke="#374151" strokeWidth="0.6" rx="4" />
      <text x="160" y="42" fontSize="6" fill="#374151" textAnchor="middle" fontWeight="700">PSU 1U Module</text>

      {/* 風扇 (右側) */}
      <circle cx="270" cy="100" r="22" fill="#1f2937" stroke="#000" strokeWidth="0.4" />
      {[0, 60, 120, 180, 240, 300].map((deg, i) => (
        <line
          key={i}
          x1="270"
          y1="100"
          x2={270 + 18 * Math.cos((deg * Math.PI) / 180)}
          y2={100 + 18 * Math.sin((deg * Math.PI) / 180)}
          stroke="#6b7280"
          strokeWidth="1"
        />
      ))}
      <circle cx="270" cy="100" r="4" fill="#374151" />

      {/* AC 輸入 (左側) */}
      <rect x="28" y="60" width="20" height="14" fill="#374151" />
      <text x="38" y="69" fontSize="4" fill="#fff" textAnchor="middle">AC IN</text>

      {/* EMI Filter */}
      <rect x="55" y="55" width="24" height="24" fill="#0ea5e9" stroke="#0c4a6e" strokeWidth="0.3" rx="1" />
      <text x="67" y="69" fontSize="4" fill="#fff" textAnchor="middle">EMI 濾波</text>

      {/* PFC 電路 */}
      <rect x="85" y="55" width="34" height="24" fill={CHIP_FILL} stroke="#000" strokeWidth="0.3" />
      <text x="102" y="65" fontSize="4" fill="#fff" textAnchor="middle">PFC</text>
      <text x="102" y="73" fontSize="3.5" fill="#a7f3d0" textAnchor="middle">SiC MOSFET</text>

      {/* 變壓器 (中央) */}
      <rect x="130" y="50" width="40" height="34" fill="#854d0e" stroke="#451a03" strokeWidth="0.5" rx="2" />
      <text x="150" y="69" fontSize="5" fill="#fef3c7" textAnchor="middle" fontWeight="700">變壓器</text>

      {/* LLC Resonant + 同步整流 */}
      <rect x="180" y="55" width="34" height="24" fill={CHIP_FILL} stroke="#000" strokeWidth="0.3" />
      <text x="197" y="65" fontSize="4" fill="#fff" textAnchor="middle">LLC + SR</text>
      <text x="197" y="73" fontSize="3.5" fill="#a7f3d0" textAnchor="middle">同步整流</text>

      {/* 輸出大電容 (下方) */}
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <rect x={70 + i * 22} y="120" width="16" height="35" fill="#0ea5e9" stroke="#0c4a6e" strokeWidth="0.3" rx="2" />
          <text x={78 + i * 22} y="140" fontSize="3.5" fill="#fff" textAnchor="middle">電解</text>
        </g>
      ))}

      {/* 控制 IC */}
      <rect x="195" y="125" width="40" height="20" fill="#dc2626" stroke="#7f1d1d" strokeWidth="0.3" />
      <text x="215" y="137" fontSize="4" fill="#fff" textAnchor="middle" fontWeight="700">MCU Controller</text>

      {/* DC 輸出 (右下) */}
      <rect x="245" y="160" width="30" height="6" fill="#374151" />
      <text x="260" y="164" fontSize="3.5" fill="#fff" textAnchor="middle">12V/54V DC OUT</text>

      <Callout x1="150" y1="65" x2="20" y2="20" label="高頻變壓器" tw="🇹🇼 台達電 / 光寶科 自製 (T1)" />
      <Callout x1="102" y1="65" x2="320" y2="22" label="SiC PFC + LLC 拓樸" tw="🌐 Wolfspeed / 🇹🇼 朋程 (T2)" align="end" />
      <Callout x1="80" y1="140" x2="320" y2="55" label="大電解電容" tw="🌐 Nichicon / Rubycon" align="end" />
      <Callout x1="215" y1="135" x2="320" y2="160" label="數位 PWM 控制" tw="🇹🇼 台達電 IC + 韌體 (T1)" align="end" />
      <Callout x1="270" y1="100" x2="20" y2="100" label="HV 散熱風扇" tw="🇹🇼 建準 / 雙鴻 (T2)" />
      <Callout x1="30" y1="20" x2="320" y2="180" label="整機組裝" tw="🇹🇼 台達 (T1) / 光寶 (T1) / 群電 (T2)" align="end" />
    </DiagramFrame>
  );
}

// ════════════════════════════════════════════════════════════════
// 6. Thermal 3DVC — 3D 均熱腔
// ════════════════════════════════════════════════════════════════
function Thermal3DVCDiagram() {
  return (
    <DiagramFrame title="3DVC 均熱腔剖面 (GB200)" legend="3D Vapor Chamber + 蒸發/冷凝雙相">
      {/* 上方銅蓋 (cold side) */}
      <rect x="40" y="30" width="240" height="14" fill="#fb923c" stroke="#9a3412" strokeWidth="0.4" />
      <text x="160" y="40" fontSize="5" fill="#fff" textAnchor="middle" fontWeight="700">銅蓋 (冷凝面)</text>

      {/* 真空腔 + 工作液 */}
      <rect x="40" y="44" width="240" height="50" fill="#cffafe" stroke="#0e7490" strokeWidth="0.4" />

      {/* wick 結構 (內壁的毛細) */}
      {[46, 88].map((wy, i) => (
        <g key={i}>
          {Array.from({ length: 60 }).map((_, j) => (
            <rect key={j} x={42 + j * 4} y={wy} width="2" height="4" fill="#0891b2" />
          ))}
        </g>
      ))}

      {/* 蒸氣箭頭 (向上) */}
      {[80, 140, 200, 240].map((vx, i) => (
        <g key={i}>
          <line x1={vx} y1="85" x2={vx} y2="60" stroke="#0e7490" strokeWidth="0.8" markerEnd="url(#arrow)" />
          <text x={vx} y="55" fontSize="3.5" fill="#0e7490" textAnchor="middle">蒸氣↑</text>
        </g>
      ))}

      {/* 液體箭頭 (向下、貼壁) */}
      <line x1="55" y1="50" x2="55" y2="88" stroke="#06b6d4" strokeWidth="0.8" />
      <text x="60" y="85" fontSize="3.5" fill="#06b6d4">↓液</text>

      <defs>
        <marker id="arrow" markerWidth="5" markerHeight="5" refX="3" refY="2.5" orient="auto">
          <polygon points="0 0, 5 2.5, 0 5" fill="#0e7490" />
        </marker>
      </defs>

      {/* 下方銅底板 (hot side) */}
      <rect x="40" y="94" width="240" height="14" fill="#fb923c" stroke="#9a3412" strokeWidth="0.4" />
      <text x="160" y="104" fontSize="5" fill="#fff" textAnchor="middle" fontWeight="700">銅底 (蒸發面 / 貼 GPU)</text>

      {/* GPU dies (下方) */}
      <rect x="80" y="115" width="50" height="22" fill={CHIP_FILL} stroke="#000" strokeWidth="0.3" />
      <text x="105" y="129" fontSize="5" fill="#fff" textAnchor="middle">GPU 1</text>
      <rect x="190" y="115" width="50" height="22" fill={CHIP_FILL} stroke="#000" strokeWidth="0.3" />
      <text x="215" y="129" fontSize="5" fill="#fff" textAnchor="middle">GPU 2</text>
      <rect x="135" y="115" width="50" height="22" fill="#7c3aed" stroke="#4c1d95" strokeWidth="0.3" />
      <text x="160" y="129" fontSize="5" fill="#fff" textAnchor="middle">CPU (Grace)</text>

      {/* 散熱鰭片 (上方) */}
      {Array.from({ length: 40 }).map((_, i) => (
        <line key={i} x1={45 + i * 6} y1="10" x2={45 + i * 6} y2="30" stroke="#9ca3af" strokeWidth="0.5" />
      ))}
      <text x="160" y="20" fontSize="4" fill="#374151" textAnchor="middle">散熱鰭片</text>

      <Callout x1="160" y1="40" x2="20" y2="50" label="銅蓋 (Cu)" tw="🇹🇼 高力 (T1) / 健策 (T2)" />
      <Callout x1="100" y1="68" x2="300" y2="55" label="真空腔 + 工作液 (純水)" tw="🇹🇼 奇鋐 (T1) / 雙鴻 (T2)" align="end" />
      <Callout x1="55" y1="55" x2="20" y2="75" label="毛細 wick 結構" tw="🇹🇼 奇鋐 自研 (T1)" />
      <Callout x1="160" y1="100" x2="300" y2="100" label="銅底板 (含 TIM 介面)" tw="🇹🇼 健策 (T2) / 力致 (T2)" align="end" />
      <Callout x1="55" y1="20" x2="300" y2="20" label="散熱鰭片" tw="🇹🇼 建準 / 奇鋐 (T1)" align="end" />
    </DiagramFrame>
  );
}

// ════════════════════════════════════════════════════════════════
// 7. Thermal Liquid — 液冷冷板
// ════════════════════════════════════════════════════════════════
function ThermalLiquidDiagram() {
  return (
    <DiagramFrame title="GPU 液冷冷板 (Direct-to-Chip)" legend="GB200 標配、單片 1.2kW 散熱">
      {/* 冷板外框 */}
      <rect x="40" y="35" width="240" height="120" fill="url(#coldGrad)" stroke="#0c4a6e" strokeWidth="0.6" rx="4" />

      {/* 入口管 (左) */}
      <rect x="20" y="55" width="22" height="10" fill="#0284c7" stroke="#0c4a6e" strokeWidth="0.4" rx="2" />
      <text x="31" y="62" fontSize="4" fill="#fff" textAnchor="middle">IN 25°C</text>

      {/* 出口管 (右) */}
      <rect x="278" y="125" width="22" height="10" fill="#dc2626" stroke="#7f1d1d" strokeWidth="0.4" rx="2" />
      <text x="289" y="132" fontSize="4" fill="#fff" textAnchor="middle">OUT 45°C</text>

      {/* 內部 microchannel (蛇形) */}
      <path
        d="M 50,60 L 90,60 L 90,75 L 50,75 L 50,90 L 90,90 L 90,105 L 50,105 L 50,120 L 90,120 L 90,135 L 50,135
           M 110,60 L 150,60 L 150,75 L 110,75 L 110,90 L 150,90 L 150,105 L 110,105 L 110,120 L 150,120 L 150,135 L 110,135
           M 170,60 L 210,60 L 210,75 L 170,75 L 170,90 L 210,90 L 210,105 L 170,105 L 170,120 L 210,120 L 210,135 L 170,135
           M 230,60 L 270,60 L 270,75 L 230,75 L 230,90 L 270,90 L 270,105 L 230,105 L 230,120 L 270,120 L 270,135"
        fill="none"
        stroke="#fff"
        strokeWidth="1.2"
      />

      {/* 連接 IN 跟蛇形 */}
      <line x1="42" y1="60" x2="50" y2="60" stroke="#fff" strokeWidth="1.5" />
      <line x1="270" y1="135" x2="278" y2="130" stroke="#fff" strokeWidth="1.5" />

      {/* GPU 在下方 (透過冷板看) */}
      <rect x="60" y="160" width="200" height="12" fill={CHIP_FILL} stroke="#000" strokeWidth="0.4" />
      <text x="160" y="169" fontSize="5" fill="#fff" textAnchor="middle">GPU + HBM (B200/GB200)</text>

      {/* TIM 層 */}
      <rect x="60" y="155" width="200" height="3" fill="#fbbf24" stroke="#92400e" strokeWidth="0.2" />
      <text x="270" y="158" fontSize="3" fill="#92400e">← TIM</text>

      <Callout x1="160" y1="95" x2="20" y2="30" label="無氧銅冷板本體" tw="🇹🇼 奇鋐 (T1) / 雙鴻 (T1) / 高力 (T1)" />
      <Callout x1="200" y1="65" x2="300" y2="30" label="Microchannel 微流道" tw="🇹🇼 奇鋐 CNC 加工 (T1)" align="end" />
      <Callout x1="31" y1="60" x2="20" y2="80" label="快接頭 (Quick Disc)" tw="🇹🇼 川湖 (T1) / 健策 (T2)" />
      <Callout x1="289" y1="132" x2="300" y2="150" label="工作液 (PG25 / 純水)" tw="🌐 CoolIT / 🇹🇼 雙鴻 (T1)" align="end" />
      <Callout x1="160" y1="156" x2="20" y2="170" label="TIM 導熱介面" tw="🇹🇼 中砂 (T2) / Honeywell" />
    </DiagramFrame>
  );
}

// ════════════════════════════════════════════════════════════════
// 8. Thermal CDU — 冷卻液分配單元
// ════════════════════════════════════════════════════════════════
function ThermalCduDiagram() {
  return (
    <DiagramFrame title="CDU 冷卻液分配單元 (NVL72 Rack 用)" legend="2.3 MW 散熱能力">
      {/* CDU 機殼 */}
      <rect x="20" y="30" width="280" height="140" fill="#e5e7eb" stroke="#374151" strokeWidth="0.6" rx="4" />
      <text x="160" y="44" fontSize="6" fill="#374151" textAnchor="middle" fontWeight="700">CDU 4U Module</text>

      {/* 板式熱交換器 */}
      <rect x="40" y="55" width="80" height="80" fill={CHIP_FILL} stroke="#000" strokeWidth="0.4" />
      <text x="80" y="80" fontSize="5" fill="#fff" textAnchor="middle" fontWeight="700">板式</text>
      <text x="80" y="90" fontSize="5" fill="#fff" textAnchor="middle" fontWeight="700">熱交換器</text>
      <text x="80" y="105" fontSize="4" fill="#a7f3d0" textAnchor="middle">(不鏽鋼板)</text>
      {/* 板片紋 */}
      {[60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130].map((py, i) => (
        <line key={i} x1="42" y1={py} x2="118" y2={py} stroke="#6b7280" strokeWidth="0.2" />
      ))}

      {/* 二次側泵浦 (中央) */}
      <circle cx="160" cy="80" r="20" fill="#0ea5e9" stroke="#0c4a6e" strokeWidth="0.5" />
      <text x="160" y="79" fontSize="5" fill="#fff" textAnchor="middle" fontWeight="700">泵浦 1</text>
      <text x="160" y="86" fontSize="3.5" fill="#fff" textAnchor="middle">(Pump)</text>

      <circle cx="160" cy="120" r="20" fill="#0ea5e9" stroke="#0c4a6e" strokeWidth="0.5" />
      <text x="160" y="119" fontSize="5" fill="#fff" textAnchor="middle" fontWeight="700">泵浦 2</text>
      <text x="160" y="126" fontSize="3.5" fill="#fff" textAnchor="middle">(冗餘)</text>

      {/* 二次側分歧管 (右) */}
      <rect x="200" y="55" width="14" height="80" fill="#fb923c" stroke="#9a3412" strokeWidth="0.4" rx="2" />
      <text x="207" y="98" fontSize="4" fill="#fff" textAnchor="middle" fontWeight="700">分歧管</text>

      {/* 控制 IC */}
      <rect x="225" y="60" width="55" height="22" fill="#dc2626" stroke="#7f1d1d" strokeWidth="0.3" />
      <text x="252.5" y="73" fontSize="4.5" fill="#fff" textAnchor="middle" fontWeight="700">PLC 控制 + 監測</text>

      {/* 感測器 */}
      <circle cx="240" cy="100" r="4" fill="#facc15" />
      <text x="248" y="102" fontSize="3.5" fill="#374151">溫度</text>
      <circle cx="240" cy="115" r="4" fill="#facc15" />
      <text x="248" y="117" fontSize="3.5" fill="#374151">壓力</text>
      <circle cx="240" cy="130" r="4" fill="#facc15" />
      <text x="248" y="132" fontSize="3.5" fill="#374151">流量</text>

      {/* 一次側 (機房水) IN/OUT */}
      <rect x="3" y="60" width="17" height="8" fill="#06b6d4" />
      <text x="11.5" y="66" fontSize="3.5" fill="#fff" textAnchor="middle">一次 IN</text>
      <rect x="3" y="125" width="17" height="8" fill="#ef4444" />
      <text x="11.5" y="131" fontSize="3.5" fill="#fff" textAnchor="middle">一次 OUT</text>

      {/* 二次側 IN/OUT */}
      <rect x="214" y="55" width="10" height="6" fill="#06b6d4" />
      <text x="219" y="60" fontSize="3" fill="#fff" textAnchor="middle">二 OUT</text>
      <rect x="214" y="130" width="10" height="6" fill="#ef4444" />
      <text x="219" y="135" fontSize="3" fill="#fff" textAnchor="middle">二 IN</text>

      <Callout x1="80" y1="95" x2="20" y2="15" label="板式熱交換器" tw="🇹🇼 高力 (T1)" />
      <Callout x1="160" y1="100" x2="300" y2="15" label="泵浦 ×2 (冗餘)" tw="🌐 Grundfos / 🇹🇼 漢科 (T2)" align="end" />
      <Callout x1="207" y1="100" x2="300" y2="35" label="不鏽鋼分歧管" tw="🇹🇼 雙鴻 (T1) / 健策 (T2)" align="end" />
      <Callout x1="252" y1="72" x2="300" y2="50" label="PLC + 監測系統" tw="🇹🇼 廣達 / 鴻海 自製 (T1)" align="end" />
      <Callout x1="240" y1="115" x2="20" y2="155" label="溫/壓/流量 感測器" tw="🌐 Honeywell / Endress" />
    </DiagramFrame>
  );
}

// ════════════════════════════════════════════════════════════════
// 9. NVLink Switch — GPU 互連
// ════════════════════════════════════════════════════════════════
function NvlinkDiagram() {
  return (
    <DiagramFrame title="NVLink 5 Switch Topology (GB200 NVL72)" legend="72 顆 GPU 全互連、1.8 TB/s/GPU">
      {/* NVLink Switch 在中央 */}
      <rect x="120" y="80" width="80" height="40" fill="#dc2626" stroke="#7f1d1d" strokeWidth="0.5" rx="2" />
      <text x="160" y="98" fontSize="6" fill="#fff" textAnchor="middle" fontWeight="700">NVLink Switch</text>
      <text x="160" y="108" fontSize="5" fill="#fecaca" textAnchor="middle">(NVL-Switch ASIC)</text>
      <text x="160" y="115" fontSize="4" fill="#fef2f2" textAnchor="middle">14.4 TB/s 雙向</text>

      {/* 8 顆 GPU 環繞 */}
      {[
        { x: 30, y: 30, label: "GPU 1" },
        { x: 130, y: 25, label: "GPU 2" },
        { x: 230, y: 30, label: "GPU 3" },
        { x: 270, y: 95, label: "GPU 4" },
        { x: 230, y: 160, label: "GPU 5" },
        { x: 130, y: 170, label: "GPU 6" },
        { x: 30, y: 160, label: "GPU 7" },
        { x: 5, y: 95, label: "GPU 8" },
      ].map((g, i) => (
        <g key={i}>
          <rect x={g.x} y={g.y} width="40" height="22" fill={CHIP_FILL} stroke="#000" strokeWidth="0.3" />
          <text x={g.x + 20} y={g.y + 14} fontSize="5" fill="#fff" textAnchor="middle">{g.label}</text>
          {/* 連接線到 switch */}
          <line x1={g.x + 20} y1={g.y + 11} x2="160" y2="100" stroke="#fbbf24" strokeWidth="0.8" strokeDasharray="2,1" />
        </g>
      ))}

      {/* NVLink ports 在 switch 周圍 */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * 45 * Math.PI) / 180;
        return (
          <circle key={i} cx={160 + 45 * Math.cos(angle)} cy={100 + 22 * Math.sin(angle)} r="2" fill="#fbbf24" stroke="#92400e" strokeWidth="0.3" />
        );
      })}

      <Callout x1="160" y1="100" x2="20" y2="190" label="NVLink Switch ASIC (NVDA 自研)" tw="🌐 TSMC 製造 / 🇹🇼 台積電 4N (T1)" />
      <Callout x1="50" y1="40" x2="320" y2="55" label="GPU die" tw="🇹🇼 台積電 製造 (T1)" align="end" />
      <Callout x1="100" y1="80" x2="20" y2="100" label="NVLink 銅線 (200G/lane)" tw="🇹🇼 嘉澤 (T1) / 信邦 (T1)" />
      <Callout x1="160" y1="120" x2="300" y2="180" label="LGA 連接器 (Switch tray)" tw="🇹🇼 嘉澤 (T1) / 健和興 (T2)" align="end" />
    </DiagramFrame>
  );
}

// ════════════════════════════════════════════════════════════════
// 10. Optical Module — 800G/1.6T 光收發
// ════════════════════════════════════════════════════════════════
function OpticalDiagram() {
  return (
    <DiagramFrame title="QSFP-DD 800G 光收發模組剖面" legend="GB200 Quantum-X 用、1.6T 為 Rubin 用">
      {/* 模組外殼 */}
      <rect x="30" y="60" width="260" height="60" fill="#374151" stroke="#000" strokeWidth="0.5" rx="4" />
      <text x="160" y="55" fontSize="5" fill="#374151" textAnchor="middle" fontWeight="700">QSFP-DD 800G Module</text>

      {/* DSP 晶片 (右側) */}
      <rect x="220" y="75" width="50" height="30" fill="#7c3aed" stroke="#4c1d95" strokeWidth="0.4" />
      <text x="245" y="88" fontSize="5" fill="#fff" textAnchor="middle" fontWeight="700">DSP</text>
      <text x="245" y="98" fontSize="3.5" fill="#ddd6fe" textAnchor="middle">(Broadcom)</text>

      {/* Driver IC */}
      <rect x="185" y="78" width="28" height="22" fill="#dc2626" stroke="#7f1d1d" strokeWidth="0.3" />
      <text x="199" y="91" fontSize="4" fill="#fff" textAnchor="middle">Driver</text>

      {/* Laser TX */}
      <rect x="80" y="78" width="40" height="22" fill="#0ea5e9" stroke="#0c4a6e" strokeWidth="0.4" />
      <text x="100" y="86" fontSize="4" fill="#fff" textAnchor="middle" fontWeight="700">Laser TX</text>
      <text x="100" y="94" fontSize="3.5" fill="#bae6fd" textAnchor="middle">(EML / VCSEL)</text>

      {/* PD RX */}
      <rect x="130" y="78" width="40" height="22" fill="#10b981" stroke="#064e3b" strokeWidth="0.4" />
      <text x="150" y="86" fontSize="4" fill="#fff" textAnchor="middle" fontWeight="700">PIN PD</text>
      <text x="150" y="94" fontSize="3.5" fill="#a7f3d0" textAnchor="middle">(光偵測器)</text>

      {/* 光纖 (左側出來) */}
      <line x1="30" y1="89" x2="2" y2="89" stroke="#fbbf24" strokeWidth="2" />
      <line x1="30" y1="93" x2="2" y2="93" stroke="#fbbf24" strokeWidth="2" />
      <text x="15" y="80" fontSize="4" fill="#92400e" textAnchor="middle">光纖</text>

      {/* TIA */}
      <rect x="150" y="105" width="20" height="10" fill="#f59e0b" stroke="#92400e" strokeWidth="0.3" />
      <text x="160" y="112" fontSize="3.5" fill="#fff" textAnchor="middle">TIA</text>

      {/* 散熱片 (上方) */}
      {Array.from({ length: 30 }).map((_, i) => (
        <line key={i} x1={40 + i * 8} y1="30" x2={40 + i * 8} y2="58" stroke="#9ca3af" strokeWidth="0.5" />
      ))}
      <text x="160" y="42" fontSize="4" fill="#374151" textAnchor="middle">散熱片</text>

      {/* 金手指接腳 (底部) */}
      <rect x="280" y="125" width="20" height="30" fill="#fbbf24" stroke="#92400e" strokeWidth="0.3" />
      <text x="290" y="142" fontSize="3.5" fill="#92400e" textAnchor="middle" fontWeight="700">電氣</text>
      <text x="290" y="148" fontSize="3.5" fill="#92400e" textAnchor="middle">接腳</text>

      <Callout x1="100" y1="89" x2="20" y2="160" label="EML 雷射 (DFB)" tw="🇹🇼 聯亞 (T1)" />
      <Callout x1="150" y1="89" x2="20" y2="175" label="PIN 光偵測器" tw="🇹🇼 聯鈞 (T2)" />
      <Callout x1="245" y1="90" x2="320" y2="60" label="DSP / SerDes" tw="🌐 Broadcom / 🇹🇼 聯發科 (T2)" align="end" />
      <Callout x1="199" y1="90" x2="320" y2="80" label="Driver / TIA" tw="🇹🇼 立積 (T2)" align="end" />
      <Callout x1="15" y1="92" x2="320" y2="105" label="光纖 + LC/MTP 接頭" tw="🇹🇼 上詮 (T1) / 波若威 (T1)" align="end" />
      <Callout x1="290" y1="140" x2="320" y2="155" label="模組組裝 / 高速連接器" tw="🇹🇼 眾達-KY (T1) / 華星光通 (T1)" align="end" />
    </DiagramFrame>
  );
}

// ════════════════════════════════════════════════════════════════
// 11. CPO — Co-Packaged Optics
// ════════════════════════════════════════════════════════════════
function CpoDiagram() {
  return (
    <DiagramFrame title="Co-Packaged Optics (Rubin 採用)" legend="光引擎直接封在 GPU 旁、超低功耗">
      {/* 大封裝外框 */}
      <rect x="35" y="45" width="250" height="90" fill="#1f2937" stroke="#000" strokeWidth="0.5" rx="4" />
      <text x="160" y="38" fontSize="6" fill="#374151" textAnchor="middle" fontWeight="700">CPO Package (一體封裝)</text>

      {/* GPU/Switch ASIC 在中央 */}
      <rect x="115" y="65" width="90" height="50" fill={CHIP_FILL} stroke="#fff" strokeWidth="0.4" />
      <text x="160" y="86" fontSize="6" fill="#fff" textAnchor="middle" fontWeight="700">GPU / Switch ASIC</text>
      <text x="160" y="96" fontSize="4" fill="#a7f3d0" textAnchor="middle">(Rubin / NVSwitch 6)</text>

      {/* Optical Engine ×4 (左右各 2) */}
      {[
        { x: 50, y: 55, label: "OE1" },
        { x: 50, y: 95, label: "OE2" },
        { x: 230, y: 55, label: "OE3" },
        { x: 230, y: 95, label: "OE4" },
      ].map((oe) => (
        <g key={oe.label}>
          <rect x={oe.x} y={oe.y} width="55" height="30" fill="#7c3aed" stroke="#4c1d95" strokeWidth="0.4" />
          <text x={oe.x + 27} y={oe.y + 15} fontSize="5" fill="#fff" textAnchor="middle" fontWeight="700">Optical</text>
          <text x={oe.x + 27} y={oe.y + 22} fontSize="4" fill="#ddd6fe" textAnchor="middle">Engine {oe.label}</text>
        </g>
      ))}

      {/* 光纖排線 (從 OE 出來) */}
      {[
        { x: 50, y: 70 },
        { x: 50, y: 110 },
      ].map((p, i) => (
        <g key={`L${i}`}>
          <line x1={p.x} y1={p.y} x2="10" y2={p.y} stroke="#fbbf24" strokeWidth="1.5" />
        </g>
      ))}
      {[
        { x: 285, y: 70 },
        { x: 285, y: 110 },
      ].map((p, i) => (
        <g key={`R${i}`}>
          <line x1={p.x} y1={p.y} x2="318" y2={p.y} stroke="#fbbf24" strokeWidth="1.5" />
        </g>
      ))}

      {/* 外部 Laser 光源 (External Laser Source) */}
      <rect x="2" y="130" width="40" height="15" fill="#dc2626" stroke="#7f1d1d" strokeWidth="0.3" />
      <text x="22" y="140" fontSize="3.5" fill="#fff" textAnchor="middle" fontWeight="700">外部雷射</text>

      {/* ABF Substrate 在底 */}
      <rect x="30" y="135" width="260" height="10" fill={SUB_FILL} stroke="#064e3b" strokeWidth="0.3" />
      {Array.from({ length: 22 }).map((_, i) => (
        <circle key={i} cx={36 + i * 12} cy="150" r="2" fill="#9ca3af" stroke="#4b5563" strokeWidth="0.2" />
      ))}

      <Callout x1="160" y1="90" x2="20" y2="25" label="GPU/Switch (Rubin)" tw="🇹🇼 台積電 N3/N2 (T1)" />
      <Callout x1="77" y1="70" x2="320" y2="35" label="Photonic IC + 矽光元件" tw="🇹🇼 台積電 SoIC + 聯亞 雷射 (T1)" align="end" />
      <Callout x1="22" y1="138" x2="20" y2="170" label="外部光源 (DFB 雷射)" tw="🇹🇼 聯亞 (T1) / 華星光通 (T1)" />
      <Callout x1="160" y1="142" x2="320" y2="170" label="ABF + CoWoS 封裝" tw="🇹🇼 欣興 + 台積電 (T1)" align="end" />
      <Callout x1="10" y1="70" x2="20" y2="50" label="光纖陣列 (FAU)" tw="🇹🇼 上詮 (T1)" />
    </DiagramFrame>
  );
}

// ════════════════════════════════════════════════════════════════
// 12. ASIC IP — 客製化 ASIC 設計
// ════════════════════════════════════════════════════════════════
function AsicIpDiagram() {
  return (
    <DiagramFrame title="ASIC 設計 IP 拼圖 (世芯/創意/智原 流程)" legend="自研晶片靠 IP block + 設計服務">
      {/* 大晶片外框 */}
      <rect x="40" y="30" width="240" height="140" fill="#1f2937" stroke="#000" strokeWidth="0.6" rx="4" />
      <text x="160" y="44" fontSize="6" fill="#fff" textAnchor="middle" fontWeight="700">ASIC Die (Hyperscaler 自研)</text>

      {/* 中央：計算核心 */}
      <rect x="100" y="60" width="120" height="60" fill="#7c3aed" stroke="#4c1d95" strokeWidth="0.4" rx="2" />
      <text x="160" y="82" fontSize="6" fill="#fff" textAnchor="middle" fontWeight="700">Compute Core</text>
      <text x="160" y="92" fontSize="4" fill="#ddd6fe" textAnchor="middle">(自研 TPU/Tensor Engine)</text>
      <text x="160" y="100" fontSize="3.5" fill="#c4b5fd" textAnchor="middle">— Google TPU / AWS Trainium —</text>

      {/* IP blocks 四週 */}
      <rect x="50" y="55" width="42" height="22" fill="#10b981" stroke="#064e3b" strokeWidth="0.3" />
      <text x="71" y="68" fontSize="4" fill="#fff" textAnchor="middle" fontWeight="700">HBM PHY</text>
      <text x="71" y="74" fontSize="3" fill="#a7f3d0" textAnchor="middle">(Cadence)</text>

      <rect x="50" y="95" width="42" height="22" fill="#10b981" stroke="#064e3b" strokeWidth="0.3" />
      <text x="71" y="108" fontSize="4" fill="#fff" textAnchor="middle" fontWeight="700">PCIe 6 PHY</text>

      <rect x="50" y="135" width="42" height="22" fill="#0ea5e9" stroke="#0c4a6e" strokeWidth="0.3" />
      <text x="71" y="148" fontSize="4" fill="#fff" textAnchor="middle" fontWeight="700">SerDes 224G</text>
      <text x="71" y="154" fontSize="3" fill="#bae6fd" textAnchor="middle">(Synopsys)</text>

      <rect x="228" y="55" width="42" height="22" fill="#dc2626" stroke="#7f1d1d" strokeWidth="0.3" />
      <text x="249" y="68" fontSize="4" fill="#fff" textAnchor="middle" fontWeight="700">eFuse / OTP</text>
      <text x="249" y="74" fontSize="3" fill="#fecaca" textAnchor="middle">(力旺)</text>

      <rect x="228" y="95" width="42" height="22" fill="#dc2626" stroke="#7f1d1d" strokeWidth="0.3" />
      <text x="249" y="108" fontSize="4" fill="#fff" textAnchor="middle" fontWeight="700">SRAM</text>
      <text x="249" y="114" fontSize="3" fill="#fecaca" textAnchor="middle">(M31)</text>

      <rect x="228" y="135" width="42" height="22" fill="#f59e0b" stroke="#92400e" strokeWidth="0.3" />
      <text x="249" y="148" fontSize="4" fill="#fff" textAnchor="middle" fontWeight="700">USB / 控制</text>
      <text x="249" y="154" fontSize="3" fill="#fef3c7" textAnchor="middle">(智原)</text>

      {/* 連接線 IP → core */}
      <line x1="92" y1="66" x2="100" y2="80" stroke="#6b7280" strokeWidth="0.4" strokeDasharray="2,1" />
      <line x1="92" y1="106" x2="100" y2="90" stroke="#6b7280" strokeWidth="0.4" strokeDasharray="2,1" />
      <line x1="92" y1="146" x2="100" y2="100" stroke="#6b7280" strokeWidth="0.4" strokeDasharray="2,1" />
      <line x1="228" y1="66" x2="220" y2="80" stroke="#6b7280" strokeWidth="0.4" strokeDasharray="2,1" />
      <line x1="228" y1="106" x2="220" y2="90" stroke="#6b7280" strokeWidth="0.4" strokeDasharray="2,1" />
      <line x1="228" y1="146" x2="220" y2="100" stroke="#6b7280" strokeWidth="0.4" strokeDasharray="2,1" />

      <Callout x1="160" y1="90" x2="20" y2="25" label="客製化 Compute Core" tw="🇹🇼 世芯-KY (T1) / 創意電子 (T1) — 設計服務" />
      <Callout x1="71" y1="66" x2="20" y2="55" label="HBM / PCIe PHY" tw="🌐 Cadence / Synopsys IP" />
      <Callout x1="71" y1="146" x2="320" y2="55" label="SerDes 高速介面" tw="🌐 Synopsys / 🇹🇼 智原 (T1)" align="end" />
      <Callout x1="249" y1="66" x2="320" y2="85" label="eFuse OTP" tw="🇹🇼 力旺 (T1) 獨家技術" align="end" />
      <Callout x1="249" y1="106" x2="320" y2="115" label="SRAM Compiler" tw="🇹🇼 M31 (T2)" align="end" />
      <Callout x1="249" y1="146" x2="320" y2="145" label="USB / I2C / SPI IP" tw="🇹🇼 智原 (T1)" align="end" />
    </DiagramFrame>
  );
}

// ════════════════════════════════════════════════════════════════
// 13. ODM HGX — 8-GPU 基板
// ════════════════════════════════════════════════════════════════
function OdmHgxDiagram() {
  return (
    <DiagramFrame title="HGX H200/B200 8-GPU 模組俯視" legend="OAM 模組 ×8 + UBB 基板 — ODM 整機組裝">
      {/* 大 UBB 基板 */}
      <rect x="20" y="30" width="280" height="140" fill={boardFill} stroke="#14532d" strokeWidth="0.5" rx="3" />
      <text x="160" y="42" fontSize="5" fill="#fff" textAnchor="middle" fontWeight="700">UBB (Universal Baseboard)</text>

      {/* 8 顆 OAM 模組 (GPU + HBM + ABF) */}
      {Array.from({ length: 8 }).map((_, i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        const x = 35 + col * 65;
        const y = 60 + row * 55;
        return (
          <g key={i}>
            <rect x={x} y={y} width="55" height="45" fill="#1f2937" stroke="#fff" strokeWidth="0.3" rx="1" />
            <text x={x + 27.5} y={y + 25} fontSize="5" fill="#fff" textAnchor="middle" fontWeight="700">GPU {i + 1}</text>
            <text x={x + 27.5} y={y + 35} fontSize="3.5" fill="#a7f3d0" textAnchor="middle">OAM 模組</text>

            {/* HBM 在 GPU 周圍 (簡化) */}
            <rect x={x + 2} y={y + 5} width="8" height="3" fill={HBM_FILL} />
            <rect x={x + 12} y={y + 5} width="8" height="3" fill={HBM_FILL} />
            <rect x={x + 45} y={y + 5} width="8" height="3" fill={HBM_FILL} />
            <rect x={x + 35} y={y + 5} width="8" height="3" fill={HBM_FILL} />
          </g>
        );
      })}

      {/* NVSwitch (中央偏下) */}
      <rect x="120" y="160" width="80" height="7" fill="#dc2626" stroke="#7f1d1d" strokeWidth="0.3" />
      <text x="160" y="165" fontSize="3.5" fill="#fff" textAnchor="middle" fontWeight="700">NVSwitch ×4</text>

      <Callout x1="62" y1="80" x2="20" y2="15" label="OAM GPU 模組 ×8" tw="🇹🇼 廣達 (T1) / 緯穎 (T1) — 主力 ODM" />
      <Callout x1="160" y1="100" x2="320" y2="15" label="UBB 大型多層 PCB" tw="🇹🇼 健鼎 (T2) / 金像電 (T2)" align="end" />
      <Callout x1="160" y1="165" x2="320" y2="50" label="NVSwitch ASIC" tw="🇹🇼 台積電 (T1)" align="end" />
      <Callout x1="50" y1="65" x2="20" y2="55" label="GPU 模組打件" tw="🇹🇼 京元電子 (T1) / 日月光 (T1)" />
      <Callout x1="100" y1="170" x2="320" y2="120" label="整機組裝 + 測試" tw="🇹🇼 廣達 / 緯創 / 緯穎 / 鴻海 (T1)" align="end" />
      <Callout x1="100" y1="80" x2="20" y2="95" label="連接器 (高速 / 電源)" tw="🇹🇼 嘉澤 (T1) / 信邦 (T1)" />
    </DiagramFrame>
  );
}

// ════════════════════════════════════════════════════════════════
// 14. ODM Rack — NVL72 機架
// ════════════════════════════════════════════════════════════════
function OdmRackDiagram() {
  return (
    <DiagramFrame title="GB200 NVL72 機架 (1.4 噸 / 120kW)" legend="18 個 Compute Tray + 9 個 Switch Tray + CDU">
      {/* 機架外框 */}
      <rect x="80" y="20" width="160" height="170" fill="#374151" stroke="#000" strokeWidth="0.8" rx="3" />
      <text x="160" y="32" fontSize="5" fill="#fff" textAnchor="middle" fontWeight="700">NVL72 Rack</text>

      {/* Compute Trays (18個) */}
      {Array.from({ length: 18 }).map((_, i) => {
        const y = 38 + i * 4.5;
        const isSwitch = [4, 8, 12, 16, 20].includes(i + 1);
        return (
          <g key={i}>
            <rect x="85" y={y} width="150" height="3.8" fill={isSwitch ? "#dc2626" : "#0ea5e9"} stroke="#000" strokeWidth="0.1" />
            <text x="90" y={y + 2.8} fontSize="2.5" fill="#fff">{isSwitch ? "Switch" : "Compute"}</text>
            <text x="230" y={y + 2.8} fontSize="2.5" fill="#fff" textAnchor="end">{`#${i + 1}`}</text>
          </g>
        );
      })}

      {/* PDU 在右側 */}
      <rect x="244" y="30" width="20" height="160" fill="#7c3aed" stroke="#4c1d95" strokeWidth="0.4" />
      <text x="254" y="105" fontSize="4" fill="#fff" textAnchor="middle" transform="rotate(-90 254 105)">PDU 33×PSU</text>

      {/* CDU 在底部 */}
      <rect x="80" y="170" width="160" height="20" fill="#0e7490" stroke="#0c4a6e" strokeWidth="0.5" />
      <text x="160" y="182" fontSize="4" fill="#fff" textAnchor="middle" fontWeight="700">CDU 冷卻液分配 (4U)</text>

      {/* 銅排 NVLink Spine (左側) */}
      <rect x="56" y="30" width="20" height="135" fill="#fb923c" stroke="#9a3412" strokeWidth="0.4" />
      <text x="66" y="98" fontSize="3.5" fill="#fff" textAnchor="middle" transform="rotate(-90 66 98)">NVLink Spine</text>

      {/* 機房水入/出 */}
      <rect x="0" y="170" width="55" height="6" fill="#06b6d4" />
      <text x="27" y="174" fontSize="3" fill="#fff" textAnchor="middle">機房冷水 IN</text>
      <rect x="0" y="180" width="55" height="6" fill="#ef4444" />
      <text x="27" y="184" fontSize="3" fill="#fff" textAnchor="middle">機房熱水 OUT</text>

      <Callout x1="160" y1="60" x2="320" y2="40" label="Compute Tray ×18 (2x Grace + 4x B200)" tw="🇹🇼 廣達 (T1) / 鴻海 (T1)" align="end" />
      <Callout x1="160" y1="100" x2="320" y2="80" label="NVSwitch Tray ×9" tw="🇹🇼 廣達 / 緯穎 (T1)" align="end" />
      <Callout x1="66" y1="98" x2="20" y2="20" label="NVLink Spine 銅排" tw="🇹🇼 嘉澤 (T1) — 5000+ pin" />
      <Callout x1="254" y1="105" x2="320" y2="120" label="PDU + 33 顆 PSU" tw="🇹🇼 台達電 (T1) / 光寶 (T1)" align="end" />
      <Callout x1="160" y1="180" x2="320" y2="155" label="CDU 液冷" tw="🇹🇼 高力 (T1) / 雙鴻 (T1)" align="end" />
      <Callout x1="160" y1="100" x2="20" y2="155" label="機箱 + 滑軌 + 風扇" tw="🇹🇼 勤誠 (T1) / 川湖 (T1) / 建準 (T1)" />
    </DiagramFrame>
  );
}

// ════════════════════════════════════════════════════════════════
// 15. Connector — 高速連接器
// ════════════════════════════════════════════════════════════════
function ConnectorDiagram() {
  return (
    <DiagramFrame title="高速連接器 (NVLink / PCIe Gen6)" legend="224 Gbps/lane、嘉澤主力">
      {/* 公端 (插頭) */}
      <rect x="30" y="60" width="100" height="50" fill="#1f2937" stroke="#000" strokeWidth="0.5" rx="3" />
      <text x="80" y="50" fontSize="5" fill="#374151" textAnchor="middle" fontWeight="700">Plug (公頭)</text>

      {/* Pin 接腳 */}
      {Array.from({ length: 10 }).map((_, i) => (
        <g key={i}>
          <rect x={35 + i * 9} y="65" width="6" height="40" fill="#fbbf24" stroke="#92400e" strokeWidth="0.2" />
        </g>
      ))}
      {Array.from({ length: 10 }).map((_, i) => (
        <g key={`r${i}`}>
          <rect x={35 + i * 9} y="65" width="6" height="3" fill="#dc2626" />
        </g>
      ))}

      {/* 母端 (Socket) */}
      <rect x="180" y="55" width="100" height="60" fill="#374151" stroke="#000" strokeWidth="0.5" rx="3" />
      <text x="230" y="50" fontSize="5" fill="#374151" textAnchor="middle" fontWeight="700">Socket (母座)</text>

      {/* Socket pins */}
      {Array.from({ length: 10 }).map((_, i) => (
        <g key={`s${i}`}>
          <rect x={185 + i * 9} y="60" width="6" height="50" fill="#9ca3af" stroke="#374151" strokeWidth="0.2" />
          <circle cx={188 + i * 9} cy="75" r="2" fill="#fbbf24" />
        </g>
      ))}

      {/* PCB 焊接 */}
      <rect x="170" y="115" width="120" height="6" fill={boardFill} stroke="#14532d" strokeWidth="0.3" />
      {Array.from({ length: 10 }).map((_, i) => (
        <circle key={i} cx={188 + i * 9} cy="120" r="1.5" fill="#fbbf24" stroke="#92400e" strokeWidth="0.2" />
      ))}

      {/* Cable */}
      <path d="M 30 85 Q 10 85 5 120 L 5 180" fill="none" stroke="#0c4a6e" strokeWidth="6" />
      <path d="M 30 85 Q 10 85 5 120 L 5 180" fill="none" stroke="#0ea5e9" strokeWidth="3" />
      <text x="20" y="155" fontSize="3.5" fill="#0c4a6e">高速雙絞</text>
      <text x="20" y="162" fontSize="3.5" fill="#0c4a6e">cable</text>

      <Callout x1="80" y1="85" x2="20" y2="30" label="導電端子 (LGA pin)" tw="🇹🇼 嘉澤 (T1) — 鍍金/鍍鈀" />
      <Callout x1="230" y1="75" x2="320" y2="30" label="Socket 殼體 (LCP/PPS)" tw="🇹🇼 嘉澤 自製 (T1)" align="end" />
      <Callout x1="230" y1="118" x2="320" y2="105" label="SMT 焊接到 PCB" tw="🇹🇼 健鼎 PCB (T2)" align="end" />
      <Callout x1="5" y1="140" x2="320" y2="140" label="高速雙絞 cable (224G)" tw="🇹🇼 信邦 (T1) / 嘉聯益 (T2)" align="end" />
      <Callout x1="80" y1="85" x2="320" y2="170" label="連接器組裝測試" tw="🇹🇼 健和興 (T2) / 信邦 (T1)" align="end" />
    </DiagramFrame>
  );
}

// ════════════════════════════════════════════════════════════════
// Diagram Dispatcher — 依 component ID 回傳對應圖
// ════════════════════════════════════════════════════════════════
const DIAGRAM_MAP: Record<string, React.FC> = {
  hbm: HBMDiagram,
  cowos: () => <CoWoSDiagram withBridge={false} />,
  "cowos-l": () => <CoWoSDiagram withBridge={true} />,
  "abf-substrate": AbfDiagram,
  "power-semi": PowerSemiDiagram,
  "power-psu": PowerPsuDiagram,
  "thermal-3dvc": Thermal3DVCDiagram,
  "thermal-liquid": ThermalLiquidDiagram,
  "thermal-cdu": ThermalCduDiagram,
  "networking-nvlink": NvlinkDiagram,
  "networking-optical": OpticalDiagram,
  "networking-cpo": CpoDiagram,
  "asic-ip": AsicIpDiagram,
  "odm-hgx": OdmHgxDiagram,
  "odm-rack": OdmRackDiagram,
  connector: ConnectorDiagram,
};

export function NvdaComponentDiagram({ componentId }: { componentId: string }) {
  const Comp = DIAGRAM_MAP[componentId];
  if (!Comp) return null;
  return <Comp />;
}

export function hasNvdaDiagram(componentId: string) {
  return componentId in DIAGRAM_MAP;
}
