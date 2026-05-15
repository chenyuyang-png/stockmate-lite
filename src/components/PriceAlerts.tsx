"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bell, BellOff, Plus, Trash2, Check } from "lucide-react";
import { useHoldings, useWatchlist } from "@/lib/storage";
import { useQuotes } from "@/lib/useQuotes";
import { displayName } from "@/lib/symbols";
import { formatPrice } from "@/lib/format";

const ALERTS_KEY = "yoyo-stocks:alerts:v1";

export type AlertRule = {
  id: string;
  symbol: string;
  type: "above" | "below" | "changeUp" | "changeDown";
  threshold: number; // price OR percent (depending on type)
  note?: string;
  createdAt: number;
  triggeredAt?: number; // 觸發後一次性紀錄
  active: boolean;
};

function loadAlerts(): AlertRule[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(ALERTS_KEY) ?? "[]") as AlertRule[];
  } catch {
    return [];
  }
}
function saveAlerts(rules: AlertRule[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ALERTS_KEY, JSON.stringify(rules));
}

export function PriceAlerts() {
  const [alerts, setAlerts] = useState<AlertRule[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [showAdd, setShowAdd] = useState(false);

  const { holdings } = useHoldings();
  const { items: watchlist } = useWatchlist();

  // 監控符號清單 = 持股 + 自選 + 警示中所有 symbol
  const symbols = useMemo(() => {
    const set = new Set<string>();
    holdings.forEach((h) => set.add(h.symbol));
    watchlist.forEach((w) => set.add(w.symbol));
    alerts.forEach((a) => set.add(a.symbol));
    return Array.from(set);
  }, [holdings, watchlist, alerts]);

  const { quotes } = useQuotes(symbols, 30_000);

  useEffect(() => {
    setAlerts(loadAlerts());
    setHydrated(true);
    if (typeof Notification !== "undefined") {
      setPermission(Notification.permission);
    }
  }, []);

  // 每次 quotes 更新時檢查警示條件
  useEffect(() => {
    if (!hydrated || alerts.length === 0) return;
    let changed = false;
    const next = alerts.map((a) => {
      if (!a.active || a.triggeredAt) return a;
      const q = quotes[a.symbol];
      if (!q) return a;

      let hit = false;
      let detail = "";
      if (a.type === "above" && q.price >= a.threshold) {
        hit = true;
        detail = `已突破 ${a.threshold}（現價 ${formatPrice(q.price)}）`;
      } else if (a.type === "below" && q.price <= a.threshold) {
        hit = true;
        detail = `已跌破 ${a.threshold}（現價 ${formatPrice(q.price)}）`;
      } else if (a.type === "changeUp" && q.changePercent >= a.threshold) {
        hit = true;
        detail = `當日漲幅 ${q.changePercent.toFixed(2)}% ≥ ${a.threshold}%`;
      } else if (a.type === "changeDown" && q.changePercent <= -Math.abs(a.threshold)) {
        hit = true;
        detail = `當日跌幅 ${q.changePercent.toFixed(2)}% ≤ -${a.threshold}%`;
      }

      if (hit) {
        changed = true;
        notify(`${displayName(a.symbol)} 觸發警示`, detail);
        return { ...a, triggeredAt: Date.now() };
      }
      return a;
    });
    if (changed) {
      setAlerts(next);
      saveAlerts(next);
    }
  }, [quotes, alerts, hydrated]);

  async function requestPermission() {
    if (typeof Notification === "undefined") {
      alert("此瀏覽器不支援通知 API");
      return;
    }
    const res = await Notification.requestPermission();
    setPermission(res);
  }

  function addAlert(rule: Omit<AlertRule, "id" | "createdAt" | "active">) {
    const next = [
      ...alerts,
      {
        ...rule,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        active: true,
      },
    ];
    setAlerts(next);
    saveAlerts(next);
    setShowAdd(false);
  }

  function removeAlert(id: string) {
    const next = alerts.filter((a) => a.id !== id);
    setAlerts(next);
    saveAlerts(next);
  }

  function resetAlert(id: string) {
    const next = alerts.map((a) =>
      a.id === id ? { ...a, triggeredAt: undefined, active: true } : a,
    );
    setAlerts(next);
    saveAlerts(next);
  }

  if (!hydrated) return null;

  const sortedAlerts = [...alerts].sort((a, b) => {
    if (a.triggeredAt && !b.triggeredAt) return -1;
    if (!a.triggeredAt && b.triggeredAt) return 1;
    return b.createdAt - a.createdAt;
  });

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-amber-600" />
          <h2 className="text-sm font-semibold text-gray-800">價格警示</h2>
          <span className="text-xs text-gray-500">
            {alerts.length} 條規則 · {alerts.filter((a) => a.triggeredAt).length} 已觸發
          </span>
        </div>
        <div className="flex items-center gap-2">
          {permission !== "granted" && (
            <button
              onClick={requestPermission}
              className="flex items-center gap-1 rounded border border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-800 hover:bg-amber-100"
            >
              <BellOff size={11} /> 啟用桌面通知
            </button>
          )}
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="flex items-center gap-1 rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
          >
            <Plus size={11} /> 新增警示
          </button>
        </div>
      </header>

      {showAdd && (
        <AddAlertForm
          knownSymbols={symbols}
          quotes={quotes}
          onAdd={addAlert}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {sortedAlerts.length === 0 ? (
        <p className="py-4 text-center text-xs text-gray-500">
          目前沒有警示規則。點「新增警示」設定第一條。
        </p>
      ) : (
        <ul className="space-y-1.5">
          {sortedAlerts.map((a) => (
            <AlertRow
              key={a.id}
              alert={a}
              currentPrice={quotes[a.symbol]?.price}
              onRemove={() => removeAlert(a.id)}
              onReset={() => resetAlert(a.id)}
            />
          ))}
        </ul>
      )}

      <p className="mt-3 text-[10px] text-gray-400">
        ⚠️ 規則每 30 秒檢查一次。瀏覽器分頁需保持開啟。若想手機收到，建議將網頁「加入主畫面」做成 PWA。
      </p>
    </section>
  );
}

function AlertRow({
  alert,
  currentPrice,
  onRemove,
  onReset,
}: {
  alert: AlertRule;
  currentPrice?: number;
  onRemove: () => void;
  onReset: () => void;
}) {
  const desc = describeAlert(alert);
  const triggered = !!alert.triggeredAt;

  return (
    <li
      className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs ${
        triggered
          ? "border-red-300 bg-red-50"
          : "border-gray-200 bg-gray-50"
      }`}
    >
      <Link
        href={`/stock/${encodeURIComponent(alert.symbol)}`}
        className="min-w-0 flex-1 truncate font-semibold text-gray-800 hover:text-blue-700"
      >
        {displayName(alert.symbol)} {triggered && "🔔"}
      </Link>
      <span className="truncate text-gray-600">{desc}</span>
      {currentPrice !== undefined && (
        <span className="shrink-0 tabular-nums text-gray-500">
          現價 {formatPrice(currentPrice)}
        </span>
      )}
      {triggered ? (
        <button
          onClick={onReset}
          className="shrink-0 rounded bg-blue-600 px-2 py-0.5 text-[10px] text-white hover:bg-blue-700"
        >
          重新啟用
        </button>
      ) : (
        <span className="shrink-0 text-[10px] text-green-600">
          <Check size={10} className="inline" /> 監控中
        </span>
      )}
      <button
        onClick={onRemove}
        className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-red-600"
        title="刪除"
      >
        <Trash2 size={11} />
      </button>
    </li>
  );
}

function describeAlert(a: AlertRule): string {
  switch (a.type) {
    case "above":
      return `當價格 ≥ ${a.threshold}`;
    case "below":
      return `當價格 ≤ ${a.threshold}`;
    case "changeUp":
      return `當當日漲幅 ≥ ${a.threshold}%`;
    case "changeDown":
      return `當當日跌幅 ≥ ${a.threshold}%`;
  }
}

function AddAlertForm({
  knownSymbols,
  quotes,
  onAdd,
  onCancel,
}: {
  knownSymbols: string[];
  quotes: Record<string, { price: number; changePercent: number }>;
  onAdd: (r: Omit<AlertRule, "id" | "createdAt" | "active">) => void;
  onCancel: () => void;
}) {
  const [symbol, setSymbol] = useState(knownSymbols[0] ?? "");
  const [type, setType] = useState<AlertRule["type"]>("below");
  const [threshold, setThreshold] = useState("");

  const currentPrice = quotes[symbol]?.price;

  function submit() {
    const num = parseFloat(threshold);
    if (!symbol || !Number.isFinite(num)) return;
    onAdd({ symbol, type, threshold: num });
  }

  // 自動帶入合理預設（價格類型 → 現價的 ±5%）
  useEffect(() => {
    if (!threshold && currentPrice && (type === "above" || type === "below")) {
      const pct = type === "above" ? 1.05 : 0.95;
      setThreshold((currentPrice * pct).toFixed(2));
    } else if (!threshold && (type === "changeUp" || type === "changeDown")) {
      setThreshold("3");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, currentPrice]);

  return (
    <div className="mb-3 rounded-md border border-blue-200 bg-blue-50/50 p-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
        <select
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="rounded border border-gray-300 bg-white px-2 py-1 text-xs"
        >
          {knownSymbols.length === 0 && <option value="">無持股 / 自選</option>}
          {knownSymbols.map((s) => (
            <option key={s} value={s}>
              {displayName(s)}（{s.replace(/\.(TW|TWO)$/i, "")}）
            </option>
          ))}
        </select>

        <select
          value={type}
          onChange={(e) => setType(e.target.value as AlertRule["type"])}
          className="rounded border border-gray-300 bg-white px-2 py-1 text-xs"
        >
          <option value="below">當價格跌破</option>
          <option value="above">當價格突破</option>
          <option value="changeDown">當日跌幅</option>
          <option value="changeUp">當日漲幅</option>
        </select>

        <div className="flex items-center gap-1">
          <input
            type="number"
            step="0.01"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            placeholder={type.startsWith("change") ? "%" : "價格"}
            className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs"
          />
          <span className="text-[10px] text-gray-500">
            {type.startsWith("change") ? "%" : ""}
          </span>
        </div>

        <div className="flex gap-1">
          <button
            onClick={submit}
            className="flex-1 rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
          >
            建立
          </button>
          <button
            onClick={onCancel}
            className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
          >
            取消
          </button>
        </div>
      </div>
      {currentPrice !== undefined && (
        <p className="mt-1 text-[10px] text-gray-500">
          {displayName(symbol)} 現價 {formatPrice(currentPrice)}
        </p>
      )}
    </div>
  );
}

function notify(title: string, body: string) {
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, {
      body,
      icon: "/icon.svg",
      tag: "yoyo-stocks-alert",
    });
  } catch {
    /* ignore */
  }
}
