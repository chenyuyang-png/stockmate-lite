"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type LineData,
  type HistogramData,
  type Time,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
} from "lightweight-charts";
import type { OHLC } from "@/lib/types";
import { sma, bbands, rsi, macd, kd } from "@/lib/indicators";

type Range = "5d" | "1mo" | "3mo" | "6mo" | "1y" | "2y" | "5y" | "max";
type Interval = "1d" | "1wk" | "1mo";
type Oscillator = "rsi" | "macd" | "kd" | null;

const RANGE_LABELS: { id: Range; label: string }[] = [
  { id: "5d", label: "5日" },
  { id: "1mo", label: "1月" },
  { id: "3mo", label: "3月" },
  { id: "6mo", label: "6月" },
  { id: "1y", label: "1年" },
  { id: "2y", label: "2年" },
  { id: "5y", label: "5年" },
  { id: "max", label: "全部" },
];

const INTERVAL_LABELS: { id: Interval; label: string }[] = [
  { id: "1d", label: "日" },
  { id: "1wk", label: "週" },
  { id: "1mo", label: "月" },
];

type Props = {
  symbol: string;
};

export function StockChart({ symbol }: Props) {
  const [range, setRange] = useState<Range>("6mo");
  const [interval, setInterval] = useState<Interval>("1d");
  const [data, setData] = useState<OHLC[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMA5, setShowMA5] = useState(true);
  const [showMA20, setShowMA20] = useState(true);
  const [showMA60, setShowMA60] = useState(true);
  const [showBB, setShowBB] = useState(false);
  const [osc, setOsc] = useState<Oscillator>(null);

  // 主圖容器與圖表
  const mainRef = useRef<HTMLDivElement>(null);
  const oscRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/chart?symbol=${encodeURIComponent(symbol)}&range=${range}&interval=${interval}`, {
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((res) => {
        if (cancelled) return;
        setData(res.data ?? []);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [symbol, range, interval]);

  // 把 OHLC 拆成主圖需要的格式
  const chartData = useMemo(() => {
    const candles: CandlestickData[] = data.map((d) => ({
      time: d.time as Time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));
    const volumes: HistogramData[] = data.map((d) => ({
      time: d.time as Time,
      value: d.volume ?? 0,
      color: d.close >= d.open ? "rgba(220, 38, 38, 0.4)" : "rgba(22, 163, 74, 0.4)",
    }));
    const closes = data.map((d) => d.close);
    const highs = data.map((d) => d.high);
    const lows = data.map((d) => d.low);

    const ma5 = sma(closes, 5);
    const ma20 = sma(closes, 20);
    const ma60 = sma(closes, 60);
    const bb = bbands(closes, 20, 2);
    const rsiVals = rsi(closes, 14);
    const macdVals = macd(closes);
    const kdVals = kd(highs, lows, closes);

    const toLine = (arr: number[]): LineData[] =>
      arr
        .map((v, i) => ({ time: data[i].time as Time, value: v }))
        .filter((p) => Number.isFinite(p.value)) as LineData[];

    return {
      candles,
      volumes,
      ma5: toLine(ma5),
      ma20: toLine(ma20),
      ma60: toLine(ma60),
      bbUpper: toLine(bb.upper),
      bbMid: toLine(bb.middle),
      bbLower: toLine(bb.lower),
      rsi: toLine(rsiVals),
      macdLine: toLine(macdVals.macd),
      macdSignal: toLine(macdVals.signal),
      macdHist: macdVals.histogram
        .map((v, i) => ({
          time: data[i].time as Time,
          value: v,
          color: v >= 0 ? "rgba(220, 38, 38, 0.7)" : "rgba(22, 163, 74, 0.7)",
        }))
        .filter((p) => Number.isFinite(p.value)) as HistogramData[],
      k: toLine(kdVals.k),
      d: toLine(kdVals.d),
    };
  }, [data]);

  // === 主圖（K 線 + 成交量 + MA + BB） ===
  useEffect(() => {
    if (!mainRef.current || chartData.candles.length === 0) return;
    const chart = createChart(mainRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#ffffff" },
        textColor: "#6b7280",
      },
      grid: {
        vertLines: { color: "#e5e7eb" },
        horzLines: { color: "#e5e7eb" },
      },
      timeScale: { borderColor: "#d1d5db", timeVisible: false },
      rightPriceScale: { borderColor: "#d1d5db" },
      crosshair: { mode: 1 },
      height: 400,
      width: mainRef.current.clientWidth,
    });

    const cleanup: Array<() => void> = [];

    const candleSeries: ISeriesApi<"Candlestick"> = chart.addSeries(CandlestickSeries, {
      upColor: "#dc2626",
      downColor: "#16a34a",
      borderUpColor: "#dc2626",
      borderDownColor: "#16a34a",
      wickUpColor: "#dc2626",
      wickDownColor: "#16a34a",
    });
    candleSeries.setData(chartData.candles);

    const volSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });
    volSeries.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
    volSeries.setData(chartData.volumes);

    if (showMA5) {
      const s = chart.addSeries(LineSeries, { color: "#fbbf24", lineWidth: 1, title: "MA5" });
      s.setData(chartData.ma5);
    }
    if (showMA20) {
      const s = chart.addSeries(LineSeries, { color: "#a78bfa", lineWidth: 1, title: "MA20" });
      s.setData(chartData.ma20);
    }
    if (showMA60) {
      const s = chart.addSeries(LineSeries, { color: "#60a5fa", lineWidth: 1, title: "MA60" });
      s.setData(chartData.ma60);
    }
    if (showBB) {
      const u = chart.addSeries(LineSeries, {
        color: "rgba(244, 114, 182, 0.6)",
        lineWidth: 1,
        title: "BB上",
      });
      u.setData(chartData.bbUpper);
      const m = chart.addSeries(LineSeries, {
        color: "rgba(244, 114, 182, 0.4)",
        lineWidth: 1,
        title: "BB中",
        lineStyle: 2,
      });
      m.setData(chartData.bbMid);
      const l = chart.addSeries(LineSeries, {
        color: "rgba(244, 114, 182, 0.6)",
        lineWidth: 1,
        title: "BB下",
      });
      l.setData(chartData.bbLower);
    }

    chart.timeScale().fitContent();

    const ro = new ResizeObserver(() => {
      if (mainRef.current) chart.applyOptions({ width: mainRef.current.clientWidth });
    });
    ro.observe(mainRef.current);
    cleanup.push(() => ro.disconnect());
    cleanup.push(() => chart.remove());

    return () => cleanup.forEach((fn) => fn());
  }, [chartData, showMA5, showMA20, showMA60, showBB]);

  // === 副圖（指標振盪器） ===
  useEffect(() => {
    if (!oscRef.current || osc === null || chartData.candles.length === 0) return;
    const chart = createChart(oscRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#ffffff" },
        textColor: "#6b7280",
      },
      grid: {
        vertLines: { color: "#e5e7eb" },
        horzLines: { color: "#e5e7eb" },
      },
      timeScale: { borderColor: "#d1d5db", timeVisible: false },
      rightPriceScale: { borderColor: "#d1d5db" },
      height: 160,
      width: oscRef.current.clientWidth,
    });

    const cleanup: Array<() => void> = [];

    if (osc === "rsi") {
      const s = chart.addSeries(LineSeries, { color: "#f97316", lineWidth: 2, title: "RSI(14)" });
      s.setData(chartData.rsi);
      // 70/30 線：lightweight-charts 沒有直接的 horizontal lines，可用 createPriceLine
      s.createPriceLine({
        price: 70,
        color: "rgba(22, 163, 74, 0.5)",
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: "70",
      });
      s.createPriceLine({
        price: 30,
        color: "rgba(220, 38, 38, 0.5)",
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: "30",
      });
    } else if (osc === "macd") {
      const hist = chart.addSeries(HistogramSeries, { title: "MACD柱" });
      hist.setData(chartData.macdHist);
      const line = chart.addSeries(LineSeries, {
        color: "#60a5fa",
        lineWidth: 1,
        title: "MACD",
      });
      line.setData(chartData.macdLine);
      const sig = chart.addSeries(LineSeries, {
        color: "#f97316",
        lineWidth: 1,
        title: "Signal",
      });
      sig.setData(chartData.macdSignal);
    } else if (osc === "kd") {
      const k = chart.addSeries(LineSeries, { color: "#3b82f6", lineWidth: 2, title: "K" });
      k.setData(chartData.k);
      const d = chart.addSeries(LineSeries, { color: "#f97316", lineWidth: 2, title: "D" });
      d.setData(chartData.d);
      k.createPriceLine({
        price: 80,
        color: "rgba(22, 163, 74, 0.5)",
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: "80",
      });
      k.createPriceLine({
        price: 20,
        color: "rgba(220, 38, 38, 0.5)",
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: "20",
      });
    }

    chart.timeScale().fitContent();

    const ro = new ResizeObserver(() => {
      if (oscRef.current) chart.applyOptions({ width: oscRef.current.clientWidth });
    });
    ro.observe(oscRef.current);
    cleanup.push(() => ro.disconnect());
    cleanup.push(() => chart.remove());

    return () => cleanup.forEach((fn) => fn());
  }, [chartData, osc]);

  return (
    <div className="space-y-3">
      {/* 控制列 */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <ButtonGroup label="期間">
          {RANGE_LABELS.map((r) => (
            <Btn key={r.id} active={range === r.id} onClick={() => setRange(r.id)}>
              {r.label}
            </Btn>
          ))}
        </ButtonGroup>
        <ButtonGroup label="K">
          {INTERVAL_LABELS.map((i) => (
            <Btn key={i.id} active={interval === i.id} onClick={() => setInterval(i.id)}>
              {i.label}
            </Btn>
          ))}
        </ButtonGroup>
        <ButtonGroup label="均線">
          <Toggle label="MA5" active={showMA5} onChange={setShowMA5} color="#fbbf24" />
          <Toggle label="MA20" active={showMA20} onChange={setShowMA20} color="#a78bfa" />
          <Toggle label="MA60" active={showMA60} onChange={setShowMA60} color="#60a5fa" />
          <Toggle label="布林" active={showBB} onChange={setShowBB} color="#f472b6" />
        </ButtonGroup>
        <ButtonGroup label="指標">
          <Btn active={osc === null} onClick={() => setOsc(null)}>無</Btn>
          <Btn active={osc === "rsi"} onClick={() => setOsc("rsi")}>RSI</Btn>
          <Btn active={osc === "macd"} onClick={() => setOsc("macd")}>MACD</Btn>
          <Btn active={osc === "kd"} onClick={() => setOsc("kd")}>KD</Btn>
        </ButtonGroup>
      </div>

      {loading && data.length === 0 ? (
        <div className="flex h-[400px] items-center justify-center rounded-lg border border-gray-200 bg-white text-sm text-gray-500">
          載入 K 線資料中…
        </div>
      ) : (
        <>
          <div ref={mainRef} className="overflow-hidden rounded-lg border border-gray-200" />
          {osc !== null && (
            <div ref={oscRef} className="overflow-hidden rounded-lg border border-gray-200" />
          )}
        </>
      )}
    </div>
  );
}

function ButtonGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] uppercase text-gray-400">{label}</span>
      <div className="flex gap-0.5 rounded-md border border-gray-200 bg-gray-100 p-0.5">
        {children}
      </div>
    </div>
  );
}

function Btn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded px-2 py-0.5 text-xs ${
        active ? "bg-zinc-700 text-gray-800" : "text-gray-500 hover:text-gray-700"
      }`}
    >
      {children}
    </button>
  );
}

function Toggle({
  label,
  active,
  onChange,
  color,
}: {
  label: string;
  active: boolean;
  onChange: (v: boolean) => void;
  color: string;
}) {
  return (
    <button
      onClick={() => onChange(!active)}
      className={`flex items-center gap-1 rounded px-2 py-0.5 text-xs ${
        active ? "bg-zinc-700 text-gray-800" : "text-gray-500 hover:text-gray-700"
      }`}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ background: active ? color : "#9ca3af" }}
      />
      {label}
    </button>
  );
}
