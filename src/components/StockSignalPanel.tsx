"use client";

import { useEffect, useState } from "react";
import { Activity, AlertTriangle, TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";
import type { HoldingSignal, SignalItem } from "@/app/api/holding-signals/route";
import { PaywallBlur } from "./PaywallBlur";
import { InvestmentDisclaimer } from "./InvestmentDisclaimer";

type Props = {
  symbol: string;
};

const CAT_LABELS: Record<keyof Pick<HoldingSignal, "warnings" | "technical" | "institutional" | "fundamental" | "news">, string> = {
  warnings: "⚠️ 警示",
  technical: "📈 技術面",
  institutional: "🏛️ 籌碼面",
  fundamental: "📊 基本面",
  news: "📰 新聞情緒",
};

// 個股版自動體檢 — 跟 HoldingsAnalysis 同邏輯，但只看一檔
export function StockSignalPanel({ symbol }: Props) {
  const [signal, setSignal] = useState<HoldingSignal | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/holding-signals?symbol=${encodeURIComponent(symbol)}`);
      const data = (await res.json()) as HoldingSignal;
      setSignal(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol]);

  if (loading && !signal)
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 text-center text-sm text-gray-500">
        整理個股指標狀態中…
      </div>
    );
  if (!signal) return null;

  // 指標排列狀態（純技術描述，非投資建議）
  const overallStyle = {
    強多: { bg: "bg-red-100", border: "border-red-300", text: "text-red-800", icon: "📊", label: "指標多頭排列（強）" },
    偏多: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", icon: "📊", label: "指標偏多排列" },
    中性: { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-600", icon: "📊", label: "指標中性排列" },
    偏空: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", icon: "📊", label: "指標偏空排列" },
    強空: { bg: "bg-green-100", border: "border-green-300", text: "text-green-800", icon: "📊", label: "指標空頭排列（強）" },
  }[signal.overall];

  const categories: (keyof typeof CAT_LABELS)[] = [
    "warnings",
    "technical",
    "institutional",
    "fundamental",
    "news",
  ];

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <header className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-800">技術指標狀態總覽</h3>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1 rounded-md border px-3 py-1 ${overallStyle.bg} ${overallStyle.border}`}
            title="純技術指標排列狀態描述，非投資建議"
          >
            <span className="text-base">{overallStyle.icon}</span>
            <span className={`text-xs font-bold ${overallStyle.text}`}>{overallStyle.label}</span>
            <span className="text-[10px] text-gray-500 tabular-nums">
              ({signal.totalScore >= 0 ? "+" : ""}
              {signal.totalScore})
            </span>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      {/* 處置警示 — 優先顯示 */}
      {signal.warnings.length > 0 && (
        <div className="mb-3 rounded border border-amber-300 bg-amber-50 px-3 py-2">
          {signal.warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-1 text-xs text-amber-900">
              <AlertTriangle size={12} className="mt-0.5 shrink-0" />
              <div>
                <span className="font-bold">{w.label}</span>
                {w.detail && <span className="ml-1">— {w.detail}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 按面向分類顯示（Pro+ 才能看細項）*/}
      <PaywallBlur
        requireTier="pro"
        featureLabel="技術 / 籌碼 / 基本面 / 新聞 — 完整指標狀態"
        hint="升級 Pro 讓 AI 一次彙整 5 面向資料 — 省下自己查財報、看法人籌碼的時間"
      >
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {categories
            .filter((c) => c !== "warnings" && signal[c].length > 0)
            .map((cat) => (
              <div
                key={cat}
                className="rounded-md border border-gray-200 bg-gray-50 p-2.5"
              >
                <div className="mb-1.5 text-[11px] font-semibold text-gray-600">
                  {CAT_LABELS[cat]}
                </div>
                <ul className="space-y-1">
                  {signal[cat].map((s, i) => (
                    <SignalRow key={i} signal={s} />
                  ))}
                </ul>
              </div>
            ))}

          {signal.warnings.length === 0 &&
            signal.technical.length === 0 &&
            signal.institutional.length === 0 &&
            signal.fundamental.length === 0 &&
            signal.news.length === 0 && (
              <p className="col-span-full py-3 text-center text-sm text-gray-500">
                目前無顯著訊號
              </p>
            )}
        </div>
      </PaywallBlur>

      <div className="mt-3">
        <InvestmentDisclaimer variant="compact" />
      </div>

      <p className="mt-2 text-[10px] text-gray-400">
        ⚠️ 規則式自動判讀，僅供分析參考。整體訊號 = 各分項分數加總後分級。
      </p>
    </section>
  );
}

function SignalRow({ signal }: { signal: SignalItem }) {
  const Icon = signal.tone === "bull" ? TrendingUp : signal.tone === "bear" ? TrendingDown : Minus;
  const color =
    signal.tone === "bull"
      ? "text-red-700"
      : signal.tone === "bear"
        ? "text-green-700"
        : "text-gray-600";
  return (
    <li className="flex items-start gap-1.5 text-xs">
      <Icon size={11} className={`mt-0.5 shrink-0 ${color}`} />
      <div className="flex-1">
        <div className="flex items-baseline gap-1">
          <span className={`font-semibold ${color}`}>{signal.label}</span>
          <span className="text-[10px] tabular-nums text-gray-400">
            {signal.score >= 0 ? "+" : ""}
            {signal.score}
          </span>
        </div>
        {signal.detail && (
          <div className="text-[10px] leading-snug text-gray-500">{signal.detail}</div>
        )}
      </div>
    </li>
  );
}
